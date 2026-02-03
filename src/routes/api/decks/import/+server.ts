import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { parseDeckList, validateDeck } from '$lib/deckParser';
import type { ScryfallCard } from '$lib/utils';

export const POST: RequestHandler = async ({ request }) => {
	const { deckText, deckName, format } = await request.json();

	try {
		// Parse the decklist
		const parsedDeck = parseDeckList(deckText);

		// Validate it
		const validation = validateDeck(parsedDeck);
		if (!validation.valid) {
			return json(
				{
					error: 'Invalid deck',
					details: validation.errors
				},
				{ status: 400 }
			);
		}

		// Fetch card data from Scryfall for each unique card
		const allCards = [...parsedDeck.mainboard, ...parsedDeck.sideboard];
		const uniqueCardNames = [...new Set(allCards.map((c) => c.name))];

		// Rate limit: Scryfall allows ~10 requests/second
		const cardDataMap = await fetchCardsFromScryfall(uniqueCardNames);

		// Combine parsed data with Scryfall data
		const enrichedDeck = {
			name: deckName || 'Imported Deck',
			format: format || 'Unknown',
			mainboard: parsedDeck.mainboard
				.map((card) => {
					const scryfallCard = cardDataMap.get(card.name.toLowerCase());
					if (!scryfallCard) return null;
					return {
						...scryfallCard,
						quantity: card.quantity
					};
				})
				.filter((card): card is ScryfallCard => card !== null),
			sideboard: parsedDeck.sideboard
				.map((card) => {
					const scryfallCard = cardDataMap.get(card.name.toLowerCase());
					if (!scryfallCard) return null;
					return {
						...scryfallCard,
						quantity: card.quantity
					};
				})
				.filter((card): card is ScryfallCard => card !== null),
			totalCards: parsedDeck.totalCards,
			notFound: uniqueCardNames.filter((name) => !cardDataMap.has(name.toLowerCase()))
		};

		return json(enrichedDeck);
	} catch (error) {
		console.error('Deck import error:', error);
		return json(
			{
				error: 'Failed to import deck',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

async function fetchCardsFromScryfall(cardNames: string[]): Promise<Map<string, ScryfallCard>> {
	const cardMap = new Map<string, ScryfallCard>();

	// Use Scryfall's collection endpoint to fetch multiple cards at once
	// This is more efficient than individual requests
	const identifiers = cardNames.map((name) => ({ name }));

	// Scryfall's collection endpoint has a limit of 75 cards per request
	const chunks = chunkArray(identifiers, 75);

	for (const chunk of chunks) {
		try {
			const response = await fetch('https://api.scryfall.com/cards/collection', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ identifiers: chunk })
			});

			if (!response.ok) {
				throw new Error(`Scryfall API error: ${response.status}`);
			}

			const data = await response.json();

			// Store found cards in map (use lowercase name as key for case-insensitive lookup)
			if (data.data && Array.isArray(data.data)) {
				for (const card of data.data) {
					cardMap.set(card.name.toLowerCase(), card);
				}
			}

			// Log not found cards
			if (data.not_found && data.not_found.length > 0) {
				console.warn(
					'Cards not found on Scryfall:',
					data.not_found.map((nf: any) => nf.name)
				);
			}

			// Respect Scryfall's rate limit (50-100ms between requests)
			await sleep(100);
		} catch (error) {
			console.error('Error fetching from Scryfall:', error);
		}
	}

	return cardMap;
}

function chunkArray<T>(array: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += size) {
		chunks.push(array.slice(i, i + size));
	}
	return chunks;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
