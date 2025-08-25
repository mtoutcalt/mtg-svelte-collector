import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	isError,
	isCard,
	calculateCollectionValue,
	formatCurrency,
	loadCollectionFromStorage,
	addCardToCollection,
	removeCardFromCollection,
	updateCardQuantity,
	type ScryfallCard,
	type ScryfallError
} from './utils';

describe('Type Guards', () => {
	it('should identify error objects correctly', () => {
		const error: ScryfallError = { error: 'Card not found' };
		const card: ScryfallCard = {
			id: '123',
			name: 'Lightning Bolt',
			type_line: 'Instant'
		};

		expect(isError(error)).toBe(true);
		expect(isError(card)).toBe(false);
		expect(isError(null)).toBe(false);
	});

	it('should identify card objects correctly', () => {
		const error: ScryfallError = { error: 'Card not found' };
		const card: ScryfallCard = {
			id: '123',
			name: 'Lightning Bolt',
			type_line: 'Instant'
		};

		expect(isCard(card)).toBe(true);
		expect(isCard(error)).toBe(false);
		expect(isCard(null)).toBe(false);
	});
});

describe('Collection Value Calculation', () => {
	it('should calculate total value correctly', () => {
		const collection: ScryfallCard[] = [
			{
				id: '1',
				name: 'Card 1',
				type_line: 'Instant',
				prices: { usd: '1.50' },
				quantity: 2
			},
			{
				id: '2',
				name: 'Card 2',
				type_line: 'Creature',
				prices: { usd: '2.25' },
				quantity: 1
			},
			{
				id: '3',
				name: 'Card 3',
				type_line: 'Land',
				prices: { usd: '0.75' },
				quantity: 3
			}
		];

		// (1.50 * 2) + (2.25 * 1) + (0.75 * 3) = 3.00 + 2.25 + 2.25 = 7.50
		expect(calculateCollectionValue(collection)).toBe(7.5);
	});

	it('should handle cards without prices', () => {
		const collection: ScryfallCard[] = [
			{
				id: '1',
				name: 'Card 1',
				type_line: 'Instant',
				prices: { usd: '1.50' }
			},
			{
				id: '2',
				name: 'Card 2',
				type_line: 'Creature'
			},
			{
				id: '3',
				name: 'Card 3',
				type_line: 'Land',
				prices: {}
			}
		];

		expect(calculateCollectionValue(collection)).toBe(1.5);
	});

	it('should return 0 for empty collection', () => {
		expect(calculateCollectionValue([])).toBe(0);
	});
});

describe('Currency Formatting', () => {
	it('should format currency correctly', () => {
		expect(formatCurrency(0)).toBe('$0.00');
		expect(formatCurrency(1.5)).toBe('$1.50');
		expect(formatCurrency(123.45)).toBe('$123.45');
		expect(formatCurrency(1234.56)).toBe('$1,234.56');
	});

	it('should handle large numbers', () => {
		expect(formatCurrency(12345.67)).toBe('$12,345.67');
		expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
	});
});

describe('Collection API Operations', () => {
	const mockFetch = vi.fn();
	
	beforeEach(() => {
		// Clear all mocks before each test
		vi.clearAllMocks();
		localStorage.clear();
		
		// Mock global fetch
		global.fetch = mockFetch;
		
		// Mock window object for localStorage fallback
		Object.defineProperty(window, 'localStorage', {
			value: {
				getItem: vi.fn(),
				setItem: vi.fn(),
				clear: vi.fn(),
			},
			writable: true
		});
	});

	it('should load empty collection when API returns empty array', async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => []
		});
		
		const collection = await loadCollectionFromStorage();
		expect(collection).toEqual([]);
		expect(mockFetch).toHaveBeenCalledWith('/api/collection');
	});

	it('should load collection from API', async () => {
		const mockCollection: ScryfallCard[] = [
			{
				id: '1',
				name: 'Lightning Bolt',
				type_line: 'Instant'
			}
		];
		
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => mockCollection
		});
		
		const collection = await loadCollectionFromStorage();
		expect(collection).toEqual(mockCollection);
		expect(mockFetch).toHaveBeenCalledWith('/api/collection');
	});

	it('should fallback to localStorage when API fails', async () => {
		const mockCollection: ScryfallCard[] = [
			{
				id: '1',
				name: 'Lightning Bolt',
				type_line: 'Instant'
			}
		];

		mockFetch.mockRejectedValue(new Error('API Error'));
		localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(mockCollection));
		
		const collection = await loadCollectionFromStorage();
		expect(collection).toEqual(mockCollection);
		expect(localStorage.getItem).toHaveBeenCalledWith('mtg-collection');
	});

	it('should add new card via API', async () => {
		const newCard: ScryfallCard = {
			id: '1',
			name: 'Lightning Bolt',
			type_line: 'Instant'
		};

		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({ success: true, message: 'Card added', quantity: 1 })
		});

		const result = await addCardToCollection(newCard);

		expect(result).toEqual({ success: true, message: 'Card added', quantity: 1 });
		expect(mockFetch).toHaveBeenCalledWith('/api/collection', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ ...newCard, quantity: 1 })
		});
	});

	it('should handle adding card when it already exists (increments quantity)', async () => {
		const existingCard: ScryfallCard = {
			id: '1',
			name: 'Lightning Bolt',
			type_line: 'Instant'
		};

		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({ success: true, message: 'Card quantity updated to 2', quantity: 2 })
		});

		const result = await addCardToCollection(existingCard);

		expect(result).toEqual({ success: true, message: 'Card quantity updated to 2', quantity: 2 });
	});

	it('should remove card via API', async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({ success: true, message: 'Card removed', quantity: 0 })
		});

		const result = await removeCardFromCollection('1');

		expect(result).toEqual({ success: true, message: 'Card removed', quantity: 0 });
		expect(mockFetch).toHaveBeenCalledWith('/api/collection/1', {
			method: 'DELETE'
		});
	});

	it('should return error when removing non-existent card (API returns 404)', async () => {
		mockFetch.mockResolvedValue({
			ok: false,
			status: 404,
			json: async () => ({ error: 'Card not found' })
		});

		const result = await removeCardFromCollection('999');

		expect(result).toEqual({ success: false, message: 'Card not found' });
	});

	it('should fallback to localStorage when add API fails', async () => {
		const newCard: ScryfallCard = {
			id: '1',
			name: 'Lightning Bolt',
			type_line: 'Instant'
		};

		// Mock API failure
		mockFetch.mockRejectedValue(new Error('Network error'));
		
		// Mock successful localStorage fallback
		localStorage.getItem = vi.fn().mockReturnValue('[]');
		localStorage.setItem = vi.fn();

		const result = await addCardToCollection(newCard);

		expect(result).toEqual({ success: true, quantity: 1, message: 'Card added to collection' });
		expect(localStorage.setItem).toHaveBeenCalledWith(
			'mtg-collection',
			JSON.stringify([{ ...newCard, quantity: 1 }])
		);
	});

	it('should fallback to localStorage when remove API fails', async () => {
		const card1: ScryfallCard = { id: '1', name: 'Card 1', type_line: 'Instant', quantity: 1 };
		const card2: ScryfallCard = { id: '2', name: 'Card 2', type_line: 'Creature', quantity: 1 };
		const existingCollection = [card1, card2];

		// Mock API failure
		mockFetch.mockRejectedValue(new Error('Network error'));
		
		// Mock successful localStorage fallback
		localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(existingCollection));
		localStorage.setItem = vi.fn();

		const result = await removeCardFromCollection('1');

		expect(result).toEqual({ success: true, message: 'Card updated' });
		expect(localStorage.setItem).toHaveBeenCalledWith(
			'mtg-collection',
			JSON.stringify([card2])
		);
	});

	it('should update card quantity via API', async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({ success: true, message: 'Card quantity updated', quantity: 3 })
		});

		const result = await updateCardQuantity('1', 3);

		expect(result).toEqual({ success: true, message: 'Card quantity updated', quantity: 3 });
		expect(mockFetch).toHaveBeenCalledWith('/api/collection/quantity', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ cardId: '1', quantity: 3 })
		});
	});
});