<script lang="ts">
	import type { ScryfallCard } from '$lib/utils';
	import { calculateCollectionValue, formatCurrency } from '$lib/utils';
	import CollectionControls from './CollectionControls.svelte';
	import CollectionCard from './CollectionCard.svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	
	export let collection: ScryfallCard[] = [];
	export let colorFilter: string | null = null;
	export let sortBy: string = 'value-desc';
	export let searchFilter: string = '';
	export let favoritesOnly: boolean = false;

	// Declare the sorted collection variable
	let sortedCollection: ScryfallCard[] = [];
	let availableDecks: any[] = [];
	
	const dispatch = createEventDispatcher();
	
	onMount(() => {
		loadDecks();
	});
	
	async function loadDecks() {
		try {
			const response = await fetch('/api/decks');
			if (response.ok) {
				availableDecks = await response.json();
			}
		} catch (error) {
			console.error('Failed to load decks:', error);
		}
	}
	
	function getCardColorCategory(card: ScryfallCard): string {
		const colors = card.colors || [];
		
		if (colors.length === 0) {
			return 'Colorless';
		} else if (colors.length === 1) {
			switch (colors[0]) {
				case 'W': return 'White';
				case 'U': return 'Blue';
				case 'B': return 'Black';
				case 'R': return 'Red';
				case 'G': return 'Green';
				default: return 'Other';
			}
		} else {
			return 'Multicolor';
		}
	}

	function getColorSortOrder(category: string): number {
		const order = ['White', 'Blue', 'Black', 'Red', 'Green', 'Multicolor', 'Colorless'];
		return order.indexOf(category);
	}

	function matchesColorFilter(card: ScryfallCard, filter = colorFilter): boolean {
		if (!filter) return true;
		
		const cardCategory = getCardColorCategory(card);
		return cardCategory === filter;
	}

	function matchesSearchFilter(card: ScryfallCard, search = searchFilter): boolean {
		if (!search) return true;

		return card.name.toLowerCase().startsWith(search.toLowerCase().trim());
	}

	function matchesFavoritesFilter(card: ScryfallCard, favFilter = favoritesOnly): boolean {
		if (!favFilter) return true;
		return card.isFavorite === true;
	}

	function getFilteredCollection(): ScryfallCard[] {
		return collection.filter(card =>
			matchesColorFilter(card, colorFilter) &&
			matchesSearchFilter(card, searchFilter) &&
			matchesFavoritesFilter(card, favoritesOnly)
		);
	}

	function getFilteredCardCount(): number {
		return getFilteredCollection().reduce((total, card) => total + (card.quantity || 1), 0);
	}

	function getFilteredUniqueCardCount(): number {
		return getFilteredCollection().length;
	}

	function getCollectionCount(): number {
		return collection.reduce((total, card) => total + (card.quantity || 1), 0);
	}

	function getUniqueCardCount(): number {
		return collection.length;
	}

	function getSortedCollection(col = collection, colorF = colorFilter, search = searchFilter, sort = sortBy, favFilter = favoritesOnly): ScryfallCard[] {
		// First apply all filters, then sort
		const filtered = col.filter(card =>
			matchesColorFilter(card, colorF) &&
			matchesSearchFilter(card, search) &&
			matchesFavoritesFilter(card, favFilter)
		);
		
		switch (sort) {
			case 'value-desc':
				return filtered.sort((a, b) => {
					const aValue = parseFloat(a.prices?.usd || '0');
					const bValue = parseFloat(b.prices?.usd || '0');
					return bValue - aValue;
				});
			case 'value-asc':
				return filtered.sort((a, b) => {
					const aValue = parseFloat(a.prices?.usd || '0');
					const bValue = parseFloat(b.prices?.usd || '0');
					return aValue - bValue;
				});
			case 'name-asc':
				return filtered.sort((a, b) => a.name.localeCompare(b.name));
			case 'name-desc':
				return filtered.sort((a, b) => b.name.localeCompare(a.name));
			case 'type-asc':
				return filtered.sort((a, b) => a.type_line.localeCompare(b.type_line));
			case 'type-desc':
				return filtered.sort((a, b) => b.type_line.localeCompare(a.type_line));
			case 'quantity-desc':
				return filtered.sort((a, b) => (b.quantity || 1) - (a.quantity || 1));
			case 'quantity-asc':
				return filtered.sort((a, b) => (a.quantity || 1) - (b.quantity || 1));
			case 'color-wubrg':
				return filtered.sort((a, b) => {
					const aCategory = getCardColorCategory(a);
					const bCategory = getCardColorCategory(b);
					const aOrder = getColorSortOrder(aCategory);
					const bOrder = getColorSortOrder(bCategory);

					if (aOrder !== bOrder) {
						return aOrder - bOrder;
					}

					// Same color, sort by name
					return a.name.localeCompare(b.name);
				});
			case 'favorites-first':
				return filtered.sort((a, b) => {
					const aFav = a.isFavorite ? 1 : 0;
					const bFav = b.isFavorite ? 1 : 0;
					if (bFav !== aFav) return bFav - aFav;
					// Secondary sort by name
					return a.name.localeCompare(b.name);
				});
			default:
				return filtered;
		}
	}


	function handleOpenImageModal(event: CustomEvent) {
		dispatch('openImageModal', event.detail);
	}

	function handleUpdateQuantity(event: CustomEvent) {
		dispatch('updateQuantity', event.detail);
	}

	function handleRemoveCard(event: CustomEvent) {
		dispatch('removeCard', event.detail);
	}
	
	async function handleAddToDeck(event: CustomEvent) {
		const { cardId, deckId, quantity } = event.detail;

		try {
			const response = await fetch(`/api/decks/${deckId}/cards`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ cardId, quantity })
			});

			if (response.ok) {
				const result = await response.json();
				// Show success message
				alert(result.message || 'Card added to deck!');
			} else {
				const error = await response.json();
				alert(error.error || 'Failed to add card to deck');
			}
		} catch (error) {
			console.error('Error adding card to deck:', error);
			alert('Failed to add card to deck');
		}
	}

	function handleFavoriteToggled(event: CustomEvent) {
		const { cardId, isFavorite } = event.detail;
		// Update local collection state
		collection = collection.map(card =>
			card.id === cardId ? { ...card, isFavorite } : card
		);
	}

	// Reactive statement to ensure collection updates when filters change
	$: sortedCollection = getSortedCollection(collection, colorFilter, searchFilter, sortBy, favoritesOnly);
</script>

<div class="collection-view">
	<div class="collection-header">
		<div class="collection-info">
			<h2>
				My Collection
				{#if colorFilter || searchFilter || favoritesOnly}
					({getFilteredCardCount()} cards, {getFilteredUniqueCardCount()} unique{#if colorFilter} - {colorFilter} filter{/if}{#if searchFilter} - "{searchFilter}" search{/if}{#if favoritesOnly} - Favorites{/if})
				{:else}
					({getCollectionCount()} cards, {getUniqueCardCount()} unique)
				{/if}
			</h2>
			{#if collection.length > 0}
				<div class="collection-value">
					<strong>Total Worth: {formatCurrency(calculateCollectionValue(getFilteredCollection()))}</strong>
				</div>
			{/if}
		</div>
		{#if collection.length > 0}
			<CollectionControls
				bind:colorFilter={colorFilter}
				bind:sortBy={sortBy}
				bind:searchFilter={searchFilter}
				bind:favoritesOnly={favoritesOnly}
			/>
		{/if}
	</div>
	
	{#if collection.length === 0}
		<p class="empty-collection">Your collection is empty. Search for cards and add them to get started!</p>
	{:else}
		<div class="collection-grid">
			{#each sortedCollection as card}
				<CollectionCard
					{card}
					{availableDecks}
					on:openImageModal={handleOpenImageModal}
					on:updateQuantity={handleUpdateQuantity}
					on:removeCard={handleRemoveCard}
					on:addToDeck={handleAddToDeck}
					on:favoriteToggled={handleFavoriteToggled}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.collection-view {
		margin-top: 2rem;
		max-width: 1200px;
		margin-left: auto;
		margin-right: auto;
	}
	
	.collection-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 3rem;
		padding: 25px 35px;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 20px;
		backdrop-filter: blur(20px);
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
		gap: 25px;
	}

	.collection-info {
		flex: 1;
	}
	
	.collection-header h2 {
		margin: 0;
		font-family: 'Cinzel', serif;
		font-size: 2rem;
		font-weight: 600;
		color: #c9b037;
		text-shadow: 0 2px 10px rgba(201, 176, 55, 0.3);
	}
	
	.collection-value {
		font-size: 1.5rem;
		color: #4caf50;
		padding: 10px 24px;
		background: linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0.1) 100%);
		border: 1px solid rgba(76, 175, 80, 0.4);
		border-radius: 15px;
		backdrop-filter: blur(5px);
		font-family: 'Cinzel', serif;
		font-weight: 600;
		text-shadow: 0 2px 10px rgba(76, 175, 80, 0.3);
	}
	
	.empty-collection {
		text-align: center;
		color: rgba(232, 233, 237, 0.7);
		font-style: italic;
		font-size: 1.2rem;
		margin: 4rem 0;
		padding: 3rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px dashed rgba(255, 255, 255, 0.1);
		border-radius: 20px;
	}
	
	.collection-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 30px;
		margin-top: 2rem;
	}

	@media (max-width: 768px) {
		.collection-grid {
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
			gap: 20px;
		}
		
		.collection-header {
			flex-direction: column;
			gap: 15px;
			text-align: center;
			align-items: center;
		}
	}
</style>