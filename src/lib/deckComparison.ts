import type { ScryfallCard } from './utils';
import type { Database } from 'better-sqlite3';

export interface DeckCardComparison extends ScryfallCard {
	deckQuantity: number;
	ownedQuantity: number;
	missingQuantity: number;
	hasEnough: boolean;
	completionPercentage: number;
}

export interface DeckComparison {
	cards: DeckCardComparison[];
	totalCards: number;
	ownedCards: number;
	missingCards: number;
	completionPercentage: number;
	estimatedCost: number;
	missingCardsList: DeckCardComparison[];
}

export async function compareDeckWithCollection(
	deckCards: ScryfallCard[],
	db: Database
): Promise<DeckComparison> {
	const comparison: DeckCardComparison[] = [];

	for (const card of deckCards) {
		const owned = db
			.prepare('SELECT quantity FROM cards WHERE id = ?')
			.get(card.id) as { quantity: number } | undefined;

		const ownedQty = owned?.quantity || 0;
		const neededQty = card.quantity || 1;
		const missingQty = Math.max(0, neededQty - ownedQty);

		comparison.push({
			...card,
			deckQuantity: neededQty,
			ownedQuantity: ownedQty,
			missingQuantity: missingQty,
			hasEnough: ownedQty >= neededQty,
			completionPercentage: Math.min(100, (ownedQty / neededQty) * 100)
		});
	}

	const totalCards = comparison.reduce((sum, c) => sum + c.deckQuantity, 0);
	const ownedCards = comparison.reduce(
		(sum, c) => sum + Math.min(c.ownedQuantity, c.deckQuantity),
		0
	);
	const missingCards = totalCards - ownedCards;

	// Calculate estimated cost for missing cards
	const estimatedCost = comparison.reduce((sum, c) => {
		if (c.missingQuantity > 0) {
			const price = parseFloat(c.prices?.usd || '0');
			return sum + price * c.missingQuantity;
		}
		return sum;
	}, 0);

	const missingCardsList = comparison.filter((c) => !c.hasEnough);

	return {
		cards: comparison,
		totalCards,
		ownedCards,
		missingCards,
		completionPercentage: totalCards > 0 ? (ownedCards / totalCards) * 100 : 0,
		estimatedCost,
		missingCardsList
	};
}

export function generateShoppingList(comparison: DeckComparison): string {
	if (comparison.missingCardsList.length === 0) {
		return 'You own all cards in this deck!';
	}

	let output = 'SHOPPING LIST\n';
	output += '═'.repeat(50) + '\n\n';

	let totalCost = 0;

	for (const card of comparison.missingCardsList) {
		const price = parseFloat(card.prices?.usd || '0');
		const lineCost = price * card.missingQuantity;
		totalCost += lineCost;

		output += `${card.missingQuantity}x ${card.name}`;
		if (price > 0) {
			output += ` - $${lineCost.toFixed(2)}`;
		}
		output += '\n';
	}

	output += '\n' + '─'.repeat(50) + '\n';
	output += `Total: $${totalCost.toFixed(2)}\n`;
	output += `Missing ${comparison.missingCards} of ${comparison.totalCards} cards\n`;

	return output;
}

export function groupCardsByType(cards: DeckCardComparison[]): {
	creatures: DeckCardComparison[];
	spells: DeckCardComparison[];
	lands: DeckCardComparison[];
	other: DeckCardComparison[];
} {
	const creatures: DeckCardComparison[] = [];
	const spells: DeckCardComparison[] = [];
	const lands: DeckCardComparison[] = [];
	const other: DeckCardComparison[] = [];

	for (const card of cards) {
		const type = card.type_line.toLowerCase();

		if (type.includes('creature')) {
			creatures.push(card);
		} else if (
			type.includes('instant') ||
			type.includes('sorcery') ||
			type.includes('enchantment') ||
			type.includes('artifact') ||
			type.includes('planeswalker')
		) {
			spells.push(card);
		} else if (type.includes('land')) {
			lands.push(card);
		} else {
			other.push(card);
		}
	}

	return { creatures, spells, lands, other };
}
