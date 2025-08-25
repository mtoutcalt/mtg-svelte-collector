import { json } from '@sveltejs/kit';
import { getDatabase, cardRowToScryfallCard, scryfallCardToCardRow, type CardRow } from '$lib/database';
import type { ScryfallCard } from '$lib/utils';
import type { RequestHandler } from './$types';

// GET /api/collection - Load all cards from collection
export const GET: RequestHandler = async () => {
	try {
		const db = getDatabase();
		const stmt = db.prepare('SELECT * FROM cards ORDER BY created_at DESC');
		const rows = stmt.all() as CardRow[];
		const cards = rows.map(cardRowToScryfallCard);
		
		return json(cards);
	} catch (error) {
		console.error('Error loading collection:', error);
		return json({ error: 'Failed to load collection' }, { status: 500 });
	}
};

// POST /api/collection - Add a card to collection
export const POST: RequestHandler = async ({ request }) => {
	try {
		const card: ScryfallCard = await request.json();
		
		if (!card.id || !card.name) {
			return json({ error: 'Invalid card data' }, { status: 400 });
		}
		
		const db = getDatabase();
		const checkStmt = db.prepare('SELECT COUNT(*) as count FROM cards WHERE id = ?');
		const result = checkStmt.get(card.id) as { count: number };
		
		if (result.count > 0) {
			return json({ error: 'Card already in collection', exists: true }, { status: 409 });
		}
		
		const row = scryfallCardToCardRow(card);
		const insertStmt = db.prepare(`
			INSERT INTO cards (
				id, name, mana_cost, type_line, oracle_text,
				image_normal, image_small, image_large,
				price_usd, price_usd_foil, price_eur, price_tix, fuzzy_match
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);
		
		insertStmt.run(
			row.id, row.name, row.mana_cost, row.type_line, row.oracle_text,
			row.image_normal, row.image_small, row.image_large,
			row.price_usd, row.price_usd_foil, row.price_eur, row.price_tix, row.fuzzy_match
		);
		
		return json({ success: true, message: 'Card added to collection' });
	} catch (error) {
		console.error('Error adding card to collection:', error);
		return json({ error: 'Failed to add card to collection' }, { status: 500 });
	}
};