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

// Storage utilities - now using API endpoints for database operations
export async function loadCollectionFromStorage(): Promise<ScryfallCard[]> {
	try {
		const response = await fetch('/api/collection');
		if (response.ok) {
			return await response.json() as ScryfallCard[];
		} else {
			console.error('Failed to load collection:', response.statusText);
			return [];
		}
	} catch (error) {
		console.error('Error loading collection:', error);
		// Fallback to localStorage for development or offline mode
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('mtg-collection');
			return stored ? JSON.parse(stored) as ScryfallCard[] : [];
		}
		return [];
	}
}

export async function addCardToCollection(card: ScryfallCard): Promise<boolean> {
	try {
		const response = await fetch('/api/collection', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(card)
		});
		
		if (response.ok) {
			return true;
		} else if (response.status === 409) {
			// Card already exists
			return false;
		} else {
			console.error('Failed to add card:', response.statusText);
			return false;
		}
	} catch (error) {
		console.error('Error adding card to collection:', error);
		// Fallback to localStorage
		if (typeof window !== 'undefined') {
			const collection = await loadCollectionFromStorage();
			const exists = collection.some(c => c.id === card.id);
			
			if (!exists) {
				collection.push(card);
				localStorage.setItem('mtg-collection', JSON.stringify(collection));
				return true;
			}
		}
		return false;
	}
}

export async function removeCardFromCollection(cardId: string): Promise<boolean> {
	try {
		const response = await fetch(`/api/collection/${cardId}`, {
			method: 'DELETE'
		});
		
		if (response.ok) {
			return true;
		} else if (response.status === 404) {
			// Card not found
			return false;
		} else {
			console.error('Failed to remove card:', response.statusText);
			return false;
		}
	} catch (error) {
		console.error('Error removing card from collection:', error);
		// Fallback to localStorage
		if (typeof window !== 'undefined') {
			const collection = await loadCollectionFromStorage();
			const updatedCollection = collection.filter(c => c.id !== cardId);
			
			if (updatedCollection.length < collection.length) {
				localStorage.setItem('mtg-collection', JSON.stringify(updatedCollection));
				return true;
			}
		}
		return false;
	}
}