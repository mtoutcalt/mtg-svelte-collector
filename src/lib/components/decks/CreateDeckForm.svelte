<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	export let creating: boolean = false;
	
	const dispatch = createEventDispatcher();
	
	let deckName = '';
	let deckDescription = '';
	let showForm = false;
	
	function handleSubmit() {
		if (!deckName.trim()) return;
		
		dispatch('createDeck', {
			name: deckName.trim(),
			description: deckDescription.trim() || null
		});
		
		// Reset form
		deckName = '';
		deckDescription = '';
		showForm = false;
	}
	
	function handleCancel() {
		deckName = '';
		deckDescription = '';
		showForm = false;
	}
</script>

<div class="create-deck">
	{#if !showForm}
		<button class="create-deck-btn" on:click={() => showForm = true}>
			➕ Create New Deck
		</button>
	{:else}
		<div class="create-form">
			<h4>Create New Deck</h4>
			
			<form on:submit|preventDefault={handleSubmit}>
				<div class="form-group">
					<label for="deck-name">Deck Name *</label>
					<input
						id="deck-name"
						type="text"
						bind:value={deckName}
						placeholder="Enter deck name..."
						maxlength="100"
						required
						disabled={creating}
					/>
				</div>
				
				<div class="form-group">
					<label for="deck-description">Description</label>
					<textarea
						id="deck-description"
						bind:value={deckDescription}
						placeholder="Optional description..."
						maxlength="500"
						rows="3"
						disabled={creating}
					></textarea>
				</div>
				
				<div class="form-actions">
					<button
						type="button"
						class="cancel-btn"
						on:click={handleCancel}
						disabled={creating}
					>
						Cancel
					</button>
					<button
						type="submit"
						class="submit-btn"
						disabled={creating || !deckName.trim()}
					>
						{creating ? 'Creating...' : 'Create Deck'}
					</button>
				</div>
			</form>
		</div>
	{/if}
</div>

<style>
	.create-deck {
		margin-bottom: 2rem;
	}
	
	.create-deck-btn {
		background: linear-gradient(135deg, #2196F3 0%, #42A5F5 100%);
		color: white;
		border: none;
		padding: 1rem 1.5rem;
		border-radius: 15px;
		cursor: pointer;
		font-size: 1rem;
		font-family: 'Cinzel', serif;
		font-weight: 600;
		transition: all 0.3s;
		box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
	}
	
	.create-deck-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 30px rgba(33, 150, 243, 0.6);
	}
	
	.create-form {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 15px;
		padding: 1.5rem;
		backdrop-filter: blur(20px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}
	
	.create-form h4 {
		margin: 0 0 1.5rem 0;
		font-family: 'Cinzel', serif;
		font-size: 1.2rem;
		color: #c9b037;
	}
	
	.form-group {
		margin-bottom: 1rem;
	}
	
	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		color: #e8e9ed;
		font-weight: 600;
		font-size: 0.9rem;
	}
	
	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.05);
		color: #e8e9ed;
		font-size: 0.9rem;
		transition: border-color 0.3s;
		resize: vertical;
	}
	
	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: rgba(201, 176, 55, 0.5);
		box-shadow: 0 0 0 2px rgba(201, 176, 55, 0.2);
	}
	
	.form-group input::placeholder,
	.form-group textarea::placeholder {
		color: rgba(232, 233, 237, 0.5);
	}
	
	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
	}
	
	.cancel-btn,
	.submit-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-family: 'Cinzel', serif;
		font-weight: 600;
		transition: all 0.3s;
	}
	
	.cancel-btn {
		background: transparent;
		color: rgba(232, 233, 237, 0.7);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}
	
	.cancel-btn:hover:not(:disabled) {
		color: #e8e9ed;
		border-color: rgba(255, 255, 255, 0.3);
	}
	
	.submit-btn {
		background: linear-gradient(135deg, #c9b037 0%, #e8d055 100%);
		color: #1a1a1a;
		box-shadow: 0 4px 15px rgba(201, 176, 55, 0.3);
	}
	
	.submit-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 6px 20px rgba(201, 176, 55, 0.4);
	}
	
	.submit-btn:disabled,
	.cancel-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}
	
	@media (max-width: 768px) {
		.form-actions {
			flex-direction: column;
		}
		
		.cancel-btn,
		.submit-btn {
			width: 100%;
		}
	}
</style>