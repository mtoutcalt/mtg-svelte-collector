<div class="card-info">
	<div class="card-content">
		<div class="card-image skeleton"></div>
		<div class="card-details">
			<div class="skeleton skeleton-title"></div>
			<div class="skeleton skeleton-text"></div>
			<div class="skeleton skeleton-text"></div>
			<div class="skeleton skeleton-text-long"></div>
		</div>
	</div>
</div>

<style>
	.card-info {
		max-width: 900px;
		margin: 2rem auto;
		padding: 30px;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 25px;
		backdrop-filter: blur(20px);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}
	
	.card-content {
		display: flex;
		gap: 30px;
		align-items: flex-start;
	}
	
	.card-image {
		width: 280px;
		height: 390px;
		flex-shrink: 0;
		border-radius: 20px;
	}
	
	.card-details {
		flex: 1;
	}
	
	.skeleton {
		background: linear-gradient(
			90deg, 
			rgba(255, 255, 255, 0.05) 25%, 
			rgba(255, 255, 255, 0.15) 50%, 
			rgba(255, 255, 255, 0.05) 75%
		);
		background-size: 200% 100%;
		animation: loading 2s ease-in-out infinite;
		border-radius: 10px;
	}
	
	.skeleton-title {
		height: 40px;
		width: 60%;
		margin-bottom: 20px;
	}
	
	.skeleton-text {
		height: 20px;
		width: 80%;
		margin-bottom: 12px;
	}
	
	.skeleton-text-long {
		height: 20px;
		width: 100%;
		margin-bottom: 8px;
	}
	
	@keyframes loading {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	@media (max-width: 768px) {
		.card-content {
			flex-direction: column;
			align-items: center;
		}
		
		.card-image {
			width: 100%;
			max-width: 280px;
		}
	}
</style>