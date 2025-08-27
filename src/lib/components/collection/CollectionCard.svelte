<script lang="ts">
	import type { ScryfallCard } from '$lib/utils';
	import { createEventDispatcher } from 'svelte';
	
	export let card: ScryfallCard;
	
	const dispatch = createEventDispatcher();
	
	function handleImageClick() {
		dispatch('openImageModal', {
			src: card.image_uris?.large || card.image_uris?.normal || '',
			name: card.name
		});
	}
	
	function handleQuantityUpdate(newQuantity: number) {
		dispatch('updateQuantity', { cardId: card.id, quantity: newQuantity });
	}
	
	function handleRemoveCard(removeAll: boolean) {
		dispatch('removeCard', { cardId: card.id, removeAll });
	}
</script>

<div class="collection-card">
	<button
		class="image-button collection-image-button"
		on:click={handleImageClick}
		title="Click to enlarge"
		aria-label="View larger image of {card.name}"
	>
		<img 
			src={card.image_uris?.normal} 
			alt={card.name} 
			class="collection-card-image"
		/>
	</button>
	<div class="collection-card-info">
		<h3>{card.name}</h3>
		<p class="card-type">{card.type_line}</p>
		<p class="card-price">{card.prices?.usd ? `$${card.prices.usd} each` : 'N/A'}</p>
		<div class="quantity-display">
			<span class="quantity-label">Quantity: <strong>{card.quantity || 1}</strong></span>
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
			<button 
				class="remove-button" 
				on:click={() => handleRemoveCard(true)}
				title="Remove all copies"
			>
				🗑️ Remove All
			</button>
		</div>
	</div>
</div>

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
</style>