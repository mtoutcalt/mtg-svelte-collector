<script>
	let cardName = '';
	let cardData = null;
	let loading = false;

	async function searchCard() {
		if (!cardName.trim()) return;
		
		loading = true;
		try {
			const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
			if (response.ok) {
				cardData = await response.json();
			} else if (response.status === 404) {
				// Try fuzzy search as fallback - search each word
				const words = cardName.split(' ').filter(word => word.length > 2);
				let found = false;
				
				for (const word of words) {
					try {
						const fuzzyResponse = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(word)}`);
						if (fuzzyResponse.ok) {
							const fuzzyData = await fuzzyResponse.json();
							if (fuzzyData.data && fuzzyData.data.length > 0) {
								// Find best match by looking for cards that contain the original search terms
								const bestMatch = fuzzyData.data.find(card => 
									cardName.toLowerCase().split(' ').some(searchWord => 
										card.name.toLowerCase().includes(searchWord.substring(0, 4))
									)
								) || fuzzyData.data[0];
								
								cardData = bestMatch;
								cardData.fuzzyMatch = true;
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
			if (error.name === 'TypeError' && error.message.includes('fetch')) {
				cardData = { error: 'Network error. Please check your internet connection.' };
			} else {
				cardData = { error: 'Something went wrong. Please try again.' };
			}
		}
		loading = false;
	}
</script>

<h1 class="main-title">Magic Card Search</h1>

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
{:else if cardData && !cardData.error}
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
				<p><strong>Text:</strong> {cardData.oracle_text || 'No text'}</p>
			</div>
		</div>
	</div>
{:else if cardData && cardData.error}
	<p class="error">{cardData.error}</p>
{/if}

<style>
	.main-title {
		margin-bottom: 20px;
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
</style>
