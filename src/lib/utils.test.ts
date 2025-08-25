import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	isError,
	isCard,
	calculateCollectionValue,
	formatCurrency,
	loadCollectionFromStorage,
	saveCollectionToStorage,
	addCardToCollection,
	removeCardFromCollection,
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
				prices: { usd: '1.50' }
			},
			{
				id: '2',
				name: 'Card 2',
				type_line: 'Creature',
				prices: { usd: '2.25' }
			},
			{
				id: '3',
				name: 'Card 3',
				type_line: 'Land',
				prices: { usd: '0.75' }
			}
		];

		expect(calculateCollectionValue(collection)).toBe(4.5);
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
			json: async () => ({ success: true })
		});

		const result = await addCardToCollection(newCard);

		expect(result).toBe(true);
		expect(mockFetch).toHaveBeenCalledWith('/api/collection', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(newCard)
		});
	});

	it('should not add duplicate card (API returns 409)', async () => {
		const existingCard: ScryfallCard = {
			id: '1',
			name: 'Lightning Bolt',
			type_line: 'Instant'
		};

		mockFetch.mockResolvedValue({
			ok: false,
			status: 409,
			json: async () => ({ error: 'Card already exists' })
		});

		const result = await addCardToCollection(existingCard);

		expect(result).toBe(false);
	});

	it('should remove card via API', async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({ success: true })
		});

		const result = await removeCardFromCollection('1');

		expect(result).toBe(true);
		expect(mockFetch).toHaveBeenCalledWith('/api/collection/1', {
			method: 'DELETE'
		});
	});

	it('should return false when removing non-existent card (API returns 404)', async () => {
		mockFetch.mockResolvedValue({
			ok: false,
			status: 404,
			json: async () => ({ error: 'Card not found' })
		});

		const result = await removeCardFromCollection('999');

		expect(result).toBe(false);
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

		expect(result).toBe(true);
		expect(localStorage.setItem).toHaveBeenCalledWith(
			'mtg-collection',
			JSON.stringify([newCard])
		);
	});

	it('should fallback to localStorage when remove API fails', async () => {
		const card1: ScryfallCard = { id: '1', name: 'Card 1', type_line: 'Instant' };
		const card2: ScryfallCard = { id: '2', name: 'Card 2', type_line: 'Creature' };
		const existingCollection = [card1, card2];

		// Mock API failure
		mockFetch.mockRejectedValue(new Error('Network error'));
		
		// Mock successful localStorage fallback
		localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(existingCollection));
		localStorage.setItem = vi.fn();

		const result = await removeCardFromCollection('1');

		expect(result).toBe(true);
		expect(localStorage.setItem).toHaveBeenCalledWith(
			'mtg-collection',
			JSON.stringify([card2])
		);
	});
});