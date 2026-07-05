<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	interface Mover {
		id: string;
		name: string;
		quantity: number;
		imageSmall: string | null;
		imageNormal: string | null;
		imageLarge: string | null;
		currentPrice: number;
		previousPrice: number;
		change: number;
		changePercent: number;
		since: string | null;
	}

	let gainers: Mover[] = [];
	let losers: Mover[] = [];
	let basis: 'recent' | 'sixMonth' = 'recent';
	let windowDays = 30;
	let isLoading = true;
	let refreshing = false;
	let error = '';

	onMount(loadMovers);

	async function loadMovers() {
		error = '';
		try {
			const response = await fetch('/api/prices/movers');
			if (!response.ok) {
				throw new Error('Failed to load price movers');
			}
			const data = await response.json();
			gainers = data.gainers || [];
			losers = data.losers || [];
			basis = data.basis || 'recent';
			windowDays = data.windowDays || 30;
		} catch (err) {
			console.error('Error loading price movers:', err);
			error = 'Failed to load price movers';
		} finally {
			isLoading = false;
		}
	}

	// Re-fetches every collection card's price from Scryfall (one request per
	// card, rate-limited server-side), then recomputes the movers
	async function refreshPrices() {
		refreshing = true;
		error = '';
		try {
			const response = await fetch('/api/prices', { method: 'PUT' });
			if (!response.ok) {
				throw new Error('Failed to update prices');
			}
			await loadMovers();
		} catch (err) {
			console.error('Error refreshing prices:', err);
			error = 'Failed to update prices';
		} finally {
			refreshing = false;
		}
	}

	function openImage(mover: Mover) {
		const src = mover.imageLarge || mover.imageNormal || mover.imageSmall;
		if (src) {
			dispatch('openImageModal', { src, name: mover.name });
		}
	}

	function formatPrice(price: number): string {
		return `$${price.toFixed(2)}`;
	}

	function formatChange(mover: Mover): string {
		const sign = mover.change > 0 ? '+' : '-';
		return `${sign}$${Math.abs(mover.change).toFixed(2)} (${sign}${Math.abs(mover.changePercent).toFixed(1)}%)`;
	}

	$: hasMovers = gainers.length > 0 || losers.length > 0;
	$: basisLabel = basis === 'sixMonth'
		? 'compared with ~6 months ago'
		: `over the last ${windowDays} days`;
</script>

{#if !isLoading && (hasMovers || error)}
	<section class="price-movers">
		<div class="section-header">
			<h2 class="section-title">Price Movers</h2>
			<div class="section-subtitle">
				<span>Biggest changes in your collection {basisLabel}</span>
				<button class="refresh-button" on:click={refreshPrices} disabled={refreshing}>
					{refreshing ? 'Updating prices…' : 'Refresh Prices'}
				</button>
			</div>
		</div>

		{#if error}
			<div class="error-message">{error}</div>
		{/if}

		{#if hasMovers}
			<div class="movers-grid">
				<div class="movers-column">
					<h3 class="column-title gainers">📈 Top Gainers</h3>
					{#if gainers.length > 0}
						<ul class="mover-list">
							{#each gainers as mover (mover.id)}
								<li class="mover-row">
									{#if mover.imageSmall}
										<button class="thumb-button" on:click={() => openImage(mover)} title="View card">
											<img src={mover.imageSmall} alt={mover.name} class="thumb" loading="lazy" />
										</button>
									{/if}
									<div class="mover-info">
										<span class="mover-name">{mover.name}</span>
										<span class="mover-prices">{formatPrice(mover.previousPrice)} → {formatPrice(mover.currentPrice)}</span>
									</div>
									<span class="mover-change up">{formatChange(mover)}</span>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="empty-note">No cards gained value.</p>
					{/if}
				</div>

				<div class="movers-column">
					<h3 class="column-title losers">📉 Biggest Losers</h3>
					{#if losers.length > 0}
						<ul class="mover-list">
							{#each losers as mover (mover.id)}
								<li class="mover-row">
									{#if mover.imageSmall}
										<button class="thumb-button" on:click={() => openImage(mover)} title="View card">
											<img src={mover.imageSmall} alt={mover.name} class="thumb" loading="lazy" />
										</button>
									{/if}
									<div class="mover-info">
										<span class="mover-name">{mover.name}</span>
										<span class="mover-prices">{formatPrice(mover.previousPrice)} → {formatPrice(mover.currentPrice)}</span>
									</div>
									<span class="mover-change down">{formatChange(mover)}</span>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="empty-note">No cards lost value.</p>
					{/if}
				</div>
			</div>
		{/if}
	</section>
{/if}

<style>
	.price-movers {
		margin: 2rem 0;
		padding: 2rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(201, 176, 55, 0.18);
		border-radius: 20px;
		backdrop-filter: blur(10px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
	}

	.section-header {
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.section-title {
		margin: 0 0 0.5rem 0;
		font-family: 'Cinzel', serif;
		font-size: 1.6rem;
		font-weight: 700;
		color: #c9b037;
		text-shadow: 0 2px 12px rgba(201, 176, 55, 0.3);
	}

	.section-subtitle {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem;
		font-size: 0.95rem;
		color: rgba(232, 233, 237, 0.8);
	}

	.refresh-button {
		padding: 0.35rem 0.9rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: #c9b037;
		background: rgba(201, 176, 55, 0.1);
		border: 1px solid rgba(201, 176, 55, 0.4);
		border-radius: 8px;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.refresh-button:hover:not(:disabled) {
		background: rgba(201, 176, 55, 0.22);
	}

	.refresh-button:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	.movers-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	.column-title {
		margin: 0 0 0.75rem 0;
		font-size: 1.1rem;
		font-weight: 700;
	}

	.column-title.gainers {
		color: #4caf50;
	}

	.column-title.losers {
		color: #f44336;
	}

	.mover-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.mover-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 10px;
	}

	.thumb-button {
		flex-shrink: 0;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		line-height: 0;
	}

	.thumb {
		width: 40px;
		border-radius: 4px;
		transition: transform 0.15s ease;
	}

	.thumb-button:hover .thumb {
		transform: scale(1.6);
	}

	.mover-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.mover-name {
		font-weight: 600;
		color: rgba(232, 233, 237, 0.95);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.mover-prices {
		font-size: 0.85rem;
		color: rgba(232, 233, 237, 0.6);
	}

	.mover-change {
		flex-shrink: 0;
		font-size: 0.9rem;
		font-weight: 700;
		white-space: nowrap;
	}

	.mover-change.up {
		color: #4caf50;
	}

	.mover-change.down {
		color: #f44336;
	}

	.empty-note {
		margin: 0;
		font-size: 0.9rem;
		font-style: italic;
		color: rgba(232, 233, 237, 0.5);
	}

	.error-message {
		padding: 1rem;
		text-align: center;
		color: #f44336;
		background: rgba(244, 67, 54, 0.1);
		border: 1px solid rgba(244, 67, 54, 0.3);
		border-radius: 8px;
		margin-bottom: 1rem;
	}

	@media (max-width: 768px) {
		.price-movers {
			padding: 1.5rem;
		}

		.movers-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
