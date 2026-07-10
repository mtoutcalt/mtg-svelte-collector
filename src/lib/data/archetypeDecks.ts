// Curated example decks used by the "Learn" section to teach the major Magic
// archetypes. Each deck is stored as a plain decklist string (resolved to real
// cards on demand via /api/decks/import) plus a teaching layer: a one-line win
// condition, a short "why it works", a turn-by-turn game plan, and annotations
// on a handful of key cards explaining the role each one plays.
//
// Decks are intentionally illustrative rather than tournament-perfect — they're
// tuned to make each archetype's structure easy to read for a new player.

export type DeckTier = 'budget' | 'classic';

export interface KeyCard {
	name: string;
	note: string;
}

export interface ArchetypeDeck {
	id: string;
	name: string;
	archetype: string;
	archetypeColor: string;
	colors: string;
	tier: DeckTier;
	format: string;
	oneLiner: string;
	whyItWorks: string;
	gamePlan: string[];
	keyCards: KeyCard[];
	decklist: string;
	// Set on decks assembled from cards the user already owns, so the UI can
	// flag them and explain the collection connection.
	fromCollection?: boolean;
	collectionNote?: string;
}

export const archetypeDecks: ArchetypeDeck[] = [
	{
		id: 'mono-red-aggro',
		name: 'Mono-Red Aggro',
		archetype: 'Aggro',
		archetypeColor: '#e53935',
		colors: 'Mono-Red',
		tier: 'budget',
		format: 'Modern',
		oneLiner: 'Flood the board with cheap creatures and finish with burn before the opponent stabilizes.',
		whyItWorks:
			'Every card does one thing well: deal damage fast. Cheap one-drops apply pressure immediately, and the burn spells double as removal for blockers or reach to close out the game. Because the whole deck curves out by turn three, it punishes any opponent who stumbles.',
		gamePlan: [
			'Turns 1-2: Land a one-drop every turn and start attacking immediately.',
			'Turns 3-4: Keep the pressure on; use burn to clear blockers, not to trade.',
			'Turns 4-5: Point the remaining burn at their face to finish before they take over.'
		],
		keyCards: [
			{
				name: 'Monastery Swiftspear',
				note: 'A one-drop that hits harder every time you cast a spell (Prowess). Your fastest clock.'
			},
			{
				name: 'Lightning Bolt',
				note: 'The gold standard of burn — 3 damage for 1 mana, aimed at their face or a blocker.'
			},
			{
				name: 'Goblin Guide',
				note: 'A 2/2 with haste for one mana. Pure speed — the small downside rarely matters when you are the beatdown.'
			},
			{
				name: 'Eidolon of the Great Revel',
				note: 'Punishes the whole table for casting cheap spells — including you, so race carefully.'
			}
		],
		decklist: `4 Monastery Swiftspear
4 Soul-Scar Mage
4 Goblin Guide
4 Eidolon of the Great Revel
4 Lightning Bolt
4 Lava Spike
4 Rift Bolt
4 Skewer the Critics
4 Searing Blaze
4 Fireblast
20 Mountain`
	},
	{
		id: 'golgari-midrange',
		name: 'Golgari Midrange',
		archetype: 'Midrange',
		archetypeColor: '#fb8c00',
		colors: 'Golgari (BG)',
		tier: 'classic',
		format: 'Modern',
		oneLiner: 'Trade one-for-one with efficient removal and disruption, then win with resilient, value-packed threats.',
		whyItWorks:
			'Midrange wins the long grind. Cheap removal and hand disruption strip the opponent of their best cards, while every creature you play is individually efficient and hard to answer cleanly. When the dust settles, you simply have better cards left than they do.',
		gamePlan: [
			'Turns 1-2: Use discard and cheap removal to break up the opponent\'s plan.',
			'Turns 3-5: Deploy efficient threats that demand answers you\'ve already stripped away.',
			'Late game: Grind them out with card advantage — you win when both players are topdecking.'
		],
		keyCards: [
			{
				name: 'Tarmogoyf',
				note: 'A tiny investment that grows into one of the biggest creatures on the board as the game goes on.'
			},
			{
				name: 'Liliana of the Veil',
				note: 'Grinds both players\' hands and resources — exactly the attrition midrange wants.'
			},
			{
				name: 'Fatal Push',
				note: 'One mana to kill almost anything early. Efficient removal is the backbone of midrange.'
			},
			{
				name: 'Grave Titan',
				note: 'Your top-end payoff — a game-ending body that leaves value behind even if it\'s removed.'
			}
		],
		decklist: `4 Llanowar Elves
4 Scavenging Ooze
4 Tarmogoyf
2 Courser of Kruphix
2 Grave Titan
4 Fatal Push
4 Abrupt Decay
2 Maelstrom Pulse
2 Assassin's Trophy
3 Inquisition of Kozilek
2 Thoughtseize
3 Liliana of the Veil
4 Overgrown Tomb
4 Blooming Marsh
2 Twilight Mire
7 Forest
7 Swamp`
	},
	{
		id: 'azorius-control',
		name: 'Azorius Control',
		archetype: 'Control',
		archetypeColor: '#1e88e5',
		colors: 'Azorius (WU)',
		tier: 'classic',
		format: 'Modern',
		oneLiner: 'Answer every threat, pull ahead on cards, and win the long game with a couple of powerful finishers.',
		whyItWorks:
			'Control trades removal and counterspells for the opponent\'s threats until they run out of gas. Board wipes reset aggressive starts, card draw refuels, and a small number of hard-to-kill finishers close the game once you\'re firmly in control. Patience is the whole strategy.',
		gamePlan: [
			'Early game: Survive. Use cheap removal and sweepers to neutralize their aggression.',
			'Mid game: Trade counters and card draw to pull ahead on resources.',
			'Late game: Land a planeswalker finisher and protect it — the game is now yours to lose.'
		],
		keyCards: [
			{
				name: 'Supreme Verdict',
				note: 'The reset button. Wipe the board, then win at your leisure with card advantage.'
			},
			{
				name: 'Counterspell',
				note: 'Answer anything for two mana. Holding it up is why control leaves mana open.'
			},
			{
				name: 'Teferi, Hero of Dominaria',
				note: 'Draws cards, resets threats, and eventually wins on its own — the classic control finisher.'
			},
			{
				name: 'Jace, the Mind Sculptor',
				note: 'Filters your draws and buries the opponent in card advantage over time.'
			}
		],
		decklist: `4 Counterspell
3 Cryptic Command
2 Mana Leak
2 Absorb
4 Path to Exile
4 Supreme Verdict
2 Detention Sphere
4 Opt
3 Fact or Fiction
2 Dig Through Time
2 Jace, the Mind Sculptor
3 Teferi, Hero of Dominaria
4 Hallowed Fountain
4 Glacial Fortress
3 Celestial Colonnade
7 Island
7 Plains`
	},
	{
		id: 'mono-green-ramp',
		name: 'Mono-Green Ramp',
		archetype: 'Ramp',
		archetypeColor: '#43a047',
		colors: 'Mono-Green',
		tier: 'budget',
		format: 'Modern',
		oneLiner: 'Accelerate your mana with dorks and spells, then cast game-ending threats far ahead of schedule.',
		whyItWorks:
			'Ramp cheats on time. Mana creatures and ramp spells let you play threats two or three turns early, so your giant creatures hit the board before the opponent is ready to deal with them. The payoffs are big enough that resolving even one usually ends the game.',
		gamePlan: [
			'Turn 1-2: Play a mana dork or ramp spell — accelerate before you do anything else.',
			'Turns 3-4: Use your extra mana to deploy a threat the opponent can\'t match yet.',
			'Turns 5+: Untap with overwhelming mana and land a finisher that closes the game.'
		],
		keyCards: [
			{
				name: 'Llanowar Elves',
				note: 'Turn-one mana acceleration — the whole plan is to cast your big threats ahead of schedule.'
			},
			{
				name: 'Primeval Titan',
				note: 'Pays off your ramp by fetching lands and threatening to end the game fast.'
			},
			{
				name: 'Craterhoof Behemoth',
				note: 'The finisher: dump your mana into it and swing for lethal out of nowhere.'
			},
			{
				name: 'Cultivate',
				note: 'Ramps AND fixes your mana while replacing itself — smooth, low-risk acceleration.'
			}
		],
		decklist: `4 Llanowar Elves
4 Elvish Mystic
3 Sakura-Tribe Elder
4 Rampant Growth
3 Cultivate
3 Elvish Visionary
4 Steel Leaf Champion
3 Primeval Titan
2 Craterhoof Behemoth
2 Ghalta, Primal Hunger
2 Beast Within
2 Nissa, Who Shakes the World
24 Forest`
	},
	{
		id: 'splinter-twin-combo',
		name: 'Splinter Twin Combo',
		archetype: 'Combo',
		archetypeColor: '#8e24aa',
		colors: 'Izzet (UR)',
		tier: 'classic',
		format: 'Modern',
		oneLiner: 'Assemble a two-card combo for infinite hasty attackers — while holding up counters and burn to protect it.',
		whyItWorks:
			'Combo decks win the game with a specific interaction rather than combat. Here, Splinter Twin plus an untapping creature makes infinite hasty copies for a one-shot kill. The rest of the deck digs for the pieces and defends them, so you can win "out of nowhere" the moment the coast is clear.',
		gamePlan: [
			'Early game: Cantrip to dig toward your combo pieces and set up your mana.',
			'Mid game: Use burn and counters as removal AND protection while you find the combo.',
			'The kill: With mana up to protect it, combo off at instant speed on the opponent\'s end step.'
		],
		keyCards: [
			{
				name: 'Splinter Twin',
				note: 'Enchant an untapper and make infinite hasty copies to win on the spot.'
			},
			{
				name: 'Deceiver Exarch',
				note: 'Untaps a land or freezes a blocker on its own — and "goes infinite" with Splinter Twin.'
			},
			{
				name: 'Serum Visions',
				note: 'Digs toward your combo pieces and smooths draws — the glue of any spell-based deck.'
			},
			{
				name: 'Snapcaster Mage',
				note: 'Recasts a spell from your graveyard — flexible value and a backup combo enabler.'
			}
		],
		decklist: `4 Splinter Twin
4 Deceiver Exarch
4 Pestermite
4 Serum Visions
4 Sleight of Hand
3 Remand
3 Cryptic Command
2 Dispel
4 Lightning Bolt
3 Electrolyze
3 Snapcaster Mage
2 Vendilion Clique
4 Steam Vents
4 Scalding Tarn
2 Sulfur Falls
5 Island
5 Mountain`
	},
	{
		id: 'dimir-tempo',
		name: 'Dimir Tempo',
		archetype: 'Tempo',
		archetypeColor: '#00acc1',
		colors: 'Dimir (UB)',
		tier: 'classic',
		format: 'Modern',
		oneLiner: 'Land one efficient threat, then protect it with cheap disruption while it races the opponent down.',
		whyItWorks:
			'Tempo sits between aggro and control: you deploy a cheap threat early, then spend the rest of the game protecting it and disrupting the opponent so it gets there. Cheap interaction trades up on mana, delve threats give you a huge body for almost nothing, and every cantrip digs toward the piece you need. You win by being both faster and more disruptive.',
		gamePlan: [
			'Turns 1-2: Deploy a cheap threat like Delver and strip their best answer with discard.',
			'Turns 2-4: Protect your clock with cheap counters and removal while chipping in damage.',
			'Late game: Delve out a giant Gurmag Angler to close before they can stabilize.'
		],
		keyCards: [
			{
				name: 'Delver of Secrets',
				note: 'A one-mana investment that flips into a 3/2 flyer — the cheap, fast clock the whole deck protects.'
			},
			{
				name: 'Gurmag Angler',
				note: 'Delve exiles cards from your graveyard to cast this 5/5 for as little as one mana — a huge threat that costs almost no tempo.'
			},
			{
				name: 'Drown in the Loch',
				note: 'Counter a spell OR kill a creature, scaling with their graveyard — the flexible interaction tempo lives on.'
			},
			{
				name: 'Thought Scour',
				note: 'Draws a card and fills your graveyard to power out Gurmag Angler — cheap fuel that keeps the gas flowing.'
			}
		],
		decklist: `4 Delver of Secrets
4 Gurmag Angler
3 Baleful Strix
2 Tasigur, the Golden Fang
4 Fatal Push
3 Drown in the Loch
2 Counterspell
2 Dispel
4 Thoughtseize
2 Inquisition of Kozilek
4 Thought Scour
4 Opt
3 Serum Visions
4 Polluted Delta
4 Watery Grave
2 Darkslick Shores
5 Island
4 Swamp`
	},
	{
		id: 'mono-white-angels',
		name: 'Mono-White Angels',
		archetype: 'Tribal',
		archetypeColor: '#e8b64c',
		colors: 'Mono-White',
		tier: 'budget',
		format: 'Casual',
		fromCollection: true,
		collectionNote:
			'Built around the Angels you already own — you have playsets of Giada, Inspiring Overseer, Youthful Valkyrie and Starfield Shepherd, so you\'re most of the way to a real deck already.',
		oneLiner: 'Curve out with evasive Angels, pump the team with Angel lords, and fly over the top for the win.',
		whyItWorks:
			'This is a tribal aggro-midrange deck built around Angels from your collection. Cheap angels apply early pressure, payoffs like Giada and Lyra make every angel bigger, and flying plus lifelink lets you race almost anything. Because so many cards share the Angel theme, your good draws snowball fast — one lord can turn a board of small flyers into a lethal army.',
		gamePlan: [
			'Turns 1-2: Land Giada, Font of Hope to start building your board and ramping your mana.',
			'Turns 3-4: Deploy value angels like Inspiring Overseer and grow the team with Youthful Valkyrie.',
			'Turns 5+: Drop Lyra Dawnbringer to anthem the team and close the game in the air.'
		],
		keyCards: [
			{
				name: 'Giada, Font of Hope',
				note: 'A one-drop that ramps you AND makes every angel that follows bigger — the engine of the deck.'
			},
			{
				name: 'Inspiring Overseer',
				note: 'A flying body that draws a card and gains life when it lands — pure value that keeps your hand full.'
			},
			{
				name: 'Youthful Valkyrie',
				note: 'Grows permanently every time another Angel enters — your reward for going all-in on the tribe.'
			},
			{
				name: 'Lyra Dawnbringer',
				note: 'An Angel lord: anthems your whole team and hands them lifelink, flipping any race in your favor.'
			}
		],
		decklist: `4 Giada, Font of Hope
4 Youthful Valkyrie
4 Inspiring Overseer
4 Starfield Shepherd
4 Exemplar of Light
2 Lyra Dawnbringer
2 Lightstall Inquisitor
1 Shalai, Voice of Plenty
1 Angel of the Ruins
1 Thraben Watcher
3 Banishing Light
2 Sheltered by Ghosts
2 Felidar Retreat
1 Swords to Plowshares
1 Dispatch
4 Secluded Courtyard
20 Plains`
	}
];
