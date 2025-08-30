import { json } from '@sveltejs/kit';
import { getDatabase } from '$lib/database';
import type { RequestHandler } from './$types';

// POST /api/decks/[id]/cards - Add card to deck
export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { id: deckId } = params;
		const { cardId, quantity = 1 } = await request.json();
		
		if (!cardId || typeof cardId !== 'string') {
			return json({ error: 'Card ID is required' }, { status: 400 });
		}
		
		if (!Number.isInteger(quantity) || quantity < 1) {
			return json({ error: 'Quantity must be a positive integer' }, { status: 400 });
		}
		
		const db = getDatabase();
		
		// Check if deck exists
		const deck = db.prepare('SELECT id FROM decks WHERE id = ?').get(deckId);
		if (!deck) {
			return json({ error: 'Deck not found' }, { status: 404 });
		}
		
		// Check if card exists in collection
		const card = db.prepare('SELECT id FROM cards WHERE id = ?').get(cardId);
		if (!card) {
			return json({ error: 'Card not found in collection' }, { status: 404 });
		}
		
		// Check if card is already in deck
		const existingDeckCard = db.prepare('SELECT quantity FROM deck_cards WHERE deck_id = ? AND card_id = ?').get(deckId, cardId) as { quantity: number } | undefined;
		
		if (existingDeckCard) {
			// Update quantity
			const updateQuantity = db.prepare(`
				UPDATE deck_cards 
				SET quantity = quantity + ?
				WHERE deck_id = ? AND card_id = ?
			`);
			updateQuantity.run(quantity, deckId, cardId);
			
			return json({
				success: true,
				message: `Added ${quantity} more copies to deck`,
				newQuantity: existingDeckCard.quantity + quantity
			});
		} else {
			// Add new card to deck
			const insertDeckCard = db.prepare(`
				INSERT INTO deck_cards (deck_id, card_id, quantity)
				VALUES (?, ?, ?)
			`);
			insertDeckCard.run(deckId, cardId, quantity);
			
			return json({
				success: true,
				message: `Added ${quantity} copy/copies to deck`,
				newQuantity: quantity
			});
		}
		
	} catch (error) {
		console.error('Error adding card to deck:', error);
		return json({ error: 'Failed to add card to deck' }, { status: 500 });
	}
};

// PUT /api/decks/[id]/cards - Update card quantity in deck
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id: deckId } = params;
		const { cardId, quantity } = await request.json();
		
		if (!cardId || typeof cardId !== 'string') {
			return json({ error: 'Card ID is required' }, { status: 400 });
		}
		
		if (!Number.isInteger(quantity) || quantity < 0) {
			return json({ error: 'Quantity must be a non-negative integer' }, { status: 400 });
		}
		
		const db = getDatabase();
		
		if (quantity === 0) {
			// Remove card from deck
			const result = db.prepare('DELETE FROM deck_cards WHERE deck_id = ? AND card_id = ?').run(deckId, cardId);
			
			if (result.changes === 0) {
				return json({ error: 'Card not found in deck' }, { status: 404 });
			}
			
			return json({
				success: true,
				message: 'Card removed from deck'
			});
		} else {
			// Update quantity
			const result = db.prepare(`
				UPDATE deck_cards 
				SET quantity = ?
				WHERE deck_id = ? AND card_id = ?
			`).run(quantity, deckId, cardId);
			
			if (result.changes === 0) {
				return json({ error: 'Card not found in deck' }, { status: 404 });
			}
			
			return json({
				success: true,
				message: `Updated quantity to ${quantity}`,
				newQuantity: quantity
			});
		}
		
	} catch (error) {
		console.error('Error updating card quantity in deck:', error);
		return json({ error: 'Failed to update card quantity' }, { status: 500 });
	}
};

// DELETE /api/decks/[id]/cards - Remove card from deck
export const DELETE: RequestHandler = async ({ params, request }) => {
	try {
		const { id: deckId } = params;
		const { cardId } = await request.json();
		
		if (!cardId || typeof cardId !== 'string') {
			return json({ error: 'Card ID is required' }, { status: 400 });
		}
		
		const db = getDatabase();
		
		const result = db.prepare('DELETE FROM deck_cards WHERE deck_id = ? AND card_id = ?').run(deckId, cardId);
		
		if (result.changes === 0) {
			return json({ error: 'Card not found in deck' }, { status: 404 });
		}
		
		return json({
			success: true,
			message: 'Card removed from deck'
		});
		
	} catch (error) {
		console.error('Error removing card from deck:', error);
		return json({ error: 'Failed to remove card from deck' }, { status: 500 });
	}
};