<script lang="ts">
	import type { ScryfallCard } from '$lib/utils';
	import { getCardImageUri } from '$lib/utils';
	import LoadingSkeleton from '../common/LoadingSkeleton.svelte';
	import { createEventDispatcher } from 'svelte';

	export let cardData: ScryfallCard | null = null;
	export let loading: boolean = false;
	export let addedToCollection: boolean = false;
	export let addMessage: string = '';

	const dispatch = createEventDispatcher();

	function handleAddCard(quantity: number) {
		if (cardData) {
			dispatch('addToCollection', { card: cardData, quantity });
		}
	}

	function handleImageClick() {
		if (cardData) {
			dispatch('openImageModal', {
				src: getCardImageUri(cardData, 'large') || getCardImageUri(cardData, 'normal') || '',
				name: cardData.name
			});
		}
	}
</script>

{#if loading}
	<LoadingSkeleton />
{:else if cardData}
	{#if cardData.fuzzyMatch}
		<div class="fuzzy-notice">
			<p>📋 Showing closest match</p>
		</div>
	{/if}
	<div class="card-info">
		<div class="card-content">
			<button
				class="image-button"
				on:click={handleImageClick}
				title="Click to enlarge"
				aria-label="View larger image of {cardData.name}"
			>
				<img
					src={getCardImageUri(cardData, 'normal')}
					alt={cardData.name}
					class="card-image"
				/>
			</button>
			<div class="card-details">
				<h2>{cardData.name}</h2>
				<p><strong>Mana Cost:</strong> {cardData.mana_cost || 'N/A'}</p>
				<p><strong>Type:</strong> {cardData.type_line}</p>
				<p><strong>Price:</strong> {cardData.prices?.usd ? `$${cardData.prices.usd}` : 'N/A'}</p>
				<p><strong>Text:</strong> {cardData.oracle_text || 'No text'}</p>

				{#if cardData.legalities}
					<div class="legalities">
						<strong>Legalities:</strong>
						<div class="legality-grid">
							{#each [
								{ format: 'Standard', key: 'standard' },
								{ format: 'Modern', key: 'modern' },
								{ format: 'Pioneer', key: 'pioneer' },
								{ format: 'Legacy', key: 'legacy' },
								{ format: 'Vintage', key: 'vintage' },
								{ format: 'Commander', key: 'commander' },
								{ format: 'Pauper', key: 'pauper' },
								{ format: 'Historic', key: 'historic' }
							] as { format, key }}
								{@const status = cardData.legalities[key]}
								{#if status === 'legal' || status === 'banned' || status === 'restricted'}
									<div class="legality-item legality-{status}">
										<span class="format-name">{format}</span>
										<span class="status-badge">{status === 'legal' ? '✓' : status === 'banned' ? '✗' : 'R'}</span>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				{/if}

				<div class="card-actions">
					<div class="quantity-controls">
						<button 
							class="quantity-btn"
							on:click={() => handleAddCard(1)}
							disabled={addedToCollection}
						>
							{addedToCollection ? '✓ Added!' : '+ Add 1'}
						</button>
						<button 
							class="quantity-btn quantity-btn-multi"
							on:click={() => handleAddCard(4)}
							disabled={addedToCollection}
						>
							+ Add 4
						</button>
					</div>
					{#if addedToCollection && addMessage}
						<div class="add-message">{addMessage}</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.fuzzy-notice {
		margin: 2rem auto;
		padding: 15px 25px;
		background: linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(33, 150, 243, 0.05) 100%);
		border: 1px solid rgba(33, 150, 243, 0.3);
		border-radius: 15px;
		color: #64b5f6;
		backdrop-filter: blur(5px);
		text-align: center;
		max-width: 600px;
	}
	
	.fuzzy-notice p {
		margin: 0;
		font-size: 1rem;
		font-style: italic;
	}
	
	.card-info {
		max-width: 900px;
		margin: 2rem auto;
		padding: 30px;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 25px;
		backdrop-filter: blur(20px);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
		position: relative;
		overflow: hidden;
	}

	.card-info::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(201, 176, 55, 0.5), transparent);
	}
	
	.card-content {
		display: flex;
		gap: 30px;
		align-items: flex-start;
	}
	
	.card-image {
		width: 280px;
		height: auto;
		border-radius: 20px;
		flex-shrink: 0;
		box-shadow: 
			0 20px 40px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(255, 255, 255, 0.1);
		transition: transform 0.3s ease;
	}

	.image-button {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		display: block;
		transition: transform 0.3s ease;
	}

	.image-button:hover {
		transform: scale(1.05);
	}

	.image-button:focus {
		outline: 3px solid #c9b037;
		outline-offset: 3px;
		border-radius: 20px;
	}
	
	.card-details {
		flex: 1;
	}

	.card-details h2 {
		font-family: 'Cinzel', serif;
		font-size: 2rem;
		font-weight: 700;
		color: #c9b037;
		margin: 0 0 1.5rem 0;
		text-shadow: 0 2px 10px rgba(201, 176, 55, 0.5);
	}

	.card-details p {
		font-size: 1.1rem;
		line-height: 1.6;
		margin: 0.8rem 0;
		color: #e8e9ed;
	}

	.card-details strong {
		color: #c9b037;
		font-weight: 600;
	}

	.legalities {
		margin: 1.5rem 0;
	}

	.legality-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 8px;
		margin-top: 0.8rem;
	}

	.legality-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 6px 12px;
		border-radius: 8px;
		font-size: 0.9rem;
		border: 1px solid;
		transition: all 0.2s ease;
	}

	.legality-legal {
		background: rgba(76, 175, 80, 0.15);
		border-color: rgba(76, 175, 80, 0.4);
		color: #81c784;
	}

	.legality-banned {
		background: rgba(244, 67, 54, 0.15);
		border-color: rgba(244, 67, 54, 0.4);
		color: #e57373;
	}

	.legality-restricted {
		background: rgba(255, 152, 0, 0.15);
		border-color: rgba(255, 152, 0, 0.4);
		color: #ffb74d;
	}

	.legality-item:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.format-name {
		font-weight: 500;
	}

	.status-badge {
		font-weight: 700;
		font-size: 1rem;
	}

	.card-actions {
		margin-top: 2rem;
	}
	
	.quantity-controls {
		display: flex;
		gap: 10px;
		margin-bottom: 1rem;
	}
	
	.quantity-btn {
		background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
		color: white;
		border: none;
		padding: 10px 20px;
		border-radius: 12px;
		cursor: pointer;
		font-size: 14px;
		font-family: 'Cinzel', serif;
		font-weight: 600;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
		flex: 1;
	}
	
	.quantity-btn-multi {
		background: linear-gradient(135deg, #2196F3 0%, #42A5F5 100%);
		box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
	}
	
	.quantity-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 10px 30px rgba(76, 175, 80, 0.6);
	}
	
	.quantity-btn-multi:hover:not(:disabled) {
		box-shadow: 0 10px 30px rgba(33, 150, 243, 0.6);
	}
	
	.quantity-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}
	
	.add-message {
		text-align: center;
		color: #4caf50;
		font-style: italic;
		font-size: 0.9rem;
		margin-top: 0.5rem;
		font-weight: 600;
	}

	@media (max-width: 768px) {
		.card-content {
			flex-direction: column;
			align-items: center;
			text-align: center;
		}
		
		.card-image {
			width: 100%;
			max-width: 280px;
		}
	}
</style>