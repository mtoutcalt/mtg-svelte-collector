import { json } from '@sveltejs/kit';
import { getDatabase, scryfallCardToCardRow, type CardRow } from '$lib/database';
import type { ScryfallCard } from '$lib/utils';
import type { RequestHandler } from './$types';

// POST /api/collection/refresh - Refresh cards with missing images from Scryfall
export const POST: RequestHandler = async () => {
	try {
		const db = getDatabase();

		// Find all cards with missing images
		const stmt = db.prepare('SELECT * FROM cards WHERE image_normal IS NULL');
		const rows = stmt.all() as CardRow[];

		if (rows.length === 0) {
			return json({
				success: true,
				message: 'No cards need refreshing',
				updated: 0
			});
		}

		let updated = 0;
		const updateStmt = db.prepare(`
			UPDATE cards SET
				image_normal = ?,
				image_small = ?,
				image_large = ?,
				card_faces = ?,
				mana_cost = ?,
				oracle_text = ?,
				colors = ?,
				color_identity = ?
			WHERE id = ?
		`);

		// Fetch fresh data from Scryfall for each card
		for (const row of rows) {
			try {
				const response = await fetch(`https://api.scryfall.com/cards/${row.id}`);

				if (!response.ok) {
					console.error(`Failed to fetch card ${row.name} (${row.id})`);
					continue;
				}

				const cardData: ScryfallCard = await response.json();
				const updatedRow = scryfallCardToCardRow(cardData);

				updateStmt.run(
					updatedRow.image_normal,
					updatedRow.image_small,
					updatedRow.image_large,
					updatedRow.card_faces,
					updatedRow.mana_cost,
					updatedRow.oracle_text,
					updatedRow.colors,
					updatedRow.color_identity,
					row.id
				);

				updated++;

				// Respect Scryfall's rate limit (10 requests per second)
				await new Promise(resolve => setTimeout(resolve, 100));
			} catch (error) {
				console.error(`Error refreshing card ${row.name}:`, error);
			}
		}

		return json({
			success: true,
			message: `Successfully refreshed ${updated} out of ${rows.length} cards`,
			updated,
			total: rows.length
		});
	} catch (error) {
		console.error('Error refreshing cards:', error);
		return json({ error: 'Failed to refresh cards' }, { status: 500 });
	}
};
