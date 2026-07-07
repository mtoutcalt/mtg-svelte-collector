import { json } from '@sveltejs/kit';
import { getDatabase, getAppMetadata, PRICES_LAST_REFRESHED_KEY } from '$lib/database';
import type { RequestHandler } from './$types';

interface MoverRow {
	id: string;
	name: string;
	quantity: number;
	image_small: string | null;
	image_normal: string | null;
	image_large: string | null;
	price_usd: string;
	price_usd_6mo_ago: string | null;
	baseline_price: string | null;
	baseline_date: string | null;
}

export interface PriceMover {
	id: string;
	name: string;
	quantity: number;
	imageSmall: string | null;
	imageNormal: string | null;
	imageLarge: string | null;
	currentPrice: number;
	previousPrice: number;
	change: number;
	changePercent: number;
	since: string | null;
}

// GET /api/prices/movers?days=30 - Biggest recent price gainers and losers in the collection.
// Scryfall only publishes current prices, so movement is computed from our own
// price_history snapshots; before enough history exists we fall back to the
// stored ~6-months-ago prices.
export const GET: RequestHandler = async ({ url }) => {
	try {
		const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get('days') || '30', 10) || 30));
		const db = getDatabase();
		const cutoff = `-${days} days`;

		// Baseline per card: the last snapshot from before the window starts
		// (price as of ~N days ago), or the oldest snapshot we have if history
		// doesn't reach back that far yet.
		const rows = db.prepare(`
			SELECT
				c.id, c.name, c.quantity,
				c.image_small, c.image_normal, c.image_large,
				c.price_usd, c.price_usd_6mo_ago,
				COALESCE(
					(SELECT ph.price_usd FROM price_history ph
						WHERE ph.card_id = c.id AND ph.recorded_at <= datetime('now', ?)
						ORDER BY ph.recorded_at DESC, ph.id DESC LIMIT 1),
					(SELECT ph.price_usd FROM price_history ph
						WHERE ph.card_id = c.id
						ORDER BY ph.recorded_at ASC, ph.id ASC LIMIT 1)
				) AS baseline_price,
				COALESCE(
					(SELECT ph.recorded_at FROM price_history ph
						WHERE ph.card_id = c.id AND ph.recorded_at <= datetime('now', ?)
						ORDER BY ph.recorded_at DESC, ph.id DESC LIMIT 1),
					(SELECT ph.recorded_at FROM price_history ph
						WHERE ph.card_id = c.id
						ORDER BY ph.recorded_at ASC, ph.id ASC LIMIT 1)
				) AS baseline_date
			FROM cards c
			WHERE c.price_usd IS NOT NULL
		`).all(cutoff, cutoff) as MoverRow[];

		const buildMover = (row: MoverRow, previousPrice: number, since: string | null): PriceMover | null => {
			const currentPrice = parseFloat(row.price_usd);
			if (!isFinite(currentPrice) || !isFinite(previousPrice) || previousPrice <= 0) {
				return null;
			}
			const change = Math.round((currentPrice - previousPrice) * 100) / 100;
			if (change === 0) return null;
			return {
				id: row.id,
				name: row.name,
				quantity: row.quantity,
				imageSmall: row.image_small,
				imageNormal: row.image_normal,
				imageLarge: row.image_large,
				currentPrice,
				previousPrice,
				change,
				changePercent: Math.round((change / previousPrice) * 10000) / 100,
				since
			};
		};

		let basis: 'recent' | 'sixMonth' = 'recent';
		let movers = rows
			.map(row => row.baseline_price ? buildMover(row, parseFloat(row.baseline_price), row.baseline_date) : null)
			.filter((m): m is PriceMover => m !== null);

		// No recorded movement yet (e.g. prices never refreshed since the history
		// table was added) - fall back to the 6-month comparison columns
		if (movers.length === 0) {
			const fallback = rows
				.map(row => row.price_usd_6mo_ago ? buildMover(row, parseFloat(row.price_usd_6mo_ago), null) : null)
				.filter((m): m is PriceMover => m !== null);
			if (fallback.length > 0) {
				movers = fallback;
				basis = 'sixMonth';
			}
		}

		const gainers = movers
			.filter(m => m.change > 0)
			.sort((a, b) => b.change - a.change)
			.slice(0, 5);

		const losers = movers
			.filter(m => m.change < 0)
			.sort((a, b) => a.change - b.change)
			.slice(0, 5);

		// When the last refresh ran. Falls back to the per-card timestamps for
		// refreshes done before the operation-level timestamp existed; strftime
		// adds the 'Z' so the client parses SQLite's UTC value correctly.
		let lastRefreshedAt = getAppMetadata(db, PRICES_LAST_REFRESHED_KEY);
		if (!lastRefreshedAt) {
			const fallbackRow = db.prepare(
				"SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(price_last_updated)) AS ts FROM cards"
			).get() as { ts: string | null } | undefined;
			lastRefreshedAt = fallbackRow?.ts ?? null;
		}

		return json({ basis, windowDays: days, gainers, losers, lastRefreshedAt });
	} catch (error) {
		console.error('Error computing price movers:', error);
		return json({ error: 'Failed to compute price movers' }, { status: 500 });
	}
};
