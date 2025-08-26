import { json } from '@sveltejs/kit';
import { getDatabase, cardRowToScryfallCard, type CardRow } from '$lib/database';
import type { RequestHandler } from './$types';

// GET /api/prices - Get current prices for all cards in collection
export const GET: RequestHandler = async () => {
	try {
		const db = getDatabase();
		const stmt = db.prepare('SELECT * FROM cards');
		const rows = stmt.all() as CardRow[];
		
		const cardsWithPrices = rows.map(row => {
			const card = cardRowToScryfallCard(row);
			return {
				id: card.id,
				name: card.name,
				currentPrice: parseFloat(card.prices?.usd || '0'),
				price6moAgo: card.priceHistory?.usd6moAgo ? parseFloat(card.priceHistory.usd6moAgo) : null,
				price12moAgo: card.priceHistory?.usd12moAgo ? parseFloat(card.priceHistory.usd12moAgo) : null,
				lastUpdated: card.priceHistory?.lastUpdated
			};
		});
		
		return json(cardsWithPrices);
	} catch (error) {
		console.error('Error fetching prices:', error);
		return json({ error: 'Failed to fetch prices' }, { status: 500 });
	}
};

// PUT /api/prices - Update prices for all cards in collection
export const PUT: RequestHandler = async () => {
	try {
		const db = getDatabase();
		
		// Get all cards in collection with their last update timestamps
		const stmt = db.prepare('SELECT id, price_usd, price_usd_6mo_ago, price_usd_12mo_ago, price_last_updated FROM cards');
		const cards = stmt.all() as Array<{ 
			id: string; 
			price_usd: string | null; 
			price_usd_6mo_ago: string | null;
			price_usd_12mo_ago: string | null;
			price_last_updated: string | null;
		}>;
		
		if (cards.length === 0) {
			return json({ message: 'No cards in collection to update', updated: 0 });
		}
		
		let updatedCount = 0;
		const errors: string[] = [];
		
		// Update prices for each card
		for (const card of cards) {
			try {
				// Fetch current price from Scryfall
				const response = await fetch(`https://api.scryfall.com/cards/${card.id}`);
				if (!response.ok) {
					errors.push(`Failed to fetch price for card ${card.id}`);
					continue;
				}
				
				const cardData = await response.json();
				const newPrice = cardData.prices?.usd;
				
				if (!newPrice) {
					errors.push(`No USD price available for card ${card.id}`);
					continue;
				}
				
				// Determine if we should rotate historical prices based on time elapsed
				const now = new Date();
				const lastUpdate = card.price_last_updated ? new Date(card.price_last_updated) : null;
				
				let newPrice6moAgo = card.price_usd_6mo_ago;
				let newPrice12moAgo = card.price_usd_12mo_ago;
				
				// Only rotate prices if enough time has passed
				if (lastUpdate) {
					const daysSinceLastUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
					
					// Rotate prices based on time elapsed since last update
					if (daysSinceLastUpdate >= 30) {
						// If it's been 6+ months, do a full rotation
						if (daysSinceLastUpdate >= 180) {
							newPrice12moAgo = card.price_usd_6mo_ago || card.price_usd; // 6mo ago becomes 12mo ago (or current if no 6mo)
							newPrice6moAgo = card.price_usd; // Current becomes 6mo ago
						}
						// If it's been 1-6 months, just rotate current to 6mo
						else {
							newPrice6moAgo = card.price_usd; // Current becomes 6mo ago
						}
					}
				} else {
					// First time updating - set current price as historical baseline
					newPrice6moAgo = newPrice; // Use the new price as baseline
				}
				
				const updateStmt = db.prepare(`
					UPDATE cards 
					SET price_usd = ?,
						price_usd_6mo_ago = ?,
						price_usd_12mo_ago = ?,
						price_last_updated = CURRENT_TIMESTAMP
					WHERE id = ?
				`);
				
				updateStmt.run(
					newPrice,           // Always update current price
					newPrice6moAgo,     // Only update if rotation time has passed
					newPrice12moAgo,    // Only update if rotation time has passed
					card.id
				);
				
				updatedCount++;
				
				// Be respectful to Scryfall API - add small delay
				await new Promise(resolve => setTimeout(resolve, 100));
				
			} catch (error) {
				console.error(`Error updating price for card ${card.id}:`, error);
				errors.push(`Error updating card ${card.id}: ${error}`);
			}
		}
		
		console.log(`Updated prices for ${updatedCount} cards`);
		
		return json({ 
			success: true,
			message: `Updated prices for ${updatedCount} cards`,
			updated: updatedCount,
			total: cards.length,
			errors: errors.length > 0 ? errors : undefined
		});
		
	} catch (error) {
		console.error('Error updating prices:', error);
		return json({ error: 'Failed to update prices' }, { status: 500 });
	}
};