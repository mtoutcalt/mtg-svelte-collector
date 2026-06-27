export interface ScryfallCard {
	id: string;
	name: string;
	mana_cost?: string;
	type_line: string;
	oracle_text?: string;
	colors?: string[];
	color_identity?: string[];
	// Printing-specific fields (used by the version picker to distinguish
	// between different arts/sets of the same card)
	set?: string;
	set_name?: string;
	collector_number?: string;
	rarity?: string;
	released_at?: string;
	frame_effects?: string[];
	promo_types?: string[];
	prints_search_uri?: string;
	image_uris?: {
		normal: string;
		small: string;
		large: string;
	};
	card_faces?: Array<{
		name: string;
		mana_cost?: string;
		type_line?: string;
		oracle_text?: string;
		image_uris?: {
			normal: string;
			small: string;
			large: string;
		};
	}>;
	prices?: {
		usd?: string;
		usd_foil?: string;
		eur?: string;
		tix?: string;
	};
	legalities?: {
		standard: string;
		future: string;
		historic: string;
		timeless: string;
		gladiator: string;
		pioneer: string;
		modern: string;
		legacy: string;
		pauper: string;
		vintage: string;
		penny: string;
		commander: string;
		oathbreaker: string;
		standardbrawl: string;
		brawl: string;
		alchemy: string;
		paupercommander: string;
		duel: string;
		oldschool: string;
		premodern: string;
		predh: string;
	};
	quantity?: number;
	fuzzyMatch?: boolean;
	priceHistory?: {
		usd6moAgo?: string;
		usd12moAgo?: string;
		lastUpdated?: string;
	};
	isFavorite?: boolean;
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
		const quantity = card.quantity || 1;
		return total + (price * quantity);
	}, 0);
}

export function formatCurrency(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(value);
}

// Build a short, human-friendly list of any special treatments on a printing
// (e.g. "Showcase", "Extended Art", "Borderless") so the user can recognize
// a different art style at a glance. Returns [] for an ordinary printing.
export function getPrintingTreatments(card: ScryfallCard): string[] {
	const labels: Record<string, string> = {
		showcase: 'Showcase',
		extendedart: 'Extended Art',
		inverted: 'Inverted',
		etched: 'Etched',
		legendary: 'Legendary Frame'
	};

	const treatments: string[] = [];

	for (const effect of card.frame_effects ?? []) {
		treatments.push(labels[effect] ?? effect);
	}

	// Borderless is exposed as a border_color, not a frame effect
	if ((card as { border_color?: string }).border_color === 'borderless') {
		treatments.push('Borderless');
	}

	// A handful of promo types are worth surfacing as a distinct "style"
	const promoLabels: Record<string, string> = {
		boosterfun: 'Booster Fun',
		galaxyfoil: 'Galaxy Foil',
		surgefoil: 'Surge Foil',
		textured: 'Textured',
		serialized: 'Serialized'
	};
	for (const promo of card.promo_types ?? []) {
		if (promoLabels[promo]) treatments.push(promoLabels[promo]);
	}

	return [...new Set(treatments)];
}

// Helper function to get card image URI (handles double-faced cards)
export function getCardImageUri(card: ScryfallCard, size: 'normal' | 'small' | 'large' = 'normal'): string {
	// Try to get image from root level first (single-faced cards)
	if (card.image_uris?.[size]) {
		return card.image_uris[size];
	}

	// Fallback to first card face (double-faced cards)
	if (card.card_faces?.[0]?.image_uris?.[size]) {
		return card.card_faces[0].image_uris[size];
	}

	return '';
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

export async function addCardToCollection(card: ScryfallCard, quantity: number = 1): Promise<{ success: boolean; quantity?: number; message?: string }> {
	try {
		const cardWithQuantity = { ...card, quantity };
		const response = await fetch('/api/collection', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(cardWithQuantity)
		});
		
		if (response.ok) {
			const data = await response.json();
			return { success: true, quantity: data.quantity, message: data.message };
		} else {
			const errorData = await response.json();
			console.error('Failed to add card:', errorData.error);
			return { success: false, message: errorData.error };
		}
	} catch (error) {
		console.error('Error adding card to collection:', error);
		// Fallback to localStorage
		if (typeof window !== 'undefined') {
			const collection = await loadCollectionFromStorage();
			const existingIndex = collection.findIndex(c => c.id === card.id);
			
			if (existingIndex >= 0) {
				collection[existingIndex].quantity = (collection[existingIndex].quantity || 1) + quantity;
			} else {
				collection.push({ ...card, quantity });
			}
			localStorage.setItem('mtg-collection', JSON.stringify(collection));
			return { success: true, quantity, message: 'Card added to collection' };
		}
		return { success: false, message: 'Failed to add card' };
	}
}

export async function removeCardFromCollection(cardId: string, removeAll: boolean = false): Promise<{ success: boolean; quantity?: number; message?: string }> {
	try {
		const url = removeAll ? `/api/collection/${cardId}?all=true` : `/api/collection/${cardId}`;
		const response = await fetch(url, {
			method: 'DELETE'
		});
		
		if (response.ok) {
			const data = await response.json();
			return { success: true, quantity: data.quantity, message: data.message };
		} else {
			const errorData = await response.json();
			console.error('Failed to remove card:', errorData.error);
			return { success: false, message: errorData.error };
		}
	} catch (error) {
		console.error('Error removing card from collection:', error);
		// Fallback to localStorage
		if (typeof window !== 'undefined') {
			const collection = await loadCollectionFromStorage();
			const cardIndex = collection.findIndex(c => c.id === cardId);
			
			if (cardIndex >= 0) {
				if (removeAll || (collection[cardIndex].quantity || 1) <= 1) {
					collection.splice(cardIndex, 1);
				} else {
					collection[cardIndex].quantity = (collection[cardIndex].quantity || 1) - 1;
				}
				localStorage.setItem('mtg-collection', JSON.stringify(collection));
				return { success: true, message: 'Card updated' };
			}
		}
		return { success: false, message: 'Failed to remove card' };
	}
}

export async function updateCardQuantity(cardId: string, quantity: number): Promise<{ success: boolean; quantity?: number; message?: string }> {
	try {
		const response = await fetch('/api/collection/quantity', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ cardId, quantity })
		});

		if (response.ok) {
			const data = await response.json();
			return { success: true, quantity: data.quantity, message: data.message };
		} else {
			const errorData = await response.json();
			console.error('Failed to update quantity:', errorData.error);
			return { success: false, message: errorData.error };
		}
	} catch (error) {
		console.error('Error updating card quantity:', error);
		return { success: false, message: 'Failed to update quantity' };
	}
}

export async function toggleCardFavorite(
	cardId: string,
	isFavorite: boolean
): Promise<{ success: boolean; isFavorite?: boolean; message?: string }> {
	try {
		const response = await fetch(`/api/collection/${cardId}/favorite`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ isFavorite })
		});

		if (response.ok) {
			const data = await response.json();
			return { success: true, isFavorite: data.isFavorite, message: data.message };
		} else {
			const errorData = await response.json();
			return { success: false, message: errorData.error };
		}
	} catch (error) {
		console.error('Error toggling favorite:', error);
		return { success: false, message: 'Failed to update favorite status' };
	}
}