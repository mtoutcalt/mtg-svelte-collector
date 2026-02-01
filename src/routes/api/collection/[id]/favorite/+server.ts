import { json, type RequestHandler } from '@sveltejs/kit';
import { getDatabase } from '$lib/database';

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const { isFavorite } = await request.json();

		const db = getDatabase();
		const stmt = db.prepare('UPDATE cards SET is_favorite = ? WHERE id = ?');
		const result = stmt.run(isFavorite ? 1 : 0, id);

		if (result.changes === 0) {
			return json({ error: 'Card not found' }, { status: 404 });
		}

		return json({
			success: true,
			isFavorite,
			message: `Card ${isFavorite ? 'added to' : 'removed from'} favorites`
		});
	} catch (error) {
		console.error('Error toggling favorite:', error);
		return json({ error: 'Failed to update favorite status' }, { status: 500 });
	}
};
