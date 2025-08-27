<script lang="ts">
	export let colorFilter: string | null = null;
	export let sortBy: string = 'value-desc';
	
	function setColorFilter(filter: string | null) {
		colorFilter = filter;
	}
	
	function clearColorFilter() {
		colorFilter = null;
	}
</script>

<div class="collection-controls">
	<div class="filter-section">
		<div class="filter-label">Filter by color:</div>
		<div class="color-filters">
			<button 
				class="color-filter-btn {colorFilter === null ? 'active' : ''}" 
				on:click={clearColorFilter}
				title="Show all colors"
			>
				All
			</button>
			<button 
				class="color-filter-btn white {colorFilter === 'White' ? 'active' : ''}" 
				on:click={() => setColorFilter('White')}
				title="White cards only"
			>
				⚪
			</button>
			<button 
				class="color-filter-btn blue {colorFilter === 'Blue' ? 'active' : ''}" 
				on:click={() => setColorFilter('Blue')}
				title="Blue cards only"
			>
				🔵
			</button>
			<button 
				class="color-filter-btn black {colorFilter === 'Black' ? 'active' : ''}" 
				on:click={() => setColorFilter('Black')}
				title="Black cards only"
			>
				⚫
			</button>
			<button 
				class="color-filter-btn red {colorFilter === 'Red' ? 'active' : ''}" 
				on:click={() => setColorFilter('Red')}
				title="Red cards only"
			>
				🔴
			</button>
			<button 
				class="color-filter-btn green {colorFilter === 'Green' ? 'active' : ''}" 
				on:click={() => setColorFilter('Green')}
				title="Green cards only"
			>
				🟢
			</button>
			<button 
				class="color-filter-btn multicolor {colorFilter === 'Multicolor' ? 'active' : ''}" 
				on:click={() => setColorFilter('Multicolor')}
				title="Multicolor cards only"
			>
				🌈
			</button>
			<button 
				class="color-filter-btn colorless {colorFilter === 'Colorless' ? 'active' : ''}" 
				on:click={() => setColorFilter('Colorless')}
				title="Colorless cards only"
			>
				◯
			</button>
		</div>
	</div>
	<div class="sort-section">
		<label for="sort-select" class="sort-label">Sort by:</label>
		<select id="sort-select" bind:value={sortBy} class="sort-dropdown">
			<option value="value-desc">💰 Price (High to Low)</option>
			<option value="value-asc">💰 Price (Low to High)</option>
			<option value="name-asc">🔤 Name (A to Z)</option>
			<option value="name-desc">🔤 Name (Z to A)</option>
			<option value="type-asc">🎴 Type (A to Z)</option>
			<option value="type-desc">🎴 Type (Z to A)</option>
			<option value="quantity-desc">📊 Quantity (Most First)</option>
			<option value="quantity-asc">📊 Quantity (Least First)</option>
			<option value="color-wubrg">🌈 Color (WUBRG Order)</option>
		</select>
	</div>
</div>

<style>
	.collection-controls {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 15px;
	}

	.filter-section {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 8px;
	}

	.sort-section {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 8px;
	}

	.filter-label {
		font-family: 'Cinzel', serif;
		font-size: 0.9rem;
		font-weight: 600;
		color: rgba(232, 233, 237, 0.8);
		margin: 0;
	}

	.color-filters {
		display: flex;
		gap: 4px;
		align-items: center;
	}

	.color-filter-btn {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%);
		border: 2px solid rgba(255, 255, 255, 0.15);
		border-radius: 12px;
		color: #e8e9ed;
		font-size: 1.2rem;
		padding: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		backdrop-filter: blur(5px);
		min-width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Crimson Text', serif;
	}

	.color-filter-btn:hover {
		border-color: #c9b037;
		background: rgba(255, 255, 255, 0.12);
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(201, 176, 55, 0.3);
	}

	.color-filter-btn.active {
		border-color: #c9b037;
		background: linear-gradient(135deg, #c9b037 0%, #f4e58c 100%);
		color: #0a0e1a;
		box-shadow: 0 6px 20px rgba(201, 176, 55, 0.6);
		transform: translateY(-1px);
	}

	.color-filter-btn.active:hover {
		background: linear-gradient(135deg, #d4bd3a 0%, #f7ea95 100%);
	}

	.sort-label {
		font-family: 'Cinzel', serif;
		font-size: 0.9rem;
		font-weight: 600;
		color: rgba(232, 233, 237, 0.8);
		margin: 0;
	}

	.sort-dropdown {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%);
		border: 2px solid rgba(255, 255, 255, 0.15);
		border-radius: 12px;
		color: #e8e9ed;
		font-family: 'Crimson Text', serif;
		font-size: 0.9rem;
		padding: 8px 10px;
		cursor: pointer;
		transition: all 0.3s ease;
		backdrop-filter: blur(5px);
		min-width: 200px;
	}

	.sort-dropdown:focus {
		outline: none;
		border-color: #c9b037;
		box-shadow: 0 0 15px rgba(201, 176, 55, 0.3);
	}

	.sort-dropdown:hover {
		border-color: #c9b037;
		background: rgba(255, 255, 255, 0.12);
	}

	.sort-dropdown option {
		background: #1a1f3a;
		color: #e8e9ed;
		padding: 8px;
	}

	@media (max-width: 768px) {
		.collection-controls {
			align-items: center;
		}

		.filter-section,
		.sort-section {
			align-items: center;
		}

		.sort-dropdown {
			min-width: 250px;
		}

		.color-filters {
			flex-wrap: wrap;
			justify-content: center;
		}
	}
</style>