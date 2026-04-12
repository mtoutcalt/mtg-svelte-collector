<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	interface KeyCard {
		name: string;
		role: string;
		image: string | null;
		typeLine: string;
		manaCost: string | null;
		oracleText: string | null;
	}

	interface DeckSeed {
		id: string;
		title: string;
		colorLabel: string;
		archetype: string;
		archetypeBlurb: string;
		gamePlan: string;
		colors: string[];
		confidence: 'strong' | 'possible' | 'maybe';
		fitCount: number;
		totalColorCount: number;
		keyCards: KeyCard[];
		why: string;
		nextSteps: string[];
		breakdown: { creatures: number; spells: number };
	}

	let seeds: DeckSeed[] = [];
	let totalCards = 0;
	let loading = true;
	let error = '';

	const COLOR_INFO: Record<string, { bg: string; accent: string; name: string }> = {
		W: { bg: '#f5f0e0', accent: '#c8b86a', name: 'White' },
		U: { bg: '#0e68ab', accent: '#3a9fd8', name: 'Blue'  },
		B: { bg: '#3a2f45', accent: '#9b7bb5', name: 'Black' },
		R: { bg: '#d3202a', accent: '#e84040', name: 'Red'   },
		G: { bg: '#00733e', accent: '#00c065', name: 'Green' },
	};

	const ARCHETYPE_COLORS: Record<string, string> = {
		Aggro:    '#e53935',
		Control:  '#1e88e5',
		Midrange: '#43a047',
		Stompy:   '#2e7d32',
		Tempo:    '#00acc1',
	};

	const CONFIDENCE_INFO: Record<string, { label: string; color: string }> = {
		strong:   { label: 'Strong foundation',  color: '#c9b037' },
		possible: { label: 'Decent start',        color: '#42a5f5' },
		maybe:    { label: 'Early signs',         color: 'rgba(232,233,237,0.5)' },
	};

	// For mono-color: the color's accent. For two-color: gold (multicolor).
	function accentColor(colors: string[]): string {
		if (colors.length === 1) return COLOR_INFO[colors[0]]?.accent ?? '#888';
		return '#c9b037';
	}

	function dotBg(color: string): string {
		return COLOR_INFO[color]?.bg ?? '#888';
	}

	onMount(async () => {
		try {
			const res = await fetch('/api/collection/seeds');
			if (res.ok) {
				const data = await res.json();
				seeds = data.seeds ?? [];
				totalCards = data.totalCards ?? 0;
			} else {
				error = 'Failed to load suggestions.';
			}
		} catch {
			error = 'Could not reach the server.';
		}
		loading = false;
	});
</script>

<div class="seeds-container">

	<!-- Page header -->
	<div class="page-header">
		<button class="back-button" on:click={() => dispatch('back')}>← Back to Decks</button>
		<h2>Deck Seeds</h2>
		<p class="page-subtitle">
			Based on what you own, here are natural starting points for decks — each one explained in plain English.
		</p>
	</div>

	{#if loading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Analyzing your collection…</p>
		</div>

	{:else if error}
		<div class="notice">{error}</div>

	{:else if seeds.length === 0}
		<div class="empty-state">
			<div class="empty-icon">🌱</div>
			<h3>Not enough cards yet</h3>
			<p>Add more cards to your collection and we'll start spotting deck patterns. Even 5–10 cards of the same color is enough to reveal a seed.</p>
		</div>

	{:else}
		<p class="analyzed-note">Analyzed <strong>{totalCards}</strong> non-land cards in your collection</p>

		<div class="seeds-list">
			{#each seeds as seed, i}
				<section class="seed" style="--accent: {accentColor(seed.colors)}">

					<!-- Seed number + top meta -->
					<div class="seed-eyebrow">
						<span class="seed-number">#{i + 1}</span>
						<div class="color-dots">
							{#each seed.colors as color}
								<span class="color-dot" title={COLOR_INFO[color]?.name ?? color} style="background: {dotBg(color)}"></span>
							{/each}
						</div>
						<span class="color-label">{seed.colorLabel}</span>
						<span
							class="archetype-badge"
							style="color: {ARCHETYPE_COLORS[seed.archetype] ?? '#c9b037'}; border-color: {ARCHETYPE_COLORS[seed.archetype] ?? '#c9b037'}55"
						>{seed.archetype}</span>
						<span
							class="confidence-badge"
							style="color: {CONFIDENCE_INFO[seed.confidence].color}; border-color: {CONFIDENCE_INFO[seed.confidence].color}44"
						>{CONFIDENCE_INFO[seed.confidence].label}</span>
					</div>

					<!-- Title + blurb -->
					<div class="seed-title-block">
						<h3 class="seed-title">{seed.title}</h3>
						<p class="archetype-blurb">{seed.archetypeBlurb}</p>
					</div>

					<!-- Stats strip -->
					<div class="stats-strip">
						<div class="stat">
							<span class="stat-value">{seed.breakdown.creatures}</span>
							<span class="stat-label">creatures in these colors</span>
						</div>
						<div class="stat-divider"></div>
						<div class="stat">
							<span class="stat-value">{seed.breakdown.spells}</span>
							<span class="stat-label">instants &amp; sorceries</span>
						</div>
						<div class="stat-divider"></div>
						<div class="stat">
							<span class="stat-value">{seed.fitCount}</span>
							<span class="stat-label">cards that fit this strategy</span>
						</div>
					</div>

					<hr class="divider" />

					<!-- Why -->
					<div class="content-block">
						<h4 class="section-label">Why your collection points here</h4>
						<p class="body-text">{seed.why}</p>
					</div>

					<!-- Game plan (highlighted) -->
					<div class="game-plan-block">
						<h4 class="section-label game-plan-label">How this deck actually plays</h4>
						<p class="body-text">{seed.gamePlan}</p>
					</div>

					<!-- Key cards (full width, image grid) -->
					{#if seed.keyCards.length > 0}
						<div class="content-block">
							<h4 class="section-label">Cards you already own that fit</h4>
							<div class="key-cards-grid">
								{#each seed.keyCards as card}
									<div class="key-card">
										<div class="key-card-image-wrap">
											{#if card.image}
												<img
													src={card.image}
													alt={card.name}
													class="key-card-img"
													loading="lazy"
												/>
											{:else}
												<div class="key-card-no-image">No image</div>
											{/if}
										</div>
										<div class="key-card-info">
											<span class="key-card-name">{card.name}</span>
											{#if card.typeLine}
												<span class="key-card-type">{card.typeLine}</span>
											{/if}
											<span class="key-card-role">{card.role}</span>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Next steps (full width) -->
					<div class="content-block">
						<h4 class="section-label">What to look for next</h4>
						<ol class="next-steps-list">
							{#each seed.nextSteps as step}
								<li>{step}</li>
							{/each}
						</ol>
					</div>

				</section>
			{/each}
		</div>
	{/if}
</div>

<style>
	.seeds-container {
		max-width: 860px;
		margin: 0 auto;
		padding: 0 1rem 5rem;
	}

	/* ── Page header ── */
	.page-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.back-button {
		background: rgba(232, 233, 237, 0.1);
		color: #e8e9ed;
		border: 1px solid rgba(232, 233, 237, 0.2);
		padding: 0.6rem 1.25rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.95rem;
		transition: background 0.2s;
		margin-bottom: 1.75rem;
		display: inline-block;
	}

	.back-button:hover { background: rgba(232, 233, 237, 0.18); }

	.page-header h2 {
		font-family: 'Cinzel', serif;
		font-size: 2.4rem;
		color: #c9b037;
		margin: 0 0 0.75rem;
		text-shadow: 0 2px 10px rgba(201, 176, 55, 0.3);
	}

	.page-subtitle {
		color: rgba(232, 233, 237, 0.6);
		font-size: 1.1rem;
		line-height: 1.65;
		margin: 0 auto;
		max-width: 560px;
	}

	.analyzed-note {
		text-align: center;
		color: rgba(232, 233, 237, 0.45);
		font-size: 0.95rem;
		margin: 0 0 3rem;
	}

	.analyzed-note strong { color: #c9b037; }

	/* ── Loading / empty ── */
	.loading, .notice {
		text-align: center;
		padding: 4rem 0;
		color: rgba(232, 233, 237, 0.6);
		font-size: 1rem;
	}

	.spinner {
		width: 2.5rem;
		height: 2.5rem;
		border: 3px solid rgba(201, 176, 55, 0.2);
		border-top-color: #c9b037;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin: 0 auto 1.25rem;
	}

	@keyframes spin { to { transform: rotate(360deg); } }

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: rgba(232, 233, 237, 0.6);
	}

	.empty-icon { font-size: 3rem; margin-bottom: 1rem; }

	.empty-state h3 {
		font-family: 'Cinzel', serif;
		color: #c9b037;
		font-size: 1.4rem;
		margin: 0 0 0.75rem;
	}

	.empty-state p {
		font-size: 1.05rem;
		line-height: 1.65;
		max-width: 400px;
		margin: 0 auto;
	}

	/* ── Seeds list ── */
	.seeds-list {
		display: flex;
		flex-direction: column;
		gap: 4rem;
	}

	/* ── Individual seed ── */
	.seed {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-left: 4px solid var(--accent);
		border-radius: 0 18px 18px 0;
		padding: 2.5rem 2.75rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	/* ── Eyebrow row ── */
	.seed-eyebrow {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.seed-number {
		font-family: 'Cinzel', serif;
		font-size: 0.85rem;
		color: var(--accent);
		font-weight: 700;
		letter-spacing: 0.05em;
		margin-right: 0.25rem;
	}

	.color-dots { display: flex; gap: 0.3rem; }

	.color-dot {
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		border: 1.5px solid rgba(255,255,255,0.25);
		display: inline-block;
		flex-shrink: 0;
	}

	.color-label {
		color: rgba(232, 233, 237, 0.5);
		font-size: 0.88rem;
		font-style: italic;
		flex: 1;
	}

	.archetype-badge {
		font-family: 'Cinzel', serif;
		font-size: 0.78rem;
		font-weight: 600;
		padding: 0.22rem 0.7rem;
		border-radius: 20px;
		border: 1px solid;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		white-space: nowrap;
	}

	.confidence-badge {
		font-size: 0.82rem;
		padding: 0.22rem 0.65rem;
		border-radius: 20px;
		border: 1px solid;
		white-space: nowrap;
	}

	/* ── Title block ── */
	.seed-title-block {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.seed-title {
		font-family: 'Cinzel', serif;
		font-size: 2rem;
		color: #e8e9ed;
		margin: 0;
		line-height: 1.15;
	}

	.archetype-blurb {
		color: rgba(232, 233, 237, 0.55);
		font-size: 1.05rem;
		font-style: italic;
		margin: 0;
		line-height: 1.55;
	}

	/* ── Stats strip ── */
	.stats-strip {
		display: flex;
		gap: 1.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.stat-value {
		font-family: 'Cinzel', serif;
		font-size: 1.6rem;
		color: var(--accent);
		line-height: 1;
	}

	.stat-label {
		color: rgba(232, 233, 237, 0.5);
		font-size: 0.82rem;
	}

	.stat-divider {
		width: 1px;
		height: 2.5rem;
		background: rgba(255, 255, 255, 0.1);
	}

	/* ── Divider ── */
	.divider {
		border: none;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		margin: 0;
	}

	/* ── Content blocks ── */
	.content-block {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.section-label {
		font-family: 'Cinzel', serif;
		font-size: 0.8rem;
		color: rgba(232, 233, 237, 0.45);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin: 0;
	}

	.body-text {
		color: rgba(232, 233, 237, 0.88);
		font-size: 1.05rem;
		line-height: 1.8;
		margin: 0;
	}

	/* ── Game plan highlight ── */
	.game-plan-block {
		background: rgba(255, 255, 255, 0.035);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-left: 3px solid var(--accent);
		border-radius: 0 12px 12px 0;
		padding: 1.5rem 1.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.game-plan-label { color: var(--accent); opacity: 0.75; }

	/* ── Key cards image grid ── */
	.key-cards-block {
		width: 100%;
	}

	.key-cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 1rem;
	}

	.key-card {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.key-card-image-wrap {
		width: 100%;
		aspect-ratio: 63 / 88;
		border-radius: 8px;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.key-card-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		transition: transform 0.25s ease;
	}

	.key-card:hover .key-card-img {
		transform: scale(1.04);
	}

	.key-card-no-image {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(232, 233, 237, 0.25);
		font-size: 0.8rem;
	}

	.key-card-info {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0 0.1rem;
	}

	.key-card-name {
		color: rgba(232, 233, 237, 0.9);
		font-size: 0.88rem;
		font-weight: 600;
		line-height: 1.3;
	}

	.key-card-type {
		color: rgba(232, 233, 237, 0.45);
		font-size: 0.78rem;
		line-height: 1.3;
	}

	.key-card-role {
		color: var(--accent);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.75;
	}

	/* ── Next steps ── */
	.next-steps-list {
		margin: 0;
		padding-left: 1.4rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.next-steps-list li {
		color: rgba(232, 233, 237, 0.82);
		font-size: 1rem;
		line-height: 1.7;
		padding-left: 0.25rem;
	}

	.next-steps-list li::marker {
		color: var(--accent);
		font-weight: 700;
	}

	/* ── Responsive ── */
	@media (max-width: 680px) {
		.seed {
			padding: 1.75rem 1.5rem;
			border-radius: 0 14px 14px 0;
		}

		.key-cards-grid {
			grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
		}

		.seed-title { font-size: 1.55rem; }

		.stats-strip { gap: 1rem; }

		.stat-divider { display: none; }
	}
</style>
