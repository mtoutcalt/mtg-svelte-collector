import { json } from '@sveltejs/kit';
import { getDatabase, scryfallCardToCardRow } from '$lib/database';
import type { ScryfallCard } from '$lib/utils';
import type { RequestHandler } from './$types';

// POST /api/migration - Migrate localStorage data to SQLite
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { cards }: { cards: ScryfallCard[] } = await request.json();
		
		if (!Array.isArray(cards)) {
			return json({ error: 'Invalid cards data' }, { status: 400 });
		}
		
		const db = getDatabase();
		
		// Clear existing cards and insert migrated ones
		const deleteStmt = db.prepare('DELETE FROM cards');
		const insertStmt = db.prepare(`
			INSERT OR REPLACE INTO cards (
				id, name, mana_cost, type_line, oracle_text,
				image_normal, image_small, image_large,
				price_usd, price_usd_foil, price_eur, price_tix, fuzzy_match
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);
		
		const transaction = db.transaction(() => {
			deleteStmt.run();
			for (const card of cards) {
				const row = scryfallCardToCardRow(card);
				insertStmt.run(
					row.id, row.name, row.mana_cost, row.type_line, row.oracle_text,
					row.image_normal, row.image_small, row.image_large,
					row.price_usd, row.price_usd_foil, row.price_eur, row.price_tix, row.fuzzy_match
				);
			}
		});
		
		transaction();
		
		return json({ 
			success: true, 
			message: `Successfully migrated ${cards.length} cards to database` 
		});
	} catch (error) {
		console.error('Error migrating data:', error);
		return json({ error: 'Failed to migrate data to database' }, { status: 500 });
	}
};