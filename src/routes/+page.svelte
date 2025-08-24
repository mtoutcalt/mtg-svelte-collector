<script lang="ts">
	interface ScryfallCard {
		id: string;
		name: string;
		mana_cost?: string;
		type_line: string;
		oracle_text?: string;
		image_uris?: {
			normal: string;
			small: string;
			large: string;
		};
		prices?: {
			usd?: string;
			usd_foil?: string;
			eur?: string;
			tix?: string;
		};
		fuzzyMatch?: boolean;
	}

	interface ScryfallError {
		error: string;
		notFound?: boolean;
	}

	interface ScryfallSearchResponse {
		data: ScryfallCard[];
		total_cards: number;
	}

	type CardData = ScryfallCard | ScryfallError | null;

	// Type guards
	function isError(data: CardData): data is ScryfallError {
		return data !== null && 'error' in data;
	}

	function isCard(data: CardData): data is ScryfallCard {
		return data !== null && 'name' in data && !('error' in data);
	}

	let cardName: string = '';
	let cardData: CardData = null;
	let loading: boolean = false;
	let addedToCollection: boolean = false;
	let viewingCollection: boolean = false;
	let collection: ScryfallCard[] = [];

	function loadCollection(): void {
		if (typeof window !== 'undefined') {
			collection = JSON.parse(localStorage.getItem('mtg-collection') || '[]') as ScryfallCard[];
		}
	}

	function addToCollection(card: ScryfallCard): void {
		if (typeof window !== 'undefined') {
			const storedCollection = JSON.parse(localStorage.getItem('mtg-collection') || '[]') as ScryfallCard[];
			
			// Check if card is already in collection
			const exists = storedCollection.some(c => c.id === card.id);
			if (!exists) {
				storedCollection.push(card);
				localStorage.setItem('mtg-collection', JSON.stringify(storedCollection));
				addedToCollection = true;
				
				// Update local collection if viewing
				if (viewingCollection) {
					loadCollection();
				}
				
				// Reset the feedback after 2 seconds
				setTimeout(() => {
					addedToCollection = false;
				}, 2000);
			}
		}
	}

	function removeFromCollection(cardId: string): void {
		if (typeof window !== 'undefined') {
			const storedCollection = JSON.parse(localStorage.getItem('mtg-collection') || '[]') as ScryfallCard[];
			const updatedCollection = storedCollection.filter(c => c.id !== cardId);
			localStorage.setItem('mtg-collection', JSON.stringify(updatedCollection));
			
			// Update local collection
			loadCollection();
		}
	}

	function toggleCollectionView(): void {
		viewingCollection = !viewingCollection;
		if (viewingCollection) {
			loadCollection();
		}
	}

	function getCollectionCount(): number {
		if (typeof window !== 'undefined') {
			const storedCollection = JSON.parse(localStorage.getItem('mtg-collection') || '[]') as ScryfallCard[];
			return storedCollection.length;
		}
		return 0;
	}

	async function searchCard(): Promise<void> {
		if (!cardName.trim()) return;
		
		// Reset added state when searching
		addedToCollection = false;
		loading = true;
		try {
			const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
			if (response.ok) {
				cardData = await response.json() as ScryfallCard;
			} else if (response.status === 404) {
				// Try fuzzy search as fallback - search each word
				const words: string[] = cardName.split(' ').filter(word => word.length > 2);
				let found: boolean = false;
				
				for (const word of words) {
					try {
						const fuzzyResponse = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(word)}`);
						if (fuzzyResponse.ok) {
							const fuzzyData = await fuzzyResponse.json() as ScryfallSearchResponse;
							if (fuzzyData.data && fuzzyData.data.length > 0) {
								// Find best match by looking for cards that contain the original search terms
								const bestMatch: ScryfallCard = fuzzyData.data.find((card: ScryfallCard) => 
									cardName.toLowerCase().split(' ').some((searchWord: string) => 
										card.name.toLowerCase().includes(searchWord.substring(0, 4))
									)
								) || fuzzyData.data[0];
								
								cardData = { ...bestMatch, fuzzyMatch: true };
								found = true;
								break;
							}
						}
					} catch (e) {
						continue;
					}
				}
				
				if (!found) {
					cardData = { 
						error: `No cards found matching "${cardName}". Try a different search term.`,
						notFound: true 
					};
				}
			} else {
				cardData = { 
					error: `Server error (${response.status}). Please try again later.` 
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
</script>

<h1 class="main-title">Magic Card Search</h1>

<div class="top-nav">
	<button class="collection-button" on:click={toggleCollectionView}>
		{viewingCollection ? '← Back to Search' : `📚 View Collection (${getCollectionCount()})`}
	</button>
</div>

{#if !viewingCollection}
<div class="search-container">
	<input 
		bind:value={cardName} 
		placeholder="Enter card name (e.g., Lightning Bolt)"
		on:keydown={(e) => e.key === 'Enter' && searchCard()}
	/>
	<button on:click={searchCard} disabled={loading}>
		{loading ? 'Searching...' : 'Search'}
	</button>
</div>

{#if loading}
	<div class="card-info">
		<div class="card-content">
			<div class="card-image skeleton"></div>
			<div class="card-details">
				<div class="skeleton skeleton-title"></div>
				<div class="skeleton skeleton-text"></div>
				<div class="skeleton skeleton-text"></div>
				<div class="skeleton skeleton-text-long"></div>
			</div>
		</div>
	</div>
{:else if isCard(cardData)}
	{#if cardData.fuzzyMatch}
		<div class="fuzzy-notice">
			<p>📋 Showing closest match for "{cardName}"</p>
		</div>
	{/if}
	<div class="card-info">
		<div class="card-content">
			<img src={cardData.image_uris?.normal} alt={cardData.name} class="card-image" />
			<div class="card-details">
				<h2>{cardData.name}</h2>
				<p><strong>Mana Cost:</strong> {cardData.mana_cost || 'N/A'}</p>
				<p><strong>Type:</strong> {cardData.type_line}</p>
				<p><strong>Price:</strong> {cardData.prices?.usd ? `$${cardData.prices.usd}` : 'N/A'}</p>
				<p><strong>Text:</strong> {cardData.oracle_text || 'No text'}</p>
				
				<div class="card-actions">
					<button 
						class="add-button" 
						on:click={() => isCard(cardData) && addToCollection(cardData)}
						disabled={addedToCollection}
					>
						{addedToCollection ? '✓ Added!' : '+ Add to Collection'}
					</button>
				</div>
			</div>
		</div>
	</div>
{:else if isError(cardData)}
	<p class="error">{cardData.error}</p>
{/if}

{:else}
<!-- Collection View -->
<div class="collection-view">
	<h2>My Collection ({collection.length} cards)</h2>
	
	{#if collection.length === 0}
		<p class="empty-collection">Your collection is empty. Search for cards and add them to get started!</p>
	{:else}
		<div class="collection-grid">
			{#each collection as card}
				<div class="collection-card">
					<img src={card.image_uris?.normal} alt={card.name} class="collection-card-image" />
					<div class="collection-card-info">
						<h3>{card.name}</h3>
						<p class="card-type">{card.type_line}</p>
						<p class="card-price">{card.prices?.usd ? `$${card.prices.usd}` : 'N/A'}</p>
						<button 
							class="remove-button" 
							on:click={() => removeFromCollection(card.id)}
							title="Remove from collection"
						>
							🗑️ Remove
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
{/if}

<style>
	.main-title {
		margin-bottom: 20px;
	}
	
	.top-nav {
		margin-bottom: 20px;
	}
	
	.collection-button {
		background: #2196F3;
		color: white;
		border: none;
		padding: 10px 16px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
		transition: background-color 0.2s;
	}
	
	.collection-button:hover {
		background: #1976D2;
	}
	
	.search-container {
		margin: 20px 0 !important;
		display: flex !important;
		gap: 10px !important;
	}
	
	input {
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
		flex: 1;
	}
	
	button {
		padding: 8px 16px;
		border: 1px solid #ccc;
		border-radius: 4px;
		background: #f0f0f0;
		cursor: pointer;
	}
	
	button:hover {
		background: #e0e0e0;
	}
	
	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.card-info {
		margin-top: 20px !important;
		padding: 15px !important;
		border: 1px solid #ddd !important;
		border-radius: 4px !important;
		background: #f9f9f9 !important;
	}
	
	.card-content {
		display: flex !important;
		gap: 20px !important;
		align-items: flex-start !important;
	}
	
	.card-image {
		width: 200px !important;
		height: auto !important;
		border-radius: 8px !important;
		flex-shrink: 0 !important;
	}
	
	.card-details {
		flex: 1;
	}
	
	.error {
		color: red;
		margin-top: 20px;
	}
	
	.fuzzy-notice {
		margin-top: 20px;
		padding: 10px;
		background: #e7f3ff;
		border: 1px solid #bee5eb;
		border-radius: 4px;
		color: #0c5460;
	}
	
	.fuzzy-notice p {
		margin: 0;
		font-size: 14px;
	}
	
	.card-actions {
		margin-top: 15px;
	}
	
	.add-button {
		background: #4CAF50;
		color: white;
		border: none;
		padding: 10px 16px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
		transition: background-color 0.2s;
	}
	
	.add-button:hover:not(:disabled) {
		background: #45a049;
	}
	
	.add-button:disabled {
		background: #28a745;
		cursor: not-allowed;
		opacity: 0.8;
	}
	
	.skeleton {
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: loading 1.5s infinite;
		border-radius: 4px;
	}
	
	.skeleton-title {
		height: 32px;
		width: 60%;
		margin-bottom: 15px;
	}
	
	.skeleton-text {
		height: 16px;
		width: 80%;
		margin-bottom: 10px;
	}
	
	.skeleton-text-long {
		height: 16px;
		width: 100%;
		margin-bottom: 5px;
	}
	
	@keyframes loading {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
	
	.collection-view {
		margin-top: 20px;
	}
	
	.empty-collection {
		text-align: center;
		color: #666;
		font-style: italic;
		margin: 40px 0;
	}
	
	.collection-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 20px;
		margin-top: 20px;
	}
	
	.collection-card {
		border: 1px solid #ddd;
		border-radius: 8px;
		overflow: hidden;
		background: white;
		transition: transform 0.2s, box-shadow 0.2s;
	}
	
	.collection-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0,0,0,0.1);
	}
	
	.collection-card-image {
		width: 100%;
		height: auto;
		display: block;
	}
	
	.collection-card-info {
		padding: 10px;
	}
	
	.collection-card-info h3 {
		margin: 0 0 5px 0;
		font-size: 14px;
		color: #333;
	}
	
	.collection-card-info .card-type {
		margin: 0 0 3px 0;
		font-size: 12px;
		color: #666;
	}
	
	.collection-card-info .card-price {
		margin: 0 0 10px 0;
		font-size: 12px;
		font-weight: bold;
		color: #2e7d32;
	}
	
	.remove-button {
		background: #f44336;
		color: white;
		border: none;
		padding: 6px 10px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 11px;
		transition: background-color 0.2s;
		width: 100%;
	}
	
	.remove-button:hover {
		background: #d32f2f;
	}
</style>
