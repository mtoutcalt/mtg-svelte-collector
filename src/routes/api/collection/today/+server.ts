import { json } from '@sveltejs/kit';
import { getDatabase, cardRowToScryfallCard, type CardRow } from '$lib/database';
import type { RequestHandler } from './$types';

// GET /api/collection/today - Get cards added today
export const GET: RequestHandler = async () => {
	try {
		const db = getDatabase();
		// Get cards where created_at is today (comparing dates only, ignoring time)
		// Use 'localtime' instead of 'now' to respect the local timezone
		// Exclude cards with quantity 0 (cards imported from deck lists but not owned)
		const stmt = db.prepare(`
			SELECT * FROM cards
			WHERE DATE(created_at) = DATE('now', 'localtime')
			AND quantity > 0
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
