<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	const archetypes = [
		{
			name: 'Aggro',
			icon: '⚔️',
			tagline: 'Attack fast, win early',
			color: '#e53935',
			colorLight: 'rgba(229, 57, 53, 0.12)',
			colorBorder: 'rgba(229, 57, 53, 0.35)',
			turns: 'Wins on turns 3–5',
			description:
				'Aggro decks flood the board with cheap, fast threats and attack before the opponent can set up. Every card should either deal damage or help other cards deal damage faster. If you\'re not attacking, something\'s wrong.',
			strategy: [
				'Play creatures on turns 1, 2, and 3 — every turn counts',
				'Use burn spells (direct damage) to clear blockers or finish the opponent',
				'Keep your mana curve low — most cards cost 1–3 mana',
				'Don\'t be afraid to lose a creature if it takes down a bigger one — spending less mana to remove a more expensive threat is always a good deal'
			],
			keyCardTypes: ['1–2 mana creatures', 'Burn spells', 'Haste creatures', 'Spells that create multiple small creatures at once (a swarm is harder to block than one big creature)'],
			exampleCards: ['Lightning Bolt', 'Goblin Guide', 'Monastery Swiftspear', 'Eidolon of the Great Revel'],
			mtgColors: ['Red', 'White', 'Green'],
			newPlayerTip: 'Great starting archetype. Simple gameplan: turn creatures sideways and attack. You will always know what to do.'
		},
		{
			name: 'Control',
			icon: '🛡️',
			tagline: 'Deny, survive, win late',
			color: '#1e88e5',
			colorLight: 'rgba(30, 136, 229, 0.12)',
			colorBorder: 'rgba(30, 136, 229, 0.35)',
			turns: 'Wins on turns 8–12+',
			description:
				'Control decks say "no" to everything the opponent tries to do. Counter their spells, destroy their creatures, then win slowly with a powerful late-game threat. The whole deck is built around surviving long enough to take over.',
			strategy: [
				'Hold up mana on your opponent\'s turn to counter or remove their threats',
				'Use board wipes to reset the board when behind',
				'Draw extra cards to maintain hand advantage',
				'Win with 1–2 powerful finisher cards after the opponent is empty'
			],
			keyCardTypes: ['Counterspells', 'Removal (destroy/exile)', 'Board wipes', 'Card draw', 'Finishers'],
			exampleCards: ['Counterspell', 'Wrath of God', 'Teferi, Hero of Dominaria', 'Shark Typhoon'],
			mtgColors: ['Blue', 'White', 'Black'],
			newPlayerTip: 'Harder to pilot — you make lots of decisions each turn about when to hold up interaction. Great if you like reacting to what the opponent does.'
		},
		{
			name: 'Midrange',
			icon: '⚖️',
			tagline: 'Efficient threats, flexible answers',
			color: '#43a047',
			colorLight: 'rgba(67, 160, 71, 0.12)',
			colorBorder: 'rgba(67, 160, 71, 0.35)',
			turns: 'Wins on turns 5–8',
			description:
				'Midrange plays cards that are just better than what they cost. A 3/3 creature for 2 mana is "efficient." Midrange decks can play aggressively against slow decks and defensively against fast decks — they adapt to the situation.',
			strategy: [
				'Play threats that demand an answer (opponents can\'t ignore them)',
				'Include removal for your opponent\'s best threats',
				'Your creatures should also have useful abilities, not just stats',
				'Be willing to trade resources — you win because your cards are individually stronger'
			],
			keyCardTypes: ['Efficient creatures (good stats + abilities)', 'Removal spells', 'Planeswalkers', '"Value" creatures that draw cards or generate advantage'],
			exampleCards: ['Tarmogoyf', 'Thoughtseize', 'Liliana of the Veil', 'Bloodbraid Elf'],
			mtgColors: ['Black', 'Green', 'White'],
			newPlayerTip: 'The most flexible archetype. Once you understand the basics, midrange teaches you to think about resource efficiency — which is the heart of MTG.'
		},
		{
			name: 'Combo',
			icon: '✨',
			tagline: 'Assemble pieces, win instantly',
			color: '#8e24aa',
			colorLight: 'rgba(142, 36, 170, 0.12)',
			colorBorder: 'rgba(142, 36, 170, 0.35)',
			turns: 'Can win on turns 3–10 (depends on combo)',
			description:
				'Combo decks win by assembling two or more cards that create an unstoppable effect — often generating infinite mana, infinite life, or an instant win. The rest of the deck is built around finding those pieces as fast as possible.',
			strategy: [
				'Use tutors (cards that search your deck) to find your combo pieces',
				'Protect your combo with counterspells or discard',
				'Win immediately once you assemble your pieces — don\'t wait',
				'Know your combo inside-out: practice the sequence before playing'
			],
			keyCardTypes: ['The combo pieces (2–3 specific cards)', 'Tutors / card search', 'Counterspells or discard to stop the opponent from interfering', 'Spells that get you extra mana so you can play your combo pieces sooner'],
			exampleCards: ['Splinter Twin + Deceiver Exarch', 'Thassa\'s Oracle + Demonic Consultation', 'Heliod, Sun-Crowned + Walking Ballista'],
			mtgColors: ['Any — depends on the combo'],
			newPlayerTip: 'Fun to learn, but tricky for new players because you need to know the combo pieces by heart. Start by learning one specific combo and build from there.'
		},
		{
			name: 'Tempo',
			icon: '⚡',
			tagline: 'Cheap threats + disruption',
			color: '#00acc1',
			colorLight: 'rgba(0, 172, 193, 0.12)',
			colorBorder: 'rgba(0, 172, 193, 0.35)',
			turns: 'Wins on turns 4–7',
			description:
				'Tempo is about making your opponent "lose time." Play a threat, then use cheap spells to slow them down — bounce their creature back to hand, counter their spell for 1 mana. Your threat deals damage while they\'re wasting turns replaying cards.',
			strategy: [
				'Play a threat first, then protect/disrupt rather than the reverse',
				'Bounce spells (return to hand) are tempo gold — opponent wastes the mana again',
				'Cheap counterspells let you hold up interaction without losing your turn',
				'Think in terms of mana efficiency: spending 1 to counter their 4 is a huge tempo swing'
			],
			keyCardTypes: ['Cheap evasive threats (flying, unblockable)', 'Spells that return the opponent\'s creatures back to their hand (forcing them to waste mana replaying them)', 'Cheap counterspells', '"Cantrips" (spells that draw a card)'],
			exampleCards: ['Delver of Secrets', 'Brazen Borrower', 'Remand', 'Spell Pierce'],
			mtgColors: ['Blue', 'Red'],
			newPlayerTip: 'Tempo decks are satisfying once it "clicks" — you feel like you\'re always two steps ahead. They reward players who think carefully about timing and sequencing.'
		}
	];

	const keyTerms = [
		{
			term: 'Mana Curve',
			definition:
				'The distribution of your cards by mana cost. A good curve has mostly cheap cards and a few expensive ones — like a curve on a graph. Aggro peaks at 1–2 mana, Control at 3–5.',
			icon: '📈'
		},
		{
			term: 'Card Advantage',
			definition:
				'Having more cards than your opponent. Cards = options = power. Drawing extra cards, getting two effects from one card, or making your opponent discard all give you card advantage.',
			icon: '🃏'
		},
		{
			term: 'Tempo',
			definition:
				'Efficiency of your actions relative to the opponent. Spending 1 mana to stop their 4-mana spell is great tempo. Tapping out and leaving yourself open is bad tempo.',
			icon: '⏱️'
		},
		{
			term: 'Removal',
			definition:
				'Spells that destroy, exile, or return the opponent\'s permanents. "Hard removal" (exile, destroy with no condition) is better than "soft removal" (tap, bounce).',
			icon: '💥'
		},
		{
			term: 'Win Condition',
			definition:
				'The specific way your deck wins the game. A 20/20 unblockable creature. Going infinite. A planeswalker ultimate. Every deck needs at least one clear win condition.',
			icon: '🏆'
		},
		{
			term: 'Tutor',
			definition:
				'A card that searches your library for another card. Tutors are powerful because they turn your single best card into two copies of it effectively.',
			icon: '🔍'
		},
		{
			term: 'Ramp',
			definition:
				'Getting more mana than normal. Playing a land that taps for 2, a creature that taps for mana, or a spell that puts extra lands in play — all are ramp. Lets you play big spells early.',
			icon: '🌿'
		},
		{
			term: 'Sideboard',
			definition:
				'15 extra cards that sit outside your deck. Between games in a match, you can swap cards from your sideboard in to counter what you saw from the opponent.',
			icon: '🔄'
		},
		{
			term: 'Board Wipe',
			definition:
				'A spell that destroys all (or most) creatures at once. Game-changing when the opponent has many creatures and you have few. Control decks use these to reset when behind.',
			icon: '💣'
		},
		{
			term: 'Evasion',
			definition:
				'An ability that lets a creature deal damage without being blocked easily. Flying, trample, menace, and unblockable are evasion. A 10/10 with no evasion can be chump-blocked forever.',
			icon: '🦅'
		}
	];

	const manaColors = [
		{
			color: 'White',
			symbol: 'W',
			hex: '#f9faf4',
			textHex: '#1a1a1a',
			icon: '☀️',
			strengths: ['Removal (exile)', 'Life gain', 'Token creatures', 'Board wipes', 'Equipment', 'Protection'],
			weakness: 'Slow — reacts to threats rather than generating them',
			flavor: 'Order, law, community, light'
		},
		{
			color: 'Blue',
			symbol: 'U',
			hex: '#0e68ab',
			textHex: '#ffffff',
			icon: '💧',
			strengths: ['Counterspells', 'Card draw', 'Flying creatures', 'Bounce (return to hand)', 'Manipulation'],
			weakness: 'No direct damage — can\'t "burn" the opponent',
			flavor: 'Knowledge, control, illusion, perfection'
		},
		{
			color: 'Black',
			symbol: 'B',
			hex: '#150b00',
			textHex: '#c6b7be',
			icon: '💀',
			strengths: ['Destroy creatures', 'Discard from opponent\'s hand', 'Tutors', 'Reanimation', 'Life drain'],
			weakness: 'Can\'t deal with enchantments or artifacts easily',
			flavor: 'Power, ambition, death, selfishness'
		},
		{
			color: 'Red',
			symbol: 'R',
			hex: '#d3202a',
			textHex: '#ffffff',
			icon: '🔥',
			strengths: ['Direct damage (burn)', 'Haste creatures', 'Fast aggro', 'Artifact destruction', 'Impulsive draw'],
			weakness: 'Short on long-term plans — runs out of resources',
			flavor: 'Chaos, emotion, freedom, destruction'
		},
		{
			color: 'Green',
			symbol: 'G',
			hex: '#00733e',
			textHex: '#ffffff',
			icon: '🌲',
			strengths: ['Mana ramp', 'Large creatures', 'Trample', 'Enchantment/artifact removal', 'Land search'],
			weakness: 'No counterspells or direct removal of creatures',
			flavor: 'Nature, growth, instinct, community'
		}
	];

	let activeArchetype: number | null = null;
	let activeTab: 'archetypes' | 'terms' | 'colors' = 'archetypes';

	function toggleArchetype(index: number) {
		activeArchetype = activeArchetype === index ? null : index;
	}
</script>

<div class="guide-container">
	<div class="guide-header">
		<button class="back-button" on:click={() => dispatch('back')}>← Back to Decks</button>
		<h2>Deck Building Guide</h2>
		<p class="guide-subtitle">Learn the archetypes, terms, and color pie — the foundation of every MTG deck</p>
	</div>

	<!-- Tab Bar -->
	<div class="tab-bar">
		<button class="tab-btn" class:active={activeTab === 'archetypes'} on:click={() => { activeTab = 'archetypes'; activeArchetype = null; }}>
			🗂️ Archetypes
		</button>
		<button class="tab-btn" class:active={activeTab === 'terms'} on:click={() => (activeTab = 'terms')}>
			📖 Key Terms
		</button>
		<button class="tab-btn" class:active={activeTab === 'colors'} on:click={() => (activeTab = 'colors')}>
			🎨 Mana Colors
		</button>
	</div>

	<!-- ARCHETYPES TAB -->
	{#if activeTab === 'archetypes'}
		<div class="intro-text">
			<p>
				Every MTG deck follows one of these five strategic blueprints. Knowing which archetype you're building
				tells you <em>what role each card should play</em> and <em>how fast you need to win</em>. Click any archetype to expand it.
			</p>
		</div>

		<div class="archetypes-grid">
			{#each archetypes as archetype, i}
				<div
					class="archetype-card"
					class:expanded={activeArchetype === i}
					style="--arch-color: {archetype.color}; --arch-light: {archetype.colorLight}; --arch-border: {archetype.colorBorder}"
				>
					<div
						class="archetype-header"
						role="button"
						tabindex="0"
						on:click={() => toggleArchetype(i)}
						on:keydown={(e: KeyboardEvent) => e.key === 'Enter' && toggleArchetype(i)}
					>
						<div class="archetype-icon">{archetype.icon}</div>
						<div class="archetype-title-group">
							<h3 class="archetype-name">{archetype.name}</h3>
							<span class="archetype-tagline">{archetype.tagline}</span>
						</div>
						<div class="archetype-meta">
							<span class="turns-badge">{archetype.turns}</span>
							<span class="expand-arrow" class:rotated={activeArchetype === i}>▼</span>
						</div>
					</div>

					{#if activeArchetype === i}
						<div class="archetype-body">
							<p class="archetype-description">{archetype.description}</p>

							<div class="archetype-sections">
								<div class="section">
									<h4>How to Play It</h4>
									<ul>
										{#each archetype.strategy as tip}
											<li>{tip}</li>
										{/each}
									</ul>
								</div>

								<div class="section">
									<h4>Cards You Need</h4>
									<ul class="card-types">
										{#each archetype.keyCardTypes as type}
											<li>{type}</li>
										{/each}
									</ul>
								</div>

								<div class="section">
									<h4>Famous Example Cards</h4>
									<div class="example-cards">
										{#each archetype.exampleCards as card}
											<span class="example-card">{card}</span>
										{/each}
									</div>
								</div>

								<div class="section">
									<h4>Colors It Uses</h4>
									<p class="mana-colors">{archetype.mtgColors.join(', ')}</p>
								</div>
							</div>

							<div class="new-player-tip">
								<span class="tip-label">New Player Tip</span>
								<p>{archetype.newPlayerTip}</p>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- KEY TERMS TAB -->
	{#if activeTab === 'terms'}
		<div class="intro-text">
			<p>
				MTG has a dense vocabulary. These are the terms you'll hear most often when building or discussing decks.
			</p>
		</div>

		<div class="terms-grid">
			{#each keyTerms as item}
				<div class="term-card">
					<div class="term-icon">{item.icon}</div>
					<div class="term-content">
						<h4 class="term-name">{item.term}</h4>
						<p class="term-definition">{item.definition}</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- MANA COLORS TAB -->
	{#if activeTab === 'colors'}
		<div class="intro-text">
			<p>
				Each of the five colors has a distinct identity — what it's good at, what it can't do, and what philosophy it represents.
				Most decks use 2 colors to cover each other's weaknesses.
			</p>
		</div>

		<div class="colors-grid">
			{#each manaColors as mc}
				<div class="color-card" style="--mc-color: {mc.hex}; --mc-text: {mc.textHex}">
					<div class="color-header">
						<div class="mana-symbol" style="background: {mc.hex}; color: {mc.textHex}">{mc.symbol}</div>
						<div>
							<h3 class="color-name">{mc.icon} {mc.color}</h3>
							<p class="color-flavor">{mc.flavor}</p>
						</div>
					</div>

					<div class="color-body">
						<div class="color-section">
							<h4>Strong At</h4>
							<ul>
								{#each mc.strengths as s}
									<li>{s}</li>
								{/each}
							</ul>
						</div>
						<div class="color-section weakness">
							<h4>Weakness</h4>
							<p>{mc.weakness}</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.guide-container {
		max-width: 900px;
		margin: 0 auto;
		padding: 0 1rem 4rem;
	}

	.guide-header {
		text-align: center;
		margin-bottom: 2.5rem;
	}

	.back-button {
		background: rgba(232, 233, 237, 0.1);
		color: #e8e9ed;
		border: 1px solid rgba(232, 233, 237, 0.2);
		padding: 0.6rem 1.25rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.2s;
		margin-bottom: 1.5rem;
		display: inline-block;
	}

	.back-button:hover {
		background: rgba(232, 233, 237, 0.18);
		border-color: rgba(232, 233, 237, 0.3);
	}

	.guide-header h2 {
		font-family: 'Cinzel', serif;
		font-size: 2.2rem;
		color: #c9b037;
		margin: 0 0 0.6rem;
		text-shadow: 0 2px 10px rgba(201, 176, 55, 0.3);
	}

	.guide-subtitle {
		color: rgba(232, 233, 237, 0.65);
		font-size: 1.15rem;
		margin: 0;
	}

	/* Tab Bar */
	.tab-bar {
		display: flex;
		justify-content: center;
		gap: 0.75rem;
		margin-bottom: 2.5rem;
		flex-wrap: wrap;
	}

	.tab-btn {
		background: rgba(255, 255, 255, 0.06);
		color: rgba(232, 233, 237, 0.7);
		border: 1px solid rgba(255, 255, 255, 0.12);
		padding: 0.8rem 1.75rem;
		border-radius: 25px;
		cursor: pointer;
		font-size: 1.05rem;
		font-family: 'Cinzel', serif;
		font-weight: 600;
		transition: all 0.25s;
	}

	.tab-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #e8e9ed;
	}

	.tab-btn.active {
		background: linear-gradient(135deg, #c9b037 0%, #f4e58c 100%);
		color: #0a0e1a;
		border-color: transparent;
		box-shadow: 0 4px 15px rgba(201, 176, 55, 0.35);
	}

	/* Intro text */
	.intro-text {
		text-align: center;
		margin-bottom: 2.5rem;
	}

	.intro-text p {
		color: rgba(232, 233, 237, 0.78);
		font-size: 1.1rem;
		line-height: 1.75;
		max-width: 700px;
		margin: 0 auto;
	}

	.intro-text em {
		color: #c9b037;
		font-style: normal;
	}

	/* ── ARCHETYPES ── */
	.archetypes-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.archetype-card {
		background: var(--arch-light);
		border: 1px solid var(--arch-border);
		border-radius: 14px;
		padding: 1.4rem 1.75rem;
		transition: all 0.25s ease;
	}

	.archetype-card:hover {
		border-color: var(--arch-color);
		background: var(--arch-light);
		transform: translateY(-1px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
	}

	.archetype-header {
		display: flex;
		align-items: center;
		gap: 1.1rem;
		user-select: none;
		cursor: pointer;
	}

	.archetype-icon {
		font-size: 2.25rem;
		flex-shrink: 0;
	}

	.archetype-title-group {
		flex: 1;
	}

	.archetype-name {
		font-family: 'Cinzel', serif;
		font-size: 1.45rem;
		color: var(--arch-color);
		margin: 0 0 0.3rem;
	}

	.archetype-tagline {
		color: rgba(232, 233, 237, 0.7);
		font-size: 1rem;
		font-style: italic;
	}

	.archetype-meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.4rem;
		flex-shrink: 0;
	}

	.turns-badge {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.14);
		color: rgba(232, 233, 237, 0.8);
		font-size: 0.9rem;
		padding: 0.3rem 0.8rem;
		border-radius: 20px;
		white-space: nowrap;
	}

	.expand-arrow {
		color: rgba(232, 233, 237, 0.45);
		font-size: 0.85rem;
		transition: transform 0.25s;
	}

	.expand-arrow.rotated {
		transform: rotate(180deg);
	}

	/* Expanded body */
	.archetype-body {
		margin-top: 1.4rem;
		padding-top: 1.4rem;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
	}

	.archetype-description {
		color: rgba(232, 233, 237, 0.9);
		line-height: 1.75;
		margin: 0 0 1.75rem;
		font-size: 1.05rem;
	}

	.archetype-sections {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.5rem;
		margin-bottom: 1.75rem;
	}

	.section h4 {
		font-family: 'Cinzel', serif;
		font-size: 0.9rem;
		color: var(--arch-color);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin: 0 0 0.75rem;
	}

	.section ul {
		margin: 0;
		padding-left: 1.25rem;
	}

	.section ul li {
		color: rgba(232, 233, 237, 0.85);
		font-size: 1rem;
		line-height: 1.65;
		margin-bottom: 0.4rem;
	}

	.example-cards {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.example-card {
		background: rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.14);
		color: rgba(232, 233, 237, 0.85);
		font-size: 0.95rem;
		padding: 0.3rem 0.7rem;
		border-radius: 5px;
		font-style: italic;
	}

	.mana-colors {
		color: rgba(232, 233, 237, 0.85);
		font-size: 1rem;
		margin: 0;
	}

	.new-player-tip {
		background: rgba(201, 176, 55, 0.09);
		border: 1px solid rgba(201, 176, 55, 0.3);
		border-radius: 10px;
		padding: 1.1rem 1.3rem;
	}

	.tip-label {
		font-family: 'Cinzel', serif;
		font-size: 0.85rem;
		color: #c9b037;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		display: block;
		margin-bottom: 0.45rem;
	}

	.new-player-tip p {
		color: rgba(232, 233, 237, 0.88);
		font-size: 1rem;
		line-height: 1.7;
		margin: 0;
	}

	/* ── KEY TERMS ── */
	.terms-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.1rem;
	}

	.term-card {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 1.25rem 1.4rem;
		display: flex;
		gap: 1rem;
		align-items: flex-start;
		transition: background 0.2s, border-color 0.2s;
	}

	.term-card:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(201, 176, 55, 0.3);
	}

	.term-icon {
		font-size: 1.9rem;
		flex-shrink: 0;
		margin-top: 0.1rem;
	}

	.term-content {
		flex: 1;
	}

	.term-name {
		font-family: 'Cinzel', serif;
		font-size: 1.1rem;
		color: #c9b037;
		margin: 0 0 0.45rem;
	}

	.term-definition {
		color: rgba(232, 233, 237, 0.82);
		font-size: 1rem;
		line-height: 1.65;
		margin: 0;
	}

	/* ── MANA COLORS ── */
	.colors-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.25rem;
	}

	.color-card {
		border-radius: 14px;
		border: 2px solid var(--mc-color);
		overflow: hidden;
	}

	.color-header {
		background: var(--mc-color);
		padding: 1.2rem 1.4rem;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.mana-symbol {
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.35);
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Cinzel', serif;
		font-weight: 700;
		font-size: 1.3rem;
		flex-shrink: 0;
	}

	.color-name {
		font-family: 'Cinzel', serif;
		font-size: 1.25rem;
		margin: 0 0 0.25rem;
		color: var(--mc-text);
	}

	.color-flavor {
		font-size: 0.95rem;
		color: var(--mc-text);
		opacity: 0.8;
		margin: 0;
		font-style: italic;
	}

	.color-body {
		background: rgba(255, 255, 255, 0.04);
		padding: 1.25rem 1.4rem;
	}

	.color-section h4 {
		font-family: 'Cinzel', serif;
		font-size: 0.88rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: #c9b037;
		margin: 0 0 0.65rem;
	}

	.color-section ul {
		margin: 0 0 1.1rem;
		padding-left: 1.25rem;
	}

	.color-section ul li {
		color: rgba(232, 233, 237, 0.85);
		font-size: 1rem;
		line-height: 1.6;
		margin-bottom: 0.3rem;
	}

	.color-section.weakness h4 {
		color: rgba(229, 57, 53, 0.85);
	}

	.color-section.weakness p {
		color: rgba(232, 233, 237, 0.8);
		font-size: 1rem;
		line-height: 1.6;
		margin: 0;
	}

	/* Responsive */
	@media (max-width: 600px) {
		.archetype-meta {
			display: none;
		}

		.archetype-sections {
			grid-template-columns: 1fr;
		}

		.terms-grid {
			grid-template-columns: 1fr;
		}

		.colors-grid {
			grid-template-columns: 1fr;
		}

		.guide-header h2 {
			font-size: 1.8rem;
		}
	}
</style>
