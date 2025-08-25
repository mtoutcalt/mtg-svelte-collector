import { json } from '@sveltejs/kit';
import { getDatabase } from '$lib/database';
import type { RequestHandler } from './$types';

// PUT /api/collection/quantity - Update card quantity
export const PUT: RequestHandler = async ({ request }) => {
	try {
		const { cardId, quantity } = await request.json();
		
		if (!cardId || typeof quantity !== 'number' || quantity < 0) {
			return json({ error: 'Invalid card ID or quantity' }, { status: 400 });
		}
		
		const db = getDatabase();
		
		if (quantity === 0) {
			// Remove card if quantity is 0
			const deleteStmt = db.prepare('DELETE FROM cards WHERE id = ?');
			const result = deleteStmt.run(cardId);
			
			if (result.changes === 0) {
				return json({ error: 'Card not found' }, { status: 404 });
			}
			
			return json({ success: true, message: 'Card removed from collection', quantity: 0 });
		} else {
			// Update quantity
			const updateStmt = db.prepare('UPDATE cards SET quantity = ? WHERE id = ?');
			const result = updateStmt.run(quantity, cardId);
			
			if (result.changes === 0) {
				return json({ error: 'Card not found' }, { status: 404 });
			}
			
			return json({ success: true, message: 'Card quantity updated', quantity });
		}
	} catch (error) {
		console.error('Error updating card quantity:', error);
		return json({ error: 'Failed to update card quantity' }, { status: 500 });
	}
};