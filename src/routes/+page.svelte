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
	let showImageModal: boolean = false;
	let modalImageSrc: string = '';
	let modalImageName: string = '';

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

	function openImageModal(imageSrc: string, imageName: string): void {
		modalImageSrc = imageSrc;
		modalImageName = imageName;
		showImageModal = true;
	}

	function closeImageModal(): void {
		showImageModal = false;
		modalImageSrc = '';
		modalImageName = '';
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
			<button
				class="image-button"
				on:click={() => {
					if (isCard(cardData)) {
						openImageModal(cardData.image_uris?.large || cardData.image_uris?.normal || '', cardData.name);
					}
				}}
				title="Click to enlarge"
				aria-label="View larger image of {cardData.name}"
			>
				<img 
					src={cardData.image_uris?.normal} 
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
					<button
						class="image-button collection-image-button"
						on:click={() => openImageModal(card.image_uris?.large || card.image_uris?.normal || '', card.name)}
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

<!-- Image Modal -->
{#if showImageModal}
	<div class="modal-overlay" on:click={closeImageModal} on:keydown={(e) => (e.key === 'Escape' || e.key === 'Enter') && closeImageModal()} role="button" tabindex="0" aria-label="Close modal">
		<div class="modal-content" on:click|stopPropagation>
			<button class="modal-close" on:click={closeImageModal} title="Close">&times;</button>
			<img src={modalImageSrc} alt={modalImageName} class="modal-image" />
			<div class="modal-title">{modalImageName}</div>
		</div>
	</div>
{/if}

<style>
	@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
	
	:root {
		/* Colors */
		--color-primary-gold: #c9b037;
		--color-primary-gold-light: #f4e58c;
		--color-primary-gold-dark: #8b7328;
		--color-primary-gold-darker: #9c7f2b;
		--color-primary-gold-variant: #d4bd3a;
		--color-text-primary: #e8e9ed;
		--color-text-secondary: rgba(232, 233, 237, 0.8);
		--color-text-muted: rgba(232, 233, 237, 0.7);
		--color-text-placeholder: rgba(232, 233, 237, 0.6);
		--color-bg-dark-primary: #0a0e1a;
		--color-bg-dark-secondary: #1a1f3a;
		--color-bg-dark-tertiary: #0f1419;
		--color-purple-primary: #6a4c93;
		--color-purple-secondary: #9b59b6;
		--color-purple-light: #7c5ba6;
		--color-purple-lighter: #a569c7;
		--color-green-primary: #4caf50;
		--color-green-secondary: #66bb6a;
		--color-blue-primary: #2196F3;
		--color-blue-secondary: #42A5F5;
		--color-blue-info: #64b5f6;
		--color-red-primary: #f44336;
		--color-red-secondary: #e57373;
		--color-red-hover: #f55a4e;
		--color-red-variant: #ef5350;
		--color-error: #ff6b6b;
		
		/* Glass morphism backgrounds */
		--bg-glass-primary: rgba(255, 255, 255, 0.1);
		--bg-glass-secondary: rgba(255, 255, 255, 0.05);
		--bg-glass-tertiary: rgba(255, 255, 255, 0.08);
		--bg-glass-quaternary: rgba(255, 255, 255, 0.12);
		--bg-glass-minimal: rgba(255, 255, 255, 0.03);
		
		/* Borders */
		--border-glass-primary: rgba(255, 255, 255, 0.2);
		--border-glass-secondary: rgba(255, 255, 255, 0.15);
		--border-glass-tertiary: rgba(255, 255, 255, 0.1);
		--border-dashed: rgba(255, 255, 255, 0.1);
		
		/* Border radius */
		--radius-small: 6px;
		--radius-medium: 12px;
		--radius-large: 15px;
		--radius-xl: 20px;
		--radius-xxl: 25px;
		
		/* Spacing */
		--spacing-xs: 4px;
		--spacing-sm: 8px;
		--spacing-md: 10px;
		--spacing-lg: 15px;
		--spacing-xl: 20px;
		--spacing-2xl: 25px;
		--spacing-3xl: 30px;
		--spacing-4xl: 35px;
		
		/* Typography */
		--font-primary: 'Cinzel', serif;
		--font-secondary: 'Crimson Text', serif;
		--font-weight-normal: 400;
		--font-weight-medium: 600;
		--font-weight-bold: 700;
		
		/* Transitions */
		--transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		--transition-bounce: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		--transition-fast: all 0.3s ease;
		--transition-slow: left 0.5s;
		
		/* Shadows */
		--shadow-small: 0 4px 15px;
		--shadow-medium: 0 6px 20px;
		--shadow-large: 0 8px 25px;
		--shadow-xl: 0 10px 30px;
		--shadow-2xl: 0 12px 35px;
		--shadow-3xl: 0 20px 40px;
		--shadow-card: 0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
		--shadow-collection: 0 10px 40px rgba(0, 0, 0, 0.3);
		--shadow-hover: 0 20px 50px rgba(0, 0, 0, 0.5);
		
		/* Backdrop filters */
		--backdrop-blur-sm: blur(5px);
		--backdrop-blur-md: blur(10px);
		--backdrop-blur-lg: blur(20px);
	}
	
	:global(body) {
		margin: 0;
		padding: var(--spacing-xl);
		background: linear-gradient(135deg, var(--color-bg-dark-primary) 0%, var(--color-bg-dark-secondary) 50%, var(--color-bg-dark-tertiary) 100%);
		min-height: 100vh;
		color: var(--color-text-primary);
		font-family: var(--font-secondary);
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
		font-family: var(--font-primary);
		font-size: clamp(2.5rem, 5vw, 4rem);
		font-weight: var(--font-weight-bold);
		background: linear-gradient(45deg, var(--color-primary-gold), var(--color-primary-gold-light), var(--color-primary-gold), var(--color-primary-gold-dark));
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
		background: linear-gradient(90deg, transparent, var(--color-primary-gold), transparent);
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
		background: linear-gradient(135deg, var(--color-purple-primary) 0%, var(--color-purple-secondary) 100%);
		color: white;
		border: none;
		padding: 14px 28px;
		border-radius: var(--radius-xxl);
		cursor: pointer;
		font-size: 16px;
		font-family: var(--font-primary);
		font-weight: var(--font-weight-medium);
		transition: var(--transition-smooth);
		box-shadow: var(--shadow-large) rgba(106, 76, 147, 0.4);
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
		box-shadow: var(--shadow-2xl) rgba(106, 76, 147, 0.6);
		background: linear-gradient(135deg, var(--color-purple-light) 0%, var(--color-purple-lighter) 100%);
	}
	
	.search-container {
		max-width: 600px;
		margin: 2rem auto;
		display: flex;
		gap: var(--spacing-lg);
		padding: var(--spacing-xl);
		background: var(--bg-glass-secondary);
		border: 1px solid var(--border-glass-tertiary);
		border-radius: var(--radius-xl);
		backdrop-filter: var(--backdrop-blur-md);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}
	
	input {
		flex: 1;
		padding: var(--spacing-lg) var(--spacing-xl);
		border: 2px solid var(--border-glass-tertiary);
		border-radius: var(--radius-large);
		background: var(--bg-glass-tertiary);
		color: var(--color-text-primary);
		font-size: 16px;
		font-family: var(--font-secondary);
		backdrop-filter: var(--backdrop-blur-sm);
		transition: var(--transition-fast);
	}

	input::placeholder {
		color: var(--color-text-placeholder);
	}

	input:focus {
		outline: none;
		border-color: var(--color-primary-gold);
		background: var(--bg-glass-quaternary);
		box-shadow: 0 0 20px rgba(201, 176, 55, 0.3);
	}
	
	button {
		padding: var(--spacing-lg) var(--spacing-2xl);
		border: none;
		border-radius: var(--radius-large);
		background: linear-gradient(135deg, var(--color-primary-gold) 0%, var(--color-primary-gold-light) 100%);
		color: var(--color-bg-dark-primary);
		cursor: pointer;
		font-size: 16px;
		font-family: var(--font-primary);
		font-weight: var(--font-weight-medium);
		transition: var(--transition-smooth);
		box-shadow: var(--shadow-medium) rgba(201, 176, 55, 0.4);
	}
	
	button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: var(--shadow-xl) rgba(201, 176, 55, 0.6);
		background: linear-gradient(135deg, var(--color-primary-gold-variant) 0%, #f7ea95 100%);
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
		padding: var(--spacing-3xl);
		background: linear-gradient(135deg, var(--bg-glass-primary) 0%, var(--bg-glass-secondary) 100%);
		border: 1px solid var(--border-glass-primary);
		border-radius: var(--radius-xxl);
		backdrop-filter: var(--backdrop-blur-lg);
		box-shadow: var(--shadow-card);
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
		gap: var(--spacing-3xl);
		align-items: flex-start;
	}
	
	.card-image {
		width: 280px;
		height: auto;
		border-radius: var(--radius-xl);
		flex-shrink: 0;
		box-shadow: 
			var(--shadow-3xl) rgba(0, 0, 0, 0.5),
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
		outline: 3px solid var(--color-primary-gold);
		outline-offset: 3px;
		border-radius: var(--radius-xl);
	}

	.collection-image-button {
		width: 100%;
		display: block;
	}
	
	.card-details {
		flex: 1;
	}

	.card-details h2 {
		font-family: var(--font-primary);
		font-size: 2rem;
		font-weight: var(--font-weight-bold);
		color: var(--color-primary-gold);
		margin: 0 0 1.5rem 0;
		text-shadow: 0 2px 10px rgba(201, 176, 55, 0.5);
	}

	.card-details p {
		font-size: 1.1rem;
		line-height: 1.6;
		margin: 0.8rem 0;
		color: var(--color-text-primary);
	}

	.card-details strong {
		color: var(--color-primary-gold);
		font-weight: var(--font-weight-medium);
	}
	
	.error {
		color: var(--color-error);
		margin-top: 2rem;
		text-align: center;
		font-size: 1.2rem;
		padding: var(--spacing-xl);
		background: rgba(255, 107, 107, 0.1);
		border: 1px solid rgba(255, 107, 107, 0.3);
		border-radius: var(--radius-large);
		backdrop-filter: var(--backdrop-blur-sm);
	}
	
	.fuzzy-notice {
		margin: 2rem auto;
		padding: var(--spacing-lg) var(--spacing-2xl);
		background: linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(33, 150, 243, 0.05) 100%);
		border: 1px solid rgba(33, 150, 243, 0.3);
		border-radius: var(--radius-large);
		color: var(--color-blue-info);
		backdrop-filter: var(--backdrop-blur-sm);
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
		gap: var(--spacing-md);
		margin-bottom: 1rem;
	}
	
	.quantity-btn {
		background: linear-gradient(135deg, var(--color-green-primary) 0%, var(--color-green-secondary) 100%);
		color: white;
		border: none;
		padding: var(--spacing-md) var(--spacing-xl);
		border-radius: var(--radius-medium);
		cursor: pointer;
		font-size: 14px;
		font-family: var(--font-primary);
		font-weight: var(--font-weight-medium);
		transition: var(--transition-smooth);
		box-shadow: var(--shadow-medium) rgba(76, 175, 80, 0.4);
		flex: 1;
	}
	
	.quantity-btn-multi {
		background: linear-gradient(135deg, var(--color-blue-primary) 0%, var(--color-blue-secondary) 100%);
		box-shadow: var(--shadow-medium) rgba(33, 150, 243, 0.4);
	}
	
	.quantity-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: var(--shadow-xl) rgba(76, 175, 80, 0.6);
	}
	
	.quantity-btn-multi:hover:not(:disabled) {
		box-shadow: var(--shadow-xl) rgba(33, 150, 243, 0.6);
	}
	
	.quantity-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}
	
	.add-message {
		text-align: center;
		color: var(--color-green-primary);
		font-style: italic;
		font-size: 0.9rem;
		margin-top: 0.5rem;
		font-weight: var(--font-weight-medium);
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
		border-radius: var(--spacing-md);
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
		padding: var(--spacing-2xl) var(--spacing-4xl);
		background: linear-gradient(135deg, var(--bg-glass-primary) 0%, var(--bg-glass-secondary) 100%);
		border: 1px solid var(--border-glass-primary);
		border-radius: var(--radius-xl);
		backdrop-filter: var(--backdrop-blur-lg);
		box-shadow: var(--shadow-collection);
	}
	
	.collection-header h2 {
		margin: 0;
		font-family: var(--font-primary);
		font-size: 2rem;
		font-weight: var(--font-weight-medium);
		color: var(--color-primary-gold);
		text-shadow: 0 2px 10px rgba(201, 176, 55, 0.3);
	}
	
	.collection-value {
		font-size: 1.5rem;
		color: var(--color-green-primary);
		padding: var(--spacing-md) 24px;
		background: linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0.1) 100%);
		border: 1px solid rgba(76, 175, 80, 0.4);
		border-radius: var(--radius-large);
		backdrop-filter: var(--backdrop-blur-sm);
		font-family: var(--font-primary);
		font-weight: var(--font-weight-medium);
		text-shadow: 0 2px 10px rgba(76, 175, 80, 0.3);
	}
	
	.empty-collection {
		text-align: center;
		color: var(--color-text-muted);
		font-style: italic;
		font-size: 1.2rem;
		margin: 4rem 0;
		padding: 3rem;
		background: var(--bg-glass-minimal);
		border: 1px dashed var(--border-dashed);
		border-radius: var(--radius-xl);
	}
	
	.collection-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: var(--spacing-3xl);
		margin-top: 2rem;
	}
	
	.collection-card {
		background: linear-gradient(135deg, var(--bg-glass-primary) 0%, var(--bg-glass-secondary) 100%);
		border: 1px solid var(--border-glass-secondary);
		border-radius: var(--radius-xl);
		overflow: hidden;
		backdrop-filter: var(--backdrop-blur-md);
		transition: var(--transition-bounce);
		box-shadow: var(--shadow-large) rgba(0, 0, 0, 0.3);
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
		box-shadow: var(--shadow-hover);
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
		padding: var(--spacing-xl);
	}
	
	.collection-card-info h3 {
		margin: 0 0 var(--spacing-sm) 0;
		font-size: 1.1rem;
		font-family: var(--font-primary);
		font-weight: var(--font-weight-medium);
		color: var(--color-primary-gold);
		text-shadow: 0 1px 5px rgba(201, 176, 55, 0.3);
	}
	
	.collection-card-info .card-type {
		margin: 0 0 var(--spacing-sm) 0;
		font-size: 0.9rem;
		color: var(--color-text-secondary);
		font-style: italic;
	}
	
	.collection-card-info .card-price {
		margin: 0 0 var(--spacing-md) 0;
		font-size: 1rem;
		font-weight: var(--font-weight-medium);
		color: var(--color-green-primary);
		font-family: var(--font-primary);
	}
	
	.quantity-display {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: var(--spacing-md) 0 var(--spacing-lg) 0;
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--bg-glass-secondary);
		border-radius: var(--spacing-sm);
		border: 1px solid var(--border-glass-tertiary);
	}
	
	.quantity-label {
		font-size: 0.9rem;
		color: var(--color-text-primary);
	}
	
	.quantity-controls-collection {
		display: flex;
		gap: 5px;
	}
	
	.quantity-btn-small {
		background: linear-gradient(135deg, var(--color-purple-primary) 0%, var(--color-purple-secondary) 100%);
		color: white;
		border: none;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-small);
		cursor: pointer;
		font-size: 12px;
		font-weight: bold;
		transition: var(--transition-fast);
		min-width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.quantity-btn-small:hover:not(:disabled) {
		transform: translateY(-1px);
		background: linear-gradient(135deg, var(--color-purple-light) 0%, var(--color-purple-lighter) 100%);
	}
	
	.quantity-btn-small:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
	
	.card-buttons {
		margin-top: var(--spacing-md);
	}
	
	.remove-button {
		background: linear-gradient(135deg, var(--color-red-primary) 0%, var(--color-red-secondary) 100%);
		color: white;
		border: none;
		padding: var(--spacing-md) var(--spacing-lg);
		border-radius: var(--radius-medium);
		cursor: pointer;
		font-size: 0.9rem;
		font-family: var(--font-primary);
		font-weight: var(--font-weight-medium);
		transition: var(--transition-smooth);
		width: 100%;
		box-shadow: var(--shadow-small) rgba(244, 67, 54, 0.4);
	}
	
	.remove-button:hover {
		transform: translateY(-2px);
		background: linear-gradient(135deg, var(--color-red-hover) 0%, var(--color-red-variant) 100%);
		box-shadow: var(--shadow-large) rgba(244, 67, 54, 0.6);
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
			gap: var(--spacing-xl);
		}
		
		.collection-header {
			flex-direction: column;
			gap: var(--spacing-lg);
			text-align: center;
		}
		
		.search-container {
			flex-direction: column;
			gap: var(--spacing-lg);
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
		background: linear-gradient(180deg, var(--color-primary-gold), var(--color-primary-gold-dark));
		border-radius: var(--spacing-xs);
	}

	:global(::-webkit-scrollbar-thumb:hover) {
		background: linear-gradient(180deg, var(--color-primary-gold-variant), var(--color-primary-gold-darker));
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.85);
		backdrop-filter: var(--backdrop-blur-lg);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		animation: modalFadeIn 0.3s ease-out;
	}

	.modal-content {
		position: relative;
		max-width: 90vw;
		max-height: 90vh;
		background: linear-gradient(135deg, var(--bg-glass-primary) 0%, var(--bg-glass-secondary) 100%);
		border: 2px solid var(--border-glass-primary);
		border-radius: var(--radius-xl);
		backdrop-filter: var(--backdrop-blur-lg);
		box-shadow: var(--shadow-3xl) rgba(0, 0, 0, 0.8);
		padding: var(--spacing-xl);
		animation: modalSlideIn 0.3s ease-out;
	}

	.modal-close {
		position: absolute;
		top: var(--spacing-md);
		right: var(--spacing-md);
		background: linear-gradient(135deg, var(--color-red-primary) 0%, var(--color-red-secondary) 100%);
		border: none;
		color: white;
		font-size: 28px;
		font-weight: bold;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: var(--transition-smooth);
		z-index: 1001;
		box-shadow: var(--shadow-medium) rgba(244, 67, 54, 0.4);
	}

	.modal-close:hover {
		transform: scale(1.1);
		background: linear-gradient(135deg, var(--color-red-hover) 0%, var(--color-red-variant) 100%);
		box-shadow: var(--shadow-large) rgba(244, 67, 54, 0.6);
	}

	.modal-image {
		max-width: 100%;
		max-height: 80vh;
		width: auto;
		height: auto;
		border-radius: var(--radius-large);
		box-shadow: 
			var(--shadow-3xl) rgba(0, 0, 0, 0.6),
			0 0 0 1px rgba(255, 255, 255, 0.1);
		display: block;
		margin: 0 auto;
	}

	.modal-title {
		text-align: center;
		margin-top: var(--spacing-lg);
		font-family: var(--font-primary);
		font-size: 1.5rem;
		font-weight: var(--font-weight-medium);
		color: var(--color-primary-gold);
		text-shadow: 0 2px 10px rgba(201, 176, 55, 0.5);
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
