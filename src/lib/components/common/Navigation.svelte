<script lang="ts">
	export let viewingCollection: boolean = false;
	export let viewingAnalytics: boolean = false;
	export let viewingDecks: boolean = false;
	export let collectionCount: number = 0;
	export let uniqueCardCount: number = 0;

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	$: activeView = viewingCollection
		? 'collection'
		: viewingAnalytics
		? 'analytics'
		: viewingDecks
		? 'decks'
		: 'search';

	function handleGoHome() {
		if (viewingCollection) dispatch('toggleCollection');
		else if (viewingAnalytics) dispatch('toggleAnalytics');
		else if (viewingDecks) dispatch('toggleDecks');
	}

	function toggleCollectionView() {
		dispatch('toggleCollection');
	}

	function toggleAnalyticsView() {
		dispatch('toggleAnalytics');
	}

	function toggleDecksView() {
		dispatch('toggleDecks');
	}
</script>

<header class="app-header">
	<div class="header-inner">
		<!-- Brand -->
		<button class="brand-btn" on:click={handleGoHome} aria-label="Go to Search">
			<svg class="brand-glyph" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
				<polygon points="16,2 30,16 16,30 2,16" stroke="currentColor" stroke-width="1.5" fill="none"/>
				<polygon points="16,8 24,16 16,24 8,16" fill="currentColor" opacity="0.5"/>
				<circle cx="16" cy="16" r="2.5" fill="currentColor"/>
			</svg>
			<span class="brand-name">Arcane Vault</span>
		</button>

		<!-- Nav -->
		<nav class="main-nav" aria-label="Main navigation">
			<button
				class="nav-item"
				class:active={activeView === 'search'}
				on:click={handleGoHome}
				aria-current={activeView === 'search' ? 'page' : undefined}
			>
				<span class="nav-label">Search</span>
			</button>
			<button
				class="nav-item"
				class:active={activeView === 'collection'}
				on:click={toggleCollectionView}
				aria-current={activeView === 'collection' ? 'page' : undefined}
			>
				<span class="nav-label">Collection</span>
				{#if collectionCount > 0}
					<span class="nav-badge" title="{collectionCount} cards, {uniqueCardCount} unique">{collectionCount}</span>
				{/if}
			</button>
			<button
				class="nav-item"
				class:active={activeView === 'decks'}
				on:click={toggleDecksView}
				aria-current={activeView === 'decks' ? 'page' : undefined}
			>
				<span class="nav-label">Decks</span>
			</button>
			<button
				class="nav-item"
				class:active={activeView === 'analytics'}
				on:click={toggleAnalyticsView}
				aria-current={activeView === 'analytics' ? 'page' : undefined}
			>
				<span class="nav-label">Analytics</span>
			</button>
		</nav>
	</div>
</header>

<style>
	.app-header {
		/* Stretch to full width, compensating for body's 20px padding */
		margin: -20px -20px 2.5rem;
		padding: 0 2rem;
		background: rgba(6, 9, 18, 0.92);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		border-bottom: 1px solid rgba(201, 176, 55, 0.18);
		box-shadow: 0 1px 0 rgba(201, 176, 55, 0.08), 0 4px 24px rgba(0, 0, 0, 0.4);
		position: sticky;
		top: -20px;
		z-index: 100;
	}

	.header-inner {
		max-width: 1280px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
		height: 64px;
	}

	/* ── Brand ── */
	.brand-btn {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem 0;
		color: #c9b037;
		text-decoration: none;
		transition: opacity 0.2s ease;
		flex-shrink: 0;
	}

	.brand-btn:hover {
		opacity: 0.8;
	}

	.brand-btn:focus-visible {
		outline: 2px solid #c9b037;
		outline-offset: 4px;
		border-radius: 4px;
	}

	.brand-glyph {
		width: 28px;
		height: 28px;
		color: #c9b037;
		flex-shrink: 0;
		filter: drop-shadow(0 0 6px rgba(201, 176, 55, 0.5));
	}

	.brand-name {
		font-family: 'Cinzel', serif;
		font-size: 1.25rem;
		font-weight: 700;
		background: linear-gradient(135deg, #c9b037 0%, #f4e58c 50%, #c9b037 100%);
		background-size: 200% 200%;
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		animation: brand-shimmer 5s ease-in-out infinite;
		letter-spacing: 1.5px;
		white-space: nowrap;
	}

	@keyframes brand-shimmer {
		0%, 100% { background-position: 0% 50%; }
		50%       { background-position: 100% 50%; }
	}

	/* ── Navigation ── */
	.main-nav {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.nav-item {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.45rem;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.45rem 1rem;
		border-radius: 8px;
		font-family: 'Cinzel', serif;
		font-size: 0.85rem;
		font-weight: 600;
		letter-spacing: 0.5px;
		color: rgba(232, 233, 237, 0.6);
		transition: color 0.2s ease, background 0.2s ease;
		white-space: nowrap;
	}

	.nav-item::after {
		content: '';
		position: absolute;
		bottom: -1px;
		left: 50%;
		transform: translateX(-50%) scaleX(0);
		width: calc(100% - 1.5rem);
		height: 2px;
		background: linear-gradient(90deg, transparent, #c9b037, transparent);
		border-radius: 1px;
		transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.nav-item:hover {
		color: rgba(232, 233, 237, 0.9);
		background: rgba(255, 255, 255, 0.05);
	}

	.nav-item:focus-visible {
		outline: 2px solid rgba(201, 176, 55, 0.6);
		outline-offset: 2px;
	}

	.nav-item.active {
		color: #c9b037;
		background: rgba(201, 176, 55, 0.08);
	}

	.nav-item.active::after {
		transform: translateX(-50%) scaleX(1);
	}

	/* ── Badge ── */
	.nav-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.4rem;
		height: 1.4rem;
		padding: 0 0.35rem;
		background: rgba(201, 176, 55, 0.18);
		border: 1px solid rgba(201, 176, 55, 0.35);
		color: #c9b037;
		border-radius: 20px;
		font-size: 0.7rem;
		font-weight: 700;
		font-family: 'Cinzel', serif;
		letter-spacing: 0;
		line-height: 1;
	}

	.nav-item.active .nav-badge {
		background: rgba(201, 176, 55, 0.25);
		border-color: rgba(201, 176, 55, 0.55);
	}

	/* ── Responsive ── */
	@media (max-width: 600px) {
		.brand-name {
			display: none;
		}

		.nav-item {
			padding: 0.45rem 0.65rem;
			font-size: 0.78rem;
		}
	}
</style>
