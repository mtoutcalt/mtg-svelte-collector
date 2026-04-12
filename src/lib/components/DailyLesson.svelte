<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	type Tip = {
		category: string;
		categoryColor: string;
		title: string;
		body: string;
		scryfallQuery?: string;
	};

	const tips: Tip[] = [
		// --- Mana & Colors ---
		{
			category: 'Mana & Colors',
			categoryColor: '#c9b037',
			title: 'The Five Colors of Magic',
			body: 'Magic has five colors: White (W), Blue (U), Black (B), Red (R), and Green (G). Each color has its own philosophy and strengths. White values order and protection, Blue loves control and drawing cards, Black pursues power at any cost, Red acts fast and aggressive, and Green grows big creatures.',
		},
		{
			category: 'Mana & Colors',
			categoryColor: '#c9b037',
			title: 'How Lands Work',
			body: 'Lands produce mana — the resource you spend to cast spells. You can play one land per turn. Basic lands each produce one mana of a specific color: Plains (White), Island (Blue), Swamp (Black), Mountain (Red), Forest (Green).',
		},
		{
			category: 'Mana & Colors',
			categoryColor: '#c9b037',
			title: 'Reading a Mana Cost',
			body: 'The number in a grey circle on a card\'s cost means "pay this many mana of any color." The colored symbols must be paid with that specific color. For example, a cost of {2}{R}{R} means two of any mana plus two Red mana — four mana total.',
		},

		// --- Card Types ---
		{
			category: 'Card Types',
			categoryColor: '#2196F3',
			title: 'Creatures Attack and Block',
			body: 'Creature cards stay on the battlefield and can attack your opponent or block their attacks. Creatures have two numbers in the bottom right: Power/Toughness (e.g., 2/3). Power is how much damage it deals; Toughness is how much damage it takes to destroy it.',
			scryfallQuery: 't:creature r:common -is:digital',
		},
		{
			category: 'Card Types',
			categoryColor: '#2196F3',
			title: 'Instants: The Surprise Card',
			body: 'Instants can be cast at any time — even during your opponent\'s turn or in response to their spell. This makes them great for surprises: counter a spell, destroy an attacker mid-combat, or give your creature a boost right before damage is dealt.',
			scryfallQuery: 't:instant r:common -is:digital',
		},
		{
			category: 'Card Types',
			categoryColor: '#2196F3',
			title: 'Sorceries: Powerful but Slow',
			body: 'Sorceries are like instants, but they can only be cast on your own turn during your main phase (when nothing else is happening). They\'re often more powerful because of this restriction.',
			scryfallQuery: 't:sorcery r:common -is:digital',
		},
		{
			category: 'Card Types',
			categoryColor: '#2196F3',
			title: 'Enchantments: Lasting Effects',
			body: 'Enchantments stay on the battlefield and create ongoing effects. Some enchant a specific creature or land (Auras), while others affect the whole game. They don\'t have power/toughness and can\'t attack or block.',
			scryfallQuery: 't:enchantment r:common -is:digital',
		},
		{
			category: 'Card Types',
			categoryColor: '#2196F3',
			title: 'Planeswalkers: Powerful Allies',
			body: 'Planeswalkers represent powerful wizards who fight alongside you. They enter with loyalty counters and have abilities you can activate once per turn. Opponents can attack them directly. If their loyalty reaches zero, they die.',
			scryfallQuery: 't:planeswalker r:rare -is:digital',
		},
		{
			category: 'Card Types',
			categoryColor: '#2196F3',
			title: 'Artifacts: Colorless Tools',
			body: 'Artifacts are permanent cards that are usually colorless — meaning any deck can use them. Equipment artifacts can be attached to creatures to boost them. Artifact creatures are both artifacts and creatures at the same time.',
			scryfallQuery: 't:artifact r:common -is:digital',
		},

		// --- Keywords ---
		{
			category: 'Keywords',
			categoryColor: '#9b59b6',
			title: 'Flying',
			body: 'A creature with Flying can only be blocked by creatures that also have Flying or Reach. It soars over ground forces. This makes flyers very hard to stop and great for dealing damage directly to your opponent.',
			scryfallQuery: 'o:"Flying" t:creature r:common -o:"gains flying" -o:"gain flying" -is:digital',
		},
		{
			category: 'Keywords',
			categoryColor: '#9b59b6',
			title: 'Trample',
			body: 'When a creature with Trample attacks, if it\'s blocked, excess damage "tramples through" to the opponent. For example, a 5/5 blocked by a 2/2: it deals 2 damage to the blocker (destroying it) and 3 damage still hits the opponent.',
			scryfallQuery: 'o:"Trample" t:creature r:common -o:"gains trample" -o:"gain trample" -is:digital',
		},
		{
			category: 'Keywords',
			categoryColor: '#9b59b6',
			title: 'Haste',
			body: 'Normally creatures must wait a full turn before attacking — called "summoning sickness." A creature with Haste ignores this rule and can attack or use tap abilities the same turn it enters the battlefield.',
			scryfallQuery: 'o:"Haste" t:creature r:common -o:"gains haste" -o:"gain haste" -is:digital',
		},
		{
			category: 'Keywords',
			categoryColor: '#9b59b6',
			title: 'First Strike',
			body: 'A creature with First Strike deals its combat damage before creatures without it. If the defending creature takes lethal damage, it dies before it gets to strike back. This makes First Strike creatures excellent in combat.',
			scryfallQuery: 'o:"First strike" t:creature r:common -o:"gains first strike" -o:"gain first strike" -is:digital',
		},
		{
			category: 'Keywords',
			categoryColor: '#9b59b6',
			title: 'Deathtouch',
			body: 'Any amount of damage a creature with Deathtouch deals is enough to destroy another creature. Even a 1/1 with Deathtouch can kill a 10/10. Deathtouch also makes blocking a creature an unappealing trade for your opponent.',
			scryfallQuery: 'o:"Deathtouch" t:creature r:common -o:"gains deathtouch" -o:"gain deathtouch" -is:digital',
		},
		{
			category: 'Keywords',
			categoryColor: '#9b59b6',
			title: 'Lifelink',
			body: 'When a creature with Lifelink deals damage (attacking, blocking, or from abilities), you gain that much life. A 3/3 with Lifelink that attacks and deals 3 damage also gains you 3 life at the same time.',
			scryfallQuery: 'o:"Lifelink" t:creature r:common -o:"gains lifelink" -o:"gain lifelink" -is:digital',
		},
		{
			category: 'Keywords',
			categoryColor: '#9b59b6',
			title: 'Vigilance',
			body: 'Creatures normally tap when they attack, leaving them unable to block on the opponent\'s next turn. A creature with Vigilance doesn\'t tap when attacking — it can attack AND still be available to block.',
			scryfallQuery: 'o:"Vigilance" t:creature r:common -o:"gains vigilance" -o:"gain vigilance" -is:digital',
		},
		{
			category: 'Keywords',
			categoryColor: '#9b59b6',
			title: 'Reach',
			body: 'Reach allows a creature to block creatures with Flying, even though it doesn\'t fly itself. Think of it as a long arm or a ranged attack. Without Reach, ground creatures are powerless against flyers.',
			scryfallQuery: 'o:"Reach" t:creature r:common -o:"gains reach" -o:"gain reach" -is:digital',
		},
		{
			category: 'Keywords',
			categoryColor: '#9b59b6',
			title: 'Flash',
			body: 'A creature or spell with Flash can be cast at any time you could cast an instant — including on your opponent\'s turn. This lets you surprise them: hold your mana open as if you\'re bluffing, then drop a creature at the last second.',
			scryfallQuery: 'o:"Flash" t:creature r:common -o:"gains flash" -o:"gain flash" -is:digital',
		},
		{
			category: 'Keywords',
			categoryColor: '#9b59b6',
			title: 'Hexproof',
			body: 'A creature with Hexproof can\'t be targeted by your opponent\'s spells or abilities. They can\'t point a "destroy target creature" spell at it. However, effects that don\'t target (like "destroy all creatures") still affect it.',
			scryfallQuery: 'o:"Hexproof" t:creature r:uncommon -o:"gains hexproof" -o:"gain hexproof" -is:digital',
		},
		{
			category: 'Keywords',
			categoryColor: '#9b59b6',
			title: 'Menace',
			body: 'A creature with Menace can only be blocked by two or more creatures. This makes it difficult to block profitably — if your opponent uses two blockers, they\'re spending double the resources to stop one attacker.',
			scryfallQuery: 'o:"Menace" t:creature r:common -o:"gains menace" -o:"gain menace" -is:digital',
		},
		{
			category: 'Keywords',
			categoryColor: '#9b59b6',
			title: 'Prowess',
			body: 'Whenever you cast a non-creature spell, a creature with Prowess gets +1/+1 until end of turn. Cast two spells and it gets +2/+2. It rewards spell-heavy decks and can lead to surprising bursts of damage.',
			scryfallQuery: 'o:"Prowess" t:creature r:common -is:digital',
		},

		// --- Rules & Phases ---
		{
			category: 'Rules',
			categoryColor: '#4caf50',
			title: 'How a Turn Works',
			body: 'Every turn has phases: Untap (untap your permanents), Upkeep (some abilities trigger here), Draw (draw a card), Main Phase 1 (play spells/lands), Combat, Main Phase 2 (more spells), End Step. Combat itself has sub-steps: attack, block, then damage.',
		},
		{
			category: 'Rules',
			categoryColor: '#4caf50',
			title: 'The Stack: Last In, First Out',
			body: 'When spells or abilities are cast, they go on "the stack." The last thing added resolves first. This means if you cast a spell and your opponent responds to it, their spell resolves before yours. You can then respond to their response!',
		},
		{
			category: 'Rules',
			categoryColor: '#4caf50',
			title: 'Summoning Sickness',
			body: 'A creature can\'t attack or use tap abilities the turn it enters the battlefield — unless it has Haste. This rule is called summoning sickness. It only affects attacking and tapping; the creature can still block on the turn it arrives.',
		},
		{
			category: 'Rules',
			categoryColor: '#4caf50',
			title: 'State-Based Actions',
			body: 'The game automatically checks certain conditions at all times: a creature with 0 or less toughness dies, a creature with lethal damage dies, a player with 0 or less life loses. These happen before anyone can respond — no spells can save a creature that already has lethal damage once the check occurs.',
		},
		{
			category: 'Rules',
			categoryColor: '#4caf50',
			title: 'How to Win',
			body: 'The most common way to win is to reduce your opponent\'s life total from 20 to 0. You can also win if your opponent tries to draw a card but their library is empty (mill out), or through special card abilities that say "you win the game."',
		},

		// --- Deckbuilding ---
		{
			category: 'Deckbuilding',
			categoryColor: '#ff9800',
			title: 'The 60-Card Rule',
			body: 'A standard Magic deck must have at least 60 cards. You can have more, but more cards means you\'ll draw your best cards less often. Most competitive players stick to exactly 60 so every card is as likely as possible to show up when you need it.',
		},
		{
			category: 'Deckbuilding',
			categoryColor: '#ff9800',
			title: 'The 4-Copy Limit',
			body: 'You can include up to 4 copies of any non-basic-land card in your deck. Playing 4 copies of a card maximizes the chance you draw it. Basic lands (Plains, Island, etc.) are exempt — you can include as many as you want.',
		},
		{
			category: 'Deckbuilding',
			categoryColor: '#ff9800',
			title: 'How Many Lands to Run',
			body: 'A good starting point for a 60-card deck is 24 lands. Aggressive low-cost decks can go as low as 20-22; slower control decks might run 26-27. Too few lands and you\'ll get "mana screwed" (stuck with nothing to play); too many and your hand fills with lands.',
		},
		{
			category: 'Deckbuilding',
			categoryColor: '#ff9800',
			title: 'Mana Curve',
			body: 'Your "mana curve" is the spread of card costs in your deck. Ideally you want something to play each turn. A curve might look like: 8 one-drops, 10 two-drops, 8 three-drops, 4 four-drops, 6 spells at 5+. This ensures you\'re never sitting idle with mana to spend.',
		},
		{
			category: 'Deckbuilding',
			categoryColor: '#ff9800',
			title: 'Pick a Strategy',
			body: 'Decks generally fall into archetypes: Aggro (win fast with cheap creatures), Control (answer everything and win late), Midrange (efficient creatures and value), or Combo (set up a specific combo to win). Knowing your strategy helps you cut cards that don\'t support it.',
		},

		// --- Strategy ---
		{
			category: 'Strategy',
			categoryColor: '#e91e63',
			title: 'Card Advantage',
			body: 'Having more cards in hand than your opponent gives you more options and flexibility. Cards that replace themselves (like cantrips that say "draw a card") or generate multiple cards are extremely powerful. Running out of cards while your opponent still has options is called "topdeck mode" — and it\'s a tough spot.',
		},
		{
			category: 'Strategy',
			categoryColor: '#e91e63',
			title: 'Tempo',
			body: 'Tempo is about efficiency — doing more per mana than your opponent. Attacking with a creature while holding up a counterspell, or bouncing an opponent\'s creature right before they attack, are tempo plays. Staying ahead on tempo often means staying ahead in the game.',
		},
		{
			category: 'Strategy',
			categoryColor: '#e91e63',
			title: 'Board Presence',
			body: 'Having more creatures on the battlefield than your opponent is called "board presence." It lets you attack and block more effectively. One of the most important things to evaluate each turn is whether your board state is better, equal, or worse than your opponent\'s.',
		},
	];

	let tip: Tip = tips[0];
	let exampleCard: any = null;
	let cardLoading = false;
	let imageError = false;

	function getTodaysTip(): Tip {
		const today = new Date();
		// Produce a stable number for today: e.g. 20260412
		const seed =
			today.getFullYear() * 10000 +
			(today.getMonth() + 1) * 100 +
			today.getDate();
		return tips[seed % tips.length];
	}

	function getCardImage(card: any): string | null {
		if (card.image_uris?.normal) return card.image_uris.normal;
		if (card.card_faces?.[0]?.image_uris?.normal)
			return card.card_faces[0].image_uris.normal;
		return null;
	}

	function handleCardClick() {
		const img = getCardImage(exampleCard);
		if (img) {
			dispatch('openImageModal', { src: img, name: exampleCard.name });
		}
	}

	onMount(async () => {
		tip = getTodaysTip();

		if (tip.scryfallQuery) {
			cardLoading = true;
			try {
				const res = await fetch(
					`https://api.scryfall.com/cards/random?q=${encodeURIComponent(tip.scryfallQuery)}`
				);
				if (res.ok) {
					exampleCard = await res.json();
				}
			} catch (_) {
				// silently fail — card example is optional
			}
			cardLoading = false;
		}
	});
</script>

<section class="daily-lesson">
	<div class="lesson-header">
		<div class="til-badge">TIL</div>
		<div class="header-text">
			<h2 class="section-title">Today I Learned</h2>
			<span class="category-tag" style="--cat-color: {tip.categoryColor}">
				{tip.category}
			</span>
		</div>
	</div>

	<div class="lesson-body">
		<div class="lesson-text">
			<h3 class="lesson-title">{tip.title}</h3>
			<p class="lesson-content">{tip.body}</p>
		</div>

		{#if tip.scryfallQuery}
			<div class="example-card">
				{#if cardLoading}
					<div class="card-placeholder loading-pulse">
						<span>Loading example...</span>
					</div>
				{:else if exampleCard && !imageError}
					<button class="card-image-btn" on:click={handleCardClick} title="Click to enlarge">
						<img
							src={getCardImage(exampleCard)}
							alt={exampleCard.name}
							class="card-thumbnail"
							on:error={() => (imageError = true)}
						/>
					</button>
					<p class="card-label">Example: <strong>{exampleCard.name}</strong></p>
				{/if}
			</div>
		{/if}
	</div>
</section>

<style>
	.daily-lesson {
		margin: 2rem 0;
		padding: 2rem;
		background: linear-gradient(135deg, rgba(201, 176, 55, 0.08) 0%, rgba(201, 176, 55, 0.03) 100%);
		border: 2px solid rgba(201, 176, 55, 0.35);
		border-radius: 20px;
		backdrop-filter: blur(10px);
		box-shadow: 0 8px 32px rgba(201, 176, 55, 0.12);
	}

	.lesson-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.til-badge {
		font-family: 'Cinzel', serif;
		font-size: 1rem;
		font-weight: 700;
		letter-spacing: 0.15em;
		color: #0a0e1a;
		background: linear-gradient(135deg, #c9b037, #f4e58c);
		padding: 0.35rem 0.75rem;
		border-radius: 8px;
		flex-shrink: 0;
		box-shadow: 0 2px 10px rgba(201, 176, 55, 0.4);
	}

	.header-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.section-title {
		margin: 0;
		font-family: 'Cinzel', serif;
		font-size: 1.4rem;
		font-weight: 700;
		background: linear-gradient(45deg, #c9b037, #f4e58c);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		line-height: 1;
	}

	.category-tag {
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--cat-color, #c9b037);
		opacity: 0.85;
	}

	.lesson-body {
		display: flex;
		gap: 2rem;
		align-items: flex-start;
	}

	.lesson-text {
		flex: 1;
	}

	.lesson-title {
		margin: 0 0 0.75rem 0;
		font-family: 'Cinzel', serif;
		font-size: 1.2rem;
		font-weight: 600;
		color: #e8e9ed;
	}

	.lesson-content {
		margin: 0;
		font-family: 'Crimson Text', serif;
		font-size: 1.15rem;
		line-height: 1.7;
		color: rgba(232, 233, 237, 0.85);
	}

	.example-card {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.card-image-btn {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		border-radius: 8px;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.card-image-btn:hover {
		transform: translateY(-4px) scale(1.02);
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
	}

	.card-thumbnail {
		width: 140px;
		border-radius: 8px;
		display: block;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
	}

	.card-label {
		margin: 0;
		font-size: 0.78rem;
		color: rgba(232, 233, 237, 0.6);
		text-align: center;
		max-width: 140px;
	}

	.card-label strong {
		color: rgba(232, 233, 237, 0.85);
	}

	.card-placeholder {
		width: 140px;
		height: 195px;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px dashed rgba(255, 255, 255, 0.15);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8rem;
		color: rgba(232, 233, 237, 0.4);
	}

	.loading-pulse {
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 0.5; }
		50% { opacity: 1; }
	}

	@media (max-width: 600px) {
		.lesson-body {
			flex-direction: column-reverse;
			align-items: center;
		}

		.card-thumbnail {
			width: 120px;
		}

		.section-title {
			font-size: 1.2rem;
		}

		.lesson-title {
			font-size: 1.05rem;
		}

		.lesson-content {
			font-size: 1.05rem;
		}
	}
</style>
