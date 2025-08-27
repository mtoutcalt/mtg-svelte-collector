<script lang="ts">
	export let show: boolean = false;
	export let imageSrc: string = '';
	export let imageName: string = '';
	
	import { createEventDispatcher } from 'svelte';
	
	const dispatch = createEventDispatcher();
	
	function closeModal() {
		dispatch('close');
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' || e.key === 'Enter') {
			closeModal();
		}
	}
	
	function handleOverlayClick() {
		closeModal();
	}
	
	function handleContentClick(e: Event) {
		e.stopPropagation();
	}
</script>

{#if show}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={handleOverlayClick} on:keydown={handleKeydown} role="button" tabindex="0" aria-label="Close modal">
		<div class="modal-content" on:click={handleContentClick}>
			<button class="modal-close" on:click={closeModal} title="Close">&times;</button>
			<img src={imageSrc} alt={imageName} class="modal-image" />
			<div class="modal-title">{imageName}</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.85);
		backdrop-filter: blur(20px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		animation: modalFadeIn 0.3s ease-out;
	}

	.modal-content {
		position: relative;
		max-width: 90vw;
		max-height: 90vh;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 20px;
		backdrop-filter: blur(20px);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
		padding: 20px;
		animation: modalSlideIn 0.3s ease-out;
	}

	.modal-close {
		position: absolute;
		top: 10px;
		right: 10px;
		background: linear-gradient(135deg, #f44336 0%, #e57373 100%);
		border: none;
		color: white;
		font-size: 28px;
		font-weight: bold;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 1001;
		box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4);
	}

	.modal-close:hover {
		transform: scale(1.1);
		background: linear-gradient(135deg, #f55a4e 0%, #ef5350 100%);
		box-shadow: 0 8px 25px rgba(244, 67, 54, 0.6);
	}

	.modal-image {
		max-width: 100%;
		max-height: 80vh;
		width: auto;
		height: auto;
		border-radius: 15px;
		box-shadow: 
			0 20px 40px rgba(0, 0, 0, 0.6),
			0 0 0 1px rgba(255, 255, 255, 0.1);
		display: block;
		margin: 0 auto;
	}

	.modal-title {
		text-align: center;
		margin-top: 15px;
		font-family: 'Cinzel', serif;
		font-size: 1.5rem;
		font-weight: 600;
		color: #c9b037;
		text-shadow: 0 2px 10px rgba(201, 176, 55, 0.5);
	}

	@keyframes modalFadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes modalSlideIn {
		from {
			opacity: 0;
			transform: translateY(-50px) scale(0.9);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>