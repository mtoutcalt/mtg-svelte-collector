<script lang="ts">
	export let cardName: string = '';
	export let loading: boolean = false;
	
	import { createEventDispatcher } from 'svelte';
	
	const dispatch = createEventDispatcher();
	
	function handleSearch() {
		dispatch('search');
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleSearch();
		}
	}
</script>

<div class="search-container">
	<input 
		bind:value={cardName} 
		placeholder="Enter card name (e.g., Lightning Bolt)"
		on:keydown={handleKeydown}
	/>
	<button on:click={handleSearch} disabled={loading}>
		{loading ? 'Searching...' : 'Search'}
	</button>
</div>

<style>
	.search-container {
		max-width: 600px;
		margin: 2rem auto;
		display: flex;
		gap: 15px;
		padding: 20px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 20px;
		backdrop-filter: blur(10px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}
	
	input {
		flex: 1;
		padding: 15px 20px;
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 15px;
		background: rgba(255, 255, 255, 0.08);
		color: #e8e9ed;
		font-size: 16px;
		font-family: 'Crimson Text', serif;
		backdrop-filter: blur(5px);
		transition: all 0.3s ease;
	}

	input::placeholder {
		color: rgba(232, 233, 237, 0.6);
	}

	input:focus {
		outline: none;
		border-color: #c9b037;
		background: rgba(255, 255, 255, 0.12);
		box-shadow: 0 0 20px rgba(201, 176, 55, 0.3);
	}
	
	button {
		padding: 15px 25px;
		border: none;
		border-radius: 15px;
		background: linear-gradient(135deg, #c9b037 0%, #f4e58c 100%);
		color: #0a0e1a;
		cursor: pointer;
		font-size: 16px;
		font-family: 'Cinzel', serif;
		font-weight: 600;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 6px 20px rgba(201, 176, 55, 0.4);
	}
	
	button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 10px 30px rgba(201, 176, 55, 0.6);
		background: linear-gradient(135deg, #d4bd3a 0%, #f7ea95 100%);
	}
	
	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
		box-shadow: 0 3px 10px rgba(201, 176, 55, 0.2);
	}

	@media (max-width: 768px) {
		.search-container {
			flex-direction: column;
			gap: 15px;
		}
	}
</style>