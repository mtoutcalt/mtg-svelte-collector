<script lang="ts">
	export let analyticsData: any = null;
</script>

{#if analyticsData}
	<div class="portfolio-summary">
		<h3>Portfolio Overview</h3>
		<div class="summary-cards">
			<div class="summary-card">
				<div class="card-value">${analyticsData.portfolioSummary.totalValue.toFixed(2)}</div>
				<div class="card-label">Total Value</div>
			</div>
			<div class="summary-card">
				<div class="card-value">{analyticsData.portfolioSummary.totalCards}</div>
				<div class="card-label">Total Cards</div>
			</div>
			<div class="summary-card">
				<div class="card-value">{analyticsData.portfolioSummary.uniqueCards}</div>
				<div class="card-label">Unique Cards</div>
			</div>
		</div>
		
		<!-- Performance Summary -->
		{#if analyticsData.portfolioSummary.sixMonthGain !== null || analyticsData.portfolioSummary.twelveMonthGain !== null}
			<div class="performance-summary">
				{#if analyticsData.portfolioSummary.sixMonthGain !== null}
					<div class="performance-card {analyticsData.portfolioSummary.sixMonthGain >= 0 ? 'positive' : 'negative'}">
						<div class="performance-value">
							{analyticsData.portfolioSummary.sixMonthGain >= 0 ? '+' : ''}${analyticsData.portfolioSummary.sixMonthGain.toFixed(2)}
						</div>
						<div class="performance-percentage">
							({analyticsData.portfolioSummary.sixMonthChange >= 0 ? '+' : ''}{analyticsData.portfolioSummary.sixMonthChange.toFixed(1)}%)
						</div>
						<div class="performance-label">6 Month Change</div>
					</div>
				{/if}
				
				{#if analyticsData.portfolioSummary.twelveMonthGain !== null}
					<div class="performance-card {analyticsData.portfolioSummary.twelveMonthGain >= 0 ? 'positive' : 'negative'}">
						<div class="performance-value">
							{analyticsData.portfolioSummary.twelveMonthGain >= 0 ? '+' : ''}${analyticsData.portfolioSummary.twelveMonthGain.toFixed(2)}
						</div>
						<div class="performance-percentage">
							({analyticsData.portfolioSummary.twelveMonthChange >= 0 ? '+' : ''}{analyticsData.portfolioSummary.twelveMonthChange.toFixed(1)}%)
						</div>
						<div class="performance-label">12 Month Change</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.portfolio-summary {
		margin-bottom: 3rem;
		padding: 30px;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 20px;
		backdrop-filter: blur(20px);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.portfolio-summary h3 {
		margin: 0 0 2rem 0;
		font-family: 'Cinzel', serif;
		font-size: 1.5rem;
		color: #c9b037;
		text-align: center;
	}

	.summary-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 20px;
		margin-bottom: 2rem;
	}

	.summary-card {
		text-align: center;
		padding: 20px;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 15px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.summary-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
	}

	.card-value {
		font-size: 2rem;
		font-weight: 700;
		color: #c9b037;
		font-family: 'Cinzel', serif;
		margin-bottom: 0.5rem;
	}

	.card-label {
		font-size: 0.9rem;
		color: rgba(232, 233, 237, 0.8);
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.performance-summary {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 20px;
	}

	.performance-card {
		text-align: center;
		padding: 20px;
		border-radius: 15px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		border: 2px solid;
	}

	.performance-card.positive {
		background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%);
		border-color: #4caf50;
		color: #4caf50;
	}

	.performance-card.negative {
		background: linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(244, 67, 54, 0.05) 100%);
		border-color: #f44336;
		color: #f44336;
	}

	.performance-value {
		font-size: 1.5rem;
		font-weight: 700;
		font-family: 'Cinzel', serif;
		margin-bottom: 0.5rem;
	}

	.performance-percentage {
		font-size: 1rem;
		margin-bottom: 0.5rem;
	}

	.performance-label {
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 1px;
		opacity: 0.8;
	}
</style>