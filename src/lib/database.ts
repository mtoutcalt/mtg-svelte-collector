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
			fuzzy_match INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`;

	// Create indexes for better performance
	const createIndexes = [
		`CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name)`,
		`CREATE INDEX IF NOT EXISTS idx_cards_type_line ON cards(type_line)`,
		`CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at)`
	];

	try {
		database.exec(createCardsTable);
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
export interface CardRow {
	id: string;
	name: string;
	mana_cost: string | null;
	type_line: string;
	oracle_text: string | null;
	image_normal: string | null;
	image_small: string | null;
	image_large: string | null;
	price_usd: string | null;
	price_usd_foil: string | null;
	price_eur: string | null;
	price_tix: string | null;
	fuzzy_match: number;
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
		image_uris: row.image_normal ? {
			normal: row.image_normal,
			small: row.image_small || row.image_normal,
			large: row.image_large || row.image_normal
		} : undefined,
		prices: {
			usd: row.price_usd || undefined,
			usd_foil: row.price_usd_foil || undefined,
			eur: row.price_eur || undefined,
			tix: row.price_tix || undefined
		},
		fuzzyMatch: row.fuzzy_match === 1
	};
}

export function scryfallCardToCardRow(card: ScryfallCard): Omit<CardRow, 'created_at' | 'updated_at'> {
	return {
		id: card.id,
		name: card.name,
		mana_cost: card.mana_cost || null,
		type_line: card.type_line,
		oracle_text: card.oracle_text || null,
		image_normal: card.image_uris?.normal || null,
		image_small: card.image_uris?.small || null,
		image_large: card.image_uris?.large || null,
		price_usd: card.prices?.usd || null,
		price_usd_foil: card.prices?.usd_foil || null,
		price_eur: card.prices?.eur || null,
		price_tix: card.prices?.tix || null,
		fuzzy_match: card.fuzzyMatch ? 1 : 0
	};
}