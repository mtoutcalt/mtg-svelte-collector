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

describe('LocalStorage Operations', () => {
	beforeEach(() => {
		// Clear all localStorage mocks before each test
		vi.clearAllMocks();
		localStorage.clear();
	});

	it('should load empty collection when localStorage is empty', () => {
		localStorage.getItem = vi.fn().mockReturnValue(null);
		
		const collection = loadCollectionFromStorage();
		expect(collection).toEqual([]);
		expect(localStorage.getItem).toHaveBeenCalledWith('mtg-collection');
	});

	it('should load collection from localStorage', () => {
		const mockCollection: ScryfallCard[] = [
			{
				id: '1',
				name: 'Lightning Bolt',
				type_line: 'Instant'
			}
		];
		
		localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(mockCollection));
		
		const collection = loadCollectionFromStorage();
		expect(collection).toEqual(mockCollection);
	});

	it('should save collection to localStorage', () => {
		const mockCollection: ScryfallCard[] = [
			{
				id: '1',
				name: 'Lightning Bolt',
				type_line: 'Instant'
			}
		];

		saveCollectionToStorage(mockCollection);
		
		expect(localStorage.setItem).toHaveBeenCalledWith(
			'mtg-collection',
			JSON.stringify(mockCollection)
		);
	});

	it('should add new card to collection', () => {
		const existingCollection: ScryfallCard[] = [];
		const newCard: ScryfallCard = {
			id: '1',
			name: 'Lightning Bolt',
			type_line: 'Instant'
		};

		localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(existingCollection));
		localStorage.setItem = vi.fn();

		const result = addCardToCollection(newCard);

		expect(result).toBe(true);
		expect(localStorage.setItem).toHaveBeenCalledWith(
			'mtg-collection',
			JSON.stringify([newCard])
		);
	});

	it('should not add duplicate card to collection', () => {
		const existingCard: ScryfallCard = {
			id: '1',
			name: 'Lightning Bolt',
			type_line: 'Instant'
		};
		const existingCollection = [existingCard];

		localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(existingCollection));
		localStorage.setItem = vi.fn();

		const result = addCardToCollection(existingCard);

		expect(result).toBe(false);
		expect(localStorage.setItem).not.toHaveBeenCalled();
	});

	it('should remove card from collection', () => {
		const card1: ScryfallCard = { id: '1', name: 'Card 1', type_line: 'Instant' };
		const card2: ScryfallCard = { id: '2', name: 'Card 2', type_line: 'Creature' };
		const existingCollection = [card1, card2];

		localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(existingCollection));
		localStorage.setItem = vi.fn();

		const result = removeCardFromCollection('1');

		expect(result).toBe(true);
		expect(localStorage.setItem).toHaveBeenCalledWith(
			'mtg-collection',
			JSON.stringify([card2])
		);
	});

	it('should return false when removing non-existent card', () => {
		const existingCollection: ScryfallCard[] = [
			{ id: '1', name: 'Card 1', type_line: 'Instant' }
		];

		localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(existingCollection));
		localStorage.setItem = vi.fn();

		const result = removeCardFromCollection('999');

		expect(result).toBe(false);
		expect(localStorage.setItem).not.toHaveBeenCalled();
	});
});