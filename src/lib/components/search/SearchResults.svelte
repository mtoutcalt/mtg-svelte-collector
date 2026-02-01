<script lang="ts">
	import type { ScryfallCard } from '$lib/utils';
	import { getCardImageUri } from '$lib/utils';
	import { createEventDispatcher } from 'svelte';

	export let searchResults: ScryfallCard[] = [];
	export let cardName: string = '';

	const dispatch = createEventDispatcher();

	function selectCard(card: ScryfallCard) {
		dispatch('selectCard', card);
	}
</script>

{#if searchResults.length > 0}
	<div class="multiple-results">
		<div class="results-header">
			<h2>Found {searchResults.length} results for "{cardName}"</h2>
			<p>Click on a card to view details and add to collection:</p>
		</div>
		<div class="results-grid">
			{#each searchResults as card}
				<div class="result-card" on:click={() => selectCard(card)} on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && selectCard(card)} role="button" tabindex="0">
					<div class="result-image">
						<img
							src={getCardImageUri(card, 'small') || getCardImageUri(card, 'normal')}
							alt={card.name}
							class="result-card-image"
						/>
					</div>
					<div class="result-info">
						<h3>{card.name}</h3>
						<p class="result-type">{card.type_line}</p>
						<p class="result-price">{card.prices?.usd ? `$${card.prices.usd}` : 'Price N/A'}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.multiple-results {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 30px;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 25px;
		backdrop-filter: blur(20px);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.results-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.results-header h2 {
		font-family: 'Cinzel', serif;
		font-size: 1.8rem;
		font-weight: 600;
		color: #c9b037;
		margin: 0 0 1rem 0;
		text-shadow: 0 2px 10px rgba(201, 176, 55, 0.3);
	}

	.results-header p {
		color: rgba(232, 233, 237, 0.8);
		font-size: 1rem;
		margin: 0;
		font-style: italic;
	}

	.results-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 20px;
		margin-top: 2rem;
	}

	.result-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 15px;
		padding: 15px;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		backdrop-filter: blur(5px);
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		position: relative;
		overflow: hidden;
	}

	.result-card::before {
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

	.result-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
		border-color: #c9b037;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 100%);
	}

	.result-card:hover::before {
		transform: scaleX(1);
	}

	.result-card:focus {
		outline: 2px solid #c9b037;
		outline-offset: 2px;
	}

	.result-image {
		width: 100%;
		margin-bottom: 10px;
		display: flex;
		justify-content: center;
	}

	.result-card-image {
		width: 120px;
		height: auto;
		border-radius: 12px;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
		transition: transform 0.3s ease;
	}

	.result-card:hover .result-card-image {
		transform: scale(1.05);
	}

	.result-info {
		width: 100%;
	}

	.result-info h3 {
		font-family: 'Cinzel', serif;
		font-size: 1.1rem;
		font-weight: 600;
		color: #c9b037;
		margin: 0 0 8px 0;
		text-shadow: 0 1px 5px rgba(201, 176, 55, 0.3);
	}

	.result-type {
		color: rgba(232, 233, 237, 0.8);
		font-size: 0.9rem;
		margin: 0 0 8px 0;
		font-style: italic;
	}

	.result-price {
		color: #4caf50;
		font-family: 'Cinzel', serif;
		font-weight: 600;
		font-size: 1rem;
		margin: 0;
	}

	@media (max-width: 768px) {
		.results-grid {
			grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
			gap: 15px;
		}

		.result-card-image {
			width: 100px;
		}

		.results-header h2 {
			font-size: 1.4rem;
		}
	}
</style>