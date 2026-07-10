<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ScryfallCard } from '$lib/utils';
	import { archetypeDecks, type ArchetypeDeck } from '$lib/data/archetypeDecks';

	// Owned collection, passed from the page so we can show "how much do I own".
	export let collection: ScryfallCard[] = [];

	const dispatch = createEventDispatcher();

	let selectedDeck: ArchetypeDeck | null = null;
	let mainboard: ScryfallCard[] = [];
	let notFound: string[] = [];
	let loading = false;
	let error = '';

	// Cache resolved decks so switching back and forth doesn't refetch Scryfall.
	const cache = new Map<string, { mainboard: ScryfallCard[]; notFound: string[] }>();

	// Owned quantities keyed by lowercased name (summed across printings), so
	// owning ANY printing of a card counts toward completing the example deck.
	$: ownedByName = buildOwnedMap(collection);

	function buildOwnedMap(cards: ScryfallCard[]): Map<string, number> {
		const map = new Map<string, number>();
		for (const c of cards) {
			if (!c.name) continue;
			const key = c.name.toLowerCase();
			map.set(key, (map.get(key) || 0) + (c.quantity || 0));
		}
		return map;
	}

	async function selectDeck(deck: ArchetypeDeck) {
		selectedDeck = deck;
		error = '';
		mainboard = [];
		notFound = [];

		const cached = cache.get(deck.id);
		if (cached) {
			mainboard = cached.mainboard;
			notFound = cached.notFound;
			return;
		}

		loading = true;
		try {
			const res = await fetch('/api/decks/import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ deckText: deck.decklist, deckName: deck.name, format: deck.format })
			});
			const data = await res.json();
			if (!res.ok) {
				error = data.error || 'Failed to load this deck.';
				return;
			}
			mainboard = data.mainboard || [];
			notFound = data.notFound || [];
			cache.set(deck.id, { mainboard, notFound });
		} catch (_) {
			error = 'Could not load this deck. Check your connection and try again.';
		} finally {
			loading = false;
		}
	}

	function backToGallery() {
		selectedDeck = null;
		mainboard = [];
		error = '';
	}

	// ── card helpers ───────────────────────────────────────────────
	function qty(card: ScryfallCard): number {
		return card.quantity || 1;
	}

	function isLand(card: ScryfallCard): boolean {
		return (card.type_line || '').toLowerCase().includes('land');
	}

	// The shared ScryfallCard type doesn't carry `cmc`, so derive mana value
	// from the printed mana cost instead. Good enough for a teaching curve.
	function manaValue(card: ScryfallCard): number {
		const cost = card.mana_cost || card.card_faces?.[0]?.mana_cost || '';
		const symbols = cost.match(/\{[^}]+\}/g) || [];
		let mv = 0;
		for (const sym of symbols) {
			const inner = sym.slice(1, -1);
			if (/^\d+$/.test(inner)) mv += parseInt(inner, 10);
			else if (['X', 'Y', 'Z'].includes(inner)) mv += 0;
			else mv += 1;
		}
		return mv;
	}

	type GroupLabel = 'Creatures' | 'Instants & Sorceries' | 'Other Spells' | 'Lands';
	function primaryType(card: ScryfallCard): GroupLabel {
		const t = (card.type_line || '').toLowerCase();
		if (t.includes('land')) return 'Lands';
		if (t.includes('creature')) return 'Creatures';
		if (t.includes('instant') || t.includes('sorcery')) return 'Instants & Sorceries';
		return 'Other Spells';
	}

	function getImage(card: ScryfallCard): string | null {
		return card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || null;
	}

	function findCard(name: string): ScryfallCard | undefined {
		return mainboard.find((c) => c.name.toLowerCase() === name.toLowerCase());
	}

	function openImage(card: ScryfallCard | undefined) {
		if (!card) return;
		const img = getImage(card);
		if (img) dispatch('openImageModal', { src: img, name: card.name });
	}

	function ownedFor(card: ScryfallCard): number {
		return ownedByName.get(card.name.toLowerCase()) || 0;
	}

	// ── derived views ──────────────────────────────────────────────
	const GROUP_ORDER: GroupLabel[] = ['Creatures', 'Instants & Sorceries', 'Other Spells', 'Lands'];

	$: grouped = (() => {
		const buckets = new Map<GroupLabel, { cards: ScryfallCard[]; count: number }>();
		for (const key of GROUP_ORDER) buckets.set(key, { cards: [], count: 0 });
		for (const c of mainboard) {
			const b = buckets.get(primaryType(c))!;
			b.cards.push(c);
			b.count += qty(c);
		}
		return GROUP_ORDER.map((label) => ({ label, ...buckets.get(label)! })).filter(
			(g) => g.cards.length > 0
		);
	})();

	$: curve = (() => {
		const buckets = [0, 0, 0, 0, 0, 0, 0]; // 0,1,2,3,4,5,6+
		for (const c of mainboard) {
			if (isLand(c)) continue;
			buckets[Math.min(6, manaValue(c))] += qty(c);
		}
		const max = Math.max(1, ...buckets);
		return buckets.map((count, i) => ({
			label: i === 6 ? '6+' : String(i),
			count,
			pct: (count / max) * 100
		}));
	})();

	$: comparison = (() => {
		let total = 0;
		let owned = 0;
		let missingCost = 0;
		for (const c of mainboard) {
			const need = qty(c);
			total += need;
			const have = Math.min(need, ownedByName.get(c.name.toLowerCase()) || 0);
			owned += have;
			if (need - have > 0) {
				missingCost += parseFloat(c.prices?.usd || '0') * (need - have);
			}
		}
		return {
			total,
			owned,
			missing: total - owned,
			pct: total > 0 ? Math.round((owned / total) * 100) : 0,
			missingCost
		};
	})();
</script>

<section class="learn">
	{#if !selectedDeck}
		<!-- ── Gallery grid ─────────────────────────────────────── -->
		<div class="intro">
			<h2 class="page-title">Learn the Archetypes</h2>
			<p class="page-sub">
				Every competitive deck falls into a handful of strategies. Pick one to see a real example
				deck, why it works, and how many of the cards you already own.
			</p>
		</div>

		<div class="deck-grid">
			{#each archetypeDecks as deck}
				<button class="deck-card" on:click={() => selectDeck(deck)}>
					<div class="deck-card-top">
						<span class="archetype-badge" style="--c: {deck.archetypeColor}">{deck.archetype}</span>
						<span class="tier-badge" class:budget={deck.tier === 'budget'}>
							{deck.tier === 'budget' ? 'Budget' : 'Classic'}
						</span>
					</div>
					<h3 class="deck-card-name">{deck.name}</h3>
					<span class="deck-colors">{deck.colors} · {deck.format}</span>
					<p class="deck-card-oneliner">{deck.oneLiner}</p>
					<span class="deck-card-cta">Study this deck →</span>
				</button>
			{/each}
		</div>
	{:else}
		<!-- ── Deck detail ──────────────────────────────────────── -->
		<button class="back-btn" on:click={backToGallery}>‹ All archetypes</button>

		<header class="deck-header" style="--c: {selectedDeck.archetypeColor}">
			<div class="deck-header-badges">
				<span class="archetype-badge" style="--c: {selectedDeck.archetypeColor}"
					>{selectedDeck.archetype}</span
				>
				<span class="tier-badge" class:budget={selectedDeck.tier === 'budget'}>
					{selectedDeck.tier === 'budget' ? 'Budget-friendly' : 'Classic'}
				</span>
			</div>
			<h2 class="deck-title">{selectedDeck.name}</h2>
			<span class="deck-colors">{selectedDeck.colors} · {selectedDeck.format}</span>
			<p class="deck-oneliner">{selectedDeck.oneLiner}</p>
		</header>

		{#if loading}
			<div class="loading-box">Loading deck from Scryfall…</div>
		{:else if error}
			<div class="error-box">{error}</div>
		{:else}
			{#if notFound.length > 0}
				<div class="warn-box">
					Heads up: {notFound.length} card{notFound.length === 1 ? '' : 's'} couldn't be resolved ({notFound.join(
						', '
					)}). The numbers below reflect the rest.
				</div>
			{/if}

			<div class="detail-grid">
				<!-- Why it works -->
				<div class="panel">
					<h3 class="panel-title">Why it works</h3>
					<p class="panel-text">{selectedDeck.whyItWorks}</p>
					<h4 class="subhead">The game plan</h4>
					<ol class="gameplan">
						{#each selectedDeck.gamePlan as step}
							<li>{step}</li>
						{/each}
					</ol>
				</div>

				<!-- Collection completion -->
				<div class="panel completion">
					<h3 class="panel-title">Your collection</h3>
					{#if collection.length === 0}
						<p class="panel-text muted">
							Add cards to your collection and this deck will show how close you are to building it.
						</p>
					{:else}
						<div class="completion-stat">
							<span class="completion-pct">{comparison.pct}%</span>
							<span class="completion-label">of this deck owned</span>
						</div>
						<div class="progress">
							<div class="progress-fill" style="width: {comparison.pct}%"></div>
						</div>
						<div class="completion-numbers">
							<span><strong>{comparison.owned}</strong> owned</span>
							<span><strong>{comparison.missing}</strong> missing</span>
							<span>of {comparison.total} cards</span>
						</div>
						{#if comparison.missing > 0}
							<p class="cost-line">
								Est. cost to finish: <strong>${comparison.missingCost.toFixed(2)}</strong>
							</p>
						{:else}
							<p class="cost-line done">You own everything in this deck! 🎉</p>
						{/if}
					{/if}
				</div>
			</div>

			<!-- Key cards -->
			<div class="panel">
				<h3 class="panel-title">Cards that define the deck</h3>
				<div class="keycards">
					{#each selectedDeck.keyCards as kc}
						{@const card = findCard(kc.name)}
						<div class="keycard">
							{#if card && getImage(card)}
								<button
									class="keycard-img-btn"
									on:click={() => openImage(card)}
									title="Click to enlarge"
								>
									<img src={getImage(card)} alt={kc.name} class="keycard-img" />
								</button>
							{:else}
								<div class="keycard-img placeholder"></div>
							{/if}
							<div class="keycard-text">
								<span class="keycard-name">{kc.name}</span>
								<p class="keycard-note">{kc.note}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Deck skeleton: mana curve + role breakdown -->
			<div class="detail-grid">
				<div class="panel">
					<h3 class="panel-title">Mana curve</h3>
					<p class="panel-text muted small">
						How the deck's non-land spells are spread across mana costs — a healthy curve means you
						have something to do every turn.
					</p>
					<div class="curve">
						{#each curve as bar}
							<div class="curve-col">
								<span class="curve-count">{bar.count}</span>
								<div class="curve-bar" style="height: {Math.max(4, bar.pct)}%"></div>
								<span class="curve-label">{bar.label}</span>
							</div>
						{/each}
					</div>
				</div>

				<div class="panel">
					<h3 class="panel-title">Deck skeleton</h3>
					<p class="panel-text muted small">
						Good decks are built from roles, not just good cards. Here's the mix:
					</p>
					<ul class="skeleton">
						{#each grouped as g}
							<li>
								<span class="skeleton-count">{g.count}</span>
								<span class="skeleton-label">{g.label}</span>
							</li>
						{/each}
					</ul>
				</div>
			</div>

			<!-- Full decklist grouped by role -->
			<div class="panel">
				<h3 class="panel-title">The full deck</h3>
				<div class="lists">
					{#each grouped as g}
						<div class="list-group">
							<h4 class="list-head">{g.label} <span class="list-count">({g.count})</span></h4>
							{#each g.cards as card}
								{@const owned = ownedFor(card)}
								{@const need = qty(card)}
								<div class="list-row" class:owned={owned >= need}>
									<span class="row-qty">{need}×</span>
									<button class="row-name" on:click={() => openImage(card)} title="Click to enlarge"
										>{card.name}</button
									>
									<span class="row-owned">
										{#if owned >= need}
											<span class="check">✓ owned</span>
										{:else if owned > 0}
											<span class="partial">own {owned}/{need}</span>
										{:else}
											<span class="none">—</span>
										{/if}
									</span>
									{#if card.prices?.usd}
										<span class="row-price">${card.prices.usd}</span>
									{/if}
								</div>
							{/each}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</section>

<style>
	.learn {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 1rem 3rem;
	}

	/* ── Intro ── */
	.intro {
		text-align: center;
		margin-bottom: 2rem;
	}

	.page-title {
		font-family: 'Cinzel', serif;
		font-size: 1.9rem;
		font-weight: 700;
		margin: 0 0 0.5rem;
		background: linear-gradient(45deg, #c9b037, #f4e58c);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.page-sub {
		max-width: 640px;
		margin: 0 auto;
		color: rgba(232, 233, 237, 0.7);
		font-family: 'Crimson Text', serif;
		font-size: 1.1rem;
		line-height: 1.6;
	}

	/* ── Gallery grid ── */
	.deck-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1.25rem;
	}

	.deck-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
		text-align: left;
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(201, 176, 55, 0.2);
		border-radius: 16px;
		cursor: pointer;
		transition: transform 0.18s ease, border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.deck-card:hover {
		transform: translateY(-4px);
		border-color: rgba(201, 176, 55, 0.5);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
	}

	.deck-card-top {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.archetype-badge {
		font-family: 'Cinzel', serif;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #0a0e1a;
		background: var(--c, #c9b037);
		padding: 0.25rem 0.6rem;
		border-radius: 6px;
	}

	.tier-badge {
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: rgba(232, 233, 237, 0.7);
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.15);
		padding: 0.22rem 0.55rem;
		border-radius: 6px;
	}

	.tier-badge.budget {
		color: #7fd08a;
		border-color: rgba(127, 208, 138, 0.4);
		background: rgba(127, 208, 138, 0.1);
	}

	.deck-card-name {
		font-family: 'Cinzel', serif;
		font-size: 1.2rem;
		font-weight: 600;
		color: #e8e9ed;
		margin: 0.25rem 0 0;
	}

	.deck-colors {
		font-size: 0.8rem;
		color: rgba(232, 233, 237, 0.5);
		letter-spacing: 0.03em;
	}

	.deck-card-oneliner {
		font-family: 'Crimson Text', serif;
		font-size: 1rem;
		line-height: 1.5;
		color: rgba(232, 233, 237, 0.75);
		margin: 0.25rem 0 0.5rem;
	}

	.deck-card-cta {
		margin-top: auto;
		font-family: 'Cinzel', serif;
		font-size: 0.8rem;
		font-weight: 600;
		color: #c9b037;
	}

	/* ── Detail ── */
	.back-btn {
		font-family: 'Cinzel', serif;
		font-size: 0.85rem;
		font-weight: 600;
		color: rgba(232, 233, 237, 0.7);
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 8px;
		padding: 0.45rem 0.9rem;
		cursor: pointer;
		margin-bottom: 1.25rem;
		transition: background 0.2s ease;
	}

	.back-btn:hover {
		background: rgba(255, 255, 255, 0.09);
	}

	.deck-header {
		border-left: 4px solid var(--c, #c9b037);
		padding-left: 1.25rem;
		margin-bottom: 1.75rem;
	}

	.deck-header-badges {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.6rem;
	}

	.deck-title {
		font-family: 'Cinzel', serif;
		font-size: 1.8rem;
		font-weight: 700;
		color: #e8e9ed;
		margin: 0;
	}

	.deck-oneliner {
		font-family: 'Crimson Text', serif;
		font-size: 1.2rem;
		line-height: 1.6;
		color: rgba(232, 233, 237, 0.8);
		margin: 0.5rem 0 0;
		max-width: 720px;
	}

	.detail-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.25rem;
		margin-bottom: 1.25rem;
	}

	.panel {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(201, 176, 55, 0.18);
		border-radius: 16px;
		padding: 1.5rem;
		margin-bottom: 1.25rem;
	}

	.detail-grid .panel {
		margin-bottom: 0;
	}

	.panel-title {
		font-family: 'Cinzel', serif;
		font-size: 1.05rem;
		font-weight: 700;
		color: #c9b037;
		margin: 0 0 0.85rem;
	}

	.panel-text {
		font-family: 'Crimson Text', serif;
		font-size: 1.1rem;
		line-height: 1.65;
		color: rgba(232, 233, 237, 0.82);
		margin: 0;
	}

	.panel-text.muted {
		color: rgba(232, 233, 237, 0.6);
	}

	.panel-text.small {
		font-size: 0.98rem;
	}

	.subhead {
		font-family: 'Cinzel', serif;
		font-size: 0.85rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: rgba(232, 233, 237, 0.55);
		margin: 1.25rem 0 0.6rem;
	}

	.gameplan {
		margin: 0;
		padding-left: 1.2rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.gameplan li {
		font-family: 'Crimson Text', serif;
		font-size: 1.05rem;
		line-height: 1.5;
		color: rgba(232, 233, 237, 0.82);
	}

	/* ── Completion ── */
	.completion-stat {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.completion-pct {
		font-family: 'Cinzel', serif;
		font-size: 2.4rem;
		font-weight: 700;
		color: #f4e58c;
		line-height: 1;
	}

	.completion-label {
		font-size: 0.9rem;
		color: rgba(232, 233, 237, 0.6);
	}

	.progress {
		height: 12px;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 999px;
		overflow: hidden;
		margin-bottom: 0.75rem;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #c9b037, #f4e58c);
		border-radius: 999px;
		transition: width 0.4s ease;
	}

	.completion-numbers {
		display: flex;
		gap: 1rem;
		font-size: 0.9rem;
		color: rgba(232, 233, 237, 0.65);
		flex-wrap: wrap;
	}

	.completion-numbers strong {
		color: #e8e9ed;
	}

	.cost-line {
		margin: 0.85rem 0 0;
		font-size: 0.98rem;
		color: rgba(232, 233, 237, 0.7);
	}

	.cost-line strong {
		color: #7fd08a;
	}

	.cost-line.done {
		color: #7fd08a;
	}

	/* ── Key cards ── */
	.keycards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.25rem;
	}

	.keycard {
		display: flex;
		gap: 0.85rem;
		align-items: flex-start;
	}

	.keycard-img-btn {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		flex-shrink: 0;
		border-radius: 6px;
		transition: transform 0.2s ease;
	}

	.keycard-img-btn:hover {
		transform: translateY(-3px) scale(1.02);
	}

	.keycard-img {
		width: 92px;
		border-radius: 6px;
		display: block;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
	}

	.keycard-img.placeholder {
		width: 92px;
		height: 128px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px dashed rgba(255, 255, 255, 0.15);
	}

	.keycard-text {
		flex: 1;
	}

	.keycard-name {
		font-family: 'Cinzel', serif;
		font-size: 0.95rem;
		font-weight: 600;
		color: #e8e9ed;
	}

	.keycard-note {
		font-family: 'Crimson Text', serif;
		font-size: 1rem;
		line-height: 1.5;
		color: rgba(232, 233, 237, 0.72);
		margin: 0.3rem 0 0;
	}

	/* ── Mana curve ── */
	.curve {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 0.5rem;
		height: 150px;
		margin-top: 1rem;
	}

	.curve-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		height: 100%;
		gap: 0.35rem;
	}

	.curve-count {
		font-size: 0.8rem;
		color: rgba(232, 233, 237, 0.55);
	}

	.curve-bar {
		width: 100%;
		max-width: 42px;
		background: linear-gradient(180deg, #f4e58c, #c9b037);
		border-radius: 5px 5px 0 0;
		min-height: 4px;
	}

	.curve-label {
		font-family: 'Cinzel', serif;
		font-size: 0.8rem;
		font-weight: 600;
		color: rgba(232, 233, 237, 0.7);
	}

	/* ── Skeleton ── */
	.skeleton {
		list-style: none;
		margin: 1rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.skeleton li {
		display: flex;
		align-items: center;
		gap: 0.85rem;
	}

	.skeleton-count {
		font-family: 'Cinzel', serif;
		font-size: 1.1rem;
		font-weight: 700;
		color: #f4e58c;
		min-width: 2rem;
		text-align: right;
	}

	.skeleton-label {
		font-family: 'Crimson Text', serif;
		font-size: 1.05rem;
		color: rgba(232, 233, 237, 0.8);
	}

	/* ── Full list ── */
	.lists {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.list-head {
		font-family: 'Cinzel', serif;
		font-size: 0.9rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: rgba(232, 233, 237, 0.6);
		margin: 0 0 0.6rem;
		padding-bottom: 0.4rem;
		border-bottom: 1px solid rgba(201, 176, 55, 0.15);
	}

	.list-count {
		color: rgba(232, 233, 237, 0.4);
	}

	.list-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.35rem 0;
		font-size: 0.95rem;
	}

	.row-qty {
		font-weight: 700;
		color: rgba(232, 233, 237, 0.5);
		min-width: 1.8rem;
	}

	.row-name {
		flex: 1;
		text-align: left;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		color: rgba(232, 233, 237, 0.9);
		font-family: 'Crimson Text', serif;
		font-size: 1.02rem;
	}

	.row-name:hover {
		color: #f4e58c;
		text-decoration: underline;
	}

	.row-owned {
		font-size: 0.78rem;
		white-space: nowrap;
	}

	.row-owned .check {
		color: #7fd08a;
	}

	.row-owned .partial {
		color: #f4b942;
	}

	.row-owned .none {
		color: rgba(232, 233, 237, 0.3);
	}

	.row-price {
		font-size: 0.82rem;
		color: rgba(232, 233, 237, 0.5);
		min-width: 3rem;
		text-align: right;
	}

	.list-row.owned .row-name {
		color: rgba(232, 233, 237, 0.6);
	}

	/* ── States ── */
	.loading-box,
	.error-box,
	.warn-box {
		padding: 1rem 1.25rem;
		border-radius: 12px;
		font-family: 'Crimson Text', serif;
		font-size: 1.05rem;
		margin-bottom: 1.25rem;
	}

	.loading-box {
		background: rgba(255, 255, 255, 0.04);
		color: rgba(232, 233, 237, 0.7);
		text-align: center;
	}

	.error-box {
		background: rgba(244, 67, 54, 0.12);
		border: 1px solid rgba(244, 67, 54, 0.35);
		color: #ffb4ae;
	}

	.warn-box {
		background: rgba(255, 152, 0, 0.1);
		border: 1px solid rgba(255, 152, 0, 0.3);
		color: #ffcc80;
		font-size: 0.95rem;
	}

	@media (max-width: 600px) {
		.page-title {
			font-size: 1.5rem;
		}

		.deck-title {
			font-size: 1.4rem;
		}
	}
</style>
