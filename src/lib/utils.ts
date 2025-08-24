export interface ScryfallCard {
	id: string;
	name: string;
	mana_cost?: string;
	type_line: string;
	oracle_text?: string;
	image_uris?: {
		normal: string;
		small: string;
		large: string;
	};
	prices?: {
		usd?: string;
		usd_foil?: string;
		eur?: string;
		tix?: string;
	};
	fuzzyMatch?: boolean;
}

export interface ScryfallError {
	error: string;
	notFound?: boolean;
}

export interface ScryfallSearchResponse {
	data: ScryfallCard[];
	total_cards: number;
}

export type CardData = ScryfallCard | ScryfallError | null;

// Type guards
export function isError(data: CardData): data is ScryfallError {
	return data !== null && 'error' in data;
}

export function isCard(data: CardData): data is ScryfallCard {
	return data !== null && 'name' in data && !('error' in data);
}

// Collection utilities
export function calculateCollectionValue(collection: ScryfallCard[]): number {
	return collection.reduce((total, card) => {
		const price = parseFloat(card.prices?.usd || '0');
		return total + price;
	}, 0);
}

export function formatCurrency(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(value);
}

// LocalStorage utilities
export function loadCollectionFromStorage(): ScryfallCard[] {
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem('mtg-collection');
		return stored ? JSON.parse(stored) as ScryfallCard[] : [];
	}
	return [];
}

export function saveCollectionToStorage(collection: ScryfallCard[]): void {
	if (typeof window !== 'undefined') {
		localStorage.setItem('mtg-collection', JSON.stringify(collection));
	}
}

export function addCardToCollection(card: ScryfallCard): boolean {
	const collection = loadCollectionFromStorage();
	const exists = collection.some(c => c.id === card.id);
	
	if (!exists) {
		collection.push(card);
		saveCollectionToStorage(collection);
		return true;
	}
	
	return false;
}

export function removeCardFromCollection(cardId: string): boolean {
	const collection = loadCollectionFromStorage();
	const initialLength = collection.length;
	const updatedCollection = collection.filter(c => c.id !== cardId);
	
	if (updatedCollection.length < initialLength) {
		saveCollectionToStorage(updatedCollection);
		return true;
	}
	
	return false;
}