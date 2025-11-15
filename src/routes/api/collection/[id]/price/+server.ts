import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'collection.db');

export const PUT: RequestHandler = async ({ params }) => {
	const { id } = params;

	try {
		const db = new Database(dbPath);

		// Fetch current card data to get the Scryfall ID
		const card = db.prepare('SELECT id, name FROM cards WHERE id = ?').get(id) as { id: string; name: string } | undefined;

		if (!card) {
			db.close();
			return json({ error: 'Card not found in collection' }, { status: 404 });
		}

		// Fetch latest price from Scryfall API
		const scryfallResponse = await fetch(`https://api.scryfall.com/cards/${card.id}`);

		if (!scryfallResponse.ok) {
			db.close();
			return json({ error: 'Failed to fetch price from Scryfall' }, { status: 500 });
		}

		const scryfallData = await scryfallResponse.json();
		const newPrice = scryfallData.prices?.usd || null;

		// Get current price data for history management
		const currentData = db.prepare(
			'SELECT price_usd, price_usd_6mo_ago, price_usd_12mo_ago, price_last_updated FROM cards WHERE id = ?'
		).get(id) as {
			price_usd: string | null;
			price_usd_6mo_ago: string | null;
			price_usd_12mo_ago: string | null;
			price_last_updated: string | null;
		} | undefined;

		const now = new Date().toISOString();
		let price6moAgo = currentData?.price_usd_6mo_ago;
		let price12moAgo = currentData?.price_usd_12mo_ago;

		// Manage price history rotation
		if (currentData?.price_last_updated) {
			const lastUpdate = new Date(currentData.price_last_updated);
			const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

			// If it's been 30+ days, rotate current price to 6mo history
			if (daysSinceUpdate >= 30 && currentData.price_usd) {
				price6moAgo = currentData.price_usd;
			}

			// If it's been 180+ days, rotate 6mo to 12mo history
			if (daysSinceUpdate >= 180 && currentData.price_usd_6mo_ago) {
				price12moAgo = currentData.price_usd_6mo_ago;
			}
		}

		// Update card with new price and timestamp
		const updateStmt = db.prepare(`
			UPDATE cards
			SET price_usd = ?,
				price_usd_foil = ?,
				price_eur = ?,
				price_tix = ?,
				price_usd_6mo_ago = ?,
				price_usd_12mo_ago = ?,
				price_last_updated = ?,
				updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`);

		updateStmt.run(
			scryfallData.prices?.usd || null,
			scryfallData.prices?.usd_foil || null,
			scryfallData.prices?.eur || null,
			scryfallData.prices?.tix || null,
			price6moAgo,
			price12moAgo,
			now,
			id
		);

		// Fetch updated card data to return
		const updatedCard = db.prepare(`
			SELECT id, name, price_usd, price_last_updated
			FROM cards
			WHERE id = ?
		`).get(id) as {
			id: string;
			name: string;
			price_usd: string | null;
			price_last_updated: string;
		};

		db.close();

		return json({
			success: true,
			card: {
				id: updatedCard.id,
				name: updatedCard.name,
				price: updatedCard.price_usd,
				lastUpdated: updatedCard.price_last_updated
			}
		});
	} catch (error) {
		console.error('Error refreshing card price:', error);
		return json({ error: 'Failed to refresh price' }, { status: 500 });
	}
};
