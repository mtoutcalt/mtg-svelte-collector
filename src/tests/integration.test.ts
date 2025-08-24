import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	loadCollectionFromStorage,
	addCardToCollection,
	removeCardFromCollection,
	calculateCollectionValue,
	formatCurrency,
	type ScryfallCard
} from '../lib/utils';

describe('Collection Integration Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		localStorage.getItem = vi.fn().mockReturnValue(null);
		localStorage.setItem = vi.fn();
	});

	it('should handle collection value calculations with real data', () => {
		// Test with realistic MTG card data
		const collection: ScryfallCard[] = [
			{
				id: 'lightning-bolt',
				name: 'Lightning Bolt',
				type_line: 'Instant',
				prices: { usd: '0.50' }
			},
			{
				id: 'black-lotus',
				name: 'Black Lotus',
				type_line: 'Artifact',
				prices: { usd: '15000.00' }
			},
			{
				id: 'counterspell',
				name: 'Counterspell',
				type_line: 'Instant',
				prices: { usd: '2.25' }
			}
		];

		const totalValue = calculateCollectionValue(collection);
		expect(totalValue).toBe(15002.75);
		expect(formatCurrency(totalValue)).toBe('$15,002.75');

		// Test individual card values
		expect(calculateCollectionValue([collection[0]])).toBe(0.50);
		expect(calculateCollectionValue([collection[1]])).toBe(15000.00);
		expect(calculateCollectionValue([collection[2]])).toBe(2.25);
	});

	it('should handle collection value calculation with mixed price data', () => {
		const cards: ScryfallCard[] = [
			{
				id: '1',
				name: 'Card with price',
				type_line: 'Instant',
				prices: { usd: '1.50' }
			},
			{
				id: '2',
				name: 'Card without prices object',
				type_line: 'Creature'
			},
			{
				id: '3',
				name: 'Card with empty prices',
				type_line: 'Land',
				prices: {}
			},
			{
				id: '4',
				name: 'Card with null USD price',
				type_line: 'Enchantment',
				prices: { usd: undefined, eur: '2.00' }
			}
		];

		const totalValue = calculateCollectionValue(cards);
		expect(totalValue).toBe(1.5);
		expect(formatCurrency(totalValue)).toBe('$1.50');
	});

	it('should properly format various currency amounts', () => {
		const testCases = [
			{ input: 0, expected: '$0.00' },
			{ input: 0.01, expected: '$0.01' },
			{ input: 0.99, expected: '$0.99' },
			{ input: 1, expected: '$1.00' },
			{ input: 10, expected: '$10.00' },
			{ input: 100, expected: '$100.00' },
			{ input: 999.99, expected: '$999.99' },
			{ input: 1000, expected: '$1,000.00' },
			{ input: 1234.56, expected: '$1,234.56' },
			{ input: 12345.67, expected: '$12,345.67' },
			{ input: 123456.78, expected: '$123,456.78' }
		];

		testCases.forEach(({ input, expected }) => {
			expect(formatCurrency(input)).toBe(expected);
		});
	});
});