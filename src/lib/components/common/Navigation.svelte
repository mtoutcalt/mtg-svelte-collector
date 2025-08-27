<script lang="ts">
	export let viewingCollection: boolean = false;
	export let viewingAnalytics: boolean = false;
	export let collectionCount: number = 0;
	export let uniqueCardCount: number = 0;
	
	import { createEventDispatcher } from 'svelte';
	
	const dispatch = createEventDispatcher();
	
	function toggleCollectionView() {
		dispatch('toggleCollection');
	}
	
	function toggleAnalyticsView() {
		dispatch('toggleAnalytics');
	}
</script>

<h1 class="main-title">Magic Card Search</h1>

<div class="top-nav">
	<button class="collection-button" on:click={toggleCollectionView}>
		{viewingCollection ? '← Back to Search' : `📚 View Collection (${collectionCount} cards, ${uniqueCardCount} unique)`}
	</button>
	<button class="analytics-button" on:click={toggleAnalyticsView}>
		{viewingAnalytics ? '← Back to Search' : '📊 Analytics'}
	</button>
</div>

<style>
	.main-title {
		text-align: center;
		font-family: 'Cinzel', serif;
		font-size: clamp(2.5rem, 5vw, 4rem);
		font-weight: 700;
		background: linear-gradient(45deg, #c9b037, #f4e58c, #c9b037, #8b7328);
		background-size: 300% 300%;
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		text-shadow: 0 4px 20px rgba(201, 176, 55, 0.5);
		margin: 0 0 3rem 0;
		animation: shimmer 3s ease-in-out infinite;
		letter-spacing: 2px;
		position: relative;
	}

	.main-title::after {
		content: '';
		position: absolute;
		bottom: -10px;
		left: 50%;
		transform: translateX(-50%);
		width: 200px;
		height: 2px;
		background: linear-gradient(90deg, transparent, #c9b037, transparent);
		border-radius: 2px;
	}

	@keyframes shimmer {
		0%, 100% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
	}
	
	.top-nav {
		display: flex;
		justify-content: center;
		gap: 20px;
		margin-bottom: 3rem;
	}
	
	.collection-button {
		background: linear-gradient(135deg, #6a4c93 0%, #9b59b6 100%);
		color: white;
		border: none;
		padding: 14px 28px;
		border-radius: 25px;
		cursor: pointer;
		font-size: 16px;
		font-family: 'Cinzel', serif;
		font-weight: 600;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 8px 25px rgba(106, 76, 147, 0.4);
		position: relative;
		overflow: hidden;
	}

	.collection-button::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
		transition: left 0.5s;
	}

	.collection-button:hover::before {
		left: 100%;
	}
	
	.collection-button:hover {
		transform: translateY(-3px);
		box-shadow: 0 12px 35px rgba(106, 76, 147, 0.6);
		background: linear-gradient(135deg, #7c5ba6 0%, #a569c7 100%);
	}
	
	.analytics-button {
		background: linear-gradient(135deg, #c9b037 0%, #f4e58c 100%);
		color: #0a0e1a;
		border: none;
		padding: 14px 28px;
		border-radius: 25px;
		cursor: pointer;
		font-size: 16px;
		font-family: 'Cinzel', serif;
		font-weight: 600;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 8px 25px rgba(201, 176, 55, 0.4);
		position: relative;
		overflow: hidden;
	}

	.analytics-button::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
		transition: left 0.5s;
	}

	.analytics-button:hover::before {
		left: 100%;
	}

	.analytics-button:hover {
		transform: translateY(-3px);
		box-shadow: 0 12px 35px rgba(201, 176, 55, 0.6);
		background: linear-gradient(135deg, #d4bd3a 0%, #f7ea95 100%);
	}
</style>