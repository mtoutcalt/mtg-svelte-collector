import Database from 'better-sqlite3';
import { dev } from '$app/environment';
import { existsSync, mkdirSync } from 'fs';
import type { ScryfallCard } from './utils';

const DB_PATH = dev ? './data/collection.db' : './data/collection.db';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
	if (!db) {
		try {
			// Ensure the data directory exists
			if (!existsSync('./data')) {
				mkdirSync('./data', { recursive: true });
			}
			
			db = new Database(DB_PATH);
			initializeDatabase(db);
		} catch (error) {
			console.error('Failed to initialize database:', error);
			throw new Error('Database initialization failed');
		}
	}
	return db;
}

function initializeDatabase(database: Database.Database): void {
	// Create cards table if it doesn't exist
	const createCardsTable = `
		CREATE TABLE IF NOT EXISTS cards (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			mana_cost TEXT,
			type_line TEXT NOT NULL,
			oracle_text TEXT,
			image_normal TEXT,
			image_small TEXT,
			image_large TEXT,
			price_usd TEXT,
			price_usd_foil TEXT,
			price_eur TEXT,
			price_tix TEXT,
			quantity INTEGER DEFAULT 1,
			fuzzy_match INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`;

	// Create decks table
	const createDecksTable = `
		CREATE TABLE IF NOT EXISTS decks (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			description TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`;

	// Create deck_cards junction table
	const createDeckCardsTable = `
		CREATE TABLE IF NOT EXISTS deck_cards (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			deck_id TEXT NOT NULL,
			card_id TEXT NOT NULL,
			quantity INTEGER DEFAULT 1,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
			FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
			UNIQUE(deck_id, card_id)
		)
	`;

	// Create indexes for better performance
	const createIndexes = [
		`CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name)`,
		`CREATE INDEX IF NOT EXISTS idx_cards_type_line ON cards(type_line)`,
		`CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at)`,
		`CREATE INDEX IF NOT EXISTS idx_cards_quantity ON cards(quantity)`,
		`CREATE INDEX IF NOT EXISTS idx_decks_name ON decks(name)`,
		`CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_id ON deck_cards(deck_id)`,
		`CREATE INDEX IF NOT EXISTS idx_deck_cards_card_id ON deck_cards(card_id)`
	];

	try {
		database.exec(createCardsTable);
		database.exec(createDecksTable);
		database.exec(createDeckCardsTable);
		
		// Check if quantity column exists, if not add it for existing databases
		const columnInfo = database.prepare("PRAGMA table_info(cards)").all() as Array<{name: string}>;
		const hasQuantityColumn = columnInfo.some(col => col.name === 'quantity');
		
		if (!hasQuantityColumn) {
			database.exec('ALTER TABLE cards ADD COLUMN quantity INTEGER DEFAULT 1');
			database.exec('UPDATE cards SET quantity = 1 WHERE quantity IS NULL');
		}

		// Check if price tracking columns exist, if not add them for historical price analysis
		const hasPriceTracking = columnInfo.some(col => col.name === 'price_usd_6mo_ago');
		
		if (!hasPriceTracking) {
			database.exec('ALTER TABLE cards ADD COLUMN price_usd_6mo_ago TEXT');
			database.exec('ALTER TABLE cards ADD COLUMN price_usd_12mo_ago TEXT');
			database.exec('ALTER TABLE cards ADD COLUMN price_last_updated DATETIME');
		}

		// Check if color columns exist, if not add them for color-based sorting
		const hasColorColumns = columnInfo.some(col => col.name === 'colors');

		if (!hasColorColumns) {
			database.exec('ALTER TABLE cards ADD COLUMN colors TEXT');
			database.exec('ALTER TABLE cards ADD COLUMN color_identity TEXT');
		}

		// Check if card_faces column exists, if not add it for double-faced cards support
		const hasCardFacesColumn = columnInfo.some(col => col.name === 'card_faces');

		if (!hasCardFacesColumn) {
			database.exec('ALTER TABLE cards ADD COLUMN card_faces TEXT');
		}

		// Check if is_favorite column exists, if not add it for favorites feature
		const hasFavoriteColumn = columnInfo.some(col => col.name === 'is_favorite');

		if (!hasFavoriteColumn) {
			database.exec('ALTER TABLE cards ADD COLUMN is_favorite INTEGER DEFAULT 0');
			database.exec('CREATE INDEX IF NOT EXISTS idx_cards_is_favorite ON cards(is_favorite)');
		}

		// Check if format column exists in decks table, if not add it for deck format tracking
		const decksColumnInfo = database.prepare("PRAGMA table_info(decks)").all() as Array<{name: string}>;
		const hasFormatColumn = decksColumnInfo.some(col => col.name === 'format');

		if (!hasFormatColumn) {
			database.exec('ALTER TABLE decks ADD COLUMN format TEXT');
		}

		// Check if is_sideboard column exists in deck_cards table
		const deckCardsColumnInfo = database.prepare("PRAGMA table_info(deck_cards)").all() as Array<{name: string}>;
		const hasSideboardColumn = deckCardsColumnInfo.some(col => col.name === 'is_sideboard');

		if (!hasSideboardColumn) {
			database.exec('ALTER TABLE deck_cards ADD COLUMN is_sideboard INTEGER DEFAULT 0');
		}

		createIndexes.forEach(indexQuery => database.exec(indexQuery));
		
		// Create triggers to automatically update the updated_at timestamp
		const updateTrigger = `
			CREATE TRIGGER IF NOT EXISTS update_cards_updated_at 
			AFTER UPDATE ON cards
			BEGIN
				UPDATE cards SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
			END
		`;
		database.exec(updateTrigger);
		
		console.log('Database initialized successfully');
	} catch (error) {
		console.error('Database initialization error:', error);
		throw error;
	}
}

export function closeDatabase(): void {
	if (db) {
		try {
			db.close();
			db = null;
		} catch (error) {
			console.error('Error closing database:', error);
		}
	}
}

// Database operations
export interface DeckRow {
	id: string;
	name: string;
	description: string | null;
	format: string | null;
	created_at: string;
	updated_at: string;
}

export interface DeckCardRow {
	id: number;
	deck_id: string;
	card_id: string;
	quantity: number;
	is_sideboard: number;
	created_at: string;
}

export interface CardRow {
	id: string;
	name: string;
	mana_cost: string | null;
	type_line: string;
	oracle_text: string | null;
	colors: string | null;
	color_identity: string | null;
	image_normal: string | null;
	image_small: string | null;
	image_large: string | null;
	card_faces: string | null;
	price_usd: string | null;
	price_usd_foil: string | null;
	price_eur: string | null;
	price_tix: string | null;
	quantity: number;
	fuzzy_match: number;
	price_usd_6mo_ago: string | null;
	price_usd_12mo_ago: string | null;
	price_last_updated: string | null;
	is_favorite: number;
	created_at: string;
	updated_at: string;
}

export function cardRowToScryfallCard(row: CardRow): ScryfallCard {
	return {
		id: row.id,
		name: row.name,
		mana_cost: row.mana_cost || undefined,
		type_line: row.type_line,
		oracle_text: row.oracle_text || undefined,
		colors: row.colors ? JSON.parse(row.colors) : undefined,
		color_identity: row.color_identity ? JSON.parse(row.color_identity) : undefined,
		image_uris: row.image_normal ? {
			normal: row.image_normal,
			small: row.image_small || row.image_normal,
			large: row.image_large || row.image_normal
		} : undefined,
		card_faces: row.card_faces ? JSON.parse(row.card_faces) : undefined,
		prices: {
			usd: row.price_usd || undefined,
			usd_foil: row.price_usd_foil || undefined,
			eur: row.price_eur || undefined,
			tix: row.price_tix || undefined
		},
		quantity: row.quantity,
		fuzzyMatch: row.fuzzy_match === 1,
		priceHistory: {
			usd6moAgo: row.price_usd_6mo_ago || undefined,
			usd12moAgo: row.price_usd_12mo_ago || undefined,
			lastUpdated: row.price_last_updated || undefined
		},
		isFavorite: row.is_favorite === 1
	};
}

export function scryfallCardToCardRow(card: ScryfallCard): Omit<CardRow, 'created_at' | 'updated_at'> {
	// Handle double-faced cards - get image from card_faces if not available at root level
	const imageNormal = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || null;
	const imageSmall = card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small || null;
	const imageLarge = card.image_uris?.large || card.card_faces?.[0]?.image_uris?.large || null;

	return {
		id: card.id,
		name: card.name,
		mana_cost: card.mana_cost || null,
		type_line: card.type_line,
		oracle_text: card.oracle_text || null,
		colors: card.colors ? JSON.stringify(card.colors) : null,
		color_identity: card.color_identity ? JSON.stringify(card.color_identity) : null,
		image_normal: imageNormal,
		image_small: imageSmall,
		image_large: imageLarge,
		card_faces: card.card_faces ? JSON.stringify(card.card_faces) : null,
		price_usd: card.prices?.usd || null,
		price_usd_foil: card.prices?.usd_foil || null,
		price_eur: card.prices?.eur || null,
		price_tix: card.prices?.tix || null,
		quantity: card.quantity || 1,
		fuzzy_match: card.fuzzyMatch ? 1 : 0,
		price_usd_6mo_ago: card.priceHistory?.usd6moAgo || null,
		price_usd_12mo_ago: card.priceHistory?.usd12moAgo || null,
		price_last_updated: card.priceHistory?.lastUpdated || null,
		is_favorite: card.isFavorite ? 1 : 0
	};
}