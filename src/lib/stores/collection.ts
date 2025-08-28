import { writable } from 'svelte/store';
import type { ScryfallCard } from '$lib/utils';

function createCollectionStore() {
	const { subscribe, set, update } = writable<ScryfallCard[]>([]);
	
	return {
		subscribe,
		set: (value: ScryfallCard[]) => {
			console.log('Collection store updated with', value.length, 'cards');
			set(value);
		},
		update
	};
}

export const collection = createCollectionStore();

// Derived stores for commonly needed values
import { derived } from 'svelte/store';

export const collectionCount = derived(
	collection,
	($collection) => $collection.reduce((total, card) => total + (card.quantity || 1), 0)
);

export const uniqueCardCount = derived(
	collection,
	($collection) => $collection.length
);