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

<section class="search-hero">
	<p class="search-eyebrow">Search the Multiverse</p>
	<div class="search-container">
		<div class="search-input-wrap">
			<svg class="search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
				<circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.5"/>
				<path d="M13 13l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			</svg>
			<input
				bind:value={cardName}
				placeholder="Card name, e.g. Lightning Bolt…"
				on:keydown={handleKeydown}
				aria-label="Search for a Magic card"
				autocomplete="off"
				spellcheck="false"
			/>
		</div>
		<button on:click={handleSearch} disabled={loading} class:loading>
			{#if loading}
				<svg class="spinner" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" stroke-dasharray="28 56" stroke-linecap="round"/>
				</svg>
				Searching…
			{:else}
				Search
			{/if}
		</button>
	</div>
</section>

<style>
	.search-hero {
		max-width: 680px;
		margin: 0 auto 2.5rem;
		text-align: center;
	}

	.search-eyebrow {
		margin: 0 0 1rem;
		font-family: 'Cinzel', serif;
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 2.5px;
		text-transform: uppercase;
		color: rgba(201, 176, 55, 0.6);
	}

	.search-container {
		display: flex;
		gap: 10px;
		padding: 10px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.10);
		border-radius: 18px;
		backdrop-filter: blur(14px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05);
		transition: border-color 0.25s ease, box-shadow 0.25s ease;
	}

	.search-container:focus-within {
		border-color: rgba(201, 176, 55, 0.35);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35), 0 0 0 3px rgba(201, 176, 55, 0.08);
	}

	.search-input-wrap {
		flex: 1;
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 14px;
		width: 16px;
		height: 16px;
		color: rgba(232, 233, 237, 0.35);
		pointer-events: none;
		flex-shrink: 0;
	}

	input {
		width: 100%;
		padding: 13px 16px 13px 40px;
		border: none;
		border-radius: 10px;
		background: transparent;
		color: #e8e9ed;
		font-size: 15px;
		font-family: 'Crimson Text', serif;
		outline: none;
	}

	input::placeholder {
		color: rgba(232, 233, 237, 0.38);
	}

	button {
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 13px 26px;
		border: none;
		border-radius: 10px;
		background: linear-gradient(135deg, #c9b037 0%, #e8d06a 100%);
		color: #0a0e1a;
		cursor: pointer;
		font-size: 15px;
		font-family: 'Cinzel', serif;
		font-weight: 700;
		letter-spacing: 0.3px;
		transition: opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
		box-shadow: 0 3px 12px rgba(201, 176, 55, 0.35);
		white-space: nowrap;
		flex-shrink: 0;
	}

	button:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 6px 20px rgba(201, 176, 55, 0.5);
		opacity: 0.95;
	}

	button:active:not(:disabled) {
		transform: translateY(0);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner {
		width: 14px;
		height: 14px;
		animation: spin 0.8s linear infinite;
		flex-shrink: 0;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@media (max-width: 520px) {
		.search-container {
			flex-direction: column;
			gap: 8px;
		}

		button {
			justify-content: center;
		}
	}
</style>
