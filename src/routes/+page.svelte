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

	let cardName: string = '';
	let cardData: CardData = null;
	let loading: boolean = false;
	let addedToCollection: boolean = false;
	let addMessage: string = '';
	let viewingCollection: boolean = false;
	let collection: ScryfallCard[] = [];

	async function loadCollection(): Promise<void> {
		collection = await loadCollectionFromStorage();
	}

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

	async function toggleCollectionView(): Promise<void> {
		viewingCollection = !viewingCollection;
		if (viewingCollection) {
			await loadCollection();
		}
	}

	function getCollectionCount(): number {
		return collection.reduce((total, card) => total + (card.quantity || 1), 0);
	}

	function getUniqueCardCount(): number {
		return collection.length;
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
		{viewingCollection ? '← Back to Search' : `📚 View Collection (${getCollectionCount()} cards, ${getUniqueCardCount()} unique)`}
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
					<div class="quantity-controls">
						<button 
							class="quantity-btn"
							on:click={() => isCard(cardData) && addToCollection(cardData, 1)}
							disabled={addedToCollection}
						>
							{addedToCollection ? '✓ Added!' : '+ Add 1'}
						</button>
						<button 
							class="quantity-btn quantity-btn-multi"
							on:click={() => isCard(cardData) && addToCollection(cardData, 4)}
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
{:else if isError(cardData)}
	<p class="error">{cardData.error}</p>
{/if}

{:else}
<!-- Collection View -->
<div class="collection-view">
	<div class="collection-header">
		<h2>My Collection ({getCollectionCount()} cards, {getUniqueCardCount()} unique)</h2>
		{#if collection.length > 0}
			<div class="collection-value">
				<strong>Total Worth: {formatCurrency(calculateCollectionValue(collection))}</strong>
			</div>
		{/if}
	</div>
	
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
						<p class="card-price">{card.prices?.usd ? `$${card.prices.usd} each` : 'N/A'}</p>
						<div class="quantity-display">
							<span class="quantity-label">Quantity: <strong>{card.quantity || 1}</strong></span>
							<div class="quantity-controls-collection">
								<button 
									class="quantity-btn-small"
									on:click={() => updateQuantity(card.id, (card.quantity || 1) + 1)}
									title="Add one"
								>
									+
								</button>
								<button 
									class="quantity-btn-small"
									on:click={() => removeFromCollection(card.id, false)}
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
								on:click={() => removeFromCollection(card.id, true)}
								title="Remove all copies"
							>
								🗑️ Remove All
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
{/if}

<style>
	@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
	
	:global(body) {
		margin: 0;
		padding: 20px;
		background: linear-gradient(135deg, #0a0e1a 0%, #1a1f3a 50%, #0f1419 100%);
		min-height: 100vh;
		color: #e8e9ed;
		font-family: 'Crimson Text', serif;
		position: relative;
		overflow-x: hidden;
	}
	
	:global(body::before) {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: 
			radial-gradient(circle at 20% 30%, rgba(138, 43, 226, 0.15) 0%, transparent 50%),
			radial-gradient(circle at 80% 70%, rgba(25, 118, 210, 0.15) 0%, transparent 50%),
			radial-gradient(circle at 40% 80%, rgba(46, 125, 50, 0.1) 0%, transparent 50%);
		pointer-events: none;
		z-index: -1;
	}

	.main-title {
		text-align: center;
		font-family: 'Cinzel', serif;
		font-size: clamp(2.5rem, 5vw, 4rem);
		font-weight: 700;
		background: linear-gradient(45deg, #c9b037, #f4e58c, #c9b037, #8b7328);
		background-size: 300% 300%;
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		text-shadow: 0 4px 20px rgba(201, 176, 55, 0.5);
		margin: 0 0 3rem 0;
		animation: shimmer 3s ease-in-out infinite;
		letter-spacing: 2px;
		position: relative;
	}

	.main-title::after {
		content: '';
		position: absolute;
		bottom: -10px;
		left: 50%;
		transform: translateX(-50%);
		width: 200px;
		height: 2px;
		background: linear-gradient(90deg, transparent, #c9b037, transparent);
		border-radius: 2px;
	}

	@keyframes shimmer {
		0%, 100% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
	}
	
	.top-nav {
		display: flex;
		justify-content: center;
		margin-bottom: 3rem;
	}
	
	.collection-button {
		background: linear-gradient(135deg, #6a4c93 0%, #9b59b6 100%);
		color: white;
		border: none;
		padding: 14px 28px;
		border-radius: 25px;
		cursor: pointer;
		font-size: 16px;
		font-family: 'Cinzel', serif;
		font-weight: 600;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 8px 25px rgba(106, 76, 147, 0.4);
		position: relative;
		overflow: hidden;
	}

	.collection-button::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
		transition: left 0.5s;
	}

	.collection-button:hover::before {
		left: 100%;
	}
	
	.collection-button:hover {
		transform: translateY(-3px);
		box-shadow: 0 12px 35px rgba(106, 76, 147, 0.6);
		background: linear-gradient(135deg, #7c5ba6 0%, #a569c7 100%);
	}
	
	.search-container {
		max-width: 600px;
		margin: 2rem auto;
		display: flex;
		gap: 15px;
		padding: 20px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 20px;
		backdrop-filter: blur(10px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}
	
	input {
		flex: 1;
		padding: 15px 20px;
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 15px;
		background: rgba(255, 255, 255, 0.08);
		color: #e8e9ed;
		font-size: 16px;
		font-family: 'Crimson Text', serif;
		backdrop-filter: blur(5px);
		transition: all 0.3s ease;
	}

	input::placeholder {
		color: rgba(232, 233, 237, 0.6);
	}

	input:focus {
		outline: none;
		border-color: #c9b037;
		background: rgba(255, 255, 255, 0.12);
		box-shadow: 0 0 20px rgba(201, 176, 55, 0.3);
	}
	
	button {
		padding: 15px 25px;
		border: none;
		border-radius: 15px;
		background: linear-gradient(135deg, #c9b037 0%, #f4e58c 100%);
		color: #0a0e1a;
		cursor: pointer;
		font-size: 16px;
		font-family: 'Cinzel', serif;
		font-weight: 600;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 6px 20px rgba(201, 176, 55, 0.4);
	}
	
	button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 10px 30px rgba(201, 176, 55, 0.6);
		background: linear-gradient(135deg, #d4bd3a 0%, #f7ea95 100%);
	}
	
	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
		box-shadow: 0 3px 10px rgba(201, 176, 55, 0.2);
	}
	
	.card-info {
		max-width: 900px;
		margin: 2rem auto;
		padding: 30px;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 25px;
		backdrop-filter: blur(20px);
		box-shadow: 
			0 20px 60px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
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

	.card-image:hover {
		transform: scale(1.05);
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
	
	.error {
		color: #ff6b6b;
		margin-top: 2rem;
		text-align: center;
		font-size: 1.2rem;
		padding: 20px;
		background: rgba(255, 107, 107, 0.1);
		border: 1px solid rgba(255, 107, 107, 0.3);
		border-radius: 15px;
		backdrop-filter: blur(5px);
	}
	
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
		padding: 12px 20px;
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
	
	
	.skeleton {
		background: linear-gradient(
			90deg, 
			rgba(255, 255, 255, 0.05) 25%, 
			rgba(255, 255, 255, 0.15) 50%, 
			rgba(255, 255, 255, 0.05) 75%
		);
		background-size: 200% 100%;
		animation: loading 2s ease-in-out infinite;
		border-radius: 10px;
	}
	
	.skeleton-title {
		height: 40px;
		width: 60%;
		margin-bottom: 20px;
	}
	
	.skeleton-text {
		height: 20px;
		width: 80%;
		margin-bottom: 12px;
	}
	
	.skeleton-text-long {
		height: 20px;
		width: 100%;
		margin-bottom: 8px;
	}
	
	@keyframes loading {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}
	
	.collection-view {
		margin-top: 2rem;
		max-width: 1200px;
		margin-left: auto;
		margin-right: auto;
	}
	
	.collection-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 3rem;
		padding: 25px 35px;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 20px;
		backdrop-filter: blur(20px);
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
	}
	
	.collection-header h2 {
		margin: 0;
		font-family: 'Cinzel', serif;
		font-size: 2rem;
		font-weight: 600;
		color: #c9b037;
		text-shadow: 0 2px 10px rgba(201, 176, 55, 0.3);
	}
	
	.collection-value {
		font-size: 1.5rem;
		color: #4caf50;
		padding: 12px 24px;
		background: linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0.1) 100%);
		border: 1px solid rgba(76, 175, 80, 0.4);
		border-radius: 15px;
		backdrop-filter: blur(5px);
		font-family: 'Cinzel', serif;
		font-weight: 600;
		text-shadow: 0 2px 10px rgba(76, 175, 80, 0.3);
	}
	
	.empty-collection {
		text-align: center;
		color: rgba(232, 233, 237, 0.7);
		font-style: italic;
		font-size: 1.2rem;
		margin: 4rem 0;
		padding: 3rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px dashed rgba(255, 255, 255, 0.1);
		border-radius: 20px;
	}
	
	.collection-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 30px;
		margin-top: 2rem;
	}
	
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
		margin: 0 0 6px 0;
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
		padding: 8px 12px;
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

	/* Responsive Design */
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
		
		.collection-grid {
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
			gap: 20px;
		}
		
		.collection-header {
			flex-direction: column;
			gap: 15px;
			text-align: center;
		}
		
		.search-container {
			flex-direction: column;
			gap: 15px;
		}
	}

	/* Scrollbar Styling */
	:global(::-webkit-scrollbar) {
		width: 8px;
	}

	:global(::-webkit-scrollbar-track) {
		background: rgba(255, 255, 255, 0.05);
	}

	:global(::-webkit-scrollbar-thumb) {
		background: linear-gradient(180deg, #c9b037, #8b7328);
		border-radius: 4px;
	}

	:global(::-webkit-scrollbar-thumb:hover) {
		background: linear-gradient(180deg, #d4bd3a, #9c7f2b);
	}
</style>
