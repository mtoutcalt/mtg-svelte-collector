import { json } from '@sveltejs/kit';
import { getDatabase, type DeckRow, type CardRow, cardRowToScryfallCard } from '$lib/database';
import type { RequestHandler } from './$types';

// GET /api/decks/[id] - Get deck with cards
export const GET: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		const db = getDatabase();
		
		// Get deck info
		const deck = db.prepare('SELECT * FROM decks WHERE id = ?').get(id) as DeckRow | undefined;
		
		if (!deck) {
			return json({ error: 'Deck not found' }, { status: 404 });
		}
		
		// Get deck cards with card details
		const deckCards = db.prepare(`
			SELECT 
				c.*,
				dc.quantity as deck_quantity
			FROM deck_cards dc
			JOIN cards c ON dc.card_id = c.id
			WHERE dc.deck_id = ?
			ORDER BY c.name
		`).all(id) as (CardRow & { deck_quantity: number })[];
		
		const cards = deckCards.map(cardRow => {
			const card = cardRowToScryfallCard(cardRow);
			return {
				...card,
				deckQuantity: cardRow.deck_quantity
			};
		});
		
		const totalCards = deckCards.reduce((sum, card) => sum + card.deck_quantity, 0);
		
		return json({
			...deck,
			cards,
			cardCount: totalCards,
			uniqueCards: cards.length
		});
		
	} catch (error) {
		console.error('Error fetching deck:', error);
		return json({ error: 'Failed to fetch deck' }, { status: 500 });
	}
};

// DELETE /api/decks/[id] - Delete deck
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		const db = getDatabase();
		
		const result = db.prepare('DELETE FROM decks WHERE id = ?').run(id);
		
		if (result.changes === 0) {
			return json({ error: 'Deck not found' }, { status: 404 });
		}
		
		return json({ success: true });
		
	} catch (error) {
		console.error('Error deleting deck:', error);
		return json({ error: 'Failed to delete deck' }, { status: 500 });
	}
};

// PUT /api/decks/[id] - Update deck name/description
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const { name, description } = await request.json();
		
		if (!name || typeof name !== 'string' || name.trim().length === 0) {
			return json({ error: 'Deck name is required' }, { status: 400 });
		}
		
		const db = getDatabase();
		
		// Check if deck exists
		const existingDeck = db.prepare('SELECT id FROM decks WHERE id = ?').get(id);
		if (!existingDeck) {
			return json({ error: 'Deck not found' }, { status: 404 });
		}
		
		// Check if name is taken by another deck
		const nameConflict = db.prepare('SELECT id FROM decks WHERE name = ? AND id != ?').get(name.trim(), id);
		if (nameConflict) {
			return json({ error: 'A deck with this name already exists' }, { status: 400 });
		}
		
		const updateDeck = db.prepare(`
			UPDATE decks 
			SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`);
		
		updateDeck.run(name.trim(), description || null, id);
		
		const updatedDeck = db.prepare('SELECT * FROM decks WHERE id = ?').get(id) as DeckRow;
		
		return json(updatedDeck);
		
	} catch (error) {
		console.error('Error updating deck:', error);
		return json({ error: 'Failed to update deck' }, { status: 500 });
	}
};