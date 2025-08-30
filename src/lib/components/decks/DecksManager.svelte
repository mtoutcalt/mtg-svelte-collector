<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import CreateDeckForm from './CreateDeckForm.svelte';
	import DeckList from './DeckList.svelte';
	import DeckView from './DeckView.svelte';
	
	export let showDecks: boolean = false;
	
	const dispatch = createEventDispatcher();
	
	let decks: any[] = [];
	let selectedDeck: any = null;
	let loading = false;
	let creating = false;
	let viewingDeck = false;
	
	onMount(() => {
		if (showDecks) {
			loadDecks();
		}
	});
	
	$: if (showDecks && decks.length === 0) {
		loadDecks();
	}
	
	async function loadDecks() {
		loading = true;
		try {
			const response = await fetch('/api/decks');
			if (response.ok) {
				decks = await response.json();
			} else {
				console.error('Failed to load decks:', response.statusText);
			}
		} catch (error) {
			console.error('Error loading decks:', error);
		}
		loading = false;
	}
	
	async function createDeck(event: CustomEvent) {
		const { name, description } = event.detail;
		creating = true;
		
		try {
			const response = await fetch('/api/decks', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name, description })
			});
			
			if (response.ok) {
				const newDeck = await response.json();
				decks = [newDeck, ...decks];
			} else {
				const error = await response.json();
				alert(error.error || 'Failed to create deck');
			}
		} catch (error) {
			console.error('Error creating deck:', error);
			alert('Failed to create deck');
		}
		
		creating = false;
	}
	
	async function selectDeck(event: CustomEvent) {
		const deck = event.detail;
		loading = true;
		
		try {
			const response = await fetch(`/api/decks/${deck.id}`);
			if (response.ok) {
				selectedDeck = await response.json();
				viewingDeck = true;
			} else {
				console.error('Failed to load deck:', response.statusText);
				alert('Failed to load deck details');
			}
		} catch (error) {
			console.error('Error loading deck:', error);
			alert('Failed to load deck details');
		}
		
		loading = false;
	}
	
	async function deleteDeck(event: CustomEvent) {
		const deckId = event.detail;
		
		try {
			const response = await fetch(`/api/decks/${deckId}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				decks = decks.filter(deck => deck.id !== deckId);
			} else {
				const error = await response.json();
				alert(error.error || 'Failed to delete deck');
			}
		} catch (error) {
			console.error('Error deleting deck:', error);
			alert('Failed to delete deck');
		}
	}
	
	function backToDecks() {
		viewingDeck = false;
		selectedDeck = null;
	}
	
	function handleOpenImageModal(event: CustomEvent) {
		dispatch('openImageModal', event.detail);
	}
	
	async function updateCardQuantity(event: CustomEvent) {
		const { deckId, cardId, quantity } = event.detail;
		
		try {
			const response = await fetch(`/api/decks/${deckId}/cards`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ cardId, quantity })
			});
			
			if (response.ok) {
				// Reload deck to get updated card list
				const deckResponse = await fetch(`/api/decks/${deckId}`);
				if (deckResponse.ok) {
					selectedDeck = await deckResponse.json();
				}
				
				// Update the deck in the main list too
				const deckIndex = decks.findIndex(d => d.id === deckId);
				if (deckIndex >= 0) {
					const listResponse = await fetch('/api/decks');
					if (listResponse.ok) {
						const updatedDecks = await listResponse.json();
						const updatedDeck = updatedDecks.find((d: any) => d.id === deckId);
						if (updatedDeck) {
							decks[deckIndex] = updatedDeck;
							decks = [...decks];
						}
					}
				}
			} else {
				const error = await response.json();
				alert(error.error || 'Failed to update card quantity');
			}
		} catch (error) {
			console.error('Error updating card quantity:', error);
			alert('Failed to update card quantity');
		}
	}
	
	async function removeCardFromDeck(event: CustomEvent) {
		const { deckId, cardId } = event.detail;
		
		try {
			const response = await fetch(`/api/decks/${deckId}/cards`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ cardId })
			});
			
			if (response.ok) {
				// Reload deck to get updated card list
				const deckResponse = await fetch(`/api/decks/${deckId}`);
				if (deckResponse.ok) {
					selectedDeck = await deckResponse.json();
				}
				
				// Update the deck in the main list too
				const deckIndex = decks.findIndex(d => d.id === deckId);
				if (deckIndex >= 0) {
					const listResponse = await fetch('/api/decks');
					if (listResponse.ok) {
						const updatedDecks = await listResponse.json();
						const updatedDeck = updatedDecks.find((d: any) => d.id === deckId);
						if (updatedDeck) {
							decks[deckIndex] = updatedDeck;
							decks = [...decks];
						}
					}
				}
			} else {
				const error = await response.json();
				alert(error.error || 'Failed to remove card from deck');
			}
		} catch (error) {
			console.error('Error removing card from deck:', error);
			alert('Failed to remove card from deck');
		}
	}
</script>

{#if showDecks}
	<div class="decks-manager">
		{#if !viewingDeck}
			<div class="decks-header">
				<h2>🃏 Deck Builder</h2>
				<p>Create and manage your Magic: The Gathering decks</p>
			</div>
			
			<CreateDeckForm 
				{creating}
				on:createDeck={createDeck}
			/>
			
			<DeckList 
				{decks}
				{loading}
				on:selectDeck={selectDeck}
				on:deleteDeck={deleteDeck}
			/>
		{:else}
			<DeckView
				deck={selectedDeck}
				{loading}
				on:backToDecks={backToDecks}
				on:openImageModal={handleOpenImageModal}
				on:updateCardQuantity={updateCardQuantity}
				on:removeCardFromDeck={removeCardFromDeck}
			/>
		{/if}
	</div>
{/if}

<style>
	.decks-manager {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}
	
	.decks-header {
		text-align: center;
		margin-bottom: 3rem;
		padding: 2rem 0;
	}
	
	.decks-header h2 {
		font-family: 'Cinzel', serif;
		font-size: 2.5rem;
		color: #c9b037;
		margin: 0 0 1rem 0;
		text-shadow: 0 2px 10px rgba(201, 176, 55, 0.3);
	}
	
	.decks-header p {
		color: rgba(232, 233, 237, 0.7);
		font-size: 1.2rem;
		margin: 0;
	}
	
	@media (max-width: 768px) {
		.decks-header h2 {
			font-size: 2rem;
		}
		
		.decks-header p {
			font-size: 1rem;
		}
	}
</style>