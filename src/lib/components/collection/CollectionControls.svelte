<script lang="ts">
	export let colorFilter: string | null = null;
	export let sortBy: string = 'value-desc';
	export let searchFilter: string = '';
	export let favoritesOnly: boolean = false;

	function setColorFilter(filter: string | null) {
		colorFilter = filter;
	}

	function clearColorFilter() {
		colorFilter = null;
	}
</script>

<div class="collection-controls">
	<div class="search-section">
		<label for="search-input" class="search-label">Search cards:</label>
		<input
			id="search-input"
			type="text"
			bind:value={searchFilter}
			placeholder="Type to filter cards..."
			class="search-input"
		/>
	</div>
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
	<div class="favorites-filter-section">
		<button
			class="favorites-filter-btn {favoritesOnly ? 'active' : ''}"
			on:click={() => favoritesOnly = !favoritesOnly}
			title={favoritesOnly ? 'Show all cards' : 'Show only favorites'}
		>
			{favoritesOnly ? '⭐ Favorites Only' : '☆ Show Favorites'}
		</button>
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
			<option value="favorites-first">⭐ Favorites First</option>
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

	.search-section {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 8px;
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

	.search-label,
	.filter-label {
		font-family: 'Cinzel', serif;
		font-size: 0.9rem;
		font-weight: 600;
		color: rgba(232, 233, 237, 0.8);
		margin: 0;
	}

	.search-input {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%);
		border: 2px solid rgba(255, 255, 255, 0.15);
		border-radius: 12px;
		color: #e8e9ed;
		font-family: 'Crimson Text', serif;
		font-size: 1rem;
		padding: 10px 14px;
		transition: all 0.3s ease;
		backdrop-filter: blur(5px);
		min-width: 250px;
	}

	.search-input:focus {
		outline: none;
		border-color: #c9b037;
		box-shadow: 0 0 15px rgba(201, 176, 55, 0.3);
		background: rgba(255, 255, 255, 0.12);
	}

	.search-input:hover {
		border-color: #c9b037;
		background: rgba(255, 255, 255, 0.12);
	}

	.search-input::placeholder {
		color: rgba(232, 233, 237, 0.5);
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

	.favorites-filter-section {
		margin: 0;
	}

	.favorites-filter-btn {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		border: 2px solid rgba(201, 176, 55, 0.5);
		border-radius: 10px;
		background: rgba(0, 0, 0, 0.3);
		color: rgba(201, 176, 55, 0.8);
		cursor: pointer;
		transition: all 0.3s ease;
		backdrop-filter: blur(5px);
		font-family: 'Cinzel', serif;
		font-weight: 600;
	}

	.favorites-filter-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(201, 176, 55, 0.3);
	}

	.favorites-filter-btn.active {
		background: linear-gradient(135deg, rgba(201, 176, 55, 0.3), rgba(255, 215, 0, 0.3));
		border-color: #ffd700;
		color: #ffd700;
		box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
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

		.search-section,
		.filter-section,
		.sort-section {
			align-items: center;
		}

		.search-input,
		.sort-dropdown {
			min-width: 250px;
		}

		.color-filters {
			flex-wrap: wrap;
			justify-content: center;
		}
	}
</style>