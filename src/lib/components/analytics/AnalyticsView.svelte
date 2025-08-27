<script lang="ts">
	import type { ScryfallCard } from '$lib/utils';
	import PortfolioSummary from './PortfolioSummary.svelte';
	import PerformersTable from './PerformersTable.svelte';
	import { createEventDispatcher } from 'svelte';
	
	export let collection: ScryfallCard[] = [];
	export let analyticsData: any = null;
	export let analyticsLoading: boolean = false;
	export let updatingPrices: boolean = false;
	
	const dispatch = createEventDispatcher();
	
	function getLastUpdateInfo(): { lastUpdate: string; canUpdate: boolean } {
		if (!analyticsData || !collection.length) {
			return { lastUpdate: 'Never', canUpdate: true };
		}
		
		// Find the most recent update time across all cards
		let mostRecentUpdate: Date | null = null;
		
		collection.forEach(card => {
			if (card.priceHistory?.lastUpdated) {
				const updateTime = new Date(card.priceHistory.lastUpdated);
				if (!mostRecentUpdate || updateTime > mostRecentUpdate) {
					mostRecentUpdate = updateTime;
				}
			}
		});
		
		if (!mostRecentUpdate) {
			return { lastUpdate: 'Never', canUpdate: true };
		}
		
		const now = new Date();
		const mostRecent = mostRecentUpdate as Date;
		const daysSinceUpdate = Math.floor((now.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));
		const hoursSinceUpdate = Math.floor((now.getTime() - mostRecent.getTime()) / (1000 * 60 * 60));
		
		let lastUpdateText = '';
		if (daysSinceUpdate > 0) {
			lastUpdateText = `${daysSinceUpdate} day${daysSinceUpdate > 1 ? 's' : ''} ago`;
		} else if (hoursSinceUpdate > 0) {
			lastUpdateText = `${hoursSinceUpdate} hour${hoursSinceUpdate > 1 ? 's' : ''} ago`;
		} else {
			lastUpdateText = 'Less than an hour ago';
		}
		
		// Allow updates if it's been more than 1 day since last update
		const canUpdate = daysSinceUpdate >= 1;
		
		return { lastUpdate: lastUpdateText, canUpdate };
	}
	
	function handleUpdatePrices() {
		dispatch('updatePrices');
	}
	
	$: updateInfo = getLastUpdateInfo();
</script>

<div class="analytics-view">
	<div class="analytics-header">
		<div class="analytics-title-section">
			<h2>📊 Portfolio Analytics</h2>
			{#if analyticsData}
				<div class="last-update-info">
					<span class="update-text">Last updated: {updateInfo.lastUpdate}</span>
					{#if !updateInfo.canUpdate}
						<span class="update-hint">💡 Updates limited to once per day</span>
					{/if}
				</div>
			{/if}
		</div>
		<button 
			class="update-prices-button" 
			on:click={handleUpdatePrices} 
			disabled={updatingPrices || (analyticsData && !updateInfo.canUpdate)}
		>
			{updatingPrices ? '⏳ Updating...' : '🔄 Update Prices'}
		</button>
	</div>

	{#if analyticsLoading}
		<div class="analytics-loading">
			<p>Loading analytics...</p>
		</div>
	{:else if analyticsData}
		<div class="analytics-content">
			<!-- Portfolio Summary -->
			<PortfolioSummary {analyticsData} />

			<!-- Top Performers -->
			<PerformersTable 
				title="🚀 Top Performers (6 Months)"
				performers={analyticsData.topPerformers.sixMonth}
				isPositive={true}
			/>

			<!-- Bottom Performers -->
			<PerformersTable 
				title="📉 Worst Performers (6 Months)"
				performers={analyticsData.bottomPerformers.sixMonth}
				isPositive={false}
			/>

			{#if analyticsData.topPerformers.sixMonth.length === 0 && analyticsData.topPerformers.twelveMonth.length === 0}
				<div class="no-data">
					<p>📈 No performance data available yet.</p>
					<p>Update prices monthly to start tracking your collection's performance over time!</p>
				</div>
			{/if}
		</div>
	{:else}
		<div class="no-analytics">
			<p>No analytics data available. Click "Update Prices" to get started!</p>
		</div>
	{/if}
</div>

<style>
	.analytics-view {
		margin-top: 2rem;
		max-width: 1200px;
		margin-left: auto;
		margin-right: auto;
	}

	.analytics-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 3rem;
		padding: 25px 35px;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 20px;
		backdrop-filter: blur(20px);
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
	}

	.analytics-title-section h2 {
		margin: 0;
		font-family: 'Cinzel', serif;
		font-size: 2rem;
		font-weight: 600;
		color: #c9b037;
		text-shadow: 0 2px 10px rgba(201, 176, 55, 0.3);
	}

	.last-update-info {
		margin-top: 0.5rem;
		font-size: 0.9rem;
		color: rgba(232, 233, 237, 0.7);
	}

	.update-text {
		margin-right: 1rem;
	}

	.update-hint {
		font-style: italic;
		color: rgba(232, 233, 237, 0.5);
	}

	.update-prices-button {
		background: linear-gradient(135deg, #2196F3 0%, #42A5F5 100%);
		color: white;
		border: none;
		padding: 10px 20px;
		border-radius: 15px;
		cursor: pointer;
		font-size: 14px;
		font-family: 'Cinzel', serif;
		font-weight: 600;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
	}

	.update-prices-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 10px 30px rgba(33, 150, 243, 0.6);
	}

	.update-prices-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	.analytics-loading,
	.no-analytics,
	.no-data {
		text-align: center;
		color: rgba(232, 233, 237, 0.7);
		font-size: 1.2rem;
		margin: 4rem 0;
		padding: 3rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px dashed rgba(255, 255, 255, 0.1);
		border-radius: 20px;
	}

	.analytics-content {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	@media (max-width: 768px) {
		.analytics-header {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
			align-items: center;
		}
	}
</style>