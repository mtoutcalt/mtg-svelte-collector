import { json } from '@sveltejs/kit';
import { getDatabase } from '$lib/database';
import type { RequestHandler } from './$types';

// DELETE /api/collection/[id] - Remove one copy or decrement quantity
export const DELETE: RequestHandler = async ({ params, url }) => {
	try {
		const { id } = params;
		
		if (!id) {
			return json({ error: 'Card ID is required' }, { status: 400 });
		}
		
		const db = getDatabase();
		const removeAll = url.searchParams.get('all') === 'true';
		
		if (removeAll) {
			// Remove all copies
			const deleteStmt = db.prepare('DELETE FROM cards WHERE id = ?');
			const result = deleteStmt.run(id);
			
			if (result.changes === 0) {
				return json({ error: 'Card not found in collection' }, { status: 404 });
			}
			
			return json({ success: true, message: 'Card removed from collection' });
		} else {
			// Decrement quantity by 1
			const checkStmt = db.prepare('SELECT quantity FROM cards WHERE id = ?');
			const existingCard = checkStmt.get(id) as { quantity: number } | undefined;
			
			if (!existingCard) {
				return json({ error: 'Card not found in collection' }, { status: 404 });
			}
			
			if (existingCard.quantity <= 1) {
				// Remove card if only 1 copy
				const deleteStmt = db.prepare('DELETE FROM cards WHERE id = ?');
				deleteStmt.run(id);
				return json({ success: true, message: 'Card removed from collection', quantity: 0 });
			} else {
				// Decrease quantity
				const newQuantity = existingCard.quantity - 1;
				const updateStmt = db.prepare('UPDATE cards SET quantity = ? WHERE id = ?');
				updateStmt.run(newQuantity, id);
				return json({ success: true, message: 'Card quantity decreased', quantity: newQuantity });
			}
		}
	} catch (error) {
		console.error('Error removing card from collection:', error);
		return json({ error: 'Failed to remove card from collection' }, { status: 500 });
	}
};