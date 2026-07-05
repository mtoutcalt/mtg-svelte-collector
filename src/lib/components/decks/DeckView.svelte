<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import CollectionCard from '../collection/CollectionCard.svelte';
	
	export let deck: any = null;
	export let loading: boolean = false;

	const dispatch = createEventDispatcher();

	let editingStrategy = false;
	let strategyDraft = '';

	function handleBackToDecks() {
		dispatch('backToDecks');
	}

	function startEditingStrategy() {
		strategyDraft = deck?.strategy || '';
		editingStrategy = true;
	}

	function cancelEditingStrategy() {
		editingStrategy = false;
	}

	function saveStrategy() {
		dispatch('updateStrategy', { deckId: deck.id, strategy: strategyDraft.trim() });
		editingStrategy = false;
	}

	type StrategyBlock =
		| { type: 'heading'; text: string }
		| { type: 'list'; items: string[] }
		| { type: 'paragraph'; text: string };

	function parseStrategy(text: string): StrategyBlock[] {
		if (!text) return [];
		const blocks: StrategyBlock[] = [];
		const lines = text.split('\n');
		let currentList: string[] | null = null;
		let currentParagraph: string[] = [];

		function flushParagraph() {
			if (currentParagraph.length > 0) {
				blocks.push({ type: 'paragraph', text: currentParagraph.join(' ') });
				currentParagraph = [];
			}
		}

		function flushList() {
			if (currentList && currentList.length > 0) {
				blocks.push({ type: 'list', items: currentList });
			}
			currentList = null;
		}

		for (const rawLine of lines) {
			const line = rawLine.trim();
			if (line.startsWith('## ')) {
				flushParagraph();
				flushList();
				blocks.push({ type: 'heading', text: line.slice(3).trim() });
			} else if (line.startsWith('- ')) {
				flushParagraph();
				if (!currentList) currentList = [];
				currentList.push(line.slice(2).trim());
			} else if (line.length === 0) {
				flushParagraph();
				flushList();
			} else {
				flushList();
				currentParagraph.push(line);
			}
		}
		flushParagraph();
		flushList();

		return blocks;
	}

	$: strategyBlocks = parseStrategy(deck?.strategy || '');
	
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

		<div class="strategy-section">
			<div class="strategy-header">
				<h3>How to Play This Deck</h3>
				{#if !editingStrategy}
					<button class="edit-strategy-btn" on:click={startEditingStrategy}>
						{deck.strategy ? '✏️ Edit' : '+ Add Strategy'}
					</button>
				{/if}
			</div>

			{#if editingStrategy}
				<div class="strategy-editor">
					<textarea
						bind:value={strategyDraft}
						rows="14"
						placeholder="Write the game plan: mulligan guidance, early/mid/late game, key synergies, how to sequence removal..."
					></textarea>
					<div class="strategy-editor-actions">
						<button class="save-strategy-btn" on:click={saveStrategy}>Save</button>
						<button class="cancel-strategy-btn" on:click={cancelEditingStrategy}>Cancel</button>
					</div>
				</div>
			{:else if strategyBlocks.length > 0}
				<div class="strategy-content">
					{#each strategyBlocks as block}
						{#if block.type === 'heading'}
							<h4>{block.text}</h4>
						{:else if block.type === 'list'}
							<ul>
								{#each block.items as item}
									<li>{item}</li>
								{/each}
							</ul>
						{:else}
							<p>{block.text}</p>
						{/if}
					{/each}
				</div>
			{:else}
				<p class="strategy-empty">No strategy notes yet. Click "Add Strategy" to write down the game plan.</p>
			{/if}
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
	
	.strategy-section {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 12px;
		padding: 1.5rem 1.75rem;
		margin-bottom: 2rem;
	}

	.strategy-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.strategy-header h3 {
		font-family: 'Cinzel', serif;
		font-size: 1.3rem;
		color: #c9b037;
		margin: 0;
	}

	.edit-strategy-btn {
		background: rgba(201, 176, 55, 0.15);
		color: #c9b037;
		border: 1px solid rgba(201, 176, 55, 0.4);
		padding: 0.4rem 0.9rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.85rem;
		transition: all 0.2s;
	}

	.edit-strategy-btn:hover {
		background: rgba(201, 176, 55, 0.25);
	}

	.strategy-content h4 {
		color: #c9b037;
		font-family: 'Cinzel', serif;
		font-size: 1.05rem;
		margin: 1.25rem 0 0.6rem;
	}

	.strategy-content h4:first-child {
		margin-top: 0;
	}

	.strategy-content p {
		color: rgba(232, 233, 237, 0.85);
		line-height: 1.65;
		margin: 0 0 0.75rem;
	}

	.strategy-content ul {
		margin: 0 0 0.75rem;
		padding-left: 1.25rem;
	}

	.strategy-content ul li {
		color: rgba(232, 233, 237, 0.85);
		line-height: 1.6;
		margin-bottom: 0.4rem;
	}

	.strategy-empty {
		color: rgba(232, 233, 237, 0.5);
		font-style: italic;
		margin: 0;
	}

	.strategy-editor textarea {
		width: 100%;
		box-sizing: border-box;
		background: rgba(0, 0, 0, 0.25);
		color: #e8e9ed;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		padding: 0.85rem;
		font-family: inherit;
		font-size: 0.95rem;
		line-height: 1.5;
		resize: vertical;
	}

	.strategy-editor-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	.save-strategy-btn {
		background: linear-gradient(135deg, #c9b037 0%, #f4e58c 100%);
		color: #0a0e1a;
		border: none;
		padding: 0.6rem 1.4rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s;
	}

	.save-strategy-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 15px rgba(201, 176, 55, 0.35);
	}

	.cancel-strategy-btn {
		background: rgba(255, 255, 255, 0.08);
		color: #e8e9ed;
		border: 1px solid rgba(255, 255, 255, 0.2);
		padding: 0.6rem 1.4rem;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.cancel-strategy-btn:hover {
		background: rgba(255, 255, 255, 0.14);
	}

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