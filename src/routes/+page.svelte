<script lang="ts">
	import {
		type ScryfallCard,
		type ScryfallError,
		type ScryfallSearchResponse,
		type CardData,
		isError,
		isCard,
		calculateCollectionValue,
		formatCurrency,
		loadCollectionFromStorage,
		addCardToCollection,
		removeCardFromCollection,
		updateCardQuantity
	} from '$lib/utils';
	import { onMount } from 'svelte';
	
	// Import new components
	import Navigation from '$lib/components/common/Navigation.svelte';
	import SearchForm from '$lib/components/search/SearchForm.svelte';
	import SearchResults from '$lib/components/search/SearchResults.svelte';
	import CardDetails from '$lib/components/search/CardDetails.svelte';
	import CollectionView from '$lib/components/collection/CollectionView.svelte';
	import AnalyticsView from '$lib/components/analytics/AnalyticsView.svelte';
	import ImageModal from '$lib/components/common/ImageModal.svelte';
	
	// Import global styles
	import '$lib/components/styles/globals.css';

	// State variables
	let cardName: string = '';
	let cardData: CardData = null;
	let searchResults: ScryfallCard[] = [];
	let showMultipleResults: boolean = false;
	let loading: boolean = false;
	let addedToCollection: boolean = false;
	let addMessage: string = '';
	let viewingCollection: boolean = false;
	let viewingAnalytics: boolean = false;
	let collection: ScryfallCard[] = [];
	let showImageModal: boolean = false;
	let modalImageSrc: string = '';
	let modalImageName: string = '';
	let colorFilter: string | null = null;
	let sortBy: string = 'value-desc';
	let analyticsData: any = null;
	let analyticsLoading: boolean = false;
	let updatingPrices: boolean = false;

	// Load collection on mount
	async function loadCollection(): Promise<void> {
		collection = await loadCollectionFromStorage();
	}

	// Load collection on page load
	onMount(() => {
		loadCollection();
	});

	// Search functionality
	async function searchCard(): Promise<void> {
		if (!cardName.trim()) return;
		
		// Reset state when searching
		addedToCollection = false;
		cardData = null;
		searchResults = [];
		showMultipleResults = false;
		loading = true;
		
		try {
			// First try exact search
			const exactResponse = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
			if (exactResponse.ok) {
				cardData = await exactResponse.json() as ScryfallCard;
				loading = false;
				return;
			}
			
			// If exact search fails, try fuzzy search for multiple results
			const fuzzyResponse = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(cardName)}&order=name`);
			if (fuzzyResponse.ok) {
				const fuzzyData = await fuzzyResponse.json() as ScryfallSearchResponse;
				if (fuzzyData.data && fuzzyData.data.length > 0) {
					// Get up to 8 results
					const results = fuzzyData.data.slice(0, 8).map(card => ({ ...card, fuzzyMatch: true }));
					
					if (results.length === 1) {
						// Only one result found, show it as single card
						cardData = results[0];
					} else {
						// Multiple results found, show them as options
						searchResults = results;
						showMultipleResults = true;
					}
				} else {
					cardData = { 
						error: `No cards found matching "${cardName}". Try a different search term.`,
						notFound: true 
					};
				}
			} else {
				cardData = { 
					error: `Server error (${fuzzyResponse.status}). Please try again later.` 
				};
			}
		} catch (error) {
			if (error instanceof TypeError && error.message.includes('fetch')) {
				cardData = { error: 'Network error. Please check your internet connection.' };
			} else {
				cardData = { error: 'Something went wrong. Please try again.' };
			}
		}
		loading = false;
	}

	// Collection functions
	async function addToCollection(card: ScryfallCard, quantity: number = 1): Promise<void> {
		const result = await addCardToCollection(card, quantity);
		if (result.success) {
			addedToCollection = true;
			addMessage = result.message || 'Added to collection!';
			
			// Update local collection if viewing
			if (viewingCollection) {
				await loadCollection();
			}
			
			// Reset the feedback after 3 seconds
			setTimeout(() => {
				addedToCollection = false;
				addMessage = '';
			}, 3000);
		}
	}

	// Event handlers
	function handleSelectCard(event: CustomEvent) {
		cardData = event.detail;
		showMultipleResults = false;
		searchResults = [];
	}

	function handleAddToCollection(event: CustomEvent) {
		const { card, quantity } = event.detail;
		addToCollection(card, quantity);
	}

	function handleToggleCollection() {
		viewingCollection = !viewingCollection;
		viewingAnalytics = false;
		if (viewingCollection) {
			loadCollection();
		}
	}

	function handleToggleAnalytics() {
		viewingAnalytics = !viewingAnalytics;
		viewingCollection = false;
		if (viewingAnalytics) {
			loadAnalytics();
		}
	}

	async function loadAnalytics(): Promise<void> {
		analyticsLoading = true;
		try {
			const response = await fetch('/api/analytics');
			if (response.ok) {
				analyticsData = await response.json();
			} else {
				console.error('Failed to load analytics:', response.statusText);
			}
		} catch (error) {
			console.error('Error loading analytics:', error);
		}
		analyticsLoading = false;
	}

	async function updatePrices(): Promise<void> {
		updatingPrices = true;
		try {
			const response = await fetch('/api/prices', { method: 'PUT' });
			if (response.ok) {
				const result = await response.json();
				console.log('Prices updated:', result);
				// Reload analytics after updating prices
				if (viewingAnalytics) {
					await loadAnalytics();
				}
			} else {
				console.error('Failed to update prices:', response.statusText);
			}
		} catch (error) {
			console.error('Error updating prices:', error);
		}
		updatingPrices = false;
	}

	function handleUpdatePrices() {
		updatePrices();
	}

	function handleOpenImageModal(event: CustomEvent) {
		const { src, name } = event.detail;
		modalImageSrc = src;
		modalImageName = name;
		showImageModal = true;
	}

	function handleCloseImageModal() {
		showImageModal = false;
		modalImageSrc = '';
		modalImageName = '';
	}

	function getCollectionCount(): number {
		return collection.reduce((total, card) => total + (card.quantity || 1), 0);
	}

	function getUniqueCardCount(): number {
		return collection.length;
	}

	// Collection management functions
	async function removeFromCollection(cardId: string, removeAll: boolean = false): Promise<void> {
		const result = await removeCardFromCollection(cardId, removeAll);
		if (result.success) {
			// Update local collection
			await loadCollection();
		}
	}

	async function updateQuantity(cardId: string, quantity: number): Promise<void> {
		const result = await updateCardQuantity(cardId, quantity);
		if (result.success) {
			// Update local collection
			await loadCollection();
		}
	}

	// Collection event handlers
	function handleUpdateQuantity(event: CustomEvent) {
		const { cardId, quantity } = event.detail;
		updateQuantity(cardId, quantity);
	}

	function handleRemoveCard(event: CustomEvent) {
		const { cardId, removeAll } = event.detail;
		removeFromCollection(cardId, removeAll);
	}
</script>

<!-- Navigation -->
<Navigation 
	{viewingCollection} 
	{viewingAnalytics}
	collectionCount={getCollectionCount()}
	uniqueCardCount={getUniqueCardCount()}
	on:toggleCollection={handleToggleCollection}
	on:toggleAnalytics={handleToggleAnalytics}
/>

{#if !viewingCollection && !viewingAnalytics}
	<!-- Search Section -->
	<SearchForm 
		bind:cardName={cardName}
		{loading}
		on:search={searchCard}
	/>

	<!-- Search Results -->
	<SearchResults 
		{searchResults}
		{cardName}
		on:selectCard={handleSelectCard}
	/>

	<!-- Card Details -->
	<CardDetails 
		cardData={isCard(cardData) ? cardData : null}
		{loading}
		{addedToCollection}
		{addMessage}
		on:addToCollection={handleAddToCollection}
		on:openImageModal={handleOpenImageModal}
	/>

	<!-- Error Display -->
	{#if isError(cardData)}
		<p class="error">{cardData.error}</p>
	{/if}

{:else if viewingCollection}
	<!-- Collection View -->
	<CollectionView
		{collection}
		bind:colorFilter={colorFilter}
		bind:sortBy={sortBy}
		on:openImageModal={handleOpenImageModal}
		on:updateQuantity={handleUpdateQuantity}
		on:removeCard={handleRemoveCard}
	/>

{:else if viewingAnalytics}
	<!-- Analytics View -->
	<AnalyticsView
		{collection}
		{analyticsData}
		{analyticsLoading}
		{updatingPrices}
		on:updatePrices={handleUpdatePrices}
	/>
{/if}

<!-- Image Modal -->
<ImageModal 
	show={showImageModal}
	imageSrc={modalImageSrc}
	imageName={modalImageName}
	on:close={handleCloseImageModal}
/>