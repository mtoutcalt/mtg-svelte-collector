<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	export let decks: any[] = [];
	export let loading: boolean = false;
	
	const dispatch = createEventDispatcher();
	
	function handleSelectDeck(deck: any) {
		dispatch('selectDeck', deck);
	}
	
	function handleDeleteDeck(deck: any) {
		if (confirm(`Are you sure you want to delete "${deck.name}"? This will remove all cards from the deck.`)) {
			dispatch('deleteDeck', deck.id);
		}
	}
</script>

<div class="deck-list">
	<h3>🃏 Your Decks</h3>
	
	{#if loading}
		<div class="loading">Loading decks...</div>
	{:else if decks.length === 0}
		<div class="no-decks">
			<p>No decks created yet.</p>
			<p>Create your first deck to get started!</p>
		</div>
	{:else}
		<div class="decks-grid">
			{#each decks as deck}
				<div class="deck-card">
					<div class="deck-header">
						<h4>{deck.name}</h4>
						<button 
							class="delete-btn"
							on:click={() => handleDeleteDeck(deck)}
							title="Delete deck"
						>
							🗑️
						</button>
					</div>
					
					{#if deck.description}
						<p class="deck-description">{deck.description}</p>
					{/if}
					
					<div class="deck-stats">
						<span class="stat">
							<strong>{deck.cardCount}</strong> cards
						</span>
						<span class="stat">
							<strong>{deck.uniqueCards}</strong> unique
						</span>
					</div>
					
					<button 
						class="view-deck-btn"
						on:click={() => handleSelectDeck(deck)}
					>
						View Deck
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.deck-list {
		margin-top: 2rem;
	}
	
	.deck-list h3 {
		font-family: 'Cinzel', serif;
		font-size: 1.5rem;
		color: #c9b037;
		margin-bottom: 1.5rem;
		text-shadow: 0 2px 10px rgba(201, 176, 55, 0.3);
	}
	
	.loading, .no-decks {
		text-align: center;
		color: rgba(232, 233, 237, 0.7);
		padding: 2rem;
		font-style: italic;
	}
	
	.decks-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}
	
	.deck-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 15px;
		padding: 1.5rem;
		backdrop-filter: blur(20px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		transition: transform 0.2s, box-shadow 0.2s;
	}
	
	.deck-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
	}
	
	.deck-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}
	
	.deck-header h4 {
		margin: 0;
		font-family: 'Cinzel', serif;
		font-size: 1.2rem;
		color: #e8e9ed;
		flex: 1;
	}
	
	.delete-btn {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		opacity: 0.6;
		transition: opacity 0.2s;
		padding: 0.25rem;
	}
	
	.delete-btn:hover {
		opacity: 1;
	}
	
	.deck-description {
		color: rgba(232, 233, 237, 0.7);
		font-size: 0.9rem;
		margin: 0 0 1rem 0;
		line-height: 1.4;
	}
	
	.deck-stats {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
		font-size: 0.9rem;
	}
	
	.stat {
		color: rgba(232, 233, 237, 0.8);
	}
	
	.stat strong {
		color: #c9b037;
	}
	
	.view-deck-btn {
		width: 100%;
		background: linear-gradient(135deg, #c9b037 0%, #e8d055 100%);
		color: #1a1a1a;
		border: none;
		padding: 0.75rem 1rem;
		border-radius: 10px;
		cursor: pointer;
		font-family: 'Cinzel', serif;
		font-weight: 600;
		transition: all 0.3s;
		box-shadow: 0 4px 15px rgba(201, 176, 55, 0.3);
	}
	
	.view-deck-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 6px 20px rgba(201, 176, 55, 0.4);
	}
</style>