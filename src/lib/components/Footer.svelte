<footer class="footer">
	<div class="footer-content">
		<div class="footer-copyright">
			© {new Date().getFullYear()} Dashboard. All rights reserved.
		</div>
		<div class="footer-links">
			<a href="/terms-of-service" class="footer-link">Terms of Service</a>
			<span class="footer-separator">•</span>
			<a href="/privacy-policy" class="footer-link">Privacy Policy</a>
		</div>
		<div class="footer-attribution">
			Built at <a href="https://starspace.group" target="_blank" rel="noopener noreferrer" class="footer-link">*Space</a>
		</div>
	</div>
</footer>

<style>
	.footer {
		background-color: var(--surface);
		border-top: 1px solid var(--border);
		padding: 1.5rem 2rem;
		margin-top: auto;
	}

	.footer-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		max-width: 1400px;
		margin: 0 auto;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.footer-copyright {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.footer-links {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.footer-link {
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.875rem;
		transition: color 0.2s;
	}

	.footer-link:hover {
		color: var(--primary-color);
	}

	.footer-separator {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.footer-attribution {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	/* Responsive layout for smaller screens */
	@media (max-width: 768px) {
		.footer-content {
			flex-direction: column;
			text-align: center;
		}
	}
</style>
