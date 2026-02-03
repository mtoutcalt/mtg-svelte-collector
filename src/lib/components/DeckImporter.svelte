<script lang="ts">
	import type { ScryfallCard } from '$lib/utils';

	let deckText = '';
	let deckName = '';
	let format = 'Standard';
	let importing = false;
	let error = '';
	let importedDeck: any = null;
	let saving = false;
	let saveSuccess = false;

	const formats = [
		'Standard',
		'Modern',
		'Pioneer',
		'Legacy',
		'Vintage',
		'Commander',
		'Pauper',
		'Historic',
		'Explorer'
	];

	async function handleImport() {
		error = '';
		importing = true;
		importedDeck = null;

		try {
			const response = await fetch('/api/decks/import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ deckText, deckName, format })
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.details?.join(', ') || data.error;
				return;
			}

			importedDeck = data;

			// Show warning if some cards weren't found
			if (data.notFound && data.notFound.length > 0) {
				error = `Warning: ${data.notFound.length} cards not found on Scryfall: ${data.notFound.join(', ')}`;
			}
		} catch (err) {
			error = 'Failed to import deck. Please check your connection and try again.';
			console.error('Import error:', err);
		} finally {
			importing = false;
		}
	}

	function handlePasteExample() {
		deckText = `Deck
4 Delver of Secrets
4 Lightning Bolt
4 Counterspell
3 Brazen Borrower
20 Island
4 Scalding Tarn

Sideboard
2 Negate
3 Dispel
2 Pithing Needle`;
		deckName = 'Example Tempo Deck';
		format = 'Modern';
	}

	function calculateTotalPrice(cards: ScryfallCard[]): string {
		const total = cards.reduce((sum, card) => {
			const price = parseFloat(card.prices?.usd || '0');
			const quantity = card.quantity || 1;
			return sum + price * quantity;
		}, 0);
		return total.toFixed(2);
	}

	async function handleSaveDeck() {
		if (!importedDeck) return;

		saving = true;
		error = '';
		saveSuccess = false;

		try {
			// First, add all cards to the collection (if they're not already there)
			const allCards = [...importedDeck.mainboard, ...importedDeck.sideboard];
			for (const card of allCards) {
				// Check if card exists in collection
				const checkResponse = await fetch(`/api/collection/${card.id}`);
				if (!checkResponse.ok) {
					// Card doesn't exist, add it with quantity 0 (it's for a deck, not owned yet)
					const addResponse = await fetch('/api/collection', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ ...card, quantity: 0 })
					});

					if (!addResponse.ok) {
						console.error(`Failed to add card ${card.name} to collection`);
					}
				}
			}

			// Then create the deck
			const createDeckResponse = await fetch('/api/decks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: importedDeck.name,
					description: `Imported deck with ${importedDeck.totalCards} cards`,
					format: importedDeck.format
				})
			});

			if (!createDeckResponse.ok) {
				const errorData = await createDeckResponse.json();
				throw new Error(errorData.error || 'Failed to create deck');
			}

			const createdDeck = await createDeckResponse.json();

			// Finally, add all the cards to the deck
			for (const card of importedDeck.mainboard) {
				await fetch(`/api/decks/${createdDeck.id}/cards`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						cardId: card.id,
						quantity: card.quantity,
						isSideboard: false
					})
				});
			}

			for (const card of importedDeck.sideboard) {
				await fetch(`/api/decks/${createdDeck.id}/cards`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						cardId: card.id,
						quantity: card.quantity,
						isSideboard: true
					})
				});
			}

			saveSuccess = true;
			error = '';
			setTimeout(() => {
				saveSuccess = false;
			}, 3000);
		} catch (err) {
			error = 'Failed to save deck: ' + (err instanceof Error ? err.message : 'Unknown error');
			console.error('Save deck error:', err);
		} finally {
			saving = false;
		}
	}

	async function handleCompareWithCollection() {
		// TODO: Implement comparison with collection
		alert('Comparison feature coming soon!');
	}
</script>

<div class="deck-importer">
	<div class="header">
		<h2>Import Pro Deck</h2>
		<p class="subtitle">Paste any decklist to see which cards you own</p>
	</div>

	<div class="form">
		<div class="form-row">
			<div class="form-group">
				<label for="deck-name">Deck Name</label>
				<input
					id="deck-name"
					type="text"
					bind:value={deckName}
					placeholder="e.g., Dimir Control - GP Winner"
				/>
			</div>

			<div class="form-group">
				<label for="format">Format</label>
				<select id="format" bind:value={format}>
					{#each formats as fmt}
						<option value={fmt}>{fmt}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="form-group">
			<label for="deck-text">
				Decklist
				<button type="button" on:click={handlePasteExample} class="link-button">
					(paste example)
				</button>
			</label>
			<textarea
				id="deck-text"
				bind:value={deckText}
				placeholder="Paste your decklist here...&#10;&#10;4 Lightning Bolt&#10;3 Counterspell&#10;20 Island&#10;&#10;Sideboard&#10;2 Negate"
				rows="12"
			></textarea>
			<p class="hint">Supports MTGGoldfish, Arena, MTGO, and most other formats</p>
		</div>

		{#if error}
			<div class="error">{error}</div>
		{/if}

		<button on:click={handleImport} disabled={!deckText || importing} class="import-button">
			{importing ? 'Importing...' : 'Import Deck'}
		</button>
	</div>

	{#if importedDeck}
		<div class="deck-preview">
			<div class="deck-header">
				<div>
					<h3>{importedDeck.name}</h3>
					<div class="deck-meta">
						<span class="format-badge">{importedDeck.format}</span>
						<span>{importedDeck.totalCards} cards</span>
					</div>
				</div>
				<div class="deck-price">
					<div class="price-label">Total Value</div>
					<div class="price-value">
						${calculateTotalPrice([...importedDeck.mainboard, ...importedDeck.sideboard])}
					</div>
				</div>
			</div>

			<div class="deck-sections">
				<div class="deck-section">
					<h4>
						Mainboard
						<span class="card-count">({importedDeck.mainboard.length} unique cards)</span>
					</h4>
					<div class="card-list">
						{#each importedDeck.mainboard as card}
							<div class="card-item">
								<div class="card-info">
									<span class="quantity">{card.quantity}x</span>
									<span class="card-name">{card.name}</span>
								</div>
								{#if card.prices?.usd}
									<span class="card-price">${(parseFloat(card.prices.usd) * card.quantity).toFixed(2)}</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				{#if importedDeck.sideboard.length > 0}
					<div class="deck-section">
						<h4>
							Sideboard
							<span class="card-count">({importedDeck.sideboard.length} unique cards)</span>
						</h4>
						<div class="card-list">
							{#each importedDeck.sideboard as card}
								<div class="card-item">
									<div class="card-info">
										<span class="quantity">{card.quantity}x</span>
										<span class="card-name">{card.name}</span>
									</div>
									{#if card.prices?.usd}
										<span class="card-price">${(parseFloat(card.prices.usd) * card.quantity).toFixed(2)}</span>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<div class="actions">
				<button class="action-button primary" on:click={handleCompareWithCollection}>
					Compare with Collection
				</button>
				<button
					class="action-button secondary"
					on:click={handleSaveDeck}
					disabled={saving || saveSuccess}
				>
					{#if saving}
						Saving...
					{:else if saveSuccess}
						✓ Saved!
					{:else}
						Save Deck
					{/if}
				</button>
			</div>

			{#if saveSuccess}
				<div class="success-message">Deck saved successfully! You can find it in your Decks.</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.deck-importer {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
	}

	.header {
		margin-bottom: 2rem;
	}

	.header h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.75rem;
		color: #1a1a1a;
	}

	.subtitle {
		margin: 0;
		color: #666;
		font-size: 0.95rem;
	}

	.form {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.form-row {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group:last-child {
		margin-bottom: 0;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #333;
		font-size: 0.9rem;
	}

	input,
	select,
	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e0e0e0;
		border-radius: 6px;
		font-family: inherit;
		font-size: 0.95rem;
		transition: border-color 0.2s;
	}

	input:focus,
	select:focus,
	textarea:focus {
		outline: none;
		border-color: #0066cc;
	}

	textarea {
		font-family: 'Courier New', monospace;
		resize: vertical;
		min-height: 200px;
	}

	.hint {
		margin: 0.5rem 0 0 0;
		font-size: 0.85rem;
		color: #888;
	}

	.link-button {
		background: none;
		border: none;
		color: #0066cc;
		cursor: pointer;
		font-size: 0.85rem;
		padding: 0;
		text-decoration: underline;
		margin-left: 0.5rem;
	}

	.link-button:hover {
		color: #0052a3;
	}

	.import-button {
		width: 100%;
		background: #0066cc;
		color: white;
		border: none;
		padding: 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		transition: background 0.2s;
	}

	.import-button:hover:not(:disabled) {
		background: #0052a3;
	}

	.import-button:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.error {
		color: #dc3545;
		margin: 1rem 0;
		padding: 0.75rem;
		background: #f8d7da;
		border-radius: 6px;
		font-size: 0.9rem;
	}

	.deck-preview {
		margin-top: 2rem;
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.deck-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 2px solid #f0f0f0;
	}

	.deck-header h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		color: #1a1a1a;
	}

	.deck-meta {
		display: flex;
		gap: 1rem;
		align-items: center;
		font-size: 0.9rem;
		color: #666;
	}

	.format-badge {
		background: #0066cc;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.deck-price {
		text-align: right;
	}

	.price-label {
		font-size: 0.85rem;
		color: #666;
		margin-bottom: 0.25rem;
	}

	.price-value {
		font-size: 1.75rem;
		font-weight: 700;
		color: #28a745;
	}

	.deck-sections {
		display: grid;
		gap: 2rem;
	}

	.deck-section h4 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		color: #333;
	}

	.card-count {
		font-weight: 400;
		color: #666;
		font-size: 0.9rem;
	}

	.card-list {
		display: grid;
		gap: 0.5rem;
	}

	.card-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: #f8f9fa;
		border-radius: 4px;
		transition: background 0.2s;
	}

	.card-item:hover {
		background: #e9ecef;
	}

	.card-info {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.quantity {
		font-weight: 600;
		color: #666;
		min-width: 2rem;
	}

	.card-name {
		color: #333;
	}

	.card-price {
		color: #28a745;
		font-weight: 600;
		font-size: 0.9rem;
	}

	.actions {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 2px solid #f0f0f0;
	}

	.action-button {
		flex: 1;
		padding: 0.875rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.95rem;
		font-weight: 600;
		transition: all 0.2s;
	}

	.action-button.primary {
		background: #0066cc;
		color: white;
	}

	.action-button.primary:hover {
		background: #0052a3;
	}

	.action-button.secondary {
		background: #f8f9fa;
		color: #333;
		border: 2px solid #e0e0e0;
	}

	.action-button.secondary:hover {
		background: #e9ecef;
		border-color: #ccc;
	}

	.action-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.success-message {
		margin-top: 1rem;
		padding: 1rem;
		background: #d4edda;
		border: 2px solid #c3e6cb;
		border-radius: 6px;
		color: #155724;
		text-align: center;
		font-weight: 600;
	}
</style>
