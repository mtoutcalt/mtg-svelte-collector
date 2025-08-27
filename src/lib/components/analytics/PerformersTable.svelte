<script lang="ts">
	export let title: string;
	export let performers: any[] = [];
	export let isPositive: boolean = true;
</script>

{#if performers.length > 0}
	<div class="performers-section">
		<h3>{title}</h3>
		<div class="performers-table">
			{#each performers as card}
				<div class="performer-row {isPositive ? 'positive' : 'negative'}">
					<div class="performer-name">{card.name}</div>
					<div class="performer-change">{isPositive ? '+' : ''}{card.sixMonthChange.toFixed(1)}%</div>
					<div class="performer-gain">${card.sixMonthGain.toFixed(2)}</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.performers-section {
		margin-bottom: 3rem;
		padding: 30px;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 20px;
		backdrop-filter: blur(20px);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.performers-section h3 {
		margin: 0 0 2rem 0;
		font-family: 'Cinzel', serif;
		font-size: 1.3rem;
		color: #c9b037;
	}

	.performers-table {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.performer-row {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		gap: 15px;
		align-items: center;
		padding: 10px 20px;
		border-radius: 12px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		border: 1px solid;
	}

	.performer-row.positive {
		background: linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(76, 175, 80, 0.02) 100%);
		border-color: rgba(76, 175, 80, 0.3);
	}

	.performer-row.negative {
		background: linear-gradient(135deg, rgba(244, 67, 54, 0.05) 0%, rgba(244, 67, 54, 0.02) 100%);
		border-color: rgba(244, 67, 54, 0.3);
	}

	.performer-row:hover {
		transform: translateX(10px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
	}

	.performer-name {
		font-weight: 600;
		color: #e8e9ed;
	}

	.performer-change {
		font-weight: 700;
		font-family: 'Cinzel', serif;
		text-align: right;
	}

	.performer-row.positive .performer-change {
		color: #4caf50;
	}

	.performer-row.negative .performer-change {
		color: #f44336;
	}

	.performer-gain {
		font-family: 'Cinzel', serif;
		font-weight: 600;
		text-align: right;
		color: rgba(232, 233, 237, 0.8);
	}
</style>