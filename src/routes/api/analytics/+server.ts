import { json } from '@sveltejs/kit';
import { getDatabase, cardRowToScryfallCard, type CardRow } from '$lib/database';
import type { RequestHandler } from './$types';

interface CardPerformance {
	id: string;
	name: string;
	currentPrice: number;
	quantity: number;
	currentValue: number;
	sixMonthChange: number | null;
	sixMonthGain: number | null;
	twelveMonthChange: number | null;
	twelveMonthGain: number | null;
}

interface AnalyticsData {
	portfolioSummary: {
		totalValue: number;
		totalCards: number;
		uniqueCards: number;
		sixMonthChange: number | null;
		sixMonthGain: number | null;
		twelveMonthChange: number | null;
		twelveMonthGain: number | null;
	};
	topPerformers: {
		sixMonth: CardPerformance[];
		twelveMonth: CardPerformance[];
	};
	bottomPerformers: {
		sixMonth: CardPerformance[];
		twelveMonth: CardPerformance[];
	};
}

// GET /api/analytics - Get investment analysis for collection
export const GET: RequestHandler = async () => {
	try {
		const db = getDatabase();
		const stmt = db.prepare('SELECT * FROM cards');
		const rows = stmt.all() as CardRow[];
		
		if (rows.length === 0) {
			return json({
				portfolioSummary: {
					totalValue: 0,
					totalCards: 0,
					uniqueCards: 0,
					sixMonthChange: null,
					sixMonthGain: null,
					twelveMonthChange: null,
					twelveMonthGain: null
				},
				topPerformers: { sixMonth: [], twelveMonth: [] },
				bottomPerformers: { sixMonth: [], twelveMonth: [] }
			});
		}
		
		// Calculate performance for each card
		const cardPerformances: CardPerformance[] = rows.map(row => {
			const card = cardRowToScryfallCard(row);
			const currentPrice = parseFloat(card.prices?.usd || '0');
			const price6moAgo = card.priceHistory?.usd6moAgo ? parseFloat(card.priceHistory.usd6moAgo) : null;
			const price12moAgo = card.priceHistory?.usd12moAgo ? parseFloat(card.priceHistory.usd12moAgo) : null;
			const quantity = card.quantity || 1;
			
			// Calculate 6-month performance
			let sixMonthChange: number | null = null;
			let sixMonthGain: number | null = null;
			if (price6moAgo && price6moAgo > 0) {
				sixMonthChange = ((currentPrice - price6moAgo) / price6moAgo) * 100;
				sixMonthGain = (currentPrice - price6moAgo) * quantity;
			}
			
			// Calculate 12-month performance
			let twelveMonthChange: number | null = null;
			let twelveMonthGain: number | null = null;
			if (price12moAgo && price12moAgo > 0) {
				twelveMonthChange = ((currentPrice - price12moAgo) / price12moAgo) * 100;
				twelveMonthGain = (currentPrice - price12moAgo) * quantity;
			}
			
			return {
				id: card.id,
				name: card.name,
				currentPrice,
				quantity,
				currentValue: currentPrice * quantity,
				sixMonthChange,
				sixMonthGain,
				twelveMonthChange,
				twelveMonthGain
			};
		});
		
		// Calculate portfolio summary
		const totalValue = cardPerformances.reduce((sum, card) => sum + card.currentValue, 0);
		const totalCards = cardPerformances.reduce((sum, card) => sum + card.quantity, 0);
		const uniqueCards = cardPerformances.length;
		
		// Portfolio-wide performance
		const cardsWithSixMonthData = cardPerformances.filter(card => card.sixMonthGain !== null);
		const cardsWithTwelveMonthData = cardPerformances.filter(card => card.twelveMonthGain !== null);
		
		const portfolioSixMonthGain = cardsWithSixMonthData.length > 0 ? 
			cardsWithSixMonthData.reduce((sum, card) => sum + (card.sixMonthGain || 0), 0) : null;
		const portfolioTwelveMonthGain = cardsWithTwelveMonthData.length > 0 ? 
			cardsWithTwelveMonthData.reduce((sum, card) => sum + (card.twelveMonthGain || 0), 0) : null;
			
		// Calculate portfolio percentage changes
		const portfolioSixMonthChange = portfolioSixMonthGain !== null && cardsWithSixMonthData.length > 0 ? 
			(portfolioSixMonthGain / (totalValue - portfolioSixMonthGain)) * 100 : null;
		const portfolioTwelveMonthChange = portfolioTwelveMonthGain !== null && cardsWithTwelveMonthData.length > 0 ? 
			(portfolioTwelveMonthGain / (totalValue - portfolioTwelveMonthGain)) * 100 : null;
		
		// Get top and bottom performers (filter out cards with no historical data)
		const cardsWithSixMonthPerformance = cardPerformances.filter(card => card.sixMonthChange !== null);
		const cardsWithTwelveMonthPerformance = cardPerformances.filter(card => card.twelveMonthChange !== null);
		
		// Sort by performance percentage
		const topSixMonth = cardsWithSixMonthPerformance
			.sort((a, b) => (b.sixMonthChange || 0) - (a.sixMonthChange || 0))
			.slice(0, 5);
			
		const bottomSixMonth = cardsWithSixMonthPerformance
			.sort((a, b) => (a.sixMonthChange || 0) - (b.sixMonthChange || 0))
			.slice(0, 5);
			
		const topTwelveMonth = cardsWithTwelveMonthPerformance
			.sort((a, b) => (b.twelveMonthChange || 0) - (a.twelveMonthChange || 0))
			.slice(0, 5);
			
		const bottomTwelveMonth = cardsWithTwelveMonthPerformance
			.sort((a, b) => (a.twelveMonthChange || 0) - (b.twelveMonthChange || 0))
			.slice(0, 5);
		
		const analyticsData: AnalyticsData = {
			portfolioSummary: {
				totalValue: Math.round(totalValue * 100) / 100,
				totalCards,
				uniqueCards,
				sixMonthChange: portfolioSixMonthChange !== null ? Math.round(portfolioSixMonthChange * 100) / 100 : null,
				sixMonthGain: portfolioSixMonthGain !== null ? Math.round(portfolioSixMonthGain * 100) / 100 : null,
				twelveMonthChange: portfolioTwelveMonthChange !== null ? Math.round(portfolioTwelveMonthChange * 100) / 100 : null,
				twelveMonthGain: portfolioTwelveMonthGain !== null ? Math.round(portfolioTwelveMonthGain * 100) / 100 : null
			},
			topPerformers: {
				sixMonth: topSixMonth,
				twelveMonth: topTwelveMonth
			},
			bottomPerformers: {
				sixMonth: bottomSixMonth,
				twelveMonth: bottomTwelveMonth
			}
		};
		
		return json(analyticsData);
		
	} catch (error) {
		console.error('Error generating analytics:', error);
		return json({ error: 'Failed to generate analytics' }, { status: 500 });
	}
};