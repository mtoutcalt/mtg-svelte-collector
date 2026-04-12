import { json } from '@sveltejs/kit';
import { getDatabase } from '$lib/database';
import type { RequestHandler } from './$types';

// ── Types ──────────────────────────────────────────────────────────────────

interface CardRow {
	name: string;
	mana_cost: string | null;
	type_line: string;
	oracle_text: string | null;
	colors: string | null;
	quantity: number;
	image_small: string | null;
	image_normal: string | null;
	card_faces: string | null;
}

interface ParsedCard {
	name: string;
	colors: string[];
	cmc: number;
	typeLine: string;
	manaCost: string | null;
	image: string | null;
	isCreature: boolean;
	isInstant: boolean;
	isSorcery: boolean;
	quantity: number;
	hasCounter: boolean;
	hasDestroy: boolean;
	hasExile: boolean;
	hasDraw: boolean;
	hasRamp: boolean;
	hasHaste: boolean;
	hasFlying: boolean;
	hasTrample: boolean;
}

export interface KeyCard {
	name: string;
	role: string;
	image: string | null;
	typeLine: string;
	manaCost: string | null;
	oracleText: string | null;
}

export interface DeckSeed {
	id: string;
	title: string;
	colorLabel: string;       // e.g. "Blue + Green (also called Simic)"
	archetype: string;
	archetypeBlurb: string;   // one plain-English sentence defining the archetype
	gamePlan: string;         // 2-3 sentences: how the deck plays turn by turn
	colors: string[];
	confidence: 'strong' | 'possible' | 'maybe';
	fitCount: number;         // cards that specifically fit the strategy (not just color count)
	totalColorCount: number;  // total cards of these colors (for context)
	keyCards: KeyCard[];
	why: string;
	nextSteps: string[];
	breakdown: { creatures: number; spells: number };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function parseCmc(manaCost: string | null): number {
	if (!manaCost) return 0;
	let cmc = 0;
	const generic = manaCost.match(/\{(\d+)\}/g);
	if (generic) {
		for (const g of generic) cmc += parseInt(g.replace(/[{}]/g, ''));
	}
	const colored = manaCost.match(/\{[WUBRG]\}/g);
	if (colored) cmc += colored.length;
	const hybrid = manaCost.match(/\{[WUBRG]\/[WUBRG]\}/g);
	if (hybrid) cmc += hybrid.length;
	return cmc;
}

function resolveImage(row: CardRow): string | null {
	if (row.image_small) return row.image_small;
	if (row.image_normal) return row.image_normal;
	if (row.card_faces) {
		try {
			const faces = JSON.parse(row.card_faces);
			return faces[0]?.image_uris?.small ?? faces[0]?.image_uris?.normal ?? null;
		} catch { return null; }
	}
	return null;
}

function parseCard(row: CardRow): ParsedCard {
	let colors: string[] = [];
	try { colors = JSON.parse(row.colors || '[]'); } catch { colors = []; }

	const typeLine = row.type_line.toLowerCase();
	const oracle = (row.oracle_text || '').toLowerCase();

	return {
		name: row.name,
		colors,
		cmc: parseCmc(row.mana_cost),
		typeLine: row.type_line,
		manaCost: row.mana_cost,
		image: resolveImage(row),
		isCreature: typeLine.includes('creature'),
		isInstant: typeLine.includes('instant'),
		isSorcery: typeLine.includes('sorcery'),
		quantity: row.quantity,
		hasCounter: oracle.includes('counter target') || oracle.includes('counter that spell'),
		hasDestroy: oracle.includes('destroy'),
		hasExile: oracle.includes('exile'),
		hasDraw: oracle.includes('draw a card') || oracle.includes('draw cards'),
		hasRamp: oracle.includes('add {') || oracle.includes('search your library for a basic land') || oracle.includes('search your library for a land'),
		hasHaste: oracle.includes('haste'),
		hasFlying: oracle.includes('flying'),
		hasTrample: oracle.includes('trample'),
	};
}

function toKeyCard(card: ParsedCard): KeyCard {
	return {
		name: card.name,
		role: cardRole(card),
		image: card.image,
		typeLine: card.typeLine,
		manaCost: card.manaCost,
		oracleText: null, // omit full oracle text from response for size
	};
}

// Assign a plain-English role label to a card based on what it does
function cardRole(card: ParsedCard): string {
	if (card.isCreature) {
		if (card.hasRamp) return 'mana creature';
		if (card.hasDraw) return 'creature that draws cards';
		if (card.hasFlying) return 'flying creature';
		if (card.hasHaste) return 'creature with haste';
		if (card.hasTrample) return 'creature with trample';
		if (card.cmc <= 1) return '1-mana creature';
		if (card.cmc === 2) return '2-mana creature';
		if (card.cmc >= 6) return 'big finisher creature';
		return 'creature';
	}
	if (card.isInstant || card.isSorcery) {
		if (card.hasCounter) return 'counterspell';
		if (card.hasExile) return 'exile spell';
		if (card.hasDestroy) return 'removal spell';
		if (card.hasRamp) return 'ramp spell';
		if (card.hasDraw) return 'card draw spell';
		return card.isInstant ? 'instant spell' : 'sorcery spell';
	}
	return 'spell';
}

const COLOR_NAMES: Record<string, string> = { W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green' };

const PAIR_NAMES: Record<string, string> = {
	'B-G': 'Golgari', 'B-R': 'Rakdos', 'B-U': 'Dimir', 'B-W': 'Orzhov',
	'G-R': 'Gruul', 'G-U': 'Simic', 'G-W': 'Selesnya',
	'R-U': 'Izzet', 'R-W': 'Boros',
	'U-W': 'Azorius',
};

function pairKey(a: string, b: string): string {
	return [a, b].sort().join('-');
}

function colorLabel(colors: string[]): string {
	if (colors.length === 1) return COLOR_NAMES[colors[0]] ?? colors[0];
	const names = colors.map(c => COLOR_NAMES[c] ?? c).join(' + ');
	const pair = PAIR_NAMES[pairKey(colors[0], colors[1])];
	return pair ? `${names} (also called ${pair})` : names;
}

function avgCmc(cards: ParsedCard[]): number {
	if (cards.length === 0) return 0;
	return cards.reduce((sum, c) => sum + c.cmc, 0) / cards.length;
}

function confidence(fitCount: number): 'strong' | 'possible' | 'maybe' {
	if (fitCount >= 10) return 'strong';
	if (fitCount >= 5) return 'possible';
	return 'maybe';
}

const ARCHETYPE_BLURBS: Record<string, string> = {
	Aggro:    'Attack every turn with cheap, fast creatures and win before the opponent can set up their plan.',
	Control:  'Stop everything the opponent tries to do, survive until the late game, then win with one powerful card.',
	Midrange: 'Play efficient creatures and targeted removal — adaptable enough to go fast or slow depending on the matchup.',
	Stompy:   'Use extra mana to deploy enormous creatures much earlier than your opponent expects.',
	Tempo:    'Apply early pressure with cheap creatures, then use cheap disruption to stop the opponent from catching up.',
};

// ── Seed generators ────────────────────────────────────────────────────────

function monoColorSeed(color: string, cards: ParsedCard[]): DeckSeed | null {
	if (cards.length < 3) return null;

	const creatures = cards.filter(c => c.isCreature);
	const spells = cards.filter(c => c.isInstant || c.isSorcery);
	const avg = avgCmc(cards);
	const creaturePct = creatures.length / cards.length;
	const spellPct = spells.length / cards.length;
	const colorName = COLOR_NAMES[color];
	const landName: Record<string, string> = { W: 'Plains', U: 'Islands', B: 'Swamps', R: 'Mountains', G: 'Forests' };

	const hasRemoval = cards.some(c => c.hasDestroy || c.hasExile);
	const hasCounters = cards.some(c => c.hasCounter);
	const hasBigCreatures = creatures.some(c => c.cmc >= 5);

	let archetype: string;
	let title: string;
	let gamePlan: string;
	let why: string;
	let nextSteps: string[];
	let keyCards: KeyCard[];
	let fitCount: number;

	if (spellPct >= 0.35 && (hasCounters || color === 'U')) {
		// Control
		archetype = 'Control';
		title = color === 'U' ? 'Mono-Blue Control' : `Mono-${colorName} Control`;
		fitCount = spells.filter(c => c.hasCounter || c.hasDestroy || c.hasExile || c.hasDraw).length
		         + creatures.filter(c => c.cmc >= 4).length;
		gamePlan = `In the first few turns, do as little as possible — hold your mana open so you can react to what your opponent plays. When they play a creature, destroy it. When they play an important spell, counter it. Once they run out of cards and options, play your own big card and win without opposition.`;
		why = `You have ${spells.length} instants and sorceries in ${colorName.toLowerCase()}${hasCounters ? ', including counterspells' : ''}${hasRemoval ? ' and removal' : ''}. That ratio of spells to creatures is the signature of a control deck — you answer threats instead of racing with creatures.`;
		keyCards = [
			...spells.filter(c => c.hasCounter).slice(0, 2),
			...spells.filter(c => c.hasDestroy || c.hasExile).slice(0, 2),
			...spells.filter(c => c.hasDraw).slice(0, 1),
			...creatures.filter(c => c.cmc >= 4).slice(0, 1),
		].filter((v, i, a) => a.findIndex(x => x.name === v.name) === i)
		 .slice(0, 5)
		 .map(toKeyCard);
		nextSteps = [
			`Add a "board wipe" — a spell that destroys all creatures at once. When your opponent has several creatures and you have none, one of these resets the game. Look for spells that say "destroy all creatures."`,
			`Look for spells that let you draw extra cards. In a control deck, you win by having more options than your opponent — more cards in hand means more answers.`,
			`Add 22-24 ${landName[color] ?? 'basic lands'} so you always have mana available. You want to hold mana open on your opponent's turn, which means you need plenty of it.`,
		];
	} else if (color === 'G' && (hasBigCreatures || avg >= 3.5)) {
		// Green stompy
		archetype = 'Stompy';
		title = 'Green Stompy';
		fitCount = creatures.filter(c => c.cmc >= 4).length + cards.filter(c => c.hasRamp).length;
		gamePlan = `Spend turns 1-3 playing smaller creatures or spells that get you extra mana (called "ramp"). Then on turn 4 or 5, drop a massive creature — one that would normally cost 7 or 8 mana — while your opponent is still playing 3-mana cards. Most decks can't deal with a 7/7 that showed up two turns early.`;
		why = `You have ${creatures.length} green creatures with an average mana cost of ${avg.toFixed(1)}, including ${creatures.filter(c => c.cmc >= 5).length} that cost 5 or more mana. That leans toward the "big green" strategy — your cards just need a way to get onto the battlefield earlier.`;
		keyCards = [
			...creatures.filter(c => c.cmc >= 5).sort((a, b) => b.cmc - a.cmc).slice(0, 3),
			...cards.filter(c => c.hasRamp).slice(0, 2),
		].filter((v, i, a) => a.findIndex(x => x.name === v.name) === i)
		 .slice(0, 5)
		 .map(toKeyCard);
		nextSteps = [
			`Look for "ramp" spells — cards that give you extra mana before your opponents can play their threats. A card that says "add two mana" or "search your library for a land" is a ramp spell.`,
			`Find creatures with trample. Trample means that when your creature is blocked, extra damage carries over to your opponent — a 6/6 blocked by a 1/1 still deals 5 damage. Without it, a single small creature can block your giant forever.`,
			`Add 22-24 Forests. You'll need Green mana every turn, and missing a land drop with big creatures in hand is the worst feeling.`,
		];
	} else if (creaturePct >= 0.5 && avg < 3.0) {
		// Aggro
		const aggro: Record<string, string> = { W: 'White Weenie', R: 'Mono-Red Burn', B: 'Mono-Black Aggro', G: 'Mono-Green Aggro', U: 'Mono-Blue Tempo' };
		archetype = 'Aggro';
		title = aggro[color] || `Mono-${colorName} Aggro`;
		fitCount = creatures.filter(c => c.cmc <= 2).length
		         + (color === 'R' ? cards.filter(c => c.hasDestroy || c.hasExile).length : 0);
		gamePlan = `Play a creature on turn 1, another on turn 2, another on turn 3, and attack every single turn. Your goal is to deal 20 damage before your opponent gets their big cards online — usually by turn 4 or 5. Every card in the deck either attacks, helps others attack, or clears the way for attacks.`;
		why = `You have ${creatures.filter(c => c.cmc <= 2).length} creatures that cost 2 mana or less in ${colorName.toLowerCase()}. That's the foundation of an aggro deck — cheap creatures that hit the board fast and start dealing damage immediately.`;
		keyCards = creatures.sort((a, b) => a.cmc - b.cmc).slice(0, 5).map(toKeyCard);
		nextSteps = [
			`Look for more 1-mana creatures. The more creatures you can play on turn 1, the more pressure you apply. Even a 1/1 creature for 1 mana is useful — it attacks every turn until they deal with it.`,
			color === 'R'
				? `Find burn spells — instants or sorceries that deal damage directly to a creature or your opponent. These are used to clear a creature that's blocking you, or to deal the last few points of damage when your opponent is at low life.`
				: `Find cheap spells that can remove a creature that's blocking you. Your opponent will try to block your creatures to stall — you need a way through.`,
			`Add 20-22 ${landName[color] ?? 'basic lands'}. Aggro decks need fewer lands than most because all your cards are cheap — too many lands means you're drawing cards you can't attack with.`,
		];
	} else {
		// Midrange
		archetype = 'Midrange';
		title = `Mono-${colorName} Midrange`;
		fitCount = creatures.filter(c => c.cmc >= 2 && c.cmc <= 4).length
		         + spells.filter(c => c.hasDestroy || c.hasExile).length;
		gamePlan = `Play efficient creatures — ones that cost 2-4 mana and have useful abilities beyond just attacking. When your opponent plays a dangerous creature, use removal spells to destroy it. When they play something small, your bigger creatures take over. You're not trying to win fast or slow — you adapt.`;
		why = `You have ${creatures.filter(c => c.cmc >= 2 && c.cmc <= 4).length} creatures costing 2-4 mana${hasRemoval ? ` and ${spells.filter(c => c.hasDestroy || c.hasExile).length} removal spells` : ''} in ${colorName.toLowerCase()}. That mix of threats and answers is exactly what a midrange deck is built from.`;
		keyCards = [
			...creatures.filter(c => c.cmc >= 2 && c.cmc <= 4).slice(0, 3),
			...spells.filter(c => c.hasDestroy || c.hasExile).slice(0, 2),
		].filter((v, i, a) => a.findIndex(x => x.name === v.name) === i)
		 .slice(0, 5)
		 .map(toKeyCard);
		nextSteps = [
			`Look for creatures that do something useful when they enter the battlefield — like drawing you a card, putting another creature into play, or gaining life. These are called "enters the battlefield" effects and they give you value even if the creature gets destroyed.`,
			`Find removal spells that can destroy any creature, regardless of size. A spell that says "destroy target creature" is useful in any situation.`,
			`Add 22-24 ${landName[color] ?? 'basic lands'}. You need to consistently cast your 3 and 4 mana spells — missing land drops will slow you down significantly.`,
		];
	}

	if (keyCards.length === 0) {
		keyCards = cards.slice(0, 5).map(toKeyCard);
	}

	return {
		id: `mono-${color.toLowerCase()}`,
		title,
		colorLabel: colorLabel([color]),
		archetype,
		archetypeBlurb: ARCHETYPE_BLURBS[archetype] ?? '',
		gamePlan,
		colors: [color],
		confidence: confidence(fitCount),
		fitCount,
		totalColorCount: cards.length,
		keyCards,
		why,
		nextSteps,
		breakdown: { creatures: creatures.length, spells: spells.length },
	};
}

function twoColorSeed(colorA: string, colorB: string, cardsA: ParsedCard[], cardsB: ParsedCard[]): DeckSeed | null {
	const allCards = [...cardsA, ...cardsB].filter((c, i, arr) => arr.findIndex(x => x.name === c.name) === i);
	const allNames = new Set(allCards.map(c => c.name));

	if (allCards.length < 5) return null;

	const creatures = allCards.filter(c => c.isCreature);
	const spells = allCards.filter(c => c.isInstant || c.isSorcery);
	const avg = avgCmc(allCards);
	const spellPct = spells.length / allCards.length;

	const nameA = COLOR_NAMES[colorA];
	const nameB = COLOR_NAMES[colorB];
	const pair = PAIR_NAMES[pairKey(colorA, colorB)];
	const hasCounters = allCards.some(c => c.hasCounter);
	const hasRemoval = allCards.some(c => c.hasDestroy || c.hasExile);

	let archetype: string;
	let gamePlan: string;
	let why: string;
	let nextSteps: string[];
	let keyCards: KeyCard[];
	let fitCount: number;

	if (spellPct >= 0.4 && (hasCounters || colorA === 'U' || colorB === 'U')) {
		archetype = 'Control';
		fitCount = spells.filter(c => c.hasCounter || c.hasDestroy || c.hasExile || c.hasDraw).length
		         + creatures.filter(c => c.cmc >= 4).length;
		gamePlan = `Hold your mana open each turn so you can react to whatever your opponent does. Counter their threats, destroy their creatures, wipe the board if they overwhelm you. Once they're out of resources, play one of your powerful cards and win without much opposition.`;
		why = `You have ${cardsA.length} ${nameA.toLowerCase()} cards and ${cardsB.length} ${nameB.toLowerCase()} cards, including ${spells.filter(c => c.hasCounter).length} counterspells and ${spells.filter(c => c.hasDestroy || c.hasExile).length} removal spells. Two colors gives you access to more ways to answer threats than any single color alone.`;
		keyCards = [
			...spells.filter(c => c.hasCounter).slice(0, 2),
			...spells.filter(c => c.hasDestroy || c.hasExile).slice(0, 2),
			...creatures.filter(c => c.cmc >= 4).slice(0, 1),
		].filter((v, i, a) => a.findIndex(x => x.name === v.name) === i)
		 .slice(0, 5)
		 .map(toKeyCard);
		nextSteps = [
			`Look for a "board wipe" — a spell that destroys all creatures at once. Examples include "Wrath of God" (White) or "Damnation" (Black). This is your emergency reset button when you fall behind.`,
			`You'll need lands that can produce both ${nameA} and ${nameB} mana. Look for cards with both a ${nameA} and ${nameB} symbol in the top right corner — these are called "dual lands" and keep your mana working smoothly.`,
			`Find card draw spells that let you draw 2 or more cards at once. In a control deck, having more cards than your opponent is how you eventually win.`,
		];
	} else if (avg < 3.0 && creatures.length / allCards.length >= 0.5) {
		archetype = 'Aggro';
		fitCount = creatures.filter(c => c.cmc <= 2).length;
		gamePlan = `Play creatures every turn starting on turn 1 and attack immediately. Both colors give you cheap, aggressive creatures that hit from different angles. Your goal is to have your opponent at low life before they can play their expensive cards — then finish them with whatever you have left.`;
		why = `You have ${creatures.filter(c => c.cmc <= 2).length} creatures costing 2 mana or less across ${nameA} and ${nameB}. Two colors means more cheap creature options — you're less likely to get stuck with no plays in the early turns.`;
		keyCards = creatures.sort((a, b) => a.cmc - b.cmc).slice(0, 5).map(toKeyCard);
		nextSteps = [
			`Look for lands that can produce both ${nameA} and ${nameB} mana. With two colors, your most important job is making sure you can cast your spells on time — lands that make both colors solve this.`,
			`Find the cheapest removal spell you can in either color — something that destroys a creature for 1 or 2 mana. When your opponent plays a creature that would block yours, you want to deal with it immediately.`,
			`Add 20-22 total lands. Aggro decks want fewer lands because everything is cheap, but you still need enough to hit your first few land drops every game.`,
		];
	} else {
		archetype = 'Midrange';
		fitCount = creatures.filter(c => c.cmc >= 2 && c.cmc <= 4).length
		         + spells.filter(c => c.hasDestroy || c.hasExile || c.hasDraw).length;
		gamePlan = `Play efficient creatures — ones worth more than what they cost — backed up by removal spells to deal with your opponent's threats. When they play something dangerous, you have an answer. When they play something small, your bigger creatures dominate. The two colors complement each other, covering each other's weaknesses.`;
		why = `You have ${cardsA.length} ${nameA.toLowerCase()} and ${cardsB.length} ${nameB.toLowerCase()} cards. The interesting part: ${nameA} is strong at ${colorStrengths(colorA)} while ${nameB} is strong at ${colorStrengths(colorB)} — together they cover a lot of ground.`;
		keyCards = [
			...creatures.filter(c => c.cmc >= 2 && c.cmc <= 4).sort((a, b) => a.cmc - b.cmc).slice(0, 3),
			...spells.filter(c => c.hasDestroy || c.hasExile || c.hasDraw).slice(0, 2),
		].filter((v, i, a) => a.findIndex(x => x.name === v.name) === i)
		 .slice(0, 5)
		 .map(toKeyCard);
		nextSteps = [
			`You need lands that can produce both ${nameA} and ${nameB} mana. Look for lands with both color symbols — they're called "dual lands" or "fetch lands". Without them, you'll sometimes have the wrong color mana at the wrong time.`,
			`Look for creatures that do something extra when they enter the battlefield or when they die. In a midrange deck, every card should generate more value than a plain creature would.`,
			`Aim for 22-24 total lands across both colors. Count how many ${nameA} cards you have and how many ${nameB} cards — adjust your land mix to match that ratio.`,
		];
	}

	if (keyCards.length === 0) keyCards = allCards.slice(0, 5).map(toKeyCard);

	return {
		id: `pair-${pairKey(colorA, colorB)}`,
		title: `${pair ?? `${nameA}/${nameB}`} ${archetype}`,
		colorLabel: colorLabel([colorA, colorB].sort()),
		archetype,
		archetypeBlurb: ARCHETYPE_BLURBS[archetype] ?? '',
		gamePlan,
		colors: [colorA, colorB].sort(),
		confidence: confidence(fitCount),
		fitCount,
		totalColorCount: allNames.size,
		keyCards,
		why,
		nextSteps,
		breakdown: { creatures: creatures.length, spells: spells.length },
	};
}

function colorStrengths(color: string): string {
	const s: Record<string, string> = {
		W: 'removal and small creatures',
		U: 'counterspells and card draw',
		B: 'destroying creatures and hand disruption',
		R: 'direct damage and fast creatures',
		G: 'big creatures and extra mana',
	};
	return s[color] ?? 'its unique abilities';
}

// ── Main handler ───────────────────────────────────────────────────────────

export const GET: RequestHandler = async () => {
	try {
		const db = getDatabase();

		const rows = db.prepare(`
			SELECT name, mana_cost, type_line, oracle_text, colors, quantity,
			       image_small, image_normal, card_faces
			FROM cards
			WHERE type_line NOT LIKE '%Land%'
			  AND quantity > 0
		`).all() as CardRow[];

		if (rows.length < 3) {
			return json({ seeds: [], totalCards: rows.length });
		}

		const cards = rows.map(parseCard);

		const buckets: Record<string, ParsedCard[]> = { W: [], U: [], B: [], R: [], G: [] };
		for (const card of cards) {
			for (const color of card.colors) {
				if (buckets[color]) buckets[color].push(card);
			}
		}

		const monoSeeds: DeckSeed[] = [];
		for (const [color, colorCards] of Object.entries(buckets)) {
			const seed = monoColorSeed(color, colorCards);
			if (seed) monoSeeds.push(seed);
		}

		const pairSeeds: DeckSeed[] = [];
		const colorKeys = Object.keys(buckets).filter(c => buckets[c].length >= 4);
		for (let i = 0; i < colorKeys.length; i++) {
			for (let j = i + 1; j < colorKeys.length; j++) {
				const a = colorKeys[i], b = colorKeys[j];
				const seed = twoColorSeed(a, b, buckets[a], buckets[b]);
				if (seed) pairSeeds.push(seed);
			}
		}

		const allSeeds = [
			...monoSeeds.sort((a, b) => b.fitCount - a.fitCount).slice(0, 3),
			...pairSeeds.sort((a, b) => b.fitCount - a.fitCount).slice(0, 3),
		].sort((a, b) => b.fitCount - a.fitCount).slice(0, 6);

		return json({ seeds: allSeeds, totalCards: cards.length });

	} catch (error) {
		console.error('Error generating deck seeds:', error);
		return json({ error: 'Failed to analyze collection' }, { status: 500 });
	}
};
