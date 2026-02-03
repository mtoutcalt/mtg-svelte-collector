export interface ParsedDeckCard {
	quantity: number;
	name: string;
	isSideboard: boolean;
}

export interface ParsedDeck {
	mainboard: ParsedDeckCard[];
	sideboard: ParsedDeckCard[];
	totalCards: number;
}

export function parseDeckList(text: string): ParsedDeck {
	const lines = text.split('\n').map(line => line.trim());

	const mainboard: ParsedDeckCard[] = [];
	const sideboard: ParsedDeckCard[] = [];
	let isSideboardSection = false;

	for (const line of lines) {
		// Skip empty lines
		if (!line) continue;

		// Check if we're entering sideboard section
		if (/^sideboard/i.test(line)) {
			isSideboardSection = true;
			continue;
		}

		// Skip category headers like "Creatures (12)"
		if (/^[a-z]+\s*\(\d+\)$/i.test(line)) {
			continue;
		}

		// Skip "Deck" header
		if (/^deck$/i.test(line)) {
			continue;
		}

		// Try to parse the card line
		const card = parseCardLine(line);

		if (card) {
			if (isSideboardSection) {
				sideboard.push({ ...card, isSideboard: true });
			} else {
				mainboard.push({ ...card, isSideboard: false });
			}
		}
	}

	const totalCards =
		mainboard.reduce((sum, card) => sum + card.quantity, 0) +
		sideboard.reduce((sum, card) => sum + card.quantity, 0);

	return { mainboard, sideboard, totalCards };
}

function parseCardLine(line: string): { quantity: number; name: string } | null {
	// Pattern 1: "4 Lightning Bolt" or "4x Lightning Bolt"
	const pattern1 = /^(\d+)x?\s+(.+)$/;
	const match1 = line.match(pattern1);

	if (match1) {
		const quantity = parseInt(match1[1]);
		let name = match1[2].trim();

		// Handle double-faced cards: "Brazen Borrower // Petty Theft"
		// We only need the front face name for Scryfall
		if (name.includes('//')) {
			name = name.split('//')[0].trim();
		}

		// Remove set codes like (NEO) or [NEO]
		name = name.replace(/[\(\[][\w\d]+[\)\]]/g, '').trim();

		return { quantity, name };
	}

	// Pattern 2: No quantity means 1 copy
	// This handles lines like "Island" or "Lightning Bolt"
	if (!/^\d/.test(line) && line.length > 0) {
		let name = line.trim();

		if (name.includes('//')) {
			name = name.split('//')[0].trim();
		}

		name = name.replace(/[\(\[][\w\d]+[\)\]]/g, '').trim();

		return { quantity: 1, name };
	}

	return null;
}

// Validate that the deck looks reasonable
export function validateDeck(deck: ParsedDeck): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (deck.mainboard.length === 0) {
		errors.push('Deck must have at least one card');
	}

	const mainboardSize = deck.mainboard.reduce((sum, card) => sum + card.quantity, 0);

	// Most constructed formats require 60+ cards (but allow smaller for limited/commander)
	if (mainboardSize < 30) {
		errors.push(`Mainboard has only ${mainboardSize} cards (seems too small)`);
	}

	if (mainboardSize > 250) {
		errors.push(`Mainboard has ${mainboardSize} cards (seems too large)`);
	}

	const sideboardSize = deck.sideboard.reduce((sum, card) => sum + card.quantity, 0);

	if (sideboardSize > 15) {
		errors.push(`Sideboard has ${sideboardSize} cards (maximum is usually 15)`);
	}

	return {
		valid: errors.length === 0,
		errors
	};
}
