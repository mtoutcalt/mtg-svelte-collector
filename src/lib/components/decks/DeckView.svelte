<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import CollectionCard from '../collection/CollectionCard.svelte';
	
	export let deck: any = null;
	export let loading: boolean = false;
	
	const dispatch = createEventDispatcher();
	
	function handleBackToDecks() {
		dispatch('backToDecks');
	}
	
	function handleOpenImageModal(event: any) {
		dispatch('openImageModal', event.detail);
	}
	
	function handleUpdateQuantity(event: any) {
		const { cardId, quantity } = event.detail;
		dispatch('updateCardQuantity', { deckId: deck.id, cardId, quantity });
	}
	
	function handleRemoveCard(event: any) {
		const { cardId } = event.detail;
		dispatch('removeCardFromDeck', { deckId: deck.id, cardId });
	}
	
	function getManaSymbolClass(symbol: string): string {
		const cleanSymbol = symbol.replace(/[{}]/g, '').toLowerCase();
		
		if (cleanSymbol === 'w') return 'mana-white';
		if (cleanSymbol === 'u') return 'mana-blue';
		if (cleanSymbol === 'b') return 'mana-black';
		if (cleanSymbol === 'r') return 'mana-red';
		if (cleanSymbol === 'g') return 'mana-green';
		if (/^\d+$/.test(cleanSymbol)) return 'mana-generic';
		if (cleanSymbol === 'x') return 'mana-generic';
		
		return 'mana-other';
	}
	
	function renderManaCost(manaCost: string): { symbol: string; class: string }[] {
		if (!manaCost) return [];
		
		const symbols = manaCost.match(/{[^}]+}/g) || [];
		return symbols.map(symbol => ({
			symbol: symbol.replace(/[{}]/g, ''),
			class: getManaSymbolClass(symbol)
		}));
	}
	
	$: manaSymbols = deck?.cards ? deck.cards.reduce((acc: any[], card: any) => {
		const symbols = renderManaCost(card.mana_cost || '');
		symbols.forEach(symbol => {
			const existing = acc.find(s => s.symbol === symbol.symbol);
			if (existing) {
				existing.count += card.deckQuantity;
			} else {
				acc.push({ ...symbol, count: card.deckQuantity });
			}
		});
		return acc;
	}, []) : [];
	
	$: totalValue = deck?.cards ? deck.cards.reduce((sum: number, card: any) => {
		const price = parseFloat(card.prices?.usd || '0');
		return sum + (price * card.deckQuantity);
	}, 0) : 0;
</script>

{#if loading}
	<div class="loading">Loading deck...</div>
{:else if deck}
	<div class="deck-view">
		<div class="deck-header">
			<button class="back-btn" on:click={handleBackToDecks}>
				← Back to Decks
			</button>
			
			<div class="deck-info">
				<h2>{deck.name}</h2>
				{#if deck.description}
					<p class="deck-description">{deck.description}</p>
				{/if}
				
				<div class="deck-stats">
					<div class="stat-card">
						<strong>{deck.cardCount}</strong>
						<span>Total Cards</span>
					</div>
					<div class="stat-card">
						<strong>{deck.uniqueCards}</strong>
						<span>Unique Cards</span>
					</div>
					<div class="stat-card">
						<strong>${totalValue.toFixed(2)}</strong>
						<span>Estimated Value</span>
					</div>
				</div>
				
				{#if manaSymbols.length > 0}
					<div class="mana-curve">
						<h4>Mana Symbols</h4>
						<div class="mana-symbols">
							{#each manaSymbols as { symbol, class: symbolClass, count }}
								<div class="mana-symbol {symbolClass}">
									<span class="symbol">{symbol}</span>
									<span class="count">×{count}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
		
		{#if deck.cards && deck.cards.length > 0}
			<div class="deck-cards">
				<h3>Cards in Deck</h3>
				<div class="cards-grid">
					{#each deck.cards as card}
						<CollectionCard
							{card}
							quantity={card.deckQuantity}
							isDeckCard={true}
							on:openImageModal={handleOpenImageModal}
							on:updateQuantity={handleUpdateQuantity}
							on:removeCard={handleRemoveCard}
						/>
					{/each}
				</div>
			</div>
		{:else}
			<div class="empty-deck">
				<p>This deck is empty.</p>
				<p>Go to your collection and start adding cards to this deck!</p>
			</div>
		{/if}
	</div>
{:else}
	<div class="no-deck">
		<p>Deck not found.</p>
		<button class="back-btn" on:click={handleBackToDecks}>
			← Back to Decks
		</button>
	</div>
{/if}

<style>
	.loading,
	.no-deck,
	.empty-deck {
		text-align: center;
		color: rgba(232, 233, 237, 0.7);
		padding: 3rem;
		font-size: 1.1rem;
	}
	
	.deck-view {
		margin-top: 1rem;
	}
	
	.deck-header {
		margin-bottom: 2rem;
	}
	
	.back-btn {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
		color: #e8e9ed;
		border: 1px solid rgba(255, 255, 255, 0.2);
		padding: 0.5rem 1rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.3s;
		margin-bottom: 1.5rem;
	}
	
	.back-btn:hover {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 100%);
		transform: translateY(-1px);
	}
	
	.deck-info h2 {
		font-family: 'Cinzel', serif;
		font-size: 2rem;
		color: #c9b037;
		margin: 0 0 1rem 0;
		text-shadow: 0 2px 10px rgba(201, 176, 55, 0.3);
	}
	
	.deck-description {
		color: rgba(232, 233, 237, 0.7);
		font-size: 1.1rem;
		margin: 0 0 1.5rem 0;
		line-height: 1.5;
	}
	
	.deck-stats {
		display: flex;
		gap: 1.5rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}
	
	.stat-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		padding: 1rem 1.5rem;
		text-align: center;
		backdrop-filter: blur(20px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	}
	
	.stat-card strong {
		display: block;
		font-size: 1.5rem;
		color: #c9b037;
		font-family: 'Cinzel', serif;
	}
	
	.stat-card span {
		color: rgba(232, 233, 237, 0.7);
		font-size: 0.9rem;
	}
	
	.mana-curve {
		margin-bottom: 2rem;
	}
	
	.mana-curve h4 {
		color: #c9b037;
		font-family: 'Cinzel', serif;
		margin: 0 0 1rem 0;
	}
	
	.mana-symbols {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	
	.mana-symbol {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: bold;
	}
	
	.mana-white { background: rgba(255, 255, 255, 0.2); color: white; }
	.mana-blue { background: rgba(0, 150, 255, 0.3); color: #aaccff; }
	.mana-black { background: rgba(50, 50, 50, 0.5); color: #cccccc; }
	.mana-red { background: rgba(255, 50, 50, 0.3); color: #ffaaaa; }
	.mana-green { background: rgba(50, 200, 50, 0.3); color: #aaffaa; }
	.mana-generic { background: rgba(150, 150, 150, 0.3); color: #dddddd; }
	.mana-other { background: rgba(200, 100, 200, 0.3); color: #ffaaff; }
	
	.deck-cards h3 {
		font-family: 'Cinzel', serif;
		font-size: 1.5rem;
		color: #c9b037;
		margin: 0 0 1.5rem 0;
	}
	
	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}
	
	@media (max-width: 768px) {
		.deck-stats {
			justify-content: center;
		}
		
		.mana-symbols {
			justify-content: center;
		}
		
		.cards-grid {
			grid-template-columns: 1fr;
		}
	}
</style>