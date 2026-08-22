<script lang="ts">
	export let cardName: string = '';
	export let loading: boolean = false;

	import { createEventDispatcher, onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	let inputEl: HTMLInputElement;
	let focused = false;

	onMount(() => {
		inputEl?.focus();
	});

	function handleSearch() {
		dispatch('search');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleSearch();
		} else if (e.key === 'Escape' && cardName) {
			e.preventDefault();
			cardName = '';
		}
	}

	// Press "/" anywhere on the page to jump back to the search field
	function handleWindowKeydown(e: KeyboardEvent) {
		if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
		const target = e.target as HTMLElement | null;
		if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
		e.preventDefault();
		inputEl?.focus();
		inputEl?.select();
	}

	function clearSearch() {
		cardName = '';
		inputEl?.focus();
	}
</script>

<svelte:window on:keydown={handleWindowKeydown} />

<section class="search-hero">
	<div class="hero-glow" aria-hidden="true"></div>

	<h1 class="search-title">Search the Multiverse</h1>
	<p class="search-sub">Find any Magic card and add it to your collection</p>

	<div class="search-container" class:focused>
		<div class="search-input-wrap">
			<svg class="search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
				<circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.5"/>
				<path d="M13 13l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			</svg>
			<input
				bind:this={inputEl}
				bind:value={cardName}
				placeholder="Lightning Bolt…"
				on:keydown={handleKeydown}
				on:focus={() => (focused = true)}
				on:blur={() => (focused = false)}
				aria-label="Search for a Magic card"
				autocomplete="off"
				spellcheck="false"
			/>
			{#if cardName}
				<button class="clear-btn" on:click={clearSearch} aria-label="Clear search" type="button">
					<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
						<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
					</svg>
				</button>
			{:else if !focused}
				<kbd class="slash-hint" aria-hidden="true">/</kbd>
			{/if}
		</div>
		<button class="search-btn" on:click={handleSearch} disabled={loading} class:loading>
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

	<p class="search-hint">
		Press <kbd>/</kbd> to search from anywhere · <kbd>Enter</kbd> to go · <kbd>Esc</kbd> to clear
	</p>
</section>

<style>
	.search-hero {
		position: relative;
		max-width: 880px;
		margin: clamp(1.25rem, 4vh, 3rem) auto clamp(2rem, 5vh, 3.5rem);
		padding: 0 4px;
		text-align: center;
	}

	/* Ambient gold wash so the search block owns the top of the page */
	.hero-glow {
		position: absolute;
		left: 50%;
		top: 45%;
		width: 130%;
		height: 320px;
		transform: translate(-50%, -50%);
		background: radial-gradient(ellipse 50% 50% at 50% 50%, rgba(201, 176, 55, 0.13) 0%, transparent 70%);
		pointer-events: none;
		z-index: -1;
	}

	.search-title {
		margin: 0 0 0.5rem;
		font-family: var(--font-display, 'Cinzel', serif);
		font-size: clamp(1.9rem, 5.2vw, 3rem);
		font-weight: 700;
		letter-spacing: 1px;
		line-height: 1.15;
		background: linear-gradient(135deg, #f4e58c 0%, #c9b037 55%, #8b7328 100%);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		color: #c9b037;
	}

	.search-sub {
		margin: 0 0 clamp(1.25rem, 3vw, 2rem);
		font-size: clamp(0.95rem, 1.8vw, 1.15rem);
		color: rgba(232, 233, 237, 0.55);
		font-style: italic;
	}

	.search-container {
		display: flex;
		gap: 12px;
		padding: 12px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 24px;
		backdrop-filter: blur(16px);
		box-shadow: 0 18px 48px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06);
		transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
	}

	.search-container.focused {
		border-color: rgba(201, 176, 55, 0.5);
		box-shadow: 0 22px 56px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(201, 176, 55, 0.13);
		transform: translateY(-1px);
	}

	.search-input-wrap {
		flex: 1;
		position: relative;
		display: flex;
		align-items: center;
		min-width: 0;
	}

	.search-icon {
		position: absolute;
		left: 20px;
		width: 26px;
		height: 26px;
		color: rgba(232, 233, 237, 0.4);
		pointer-events: none;
		flex-shrink: 0;
		transition: color 0.25s ease;
	}

	.search-container.focused .search-icon {
		color: rgba(201, 176, 55, 0.85);
	}

	input {
		width: 100%;
		min-width: 0;
		padding: 20px 56px 20px 60px;
		border: none;
		border-radius: 16px;
		background: transparent;
		color: #e8e9ed;
		font-size: clamp(1.1rem, 2.4vw, 1.5rem);
		font-family: var(--font-body, 'Crimson Text', serif);
		outline: none;
	}

	input::placeholder {
		color: rgba(232, 233, 237, 0.32);
	}

	.slash-hint,
	.search-hint kbd {
		font-family: var(--font-body, 'Crimson Text', serif);
		background: rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.14);
		border-radius: 6px;
		color: rgba(232, 233, 237, 0.5);
	}

	.slash-hint {
		position: absolute;
		right: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 26px;
		height: 26px;
		padding: 0 7px;
		font-size: 0.9rem;
		pointer-events: none;
	}

	.clear-btn {
		position: absolute;
		right: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.08);
		color: rgba(232, 233, 237, 0.6);
		cursor: pointer;
		transition: background 0.2s ease, color 0.2s ease;
	}

	.clear-btn:hover {
		background: rgba(255, 255, 255, 0.16);
		color: #e8e9ed;
	}

	.clear-btn svg {
		width: 15px;
		height: 15px;
	}

	.search-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 9px;
		padding: 0 clamp(24px, 4vw, 40px);
		border: none;
		border-radius: 16px;
		background: linear-gradient(135deg, #c9b037 0%, #e8d06a 100%);
		color: #0a0e1a;
		cursor: pointer;
		font-size: clamp(0.95rem, 1.8vw, 1.15rem);
		font-family: var(--font-display, 'Cinzel', serif);
		font-weight: 700;
		letter-spacing: 0.5px;
		transition: opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
		box-shadow: 0 6px 20px rgba(201, 176, 55, 0.4);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.search-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 10px 28px rgba(201, 176, 55, 0.55);
		opacity: 0.95;
	}

	.search-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.search-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner {
		width: 17px;
		height: 17px;
		animation: spin 0.8s linear infinite;
		flex-shrink: 0;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.search-hint {
		margin: 1rem 0 0;
		font-size: 0.85rem;
		color: rgba(232, 233, 237, 0.35);
	}

	.search-hint kbd {
		display: inline-block;
		padding: 1px 6px;
		font-size: 0.8rem;
		line-height: 1.4;
	}

	@media (max-width: 560px) {
		.search-container {
			flex-direction: column;
			gap: 10px;
			padding: 10px;
			border-radius: 20px;
		}

		input {
			padding: 16px 50px 16px 52px;
		}

		.search-icon {
			left: 16px;
			width: 22px;
			height: 22px;
		}

		.search-btn {
			padding: 16px 24px;
		}

		.search-hint {
			font-size: 0.78rem;
		}
	}
</style>
