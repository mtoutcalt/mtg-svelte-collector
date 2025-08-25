import { json } from '@sveltejs/kit';
import { getDatabase } from '$lib/database';
import type { RequestHandler } from './$types';

// DELETE /api/collection/[id] - Remove a card from collection
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		
		if (!id) {
			return json({ error: 'Card ID is required' }, { status: 400 });
		}
		
		const db = getDatabase();
		const deleteStmt = db.prepare('DELETE FROM cards WHERE id = ?');
		const result = deleteStmt.run(id);
		
		if (result.changes === 0) {
			return json({ error: 'Card not found in collection' }, { status: 404 });
		}
		
		return json({ success: true, message: 'Card removed from collection' });
	} catch (error) {
		console.error('Error removing card from collection:', error);
		return json({ error: 'Failed to remove card from collection' }, { status: 500 });
	}
};