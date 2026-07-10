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
		{
			category: 'Keywords',
			categoryColor: '#9b59b6',
			title: 'Double Strike',
			body: 'A creature with Double Strike deals combat damage twice — once during the first-strike step and again during the regular step. A 3/3 with Double Strike effectively hits for 6. Paired with Deathtouch or Trample, it becomes especially deadly.',
			scryfallQuery: 'o:"Double strike" t:creature r:uncommon -o:"gains double strike" -o:"gain double strike" -is:digital',
		},
		{
			category: 'Keywords',
			categoryColor: '#9b59b6',
			title: 'Defender',
			body: 'A creature with Defender can\'t attack — it\'s built to hold the line. These are usually walls with high toughness, meant to block early aggression while you set up. Some cards give them ways to deal damage without attacking.',
			scryfallQuery: 'o:"Defender" t:creature r:common -is:digital',
		},
		{
			category: 'Keywords',
			categoryColor: '#9b59b6',
			title: 'Ward',
			body: 'Ward is a softer version of Hexproof. A creature with "Ward {2}" can be targeted, but the opponent must pay an extra cost — here, two mana — or their spell or ability is countered. It taxes removal rather than outright preventing it.',
			scryfallQuery: 'o:"Ward" t:creature r:rare -is:digital',
		},
		{
			category: 'Keywords',
			categoryColor: '#9b59b6',
			title: 'Indestructible',
			body: 'An Indestructible permanent can\'t be destroyed by damage or by "destroy" effects. It still isn\'t invincible: it can be exiled, bounced to hand, sacrificed, or reduced to 0 toughness. Knowing what does and doesn\'t get around it is a key skill.',
			scryfallQuery: 'o:"Indestructible" r:rare -is:digital',
		},
		{
			category: 'Keywords',
			categoryColor: '#9b59b6',
			title: 'Scry',
			body: 'When you Scry, you look at the top card (or cards) of your library and decide whether to keep each on top or put it on the bottom. It smooths your draws — bottom a land when you\'re flooded, or keep a spell you need. Small but powerful consistency.',
			scryfallQuery: 'o:"Scry" r:common -is:digital',
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
		{
			category: 'Strategy',
			categoryColor: '#e91e63',
			title: 'Who\'s the Beatdown?',
			body: 'In any matchup, one player is the aggressor ("the beatdown") and the other is the controller. Figuring out which role you\'re in is one of the most important skills in Magic. If you\'re the slower deck, defend and grind; if you\'re the faster deck, push damage before your opponent stabilizes. Misassigning your role loses games you should win.',
		},
		{
			category: 'Strategy',
			categoryColor: '#e91e63',
			title: 'Play to Your Outs',
			body: 'When you\'re losing, don\'t play for the most likely outcome — play for the line where you can still win, even if it\'s unlikely. If you only win by drawing a specific card or your opponent not having an answer, sequence your plays assuming that\'s the world you live in. Playing "safe" when you\'re behind just loses slower.',
		},
		{
			category: 'Strategy',
			categoryColor: '#e91e63',
			title: 'Sandbagging Lands and Spells',
			body: 'You don\'t have to play everything the moment you can. Holding a second copy of a creature back protects you from a board wipe. Keeping an extra land in hand can disguise what you\'re holding. Dumping your whole hand makes you predictable and vulnerable.',
		},

		// --- Mulligans ---
		{
			category: 'Mulligans',
			categoryColor: '#00bcd4',
			title: 'When to Mulligan',
			body: 'A "keepable" opening hand can cast spells on time and has a realistic plan to affect the game. Hands with 0-1 lands or 6-7 lands are almost always mulligans. So are hands full of expensive cards you can\'t cast for many turns. A free re-draw is better than starting the game already behind.',
		},
		{
			category: 'Mulligans',
			categoryColor: '#00bcd4',
			title: 'The London Mulligan',
			body: 'When you mulligan, you draw a fresh 7 cards, then put a number of cards on the bottom equal to how many times you\'ve mulliganed. So your first mulligan still lets you see 7 and keep 6 — you pick the best 6 and bottom the worst. This makes aggressive mulliganing for a key card much safer than it used to be.',
		},
		{
			category: 'Mulligans',
			categoryColor: '#00bcd4',
			title: 'Keep by Curve, Not Card Count',
			body: 'A hand isn\'t good just because it has lands and spells — it\'s good if you can do something meaningful on the early turns. Three lands and three four-drops is a slow, clunky keep. Two lands with a one-drop, a two-drop, and a card-draw spell is often far stronger.',
		},
		{
			category: 'Mulligans',
			categoryColor: '#00bcd4',
			title: 'Don\'t Keep "Hope" Hands',
			body: 'A hand that only works if you draw exactly the right cards over the next few turns is a trap. "I\'ll keep this two-lander and just draw a third land" feels fine until you don\'t. Be honest about how many draws need to go right — if it\'s more than one or two, ship it.',
		},

		// --- Combat Math ---
		{
			category: 'Combat Math',
			categoryColor: '#f44336',
			title: 'Attacking Into Open Mana',
			body: 'When your opponent has untapped lands, assume they have a trick or removal spell. Before attacking, ask: "If they have the obvious instant, do I still come out ahead?" Sometimes you attack anyway to apply pressure, but you should know the risk rather than walking into it blindly.',
			scryfallQuery: 't:instant (o:"+2/+2" or o:"+3/+3") r:common -is:digital',
		},
		{
			category: 'Combat Math',
			categoryColor: '#f44336',
			title: 'Profitable vs. Unprofitable Blocks',
			body: 'A "profitable" block trades your cheaper creature for their more valuable one, or kills their attacker while yours survives. Blocking a 2/2 with your 4/4 just to prevent 2 damage is usually a bad trade unless that life matters. Always weigh what each creature is worth, not just the damage.',
		},
		{
			category: 'Combat Math',
			categoryColor: '#f44336',
			title: 'Double Blocking',
			body: 'You can block one attacker with multiple creatures. This lets you kill a big threat you couldn\'t handle one-on-one — but the attacker\'s controller chooses how to assign damage and may have a trick to pick off both blockers. Double block when killing the creature is worth the risk of a two-for-one.',
		},
		{
			category: 'Combat Math',
			categoryColor: '#f44336',
			title: 'The Combat Trick Bluff',
			body: 'You don\'t need to actually have a trick to benefit from one. Leaving a single mana open or hesitating before attacks can make a cautious opponent block badly or not at all. Conversely, recognizing when an opponent is bluffing — and calling it — wins games. Combat is as much psychology as math.',
			scryfallQuery: 't:instant o:"target creature gets" r:common -is:digital',
		},
		{
			category: 'Combat Math',
			categoryColor: '#f44336',
			title: 'Count Lethal Before You Act',
			body: 'Every turn, add up the damage you can deal this turn if your opponent doesn\'t block. Knowing your exact "clock" — how many turns until they\'re dead — tells you whether to race, hold back, or take a risk. Many games are lost by players who didn\'t notice they had lethal on the board.',
		},

		// --- Sequencing ---
		{
			category: 'Sequencing',
			categoryColor: '#3f51b5',
			title: 'Lead With the Right Land',
			body: 'If your lands enter tapped or produce different colors, the order you play them matters. Play tapped lands on turns you have nothing to do anyway. Lead with the color you need now and hold flexible lands so you keep your options open for what you might draw.',
		},
		{
			category: 'Sequencing',
			categoryColor: '#3f51b5',
			title: 'Hold Up Interaction',
			body: 'You don\'t always want to spend all your mana on your own turn. Passing with mana open lets you cast instants — removal, counters, or tricks — in response to what your opponent does. Sometimes the strongest play is to do nothing and stay reactive.',
			scryfallQuery: 'o:"counter target spell" t:instant r:common -is:digital',
		},
		{
			category: 'Sequencing',
			categoryColor: '#3f51b5',
			title: 'Play Around the Board Wipe',
			body: 'When you\'re ahead on board, resist the urge to dump every creature. If your opponent could have a "destroy all creatures" spell, commit just enough to keep the pressure on while holding reinforcements. Overextending into a wipe can turn a winning game into a loss in one card.',
			scryfallQuery: 'o:"destroy all creatures" r:rare -is:digital',
		},
		{
			category: 'Sequencing',
			categoryColor: '#3f51b5',
			title: 'Bait the Counterspell',
			body: 'Against a control deck, lead with your second-best threat before your best one. If they counter it, your real haymaker resolves later. If they let it through, you got value. Forcing your opponent to make a bad choice with your sequencing is a core skill.',
		},
		{
			category: 'Sequencing',
			categoryColor: '#3f51b5',
			title: 'Cast Removal at the Best Moment',
			body: 'Instant-speed removal is most efficient when you wait. Kill a creature in response to it being targeted by a pump spell, or after your opponent invests mana equipping it. Killing it on your own turn "just because" often wastes the flexibility you paid for.',
			scryfallQuery: 'o:"destroy target creature" t:instant r:common -is:digital',
		},

		// --- Resource Management ---
		{
			category: 'Resource Management',
			categoryColor: '#009688',
			title: 'The Two-for-One',
			body: 'A "two-for-one" is when one of your cards deals with two of your opponent\'s (or generates two cards of value). Every two-for-one you land puts you a card ahead, and card advantage compounds. Conversely, avoid letting a single removal spell or trick blow you out for two cards.',
		},
		{
			category: 'Resource Management',
			categoryColor: '#009688',
			title: 'Don\'t Over-Commit',
			body: 'Every creature you add to the board is a resource at risk. Against decks with sweepers or strong blockers, deploying threats one at a time forces your opponent to answer each individually. Spending your whole hand to "go fast" only works if you can actually close the game before they recover.',
		},
		{
			category: 'Resource Management',
			categoryColor: '#009688',
			title: 'Life Is a Resource',
			body: 'Your 20 life isn\'t something to protect at all costs — it\'s a resource you can spend. Taking a few points of damage to keep a creature back for a better block, or to play a painful land untapped, is often correct. Only the last point of life actually matters.',
		},
		{
			category: 'Resource Management',
			categoryColor: '#009688',
			title: 'Save Removal for the Right Target',
			body: 'It\'s tempting to kill the first creature your opponent plays, but premium removal is precious. Holding it for their most dangerous threat — the bomb, the equipped creature, the engine — usually wins more games than trading it for a small early creature you could have blocked.',
		},

		// --- Sideboarding ---
		{
			category: 'Sideboarding',
			categoryColor: '#607d8b',
			title: 'What a Sideboard Is',
			body: 'In best-of-three matches, you have a 15-card sideboard. After game one, you may swap cards between your main deck and sideboard to tune for the specific opponent. This lets you bring in answers to their strategy and cut cards that are weak in the matchup.',
		},
		{
			category: 'Sideboarding',
			categoryColor: '#607d8b',
			title: 'Cut Your Worst Cards First',
			body: 'Good sideboarding starts with knowing which of your cards are weakest against this opponent — not just which sideboard cards look exciting. Removal with no good targets, or slow cards against an aggressive deck, are the first to go. Take out dead weight, then add answers.',
		},
		{
			category: 'Sideboarding',
			categoryColor: '#607d8b',
			title: 'Don\'t Over-Sideboard',
			body: 'Swapping in 8 cards can wreck the consistency and mana curve that made your deck work. Most of the time, changing 2-5 cards is plenty. A few targeted answers usually beat a wholesale rebuild that leaves you with a clunky, untested 60.',
		},

		// --- Advanced Play ---
		{
			category: 'Advanced Play',
			categoryColor: '#7e57c2',
			title: 'Inevitability',
			body: 'Inevitability is the answer to "who wins if the game goes forever?" The deck with card-draw engines, recursion, or a game-ending bomb usually has it. Recognizing who holds inevitability tells you your role: if you have it, trade resources and stall; if your opponent does, you must end the game before their edge takes over.',
		},
		{
			category: 'Advanced Play',
			categoryColor: '#7e57c2',
			title: 'Must-Answer Threats',
			body: 'Learn to sort your opponent\'s cards into "must answer now," "answer eventually," and "can ignore." A ticking planeswalker or a lifelinking bomb demands a response; a lone 2/2 usually does not. Spending premium removal on something you could have simply blocked — while a real threat looms in their hand — is a self-inflicted loss.',
		},
		{
			category: 'Advanced Play',
			categoryColor: '#7e57c2',
			title: 'Virtual Card Advantage',
			body: 'Card advantage is not only about drawing extra cards — it is about how much each card does. A sweeper that kills four creatures is a four-for-one. Making an opponent\'s removal spell useless is "virtual" card advantage: you did not draw a card, but theirs became a blank. Winning this quiet exchange wins games.',
		},
		{
			category: 'Advanced Play',
			categoryColor: '#7e57c2',
			title: 'Sculpt Your Draws',
			body: 'Card selection — Scry, surveil, "draw two, discard one" — quietly ranks among the strongest effects in Magic. It does not grow your hand, but it turns dead draws into live ones. Use it to dig toward your plan: bottom excess lands when flooded, or find the exact answer you need under pressure.',
			scryfallQuery: 'o:"Surveil" r:common -is:digital',
		},
		{
			category: 'Advanced Play',
			categoryColor: '#7e57c2',
			title: 'Strand Their Answers',
			body: 'Great players force opponents to hold cards that do nothing. Play around the sweeper so it rots in their hand; present no targets so their removal sits dead; bait the counter with a lesser threat. Every card you strand is a card they are not casting — the same as being up a card without ever drawing one.',
		},
		{
			category: 'Advanced Play',
			categoryColor: '#7e57c2',
			title: 'Proactive vs. Reactive',
			body: 'Every turn you choose a stance: spend your mana developing your own plan (proactive), or hold it open to answer theirs (reactive). Aggressive decks want to force the issue; control decks want to answer everything. Picking the wrong stance for your role — durdling when you should attack, or tapping out when you should hold up — quietly loses games.',
		},
		{
			category: 'Advanced Play',
			categoryColor: '#7e57c2',
			title: 'Sequence to Fight Their Interaction',
			body: 'The order you cast spells often matters more than which spells you hold. Bait a counter with your second-best threat, force removal onto a creature you can rebuild from, and save your haymaker for when they are tapped out. Thinking one exchange ahead — "what do they do, and what do I do back?" — separates good players from great ones.',
		},

		// --- Reading the Game ---
		{
			category: 'Reading the Game',
			categoryColor: '#26c6da',
			title: 'Read the Full Board State',
			body: 'Before every meaningful decision, pause and honestly assess three things: who is ahead on board, who is ahead on cards, and who is ahead on life — plus who wins if nothing changes. That read tells you whether to press, stabilize, or gamble. Most misplays come from acting on autopilot instead of reading the actual state of the game.',
		},
		{
			category: 'Reading the Game',
			categoryColor: '#26c6da',
			title: 'Count Their Mana',
			body: 'Always track how much untapped mana your opponent has and what it could represent. Two blue up against control screams counterspell; an untapped Swamp might be removal. Play around what they can actually afford — without freezing over cards they may not even have. Respecting their mana without fearing it is a core skill.',
		},
		{
			category: 'Reading the Game',
			categoryColor: '#26c6da',
			title: 'Deduce Their Hand',
			body: 'You have more information than you think. What they mulliganed, which lands they have played, what they choose to hold, and how they attack all leak clues. A player who passes with mana up and declines an obvious block is usually holding interaction. Read the story their plays are telling you.',
		},
		{
			category: 'Reading the Game',
			categoryColor: '#26c6da',
			title: 'Give Away Nothing',
			body: 'Your rhythm leaks information. Snap-attacking, long tanks before blocking, or hovering over a land all tell a watchful opponent what you are thinking. Play at an even pace and keep your options genuinely open, so opponents cannot read your hand from your tempo the way you are reading theirs.',
		},
		{
			category: 'Reading the Game',
			categoryColor: '#26c6da',
			title: 'Bait and Punish',
			body: 'Offer your opponent a play that looks great, then punish it. Attack into a "free" block that your combat trick blows out. Leave a planeswalker seemingly exposed to lure their creature into your waiting removal. Setting traps — and recognizing when one has been set for you — is where high-level Magic lives.',
		},
		{
			category: 'Reading the Game',
			categoryColor: '#26c6da',
			title: 'Play the Percentages',
			body: 'When you cannot know for sure, play to what is most likely — but weight it by what you can afford to lose. If their possible instant would cost you the game and playing around it costs almost nothing, play safe. If caution throws away a near-certain win, take the small risk. Weigh probability against consequence, not fear.',
		},

		// --- Formats ---
		{
			category: 'Formats',
			categoryColor: '#8d6e63',
			title: 'Standard: The Rotating Format',
			body: 'Standard uses cards from roughly the last few years of sets. Older sets "rotate out" each year, keeping the card pool fresh and usually more affordable. It\'s a great entry point for competitive play because you don\'t need cards from a decade ago.',
		},
		{
			category: 'Formats',
			categoryColor: '#8d6e63',
			title: 'Commander (EDH)',
			body: 'Commander is the most-played casual format. You build a 100-card singleton deck led by a legendary creature — your "commander" — and start at 40 life. Games are multiplayer, political, and full of huge swingy plays. Only one copy of each card is allowed besides basic lands.',
		},
		{
			category: 'Formats',
			categoryColor: '#8d6e63',
			title: 'Limited: Draft & Sealed',
			body: 'In Limited you build a deck on the spot from sealed packs. In Draft, players open packs and pass cards one at a time; in Sealed, you build from six packs. Everyone starts from a random pool, so Limited tests raw skill — your collection budget doesn\'t matter.',
		},
		{
			category: 'Formats',
			categoryColor: '#8d6e63',
			title: 'Modern & Eternal Formats',
			body: 'Modern, Legacy, and Vintage are non-rotating formats where cards stay legal for years. The card pools are enormous and powerful, enabling decks impossible in Standard. They reward deep knowledge but can be pricey, since the best cards never rotate out of demand.',
		},
		{
			category: 'Formats',
			categoryColor: '#8d6e63',
			title: 'Why Singleton Changes Everything',
			body: 'Singleton formats like Commander allow only one copy of each card besides basic lands. That kills consistency — you can\'t lean on drawing four copies of your best card — so decks must be flexible and games play out very differently every time.',
		},

		// --- Collecting ---
		{
			category: 'Collecting',
			categoryColor: '#ffb300',
			title: 'Reading Rarity',
			body: 'Cards come in four rarities, shown by the color of the set symbol: black (common), silver (uncommon), gold (rare), and orange (mythic rare). Rarity reflects how often a card appears in packs — not how good it is. Plenty of commons are staples, and some mythics see little play.',
			scryfallQuery: 'r:mythic -is:digital',
		},
		{
			category: 'Collecting',
			categoryColor: '#ffb300',
			title: 'What Makes a Foil',
			body: 'Foil cards have a shiny, reflective finish and are pulled far less often than normal versions. They\'re purely cosmetic — a foil plays identically to a non-foil. Older foils can curl or "pringle" over time, so collectors often store them sleeved in top-loaders.',
			scryfallQuery: 'is:foil r:mythic -is:digital',
		},
		{
			category: 'Collecting',
			categoryColor: '#ffb300',
			title: 'Set Symbols Tell a Story',
			body: 'Every card carries a small set symbol showing which set it came from. Since a card can be reprinted many times, collectors use the symbol to identify the exact printing — and its color doubles as a quick read on the card\'s rarity.',
		},
		{
			category: 'Collecting',
			categoryColor: '#ffb300',
			title: 'Condition Is Everything',
			body: 'A card\'s condition drives its value. Grades run from Near Mint (NM) down through Lightly Played, Moderately Played, and Heavily Played, to Damaged. Sleeving cards and avoiding bent corners or scratches keeps them in top shape — especially valuable or foil ones.',
		},
		{
			category: 'Collecting',
			categoryColor: '#ffb300',
			title: 'Reprints & the Reserved List',
			body: 'Most cards get reprinted over time, which lowers prices by increasing supply. But a set of older cards on the "Reserved List" can never be reprinted — a promise from Wizards that keeps those cards rare and, in many cases, very expensive.',
		},
	];

	let currentIndex = 0;
	let exampleCard: any = null;
	let cardLoading = false;
	let imageError = false;

	$: tip = tips[currentIndex];

	function getTodaysIndex(): number {
		const today = new Date();
		// Produce a stable number for today: e.g. 20260412
		const seed =
			today.getFullYear() * 10000 +
			(today.getMonth() + 1) * 100 +
			today.getDate();
		return seed % tips.length;
	}

	async function loadExampleCard(t: Tip) {
		exampleCard = null;
		imageError = false;
		if (!t.scryfallQuery) return;

		cardLoading = true;
		try {
			const res = await fetch(
				`https://api.scryfall.com/cards/random?q=${encodeURIComponent(t.scryfallQuery)}`
			);
			if (res.ok) {
				exampleCard = await res.json();
			}
		} catch (_) {
			// silently fail — card example is optional
		}
		cardLoading = false;
	}

	function showTip(index: number) {
		currentIndex = ((index % tips.length) + tips.length) % tips.length;
		loadExampleCard(tips[currentIndex]);
	}

	function nextTip() {
		showTip(currentIndex + 1);
	}

	function prevTip() {
		showTip(currentIndex - 1);
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

	onMount(() => {
		showTip(getTodaysIndex());
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

	<div class="lesson-nav">
		<button class="nav-btn" on:click={prevTip} title="Previous tip">‹ Prev</button>
		<button class="today-btn" on:click={() => showTip(getTodaysIndex())} title="Back to today's tip">
			Today
		</button>
		<span class="nav-counter">{currentIndex + 1} / {tips.length}</span>
		<button class="nav-btn" on:click={nextTip} title="Next tip">Next ›</button>
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

	.lesson-nav {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-top: 1.75rem;
		padding-top: 1.25rem;
		border-top: 1px solid rgba(201, 176, 55, 0.2);
	}

	.nav-btn,
	.today-btn {
		font-family: 'Cinzel', serif;
		font-size: 0.85rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		color: #f4e58c;
		background: rgba(201, 176, 55, 0.1);
		border: 1px solid rgba(201, 176, 55, 0.35);
		padding: 0.45rem 1rem;
		border-radius: 8px;
		cursor: pointer;
		transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
	}

	.nav-btn:hover,
	.today-btn:hover {
		background: rgba(201, 176, 55, 0.22);
		transform: translateY(-2px);
		box-shadow: 0 4px 14px rgba(201, 176, 55, 0.2);
	}

	.nav-btn:active,
	.today-btn:active {
		transform: translateY(0);
	}

	.today-btn {
		color: rgba(232, 233, 237, 0.7);
		background: rgba(255, 255, 255, 0.04);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.today-btn:hover {
		background: rgba(255, 255, 255, 0.09);
		box-shadow: none;
	}

	.nav-counter {
		font-family: 'Crimson Text', serif;
		font-size: 0.9rem;
		color: rgba(232, 233, 237, 0.55);
		min-width: 3.5rem;
		text-align: center;
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
