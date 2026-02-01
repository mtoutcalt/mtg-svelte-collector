<script lang="ts">
	import type { ScryfallCard } from '$lib/utils';
	import { getCardImageUri, toggleCardFavorite } from '$lib/utils';
	import { createEventDispatcher } from 'svelte';

	export let card: ScryfallCard;
	export let quantity: number = card.quantity || 1;
	export let isDeckCard: boolean = false;
	export let availableDecks: any[] = [];

	const dispatch = createEventDispatcher();

	let showDeckSelector = false;
	let isRefreshingPrice = false;
	let priceRefreshError = '';
	let showRemoveAllConfirmation = false;
	let isFavoriteState = card.isFavorite || false;
	let isTogglingFavorite = false;
	let errorMessage = '';

	function handleImageClick() {
		dispatch('openImageModal', {
			src: getCardImageUri(card, 'large') || getCardImageUri(card, 'normal') || '',
			name: card.name
		});
	}
	
	function handleQuantityUpdate(newQuantity: number) {
		dispatch('updateQuantity', { cardId: card.id, quantity: newQuantity });
	}
	
	function handleRemoveCard(removeAll: boolean) {
		if (removeAll && !isDeckCard) {
			// Show confirmation modal for removing all copies
			showRemoveAllConfirmation = true;
		} else {
			// Directly remove for single card or deck cards
			dispatch('removeCard', { cardId: card.id, removeAll });
		}
	}

	function confirmRemoveAll() {
		showRemoveAllConfirmation = false;
		dispatch('removeCard', { cardId: card.id, removeAll: true });
	}

	function cancelRemoveAll() {
		showRemoveAllConfirmation = false;
	}
	
	function handleAddToDeck(deckId: string) {
		dispatch('addToDeck', { cardId: card.id, deckId, quantity: 1 });
		showDeckSelector = false;
	}

	async function handleRefreshPrice() {
		isRefreshingPrice = true;
		priceRefreshError = '';

		try {
			const response = await fetch(`/api/collection/${card.id}/price`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error('Failed to refresh price');
			}

			const data = await response.json();

			// Update the card with new price data
			card.prices = {
				...card.prices,
				usd: data.card.price
			};

			if (card.priceHistory) {
				card.priceHistory.lastUpdated = data.card.lastUpdated;
			} else {
				card.priceHistory = { lastUpdated: data.card.lastUpdated };
			}

			// Notify parent component about the price update
			dispatch('priceUpdated', {
				cardId: card.id,
				price: data.card.price,
				lastUpdated: data.card.lastUpdated
			});
		} catch (error) {
			console.error('Error refreshing price:', error);
			priceRefreshError = 'Failed to refresh price';
		} finally {
			isRefreshingPrice = false;
		}
	}

	async function handleToggleFavorite() {
		isTogglingFavorite = true;
		const result = await toggleCardFavorite(card.id, !isFavoriteState);

		if (result.success) {
			isFavoriteState = result.isFavorite ?? false;
			dispatch('favoriteToggled', { cardId: card.id, isFavorite: result.isFavorite });
		} else {
			errorMessage = result.message || 'Failed to update favorite';
			setTimeout(() => errorMessage = '', 3000);
		}

		isTogglingFavorite = false;
	}

	function formatLastUpdated(timestamp: string | undefined): string {
		if (!timestamp) return 'Never';

		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 30) return `${diffDays}d ago`;

		return date.toLocaleDateString();
	}
	
	function getValueTier(price: number): string {
		if (price >= 50) return 'high-value';
		if (price >= 10) return 'medium-value';
		if (price >= 5) return 'low-value';
		return 'standard';
	}

	$: displayQuantity = isDeckCard ? quantity : card.quantity || 1;
	$: cardPrice = parseFloat(card.prices?.usd || '0');
	$: valueTier = getValueTier(cardPrice);
</script>

<div class="collection-card {valueTier}">
	<div class="card-image-wrapper">
		<button
			class="image-button collection-image-button"
			on:click={handleImageClick}
			title="Click to enlarge"
			aria-label="View larger image of {card.name}"
		>
			<img
				src={getCardImageUri(card, 'normal')}
				alt={card.name}
				class="collection-card-image"
			/>
		</button>
		<div class="favorite-button-wrapper">
			<button
				class="favorite-button {isFavoriteState ? 'active' : ''}"
				on:click|stopPropagation={handleToggleFavorite}
				disabled={isTogglingFavorite}
				title={isFavoriteState ? 'Remove from favorites' : 'Add to favorites'}
				aria-label={isFavoriteState ? 'Remove from favorites' : 'Add to favorites'}
			>
				{isFavoriteState ? '⭐' : '☆'}
			</button>
		</div>
	</div>
	<div class="collection-card-info">
		<h3>{card.name}</h3>
		<p class="card-type">{card.type_line}</p>
		<p class="card-price">{card.prices?.usd ? `$${card.prices.usd} each` : 'N/A'}</p>

		{#if !isDeckCard}
			<div class="price-info-section">
				<button
					class="refresh-price-button"
					on:click={handleRefreshPrice}
					disabled={isRefreshingPrice}
					title="Refresh price from Scryfall"
				>
					<span class="refresh-icon" class:spinning={isRefreshingPrice}>🔄</span>
					{isRefreshingPrice ? 'Refreshing...' : 'Refresh Price'}
				</button>
				<p class="price-timestamp">
					Last updated: {formatLastUpdated(card.priceHistory?.lastUpdated)}
				</p>
				{#if priceRefreshError}
					<p class="price-error">{priceRefreshError}</p>
				{/if}
			</div>
		{/if}

		<div class="quantity-display">
			<span class="quantity-label">Quantity: <strong>{displayQuantity}</strong></span>
			<div class="quantity-controls-collection">
				<button 
					class="quantity-btn-small"
					on:click={() => handleQuantityUpdate((card.quantity || 1) + 1)}
					title="Add one"
				>
					+
				</button>
				<button 
					class="quantity-btn-small"
					on:click={() => handleRemoveCard(false)}
					title="Remove one"
					disabled={(card.quantity || 1) <= 1}
				>
					-
				</button>
			</div>
		</div>
		<div class="card-buttons">
			{#if !isDeckCard && availableDecks.length > 0}
				<div class="deck-selector-wrapper">
					<button 
						class="add-to-deck-button"
						on:click={() => showDeckSelector = !showDeckSelector}
						title="Add to deck"
					>
						🃏 Add to Deck
					</button>
					
					{#if showDeckSelector}
						<div class="deck-selector">
							<p class="deck-selector-title">Select Deck:</p>
							{#each availableDecks as deck}
								<button
									class="deck-option"
									on:click={() => handleAddToDeck(deck.id)}
								>
									{deck.name}
								</button>
							{/each}
							<button
								class="deck-selector-cancel"
								on:click={() => showDeckSelector = false}
							>
								Cancel
							</button>
						</div>
					{/if}
				</div>
			{/if}
			
			<button 
				class="remove-button" 
				on:click={() => handleRemoveCard(true)}
				title={isDeckCard ? 'Remove from deck' : 'Remove all copies'}
			>
				🗑️ {isDeckCard ? 'Remove from Deck' : 'Remove All'}
			</button>
		</div>
	</div>
</div>

{#if showRemoveAllConfirmation}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={cancelRemoveAll} role="button" tabindex="0" aria-label="Close confirmation">
		<div class="confirmation-modal" on:click={(e) => e.stopPropagation()}>
			<h3 class="confirmation-title">Remove All Copies?</h3>
			<p class="confirmation-message">
				Are you sure you want to remove all {displayQuantity} {displayQuantity === 1 ? 'copy' : 'copies'} of <strong>{card.name}</strong> from your collection?
			</p>
			<div class="confirmation-buttons">
				<button class="confirm-yes-button" on:click={confirmRemoveAll}>
					Yes, Remove All
				</button>
				<button class="confirm-no-button" on:click={cancelRemoveAll}>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.collection-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 20px;
		overflow: hidden;
		backdrop-filter: blur(10px);
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
		position: relative;
	}

	.collection-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(90deg, transparent, rgba(201, 176, 55, 0.5), transparent);
		transform: scaleX(0);
		transition: transform 0.3s ease;
	}
	
	.collection-card:hover {
		transform: translateY(-8px) scale(1.02);
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
		border-color: rgba(201, 176, 55, 0.3);
	}

	.collection-card:hover::before {
		transform: scaleX(1);
	}

	.image-button {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		display: block;
		transition: transform 0.3s ease;
		width: 100%;
	}

	.image-button:hover {
		transform: scale(1.05);
	}

	.image-button:focus {
		outline: 3px solid #c9b037;
		outline-offset: 3px;
		border-radius: 20px;
	}

	.card-image-wrapper {
		position: relative;
		width: 100%;
	}

	.favorite-button-wrapper {
		position: absolute;
		top: 10px;
		left: 10px;
		z-index: 5;
	}

	.favorite-button {
		background: rgba(0, 0, 0, 0.7);
		border: 2px solid rgba(201, 176, 55, 0.5);
		border-radius: 50%;
		width: 45px;
		height: 45px;
		font-size: 1.5rem;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		backdrop-filter: blur(5px);
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(201, 176, 55, 0.8);
		padding: 0;
	}

	.favorite-button:hover:not(:disabled) {
		transform: scale(1.15);
		border-color: #ffd700;
		background: rgba(0, 0, 0, 0.85);
	}

	.favorite-button.active {
		border-color: #ffd700;
		box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
		color: #ffd700;
	}

	.favorite-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.collection-card-image {
		width: 100%;
		height: auto;
		display: block;
		transition: filter 0.3s ease;
	}

	.collection-card:hover .collection-card-image {
		filter: brightness(1.1);
	}
	
	.collection-card-info {
		padding: 20px;
	}
	
	.collection-card-info h3 {
		margin: 0 0 8px 0;
		font-size: 1.1rem;
		font-family: 'Cinzel', serif;
		font-weight: 600;
		color: #c9b037;
		text-shadow: 0 1px 5px rgba(201, 176, 55, 0.3);
	}
	
	.collection-card-info .card-type {
		margin: 0 0 8px 0;
		font-size: 0.9rem;
		color: rgba(232, 233, 237, 0.8);
		font-style: italic;
	}
	
	.collection-card-info .card-price {
		margin: 0 0 10px 0;
		font-size: 1rem;
		font-weight: 600;
		color: #4caf50;
		font-family: 'Cinzel', serif;
	}
	
	.quantity-display {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 10px 0 15px 0;
		padding: 8px 10px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.quantity-label {
		font-size: 0.9rem;
		color: #e8e9ed;
	}
	
	.quantity-controls-collection {
		display: flex;
		gap: 5px;
	}
	
	.quantity-btn-small {
		background: linear-gradient(135deg, #6a4c93 0%, #9b59b6 100%);
		color: white;
		border: none;
		padding: 4px 8px;
		border-radius: 6px;
		cursor: pointer;
		font-size: 12px;
		font-weight: bold;
		transition: all 0.3s ease;
		min-width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.quantity-btn-small:hover:not(:disabled) {
		transform: translateY(-1px);
		background: linear-gradient(135deg, #7c5ba6 0%, #a569c7 100%);
	}
	
	.quantity-btn-small:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
	
	.card-buttons {
		margin-top: 10px;
	}
	
	.remove-button {
		background: linear-gradient(135deg, #f44336 0%, #e57373 100%);
		color: white;
		border: none;
		padding: 10px 15px;
		border-radius: 12px;
		cursor: pointer;
		font-size: 0.9rem;
		font-family: 'Cinzel', serif;
		font-weight: 600;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		width: 100%;
		box-shadow: 0 4px 15px rgba(244, 67, 54, 0.4);
	}
	
	.remove-button:hover {
		transform: translateY(-2px);
		background: linear-gradient(135deg, #f55a4e 0%, #ef5350 100%);
		box-shadow: 0 8px 25px rgba(244, 67, 54, 0.6);
	}
	
	.deck-selector-wrapper {
		position: relative;
		margin-bottom: 10px;
	}
	
	.add-to-deck-button {
		background: linear-gradient(135deg, #2196F3 0%, #42A5F5 100%);
		color: white;
		border: none;
		padding: 10px 15px;
		border-radius: 12px;
		cursor: pointer;
		font-size: 0.9rem;
		font-family: 'Cinzel', serif;
		font-weight: 600;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		width: 100%;
		box-shadow: 0 4px 15px rgba(33, 150, 243, 0.4);
	}
	
	.add-to-deck-button:hover {
		transform: translateY(-2px);
		background: linear-gradient(135deg, #2196F3 0%, #55B2F6 100%);
		box-shadow: 0 8px 25px rgba(33, 150, 243, 0.6);
	}
	
	.deck-selector {
		position: absolute;
		bottom: 100%;
		left: 0;
		right: 0;
		background: linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(40, 40, 40, 0.95) 100%);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		padding: 1rem;
		margin-bottom: 0.5rem;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(20px);
		z-index: 10;
	}
	
	.deck-selector-title {
		margin: 0 0 0.5rem 0;
		font-size: 0.8rem;
		color: #c9b037;
		font-weight: 600;
	}
	
	.deck-option {
		display: block;
		width: 100%;
		background: rgba(255, 255, 255, 0.1);
		color: #e8e9ed;
		border: none;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.8rem;
		margin-bottom: 0.25rem;
		transition: all 0.2s;
		text-align: left;
	}
	
	.deck-option:hover {
		background: rgba(201, 176, 55, 0.2);
		color: #c9b037;
	}
	
	.deck-selector-cancel {
		display: block;
		width: 100%;
		background: transparent;
		color: rgba(232, 233, 237, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.2);
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.8rem;
		margin-top: 0.5rem;
		transition: all 0.2s;
	}
	
	.deck-selector-cancel:hover {
		color: #e8e9ed;
		border-color: rgba(255, 255, 255, 0.3);
	}

	/* Value-based styling - More obvious effects */
	.collection-card.low-value {
		border: 3px solid #ffc107;
		box-shadow: 0 8px 25px rgba(255, 193, 7, 0.5), 0 0 25px rgba(255, 193, 7, 0.3);
		background: linear-gradient(135deg, rgba(255, 193, 7, 0.2) 0%, rgba(255, 193, 7, 0.1) 100%);
		position: relative;
	}

	.collection-card.low-value::before {
		background: linear-gradient(90deg, transparent, #ffc107, transparent);
		height: 3px;
		transform: scaleX(1);
	}

	.collection-card.low-value:hover {
		border-color: #ffb300;
		box-shadow: 0 20px 50px rgba(255, 193, 7, 0.6), 0 0 40px rgba(255, 193, 7, 0.4);
		transform: translateY(-10px) scale(1.03);
	}

	.collection-card.low-value .collection-card-info .card-price {
		color: #ffc107;
		font-size: 1.1rem;
		font-weight: 700;
		text-shadow: 0 2px 8px rgba(255, 193, 7, 0.4);
	}

	.collection-card.medium-value {
		border: 4px solid #9c27b0;
		box-shadow: 0 12px 35px rgba(156, 39, 176, 0.6), 0 0 35px rgba(156, 39, 176, 0.4);
		background: linear-gradient(135deg, rgba(156, 39, 176, 0.25) 0%, rgba(156, 39, 176, 0.15) 100%);
		position: relative;
		animation: pulse-purple 4s ease-in-out infinite;
	}

	.collection-card.medium-value::before {
		background: linear-gradient(90deg, transparent, #9c27b0, transparent);
		height: 4px;
		transform: scaleX(1);
	}

	.collection-card.medium-value::after {
		content: '💎';
		position: absolute;
		top: 10px;
		right: 10px;
		font-size: 1.5rem;
		z-index: 5;
		animation: rotate 6s linear infinite;
	}

	.collection-card.medium-value:hover {
		border-color: #ab47bc;
		box-shadow: 0 25px 60px rgba(156, 39, 176, 0.7), 0 0 60px rgba(156, 39, 176, 0.5);
		transform: translateY(-12px) scale(1.04);
	}

	.collection-card.medium-value .collection-card-info .card-price {
		color: #e91e63;
		font-size: 1.2rem;
		font-weight: 700;
		text-shadow: 0 2px 10px rgba(156, 39, 176, 0.6);
		background: linear-gradient(45deg, #9c27b0, #e91e63);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.collection-card.high-value {
		border: 5px solid #ffd700;
		box-shadow: 0 15px 45px rgba(255, 215, 0, 0.8), 0 0 50px rgba(255, 215, 0, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.3);
		background: linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 215, 0, 0.2) 50%, rgba(255, 255, 255, 0.1) 100%);
		position: relative;
		animation: golden-glow 2s ease-in-out infinite alternate;
		transform: scale(1.02);
	}

	.collection-card.high-value::before {
		background: linear-gradient(90deg, transparent, #ffd700, #fff, #ffd700, transparent);
		height: 5px;
		transform: scaleX(1);
		animation: golden-sweep 3s ease-in-out infinite;
	}

	.collection-card.high-value::after {
		content: '👑';
		position: absolute;
		top: 8px;
		right: 8px;
		font-size: 2rem;
		z-index: 5;
		animation: bounce 2s ease-in-out infinite;
		filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8));
	}

	.collection-card.high-value:hover {
		border-color: #ffeb3b;
		box-shadow: 0 30px 70px rgba(255, 215, 0, 0.9), 0 0 80px rgba(255, 215, 0, 0.7);
		transform: translateY(-15px) scale(1.05);
	}

	.collection-card.high-value .collection-card-info h3 {
		color: #ffd700;
		font-size: 1.3rem;
		font-weight: 700;
		text-shadow: 0 3px 15px rgba(255, 215, 0, 0.8);
		background: linear-gradient(45deg, #ffd700, #fff, #ffd700);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		animation: golden-text 3s ease-in-out infinite;
	}

	.collection-card.high-value .collection-card-info .card-price {
		color: #4caf50;
		font-size: 1.3rem;
		font-weight: 800;
		text-shadow: 0 3px 15px rgba(76, 175, 80, 0.8);
		background: linear-gradient(45deg, #4caf50, #8bc34a, #4caf50);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		animation: price-glow 2.5s ease-in-out infinite alternate;
	}

	@keyframes pulse-purple {
		0%, 100% { box-shadow: 0 12px 35px rgba(156, 39, 176, 0.6), 0 0 35px rgba(156, 39, 176, 0.4); }
		50% { box-shadow: 0 12px 35px rgba(156, 39, 176, 0.8), 0 0 45px rgba(156, 39, 176, 0.6); }
	}

	@keyframes golden-glow {
		0% { box-shadow: 0 15px 45px rgba(255, 215, 0, 0.8), 0 0 50px rgba(255, 215, 0, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.3); }
		100% { box-shadow: 0 20px 55px rgba(255, 215, 0, 1), 0 0 70px rgba(255, 215, 0, 0.8), inset 0 2px 0 rgba(255, 255, 255, 0.4); }
	}

	@keyframes golden-sweep {
		0% { transform: translateX(-100%) scaleX(1); }
		50% { transform: translateX(0) scaleX(1); }
		100% { transform: translateX(100%) scaleX(1); }
	}

	@keyframes rotate {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	@keyframes bounce {
		0%, 20%, 50%, 80%, 100% { transform: translateY(0) scale(1); }
		40% { transform: translateY(-8px) scale(1.1); }
		60% { transform: translateY(-4px) scale(1.05); }
	}

	@keyframes golden-text {
		0%, 100% { text-shadow: 0 3px 15px rgba(255, 215, 0, 0.8); }
		50% { text-shadow: 0 5px 25px rgba(255, 215, 0, 1), 0 0 15px rgba(255, 255, 255, 0.5); }
	}

	@keyframes price-glow {
		0% { text-shadow: 0 3px 15px rgba(76, 175, 80, 0.8); }
		100% { text-shadow: 0 5px 25px rgba(76, 175, 80, 1), 0 0 20px rgba(76, 175, 80, 0.6); }
	}

	/* Price refresh section styles */
	.price-info-section {
		margin: 10px 0;
		padding: 8px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.refresh-price-button {
		background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
		color: white;
		border: none;
		padding: 6px 12px;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.85rem;
		font-family: 'Cinzel', serif;
		font-weight: 600;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		width: 100%;
		box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
	}

	.refresh-price-button:hover:not(:disabled) {
		transform: translateY(-2px);
		background: linear-gradient(135deg, #66bb6a 0%, #81c784 100%);
		box-shadow: 0 4px 15px rgba(76, 175, 80, 0.5);
	}

	.refresh-price-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.refresh-icon {
		display: inline-block;
		transition: transform 0.3s ease;
	}

	.refresh-icon.spinning {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.price-timestamp {
		margin: 6px 0 0 0;
		font-size: 0.75rem;
		color: rgba(232, 233, 237, 0.6);
		text-align: center;
		font-style: italic;
	}

	.price-error {
		margin: 6px 0 0 0;
		font-size: 0.75rem;
		color: #f44336;
		text-align: center;
		font-weight: 600;
	}

	/* Confirmation Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.85);
		backdrop-filter: blur(20px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		animation: modalFadeIn 0.3s ease-out;
	}

	.confirmation-modal {
		position: relative;
		max-width: 500px;
		width: 90%;
		background: linear-gradient(135deg, rgba(40, 40, 40, 0.98) 0%, rgba(26, 26, 26, 0.98) 100%);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 20px;
		backdrop-filter: blur(20px);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
		padding: 2rem;
		animation: modalSlideIn 0.3s ease-out;
	}

	.confirmation-title {
		margin: 0 0 1rem 0;
		font-family: 'Cinzel', serif;
		font-size: 1.5rem;
		font-weight: 600;
		color: #c9b037;
		text-shadow: 0 2px 10px rgba(201, 176, 55, 0.5);
		text-align: center;
	}

	.confirmation-message {
		margin: 0 0 1.5rem 0;
		font-size: 1rem;
		color: #e8e9ed;
		line-height: 1.6;
		text-align: center;
	}

	.confirmation-message strong {
		color: #c9b037;
		font-weight: 600;
	}

	.confirmation-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.confirm-yes-button {
		background: linear-gradient(135deg, #f44336 0%, #e57373 100%);
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 12px;
		cursor: pointer;
		font-size: 1rem;
		font-family: 'Cinzel', serif;
		font-weight: 600;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 4px 15px rgba(244, 67, 54, 0.4);
		flex: 1;
		max-width: 200px;
	}

	.confirm-yes-button:hover {
		transform: translateY(-2px);
		background: linear-gradient(135deg, #f55a4e 0%, #ef5350 100%);
		box-shadow: 0 8px 25px rgba(244, 67, 54, 0.6);
	}

	.confirm-no-button {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
		color: #e8e9ed;
		border: 2px solid rgba(255, 255, 255, 0.2);
		padding: 12px 24px;
		border-radius: 12px;
		cursor: pointer;
		font-size: 1rem;
		font-family: 'Cinzel', serif;
		font-weight: 600;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		flex: 1;
		max-width: 200px;
	}

	.confirm-no-button:hover {
		transform: translateY(-2px);
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 100%);
		border-color: rgba(255, 255, 255, 0.3);
		box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1);
	}

	@keyframes modalFadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes modalSlideIn {
		from {
			opacity: 0;
			transform: translateY(-50px) scale(0.9);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>