import { json } from '@sveltejs/kit';
import { getDatabase, cardRowToScryfallCard, type CardRow } from '$lib/database';
import type { RequestHandler } from './$types';

// GET /api/collection/today - Get cards added today
export const GET: RequestHandler = async () => {
	try {
		const db = getDatabase();
		// Get cards where created_at is today (comparing dates only, ignoring time)
		const stmt = db.prepare(`
			SELECT * FROM cards
			WHERE DATE(created_at) = DATE('now')
			ORDER BY created_at DESC
		`);
		const rows = stmt.all() as CardRow[];
		const cards = rows.map(cardRowToScryfallCard);

		return json(cards);
	} catch (error) {
		console.error('Error loading today\'s additions:', error);
		return json({ error: 'Failed to load today\'s additions' }, { status: 500 });
	}
};
