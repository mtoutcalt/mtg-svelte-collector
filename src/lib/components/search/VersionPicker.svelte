<script lang="ts">
	import type { ScryfallCard, ScryfallSearchResponse } from '$lib/utils';
	import { getCardImageUri, getPrintingTreatments } from '$lib/utils';
	import { createEventDispatcher, onMount } from 'svelte';

	// The card whose other printings we want to browse.
	export let card: ScryfallCard;

	const dispatch = createEventDispatcher();

	let versions: ScryfallCard[] = [];
	let loading = true;
	let error = '';

	async function loadVersions() {
		loading = true;
		error = '';
		try {
			// Every card carries a prints_search_uri that returns all of its
			// printings (unique=prints). Fall back to a name search if missing.
			const url =
				card.prints_search_uri ||
				`https://api.scryfall.com/cards/search?q=${encodeURIComponent(
					`!"${card.name}"`
				)}&unique=prints&order=released`;

			const response = await fetch(url);
			if (!response.ok) {
				error = 'Could not load other versions of this card.';
				return;
			}

			const data = (await response.json()) as ScryfallSearchResponse;
			versions = data.data ?? [];
		} catch (e) {
			error = 'Network error while loading versions.';
		} finally {
			loading = false;
		}
	}

	function selectVersion(version: ScryfallCard) {
		dispatch('select', version);
	}

	function close() {
		dispatch('close');
	}

	onMount(loadVersions);
</script>

<div class="version-picker">
	<div class="picker-header">
		<h3>Choose your version of "{card.name}"</h3>
		<button class="close-btn" on:click={close} aria-label="Close version picker">✕</button>
	</div>

	{#if loading}
		<p class="picker-status">Loading printings…</p>
	{:else if error}
		<p class="picker-status picker-error">{error}</p>
	{:else if versions.length === 0}
		<p class="picker-status">No other versions found.</p>
	{:else}
		<p class="picker-hint">{versions.length} printings — click the one you own.</p>
		<div class="versions-grid">
			{#each versions as version (version.id)}
				{@const treatments = getPrintingTreatments(version)}
				<button
					class="version-card"
					class:selected={version.id === card.id}
					on:click={() => selectVersion(version)}
				>
					<img
						src={getCardImageUri(version, 'small') || getCardImageUri(version, 'normal')}
						alt="{version.name} ({version.set_name})"
						loading="lazy"
					/>
					<div class="version-meta">
						<span class="set-name">{version.set_name || version.set?.toUpperCase()}</span>
						<span class="collector">#{version.collector_number}</span>
						{#if treatments.length > 0}
							<span class="treatments">
								{#each treatments as t}
									<span class="treatment-badge">{t}</span>
								{/each}
							</span>
						{/if}
						<span class="version-price">
							{version.prices?.usd
								? `$${version.prices.usd}`
								: version.prices?.usd_foil
									? `$${version.prices.usd_foil} (foil)`
									: 'Price N/A'}
						</span>
						{#if version.id === card.id}
							<span class="current-tag">Current</span>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.version-picker {
		max-width: 900px;
		margin: 1.5rem auto;
		padding: 24px;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%);
		border: 1px solid rgba(255, 255, 255, 0.18);
		border-radius: 20px;
		backdrop-filter: blur(16px);
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
	}

	.picker-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.picker-header h3 {
		font-family: 'Cinzel', serif;
		font-size: 1.3rem;
		font-weight: 600;
		color: #c9b037;
		margin: 0;
	}

	.close-btn {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #e8e9ed;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		cursor: pointer;
		font-size: 14px;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.15);
		transform: scale(1.05);
	}

	.picker-status {
		text-align: center;
		color: rgba(232, 233, 237, 0.75);
		font-style: italic;
		padding: 1.5rem 0;
	}

	.picker-error {
		color: #e57373;
	}

	.picker-hint {
		color: rgba(232, 233, 237, 0.7);
		font-size: 0.9rem;
		font-style: italic;
		margin: 0 0 1rem 0;
	}

	.versions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 16px;
	}

	.version-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 10px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 14px;
		cursor: pointer;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		text-align: center;
		color: #e8e9ed;
		font-family: inherit;
	}

	.version-card:hover {
		transform: translateY(-4px);
		border-color: #c9b037;
		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
	}

	.version-card.selected {
		border-color: #c9b037;
		box-shadow: 0 0 0 2px rgba(201, 176, 55, 0.4);
	}

	.version-card img {
		width: 100%;
		max-width: 130px;
		border-radius: 10px;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
	}

	.version-meta {
		display: flex;
		flex-direction: column;
		gap: 4px;
		width: 100%;
	}

	.set-name {
		font-family: 'Cinzel', serif;
		font-size: 0.85rem;
		font-weight: 600;
		color: #c9b037;
		line-height: 1.2;
	}

	.collector {
		font-size: 0.75rem;
		color: rgba(232, 233, 237, 0.6);
	}

	.treatments {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		justify-content: center;
	}

	.treatment-badge {
		font-size: 0.65rem;
		padding: 2px 6px;
		border-radius: 6px;
		background: rgba(156, 39, 176, 0.25);
		border: 1px solid rgba(186, 104, 200, 0.4);
		color: #ce93d8;
	}

	.version-price {
		font-family: 'Cinzel', serif;
		font-weight: 600;
		font-size: 0.85rem;
		color: #81c784;
	}

	.current-tag {
		font-size: 0.7rem;
		color: #c9b037;
		font-style: italic;
	}

	@media (max-width: 600px) {
		.versions-grid {
			grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
			gap: 10px;
		}
	}
</style>
