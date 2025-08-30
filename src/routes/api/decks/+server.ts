import { json } from '@sveltejs/kit';
import { getDatabase, type DeckRow } from '$lib/database';
import type { RequestHandler } from './$types';
import { randomUUID } from 'crypto';

// GET /api/decks - Get all decks
export const GET: RequestHandler = async () => {
	try {
		const db = getDatabase();
		const decks = db.prepare('SELECT * FROM decks ORDER BY created_at DESC').all() as DeckRow[];
		
		// Get card count for each deck
		const decksWithCounts = decks.map(deck => {
			const cardCount = db.prepare('SELECT SUM(quantity) as total FROM deck_cards WHERE deck_id = ?').get(deck.id) as { total: number | null };
			const uniqueCards = db.prepare('SELECT COUNT(*) as count FROM deck_cards WHERE deck_id = ?').get(deck.id) as { count: number };
			
			return {
				...deck,
				cardCount: cardCount?.total || 0,
				uniqueCards: uniqueCards?.count || 0
			};
		});
		
		return json(decksWithCounts);
	} catch (error) {
		console.error('Error fetching decks:', error);
		return json({ error: 'Failed to fetch decks' }, { status: 500 });
	}
};

// POST /api/decks - Create a new deck
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { name, description } = await request.json();
		
		if (!name || typeof name !== 'string' || name.trim().length === 0) {
			return json({ error: 'Deck name is required' }, { status: 400 });
		}
		
		const db = getDatabase();
		const deckId = randomUUID();
		
		// Check if deck name already exists
		const existingDeck = db.prepare('SELECT id FROM decks WHERE name = ?').get(name.trim());
		if (existingDeck) {
			return json({ error: 'A deck with this name already exists' }, { status: 400 });
		}
		
		const insertDeck = db.prepare(`
			INSERT INTO decks (id, name, description)
			VALUES (?, ?, ?)
		`);
		
		insertDeck.run(deckId, name.trim(), description || null);
		
		const newDeck = db.prepare('SELECT * FROM decks WHERE id = ?').get(deckId) as DeckRow;
		
		return json({
			...newDeck,
			cardCount: 0,
			uniqueCards: 0
		}, { status: 201 });
		
	} catch (error) {
		console.error('Error creating deck:', error);
		return json({ error: 'Failed to create deck' }, { status: 500 });
	}
};