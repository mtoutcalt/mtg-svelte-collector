<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import type { ScryfallCard } from '$lib/utils';
	import CollectionCard from './collection/CollectionCard.svelte';

	const dispatch = createEventDispatcher();

	let todaysCards: ScryfallCard[] = [];
	let isLoading = true;
	let error = '';

	onMount(async () => {
		await loadTodaysAdditions();
	});

	async function loadTodaysAdditions() {
		isLoading = true;
		error = '';
		try {
			const response = await fetch('/api/collection/today');
			if (!response.ok) {
				throw new Error('Failed to load today\'s additions');
			}
			todaysCards = await response.json();
		} catch (err) {
			console.error('Error loading today\'s additions:', err);
			error = 'Failed to load today\'s additions';
		} finally {
			isLoading = false;
		}
	}

	function handleQuantityUpdate(event: CustomEvent<{ cardId: string; quantity: number }>) {
		const { cardId, quantity } = event.detail;
		const card = todaysCards.find(c => c.id === cardId);
		if (card) {
			card.quantity = quantity;
			todaysCards = todaysCards; // Trigger reactivity
		}
	}

	function handleRemoveCard(event: CustomEvent<{ cardId: string; removeAll: boolean }>) {
		const { cardId } = event.detail;
		todaysCards = todaysCards.filter(c => c.id !== cardId);
	}

	function handleImageModal(event: CustomEvent<{ src: string; name: string }>) {
		// Forward the event to parent component
		dispatch('openImageModal', event.detail);
	}

	function handlePriceUpdated(event: CustomEvent<{ cardId: string; price: string; lastUpdated: string }>) {
		const { cardId, price, lastUpdated } = event.detail;
		const card = todaysCards.find(c => c.id === cardId);
		if (card) {
			if (card.prices) {
				card.prices.usd = price;
			}
			if (card.priceHistory) {
				card.priceHistory.lastUpdated = lastUpdated;
			}
			todaysCards = todaysCards; // Trigger reactivity
		}
	}

	function handleFavoriteToggled(event: CustomEvent<{ cardId: string; isFavorite: boolean }>) {
		const { cardId, isFavorite } = event.detail;
		const card = todaysCards.find(c => c.id === cardId);
		if (card) {
			card.isFavorite = isFavorite;
			todaysCards = todaysCards; // Trigger reactivity
		}
	}

	$: totalQuantity = todaysCards.reduce((sum, card) => sum + (card.quantity || 1), 0);
	$: totalValue = todaysCards.reduce((sum, card) => {
		const price = parseFloat(card.prices?.usd || '0');
		const quantity = card.quantity || 1;
		return sum + (price * quantity);
	}, 0);
</script>

{#if !isLoading && todaysCards.length > 0}
	<section class="todays-additions">
		<div class="section-header">
			<h2 class="section-title">📅 Today's Additions</h2>
			<div class="section-stats">
				<span class="stat">{todaysCards.length} {todaysCards.length === 1 ? 'card' : 'cards'}</span>
				<span class="stat-separator">•</span>
				<span class="stat">{totalQuantity} {totalQuantity === 1 ? 'copy' : 'copies'}</span>
				{#if totalValue > 0}
					<span class="stat-separator">•</span>
					<span class="stat value">${totalValue.toFixed(2)} total value</span>
				{/if}
			</div>
		</div>

		<div class="cards-grid">
			{#each todaysCards as card (card.id)}
				<CollectionCard
					{card}
					availableDecks={[]}
					on:openImageModal={handleImageModal}
					on:updateQuantity={handleQuantityUpdate}
					on:removeCard={handleRemoveCard}
					on:priceUpdated={handlePriceUpdated}
					on:favoriteToggled={handleFavoriteToggled}
				/>
			{/each}
		</div>
	</section>
{:else if isLoading}
	<div class="loading-message">Loading today's additions...</div>
{:else if error}
	<div class="error-message">{error}</div>
{/if}

<style>
	.todays-additions {
		margin: 2rem 0;
		padding: 2rem;
		background: linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%);
		border: 2px solid rgba(33, 150, 243, 0.3);
		border-radius: 20px;
		backdrop-filter: blur(10px);
		box-shadow: 0 8px 32px rgba(33, 150, 243, 0.2);
	}

	.section-header {
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.section-title {
		margin: 0 0 0.5rem 0;
		font-family: 'Cinzel', serif;
		font-size: 1.8rem;
		font-weight: 700;
		color: #2196F3;
		text-shadow: 0 2px 15px rgba(33, 150, 243, 0.5);
		background: linear-gradient(45deg, #2196F3, #64B5F6);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.section-stats {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.95rem;
		color: rgba(232, 233, 237, 0.8);
	}

	.stat {
		font-weight: 600;
	}

	.stat.value {
		color: #4caf50;
		font-weight: 700;
	}

	.stat-separator {
		color: rgba(232, 233, 237, 0.4);
	}

	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
		margin-top: 1rem;
	}

	.loading-message {
		padding: 2rem;
		text-align: center;
		color: rgba(232, 233, 237, 0.6);
		font-style: italic;
	}

	.error-message {
		padding: 1rem;
		text-align: center;
		color: #f44336;
		background: rgba(244, 67, 54, 0.1);
		border: 1px solid rgba(244, 67, 54, 0.3);
		border-radius: 8px;
		margin: 1rem 0;
	}

	@media (max-width: 768px) {
		.todays-additions {
			padding: 1.5rem;
		}

		.section-title {
			font-size: 1.5rem;
		}

		.section-stats {
			flex-direction: column;
			gap: 0.25rem;
		}

		.stat-separator {
			display: none;
		}

		.cards-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
