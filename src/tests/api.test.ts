import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ScryfallCard } from '../lib/utils';

// Mock better-sqlite3 for testing
const mockDatabase = {
	prepare: vi.fn(),
	transaction: vi.fn(),
	exec: vi.fn(),
	close: vi.fn()
};

const mockStatement = {
	run: vi.fn(),
	get: vi.fn(),
	all: vi.fn()
};

// Mock the database module
vi.mock('../lib/database', () => ({
	getDatabase: () => mockDatabase,
	cardRowToScryfallCard: (row: any) => ({
		id: row.id,
		name: row.name,
		type_line: row.type_line,
		mana_cost: row.mana_cost,
		oracle_text: row.oracle_text,
		image_uris: row.image_normal ? {
			normal: row.image_normal,
			small: row.image_small,
			large: row.image_large
		} : undefined,
		prices: {
			usd: row.price_usd,
			usd_foil: row.price_usd_foil,
			eur: row.price_eur,
			tix: row.price_tix
		},
		fuzzyMatch: row.fuzzy_match === 1
	}),
	scryfallCardToCardRow: (card: ScryfallCard) => ({
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
	})
}));

// Mock fs module
vi.mock('fs', () => ({
	existsSync: vi.fn(() => true),
	mkdirSync: vi.fn()
}));

describe('API Collection Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDatabase.prepare.mockReturnValue(mockStatement);
		mockDatabase.transaction.mockImplementation((fn) => fn);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('GET /api/collection', () => {
		it('should return empty collection', async () => {
			// Import after mocks are set up
			const { GET } = await import('../routes/api/collection/+server');
			
			mockStatement.all.mockReturnValue([]);
			
			const response = await GET();
			const data = await response.json();
			
			expect(data).toEqual([]);
			expect(mockDatabase.prepare).toHaveBeenCalledWith('SELECT * FROM cards ORDER BY created_at DESC');
		});

		it('should return collection with cards', async () => {
			const { GET } = await import('../routes/api/collection/+server');
			
			const mockRows = [
				{
					id: '1',
					name: 'Lightning Bolt',
					type_line: 'Instant',
					mana_cost: '{R}',
					oracle_text: 'Lightning Bolt deals 3 damage to any target.',
					image_normal: 'https://example.com/bolt.jpg',
					image_small: 'https://example.com/bolt_small.jpg',
					image_large: 'https://example.com/bolt_large.jpg',
					price_usd: '0.50',
					price_usd_foil: null,
					price_eur: '0.45',
					price_tix: null,
					fuzzy_match: 0,
					created_at: '2024-01-01',
					updated_at: '2024-01-01'
				}
			];
			
			mockStatement.all.mockReturnValue(mockRows);
			
			const response = await GET();
			const data = await response.json();
			
			expect(data).toHaveLength(1);
			expect(data[0]).toMatchObject({
				id: '1',
				name: 'Lightning Bolt',
				type_line: 'Instant',
				mana_cost: '{R}',
				oracle_text: 'Lightning Bolt deals 3 damage to any target.'
			});
		});
	});

	describe('POST /api/collection', () => {
		it('should add new card successfully', async () => {
			const { POST } = await import('../routes/api/collection/+server');
			
			const newCard: ScryfallCard = {
				id: '1',
				name: 'Lightning Bolt',
				type_line: 'Instant',
				mana_cost: '{R}',
				oracle_text: 'Lightning Bolt deals 3 damage to any target.'
			};
			
			// Mock that card doesn't exist
			mockStatement.get.mockReturnValue({ count: 0 });
			mockStatement.run.mockReturnValue({ changes: 1 });
			
			const request = new Request('http://localhost', {
				method: 'POST',
				body: JSON.stringify(newCard),
				headers: { 'Content-Type': 'application/json' }
			});
			
			const response = await POST({ request });
			const data = await response.json();
			
			expect(data).toEqual({ success: true, message: 'Card added to collection' });
			expect(mockStatement.get).toHaveBeenCalledWith('1');
			expect(mockStatement.run).toHaveBeenCalled();
		});

		it('should reject duplicate card', async () => {
			const { POST } = await import('../routes/api/collection/+server');
			
			const existingCard: ScryfallCard = {
				id: '1',
				name: 'Lightning Bolt',
				type_line: 'Instant'
			};
			
			// Mock that card already exists
			mockStatement.get.mockReturnValue({ count: 1 });
			
			const request = new Request('http://localhost', {
				method: 'POST',
				body: JSON.stringify(existingCard),
				headers: { 'Content-Type': 'application/json' }
			});
			
			const response = await POST({ request });
			const data = await response.json();
			
			expect(response.status).toBe(409);
			expect(data).toEqual({ error: 'Card already in collection', exists: true });
		});

		it('should reject invalid card data', async () => {
			const { POST } = await import('../routes/api/collection/+server');
			
			const invalidCard = {
				name: 'Lightning Bolt'
				// Missing required id field
			};
			
			const request = new Request('http://localhost', {
				method: 'POST',
				body: JSON.stringify(invalidCard),
				headers: { 'Content-Type': 'application/json' }
			});
			
			const response = await POST({ request });
			const data = await response.json();
			
			expect(response.status).toBe(400);
			expect(data).toEqual({ error: 'Invalid card data' });
		});
	});

	describe('DELETE /api/collection/[id]', () => {
		it('should remove card successfully', async () => {
			const { DELETE } = await import('../routes/api/collection/[id]/+server');
			
			mockStatement.run.mockReturnValue({ changes: 1 });
			
			const response = await DELETE({ params: { id: '1' } });
			const data = await response.json();
			
			expect(data).toEqual({ success: true, message: 'Card removed from collection' });
			expect(mockStatement.run).toHaveBeenCalledWith('1');
		});

		it('should return 404 when card not found', async () => {
			const { DELETE } = await import('../routes/api/collection/[id]/+server');
			
			mockStatement.run.mockReturnValue({ changes: 0 });
			
			const response = await DELETE({ params: { id: '999' } });
			const data = await response.json();
			
			expect(response.status).toBe(404);
			expect(data).toEqual({ error: 'Card not found in collection' });
		});

		it('should return 400 when id is missing', async () => {
			const { DELETE } = await import('../routes/api/collection/[id]/+server');
			
			const response = await DELETE({ params: { id: '' } });
			const data = await response.json();
			
			expect(response.status).toBe(400);
			expect(data).toEqual({ error: 'Card ID is required' });
		});
	});
});