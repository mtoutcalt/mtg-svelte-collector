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
	let viewingAnalytics: boolean = false;
	let collection: ScryfallCard[] = [];
	let showImageModal: boolean = false;
	let modalImageSrc: string = '';
	let modalImageName: string = '';
	let sortBy: string = 'value-desc';
	let analyticsData: any = null;
	let analyticsLoading: boolean = false;
	let updatingPrices: boolean = false;
	let colorFilter: string | null = null;

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
		viewingAnalytics = false;
		if (viewingCollection) {
			await loadCollection();
		}
	}

	async function toggleAnalyticsView(): Promise<void> {
		viewingAnalytics = !viewingAnalytics;
		viewingCollection = false;
		if (viewingAnalytics) {
			await loadAnalytics();
		}
	}

	async function loadAnalytics(): Promise<void> {
		analyticsLoading = true;
		try {
			const response = await fetch('/api/analytics');
			if (response.ok) {
				analyticsData = await response.json();
			} else {
				console.error('Failed to load analytics:', response.statusText);
			}
		} catch (error) {
			console.error('Error loading analytics:', error);
		}
		analyticsLoading = false;
	}

	async function updatePrices(): Promise<void> {
		updatingPrices = true;
		try {
			const response = await fetch('/api/prices', { method: 'PUT' });
			if (response.ok) {
				const result = await response.json();
				console.log('Prices updated:', result);
				// Reload analytics after updating prices
				if (viewingAnalytics) {
					await loadAnalytics();
				}
			} else {
				console.error('Failed to update prices:', response.statusText);
			}
		} catch (error) {
			console.error('Error updating prices:', error);
		}
		updatingPrices = false;
	}

	function getLastUpdateInfo(): { lastUpdate: string; canUpdate: boolean } {
		if (!analyticsData || !collection.length) {
			return { lastUpdate: 'Never', canUpdate: true };
		}
		
		// Find the most recent update time across all cards
		let mostRecentUpdate: Date | null = null;
		
		collection.forEach(card => {
			if (card.priceHistory?.lastUpdated) {
				const updateTime = new Date(card.priceHistory.lastUpdated);
				if (!mostRecentUpdate || updateTime > mostRecentUpdate) {
					mostRecentUpdate = updateTime;
				}
			}
		});
		
		if (!mostRecentUpdate) {
			return { lastUpdate: 'Never', canUpdate: true };
		}
		
		const now = new Date();
		const mostRecent = mostRecentUpdate as Date; // Type assertion for clarity
		const daysSinceUpdate = Math.floor((now.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));
		const hoursSinceUpdate = Math.floor((now.getTime() - mostRecent.getTime()) / (1000 * 60 * 60));
		
		let lastUpdateText = '';
		if (daysSinceUpdate > 0) {
			lastUpdateText = `${daysSinceUpdate} day${daysSinceUpdate > 1 ? 's' : ''} ago`;
		} else if (hoursSinceUpdate > 0) {
			lastUpdateText = `${hoursSinceUpdate} hour${hoursSinceUpdate > 1 ? 's' : ''} ago`;
		} else {
			lastUpdateText = 'Less than an hour ago';
		}
		
		// Allow updates if it's been more than 1 day since last update
		const canUpdate = daysSinceUpdate >= 1;
		
		return { lastUpdate: lastUpdateText, canUpdate };
	}

	function getCollectionCount(): number {
		return collection.reduce((total, card) => total + (card.quantity || 1), 0);
	}

	function getUniqueCardCount(): number {
		return collection.length;
	}

	function getFilteredCollection(): ScryfallCard[] {
		return colorFilter ? collection.filter(matchesColorFilter) : collection;
	}

	function getFilteredCardCount(): number {
		return getFilteredCollection().reduce((total, card) => total + (card.quantity || 1), 0);
	}

	function getFilteredUniqueCardCount(): number {
		return getFilteredCollection().length;
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

	function getCardColorCategory(card: ScryfallCard): string {
		const colors = card.colors || [];
		
		if (colors.length === 0) {
			return 'Colorless';
		} else if (colors.length === 1) {
			switch (colors[0]) {
				case 'W': return 'White';
				case 'U': return 'Blue';
				case 'B': return 'Black';
				case 'R': return 'Red';
				case 'G': return 'Green';
				default: return 'Other';
			}
		} else {
			return 'Multicolor';
		}
	}

	function getColorSortOrder(category: string): number {
		const order = ['White', 'Blue', 'Black', 'Red', 'Green', 'Multicolor', 'Colorless'];
		return order.indexOf(category);
	}

	function setColorFilter(filter: string | null): void {
		colorFilter = filter;
	}

	function clearColorFilter(): void {
		colorFilter = null;
	}

	function matchesColorFilter(card: ScryfallCard): boolean {
		if (!colorFilter) return true;
		
		const cardCategory = getCardColorCategory(card);
		return cardCategory === colorFilter;
	}

	function getSortedCollection(): ScryfallCard[] {
		// First apply color filter, then sort
		const filtered = colorFilter ? collection.filter(matchesColorFilter) : [...collection];
		
		switch (sortBy) {
			case 'value-desc':
				return filtered.sort((a, b) => {
					const aValue = parseFloat(a.prices?.usd || '0');
					const bValue = parseFloat(b.prices?.usd || '0');
					return bValue - aValue;
				});
			case 'value-asc':
				return filtered.sort((a, b) => {
					const aValue = parseFloat(a.prices?.usd || '0');
					const bValue = parseFloat(b.prices?.usd || '0');
					return aValue - bValue;
				});
			case 'name-asc':
				return filtered.sort((a, b) => a.name.localeCompare(b.name));
			case 'name-desc':
				return filtered.sort((a, b) => b.name.localeCompare(a.name));
			case 'type-asc':
				return filtered.sort((a, b) => a.type_line.localeCompare(b.type_line));
			case 'type-desc':
				return filtered.sort((a, b) => b.type_line.localeCompare(a.type_line));
			case 'quantity-desc':
				return filtered.sort((a, b) => (b.quantity || 1) - (a.quantity || 1));
			case 'quantity-asc':
				return filtered.sort((a, b) => (a.quantity || 1) - (b.quantity || 1));
			case 'color-wubrg':
				return filtered.sort((a, b) => {
					const aCategory = getCardColorCategory(a);
					const bCategory = getCardColorCategory(b);
					const aOrder = getColorSortOrder(aCategory);
					const bOrder = getColorSortOrder(bCategory);
					
					if (aOrder !== bOrder) {
						return aOrder - bOrder;
					}
					
					// Same color, sort by name
					return a.name.localeCompare(b.name);
				});
			default:
				return filtered;
		}
	}
</script>

<h1 class="main-title">Magic Card Search</h1>

<div class="top-nav">
	<button class="collection-button" on:click={toggleCollectionView}>
		{viewingCollection ? '← Back to Search' : `📚 View Collection (${getCollectionCount()} cards, ${getUniqueCardCount()} unique)`}
	</button>
	<button class="analytics-button" on:click={toggleAnalyticsView}>
		{viewingAnalytics ? '← Back to Search' : '📊 Analytics'}
	</button>
</div>

{#if !viewingCollection && !viewingAnalytics}
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

{:else if viewingCollection}
<!-- Collection View -->
<div class="collection-view">
	<div class="collection-header">
		<div class="collection-info">
			<h2>
				My Collection 
				{#if colorFilter}
					({getFilteredCardCount()} cards, {getFilteredUniqueCardCount()} unique - {colorFilter} filter)
				{:else}
					({getCollectionCount()} cards, {getUniqueCardCount()} unique)
				{/if}
			</h2>
			{#if collection.length > 0}
				<div class="collection-value">
					<strong>Total Worth: {formatCurrency(calculateCollectionValue(getFilteredCollection()))}</strong>
				</div>
			{/if}
		</div>
		{#if collection.length > 0}
			<div class="collection-controls">
				<div class="filter-section">
					<div class="filter-label">Filter by color:</div>
					<div class="color-filters">
						<button 
							class="color-filter-btn {colorFilter === null ? 'active' : ''}" 
							on:click={clearColorFilter}
							title="Show all colors"
						>
							All
						</button>
						<button 
							class="color-filter-btn white {colorFilter === 'White' ? 'active' : ''}" 
							on:click={() => setColorFilter('White')}
							title="White cards only"
						>
							⚪
						</button>
						<button 
							class="color-filter-btn blue {colorFilter === 'Blue' ? 'active' : ''}" 
							on:click={() => setColorFilter('Blue')}
							title="Blue cards only"
						>
							🔵
						</button>
						<button 
							class="color-filter-btn black {colorFilter === 'Black' ? 'active' : ''}" 
							on:click={() => setColorFilter('Black')}
							title="Black cards only"
						>
							⚫
						</button>
						<button 
							class="color-filter-btn red {colorFilter === 'Red' ? 'active' : ''}" 
							on:click={() => setColorFilter('Red')}
							title="Red cards only"
						>
							🔴
						</button>
						<button 
							class="color-filter-btn green {colorFilter === 'Green' ? 'active' : ''}" 
							on:click={() => setColorFilter('Green')}
							title="Green cards only"
						>
							🟢
						</button>
						<button 
							class="color-filter-btn multicolor {colorFilter === 'Multicolor' ? 'active' : ''}" 
							on:click={() => setColorFilter('Multicolor')}
							title="Multicolor cards only"
						>
							🌈
						</button>
						<button 
							class="color-filter-btn colorless {colorFilter === 'Colorless' ? 'active' : ''}" 
							on:click={() => setColorFilter('Colorless')}
							title="Colorless cards only"
						>
							◯
						</button>
					</div>
				</div>
				<div class="sort-section">
					<label for="sort-select" class="sort-label">Sort by:</label>
					<select id="sort-select" bind:value={sortBy} class="sort-dropdown">
						<option value="value-desc">💰 Price (High to Low)</option>
						<option value="value-asc">💰 Price (Low to High)</option>
						<option value="name-asc">🔤 Name (A to Z)</option>
						<option value="name-desc">🔤 Name (Z to A)</option>
						<option value="type-asc">🎴 Type (A to Z)</option>
						<option value="type-desc">🎴 Type (Z to A)</option>
						<option value="quantity-desc">📊 Quantity (Most First)</option>
						<option value="quantity-asc">📊 Quantity (Least First)</option>
						<option value="color-wubrg">🌈 Color (WUBRG Order)</option>
					</select>
				</div>
			</div>
		{/if}
	</div>
	
	{#if collection.length === 0}
		<p class="empty-collection">Your collection is empty. Search for cards and add them to get started!</p>
	{:else}
		<div class="collection-grid">
			{#each getSortedCollection() as card}
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

{:else if viewingAnalytics}
<!-- Analytics View -->
<div class="analytics-view">
	<div class="analytics-header">
		<div class="analytics-title-section">
			<h2>📊 Portfolio Analytics</h2>
			{#if analyticsData}
				{@const updateInfo = getLastUpdateInfo()}
				<div class="last-update-info">
					<span class="update-text">Last updated: {updateInfo.lastUpdate}</span>
					{#if !updateInfo.canUpdate}
						<span class="update-hint">💡 Updates limited to once per day</span>
					{/if}
				</div>
			{/if}
		</div>
		<button class="update-prices-button" on:click={updatePrices} disabled={updatingPrices || (analyticsData && !getLastUpdateInfo().canUpdate)}>
			{updatingPrices ? '⏳ Updating...' : '🔄 Update Prices'}
		</button>
	</div>

	{#if analyticsLoading}
		<div class="analytics-loading">
			<p>Loading analytics...</p>
		</div>
	{:else if analyticsData}
		<div class="analytics-content">
			<!-- Portfolio Summary -->
			<div class="portfolio-summary">
				<h3>Portfolio Overview</h3>
				<div class="summary-cards">
					<div class="summary-card">
						<div class="card-value">${analyticsData.portfolioSummary.totalValue.toFixed(2)}</div>
						<div class="card-label">Total Value</div>
					</div>
					<div class="summary-card">
						<div class="card-value">{analyticsData.portfolioSummary.totalCards}</div>
						<div class="card-label">Total Cards</div>
					</div>
					<div class="summary-card">
						<div class="card-value">{analyticsData.portfolioSummary.uniqueCards}</div>
						<div class="card-label">Unique Cards</div>
					</div>
				</div>
				
				<!-- Performance Summary -->
				{#if analyticsData.portfolioSummary.sixMonthGain !== null || analyticsData.portfolioSummary.twelveMonthGain !== null}
					<div class="performance-summary">
						{#if analyticsData.portfolioSummary.sixMonthGain !== null}
							<div class="performance-card {analyticsData.portfolioSummary.sixMonthGain >= 0 ? 'positive' : 'negative'}">
								<div class="performance-value">
									{analyticsData.portfolioSummary.sixMonthGain >= 0 ? '+' : ''}${analyticsData.portfolioSummary.sixMonthGain.toFixed(2)}
								</div>
								<div class="performance-percentage">
									({analyticsData.portfolioSummary.sixMonthChange >= 0 ? '+' : ''}{analyticsData.portfolioSummary.sixMonthChange.toFixed(1)}%)
								</div>
								<div class="performance-label">6 Month Change</div>
							</div>
						{/if}
						
						{#if analyticsData.portfolioSummary.twelveMonthGain !== null}
							<div class="performance-card {analyticsData.portfolioSummary.twelveMonthGain >= 0 ? 'positive' : 'negative'}">
								<div class="performance-value">
									{analyticsData.portfolioSummary.twelveMonthGain >= 0 ? '+' : ''}${analyticsData.portfolioSummary.twelveMonthGain.toFixed(2)}
								</div>
								<div class="performance-percentage">
									({analyticsData.portfolioSummary.twelveMonthChange >= 0 ? '+' : ''}{analyticsData.portfolioSummary.twelveMonthChange.toFixed(1)}%)
								</div>
								<div class="performance-label">12 Month Change</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Top Performers -->
			{#if analyticsData.topPerformers.sixMonth.length > 0}
				<div class="performers-section">
					<h3>🚀 Top Performers (6 Months)</h3>
					<div class="performers-table">
						{#each analyticsData.topPerformers.sixMonth as card}
							<div class="performer-row positive">
								<div class="performer-name">{card.name}</div>
								<div class="performer-change">+{card.sixMonthChange.toFixed(1)}%</div>
								<div class="performer-gain">${card.sixMonthGain.toFixed(2)}</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Bottom Performers -->
			{#if analyticsData.bottomPerformers.sixMonth.length > 0}
				<div class="performers-section">
					<h3>📉 Worst Performers (6 Months)</h3>
					<div class="performers-table">
						{#each analyticsData.bottomPerformers.sixMonth as card}
							<div class="performer-row negative">
								<div class="performer-name">{card.name}</div>
								<div class="performer-change">{card.sixMonthChange.toFixed(1)}%</div>
								<div class="performer-gain">${card.sixMonthGain.toFixed(2)}</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if analyticsData.topPerformers.sixMonth.length === 0 && analyticsData.topPerformers.twelveMonth.length === 0}
				<div class="no-data">
					<p>📈 No performance data available yet.</p>
					<p>Update prices monthly to start tracking your collection's performance over time!</p>
				</div>
			{/if}
		</div>
	{:else}
		<div class="no-analytics">
			<p>No analytics data available. Click "Update Prices" to get started!</p>
		</div>
	{/if}
</div>
{/if}

<!-- Image Modal -->
{#if showImageModal}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
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
		gap: var(--spacing-xl);
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
	
	.analytics-button {
		background: linear-gradient(135deg, var(--color-primary-gold) 0%, var(--color-primary-gold-light) 100%);
		color: var(--color-bg-dark-primary);
		border: none;
		padding: 14px 28px;
		border-radius: var(--radius-xxl);
		cursor: pointer;
		font-size: 16px;
		font-family: var(--font-primary);
		font-weight: var(--font-weight-medium);
		transition: var(--transition-smooth);
		box-shadow: var(--shadow-large) rgba(201, 176, 55, 0.4);
		position: relative;
		overflow: hidden;
	}

	.analytics-button::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
		transition: left 0.5s;
	}

	.analytics-button:hover::before {
		left: 100%;
	}

	.analytics-button:hover {
		transform: translateY(-3px);
		box-shadow: var(--shadow-2xl) rgba(201, 176, 55, 0.6);
		background: linear-gradient(135deg, var(--color-primary-gold-variant) 0%, #f7ea95 100%);
	}

	/* Analytics View Styles */
	.analytics-view {
		margin-top: 2rem;
		max-width: 1200px;
		margin-left: auto;
		margin-right: auto;
	}

	.analytics-header {
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

	.analytics-header h2 {
		margin: 0;
		font-family: var(--font-primary);
		font-size: 2rem;
		font-weight: var(--font-weight-medium);
		color: var(--color-primary-gold);
		text-shadow: 0 2px 10px rgba(201, 176, 55, 0.3);
	}

	.update-prices-button {
		background: linear-gradient(135deg, var(--color-blue-primary) 0%, var(--color-blue-secondary) 100%);
		color: white;
		border: none;
		padding: var(--spacing-md) var(--spacing-xl);
		border-radius: var(--radius-large);
		cursor: pointer;
		font-size: 14px;
		font-family: var(--font-primary);
		font-weight: var(--font-weight-medium);
		transition: var(--transition-smooth);
		box-shadow: var(--shadow-medium) rgba(33, 150, 243, 0.4);
	}

	.update-prices-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: var(--shadow-xl) rgba(33, 150, 243, 0.6);
	}

	.update-prices-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	.analytics-loading,
	.no-analytics,
	.no-data {
		text-align: center;
		color: var(--color-text-muted);
		font-size: 1.2rem;
		margin: 4rem 0;
		padding: 3rem;
		background: var(--bg-glass-minimal);
		border: 1px dashed var(--border-dashed);
		border-radius: var(--radius-xl);
	}

	.portfolio-summary {
		margin-bottom: 3rem;
		padding: var(--spacing-3xl);
		background: linear-gradient(135deg, var(--bg-glass-primary) 0%, var(--bg-glass-secondary) 100%);
		border: 1px solid var(--border-glass-primary);
		border-radius: var(--radius-xl);
		backdrop-filter: var(--backdrop-blur-lg);
		box-shadow: var(--shadow-card);
	}

	.portfolio-summary h3 {
		margin: 0 0 2rem 0;
		font-family: var(--font-primary);
		font-size: 1.5rem;
		color: var(--color-primary-gold);
		text-align: center;
	}

	.summary-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--spacing-xl);
		margin-bottom: 2rem;
	}

	.summary-card {
		text-align: center;
		padding: var(--spacing-xl);
		background: var(--bg-glass-tertiary);
		border: 1px solid var(--border-glass-secondary);
		border-radius: var(--radius-large);
		transition: var(--transition-smooth);
	}

	.summary-card:hover {
		transform: translateY(-5px);
		box-shadow: var(--shadow-large) rgba(0, 0, 0, 0.3);
	}

	.card-value {
		font-size: 2rem;
		font-weight: var(--font-weight-bold);
		color: var(--color-primary-gold);
		font-family: var(--font-primary);
		margin-bottom: 0.5rem;
	}

	.card-label {
		font-size: 0.9rem;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.performance-summary {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: var(--spacing-xl);
	}

	.performance-card {
		text-align: center;
		padding: var(--spacing-xl);
		border-radius: var(--radius-large);
		transition: var(--transition-smooth);
		border: 2px solid;
	}

	.performance-card.positive {
		background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%);
		border-color: var(--color-green-primary);
		color: var(--color-green-primary);
	}

	.performance-card.negative {
		background: linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(244, 67, 54, 0.05) 100%);
		border-color: var(--color-red-primary);
		color: var(--color-red-primary);
	}

	.performance-value {
		font-size: 1.5rem;
		font-weight: var(--font-weight-bold);
		font-family: var(--font-primary);
		margin-bottom: 0.5rem;
	}

	.performance-percentage {
		font-size: 1rem;
		margin-bottom: 0.5rem;
	}

	.performance-label {
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 1px;
		opacity: 0.8;
	}

	.performers-section {
		margin-bottom: 3rem;
		padding: var(--spacing-3xl);
		background: linear-gradient(135deg, var(--bg-glass-primary) 0%, var(--bg-glass-secondary) 100%);
		border: 1px solid var(--border-glass-primary);
		border-radius: var(--radius-xl);
		backdrop-filter: var(--backdrop-blur-lg);
		box-shadow: var(--shadow-card);
	}

	.performers-section h3 {
		margin: 0 0 2rem 0;
		font-family: var(--font-primary);
		font-size: 1.3rem;
		color: var(--color-primary-gold);
	}

	.performers-table {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.performer-row {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		gap: var(--spacing-lg);
		align-items: center;
		padding: var(--spacing-md) var(--spacing-xl);
		border-radius: var(--radius-medium);
		transition: var(--transition-smooth);
		border: 1px solid;
	}

	.performer-row.positive {
		background: linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(76, 175, 80, 0.02) 100%);
		border-color: rgba(76, 175, 80, 0.3);
	}

	.performer-row.negative {
		background: linear-gradient(135deg, rgba(244, 67, 54, 0.05) 0%, rgba(244, 67, 54, 0.02) 100%);
		border-color: rgba(244, 67, 54, 0.3);
	}

	.performer-row:hover {
		transform: translateX(10px);
		box-shadow: var(--shadow-medium) rgba(0, 0, 0, 0.2);
	}

	.performer-name {
		font-weight: var(--font-weight-medium);
		color: var(--color-text-primary);
	}

	.performer-change {
		font-weight: var(--font-weight-bold);
		font-family: var(--font-primary);
		text-align: right;
	}

	.performer-row.positive .performer-change {
		color: var(--color-green-primary);
	}

	.performer-row.negative .performer-change {
		color: var(--color-red-primary);
	}

	.performer-gain {
		font-family: var(--font-primary);
		font-weight: var(--font-weight-medium);
		text-align: right;
		color: var(--color-text-secondary);
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
		align-items: flex-start;
		margin-bottom: 3rem;
		padding: var(--spacing-2xl) var(--spacing-4xl);
		background: linear-gradient(135deg, var(--bg-glass-primary) 0%, var(--bg-glass-secondary) 100%);
		border: 1px solid var(--border-glass-primary);
		border-radius: var(--radius-xl);
		backdrop-filter: var(--backdrop-blur-lg);
		box-shadow: var(--shadow-collection);
		gap: var(--spacing-2xl);
	}

	.collection-info {
		flex: 1;
	}

	.collection-controls {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--spacing-lg);
	}

	.filter-section {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--spacing-sm);
	}

	.sort-section {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--spacing-sm);
	}

	.filter-label {
		font-family: var(--font-primary);
		font-size: 0.9rem;
		font-weight: var(--font-weight-medium);
		color: var(--color-text-secondary);
		margin: 0;
	}

	.color-filters {
		display: flex;
		gap: var(--spacing-xs);
		align-items: center;
	}

	.color-filter-btn {
		background: linear-gradient(135deg, var(--bg-glass-tertiary) 0%, var(--bg-glass-secondary) 100%);
		border: 2px solid var(--border-glass-secondary);
		border-radius: var(--radius-medium);
		color: var(--color-text-primary);
		font-size: 1.2rem;
		padding: var(--spacing-sm);
		cursor: pointer;
		transition: var(--transition-fast);
		backdrop-filter: var(--backdrop-blur-sm);
		min-width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-secondary);
	}

	.color-filter-btn:hover {
		border-color: var(--color-primary-gold);
		background: var(--bg-glass-quaternary);
		transform: translateY(-2px);
		box-shadow: var(--shadow-medium) rgba(201, 176, 55, 0.3);
	}

	.color-filter-btn.active {
		border-color: var(--color-primary-gold);
		background: linear-gradient(135deg, var(--color-primary-gold) 0%, var(--color-primary-gold-light) 100%);
		color: var(--color-bg-dark-primary);
		box-shadow: var(--shadow-medium) rgba(201, 176, 55, 0.6);
		transform: translateY(-1px);
	}

	.color-filter-btn.active:hover {
		background: linear-gradient(135deg, var(--color-primary-gold-variant) 0%, #f7ea95 100%);
	}

	.sort-label {
		font-family: var(--font-primary);
		font-size: 0.9rem;
		font-weight: var(--font-weight-medium);
		color: var(--color-text-secondary);
		margin: 0;
	}

	.sort-dropdown {
		background: linear-gradient(135deg, var(--bg-glass-tertiary) 0%, var(--bg-glass-secondary) 100%);
		border: 2px solid var(--border-glass-secondary);
		border-radius: var(--radius-medium);
		color: var(--color-text-primary);
		font-family: var(--font-secondary);
		font-size: 0.9rem;
		padding: var(--spacing-sm) var(--spacing-md);
		cursor: pointer;
		transition: var(--transition-fast);
		backdrop-filter: var(--backdrop-blur-sm);
		min-width: 200px;
	}

	.sort-dropdown:focus {
		outline: none;
		border-color: var(--color-primary-gold);
		box-shadow: 0 0 15px rgba(201, 176, 55, 0.3);
	}

	.sort-dropdown:hover {
		border-color: var(--color-primary-gold);
		background: var(--bg-glass-quaternary);
	}

	.sort-dropdown option {
		background: var(--color-bg-dark-secondary);
		color: var(--color-text-primary);
		padding: var(--spacing-sm);
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
			align-items: center;
		}

		.collection-controls {
			align-items: center;
		}

		.filter-section,
		.sort-section {
			align-items: center;
		}

		.sort-dropdown {
			min-width: 250px;
		}

		.color-filters {
			flex-wrap: wrap;
			justify-content: center;
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
