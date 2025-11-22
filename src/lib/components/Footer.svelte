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
			Built at <a href="https://starspace.group" target="_blank" rel="noopener noreferrer" class="footer-link">*Space</a> | Open Source on <a href="https://github.com/starspacegroup/dashboard" target="_blank" rel="noopener noreferrer" class="footer-link">GitHub</a>
		</div>
	</div>
</footer>

<style>
	.footer {
		background: var(--surface);
		border-top: 3px solid var(--primary-color);
		padding: 2rem 2rem 1.5rem;
		margin-top: auto;
		position: relative;
	}

	.footer-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		max-width: 1400px;
		margin: 0 auto;
		flex-wrap: wrap;
		gap: 1.25rem;
	}

	.footer-copyright {
		color: var(--text-secondary);
		font-size: 0.85rem;
		font-weight: 500;
	}

	.footer-links {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.footer-link {
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.85rem;
		font-weight: 600;
		transition: all 100ms cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		border-bottom: 2px solid transparent;
	}

	.footer-link:hover {
		color: var(--primary-color);
		border-bottom-color: var(--primary-color);
	}

	.footer-separator {
		color: var(--text-secondary);
		font-size: 0.85rem;
		opacity: 0.5;
	}

	.footer-attribution {
		color: var(--text-secondary);
		font-size: 0.85rem;
		font-weight: 500;
	}

	/* Mobile optimizations */
	@media (max-width: 768px) {
		.footer {
			padding: 1.5rem 1rem 1.25rem;
		}

		.footer-content {
			flex-direction: column;
			text-align: center;
			gap: 1rem;
		}

		.footer-copyright,
		.footer-links,
		.footer-attribution {
			font-size: 0.8rem;
		}
	}

	@media (max-width: 480px) {
		.footer {
			padding: 1.25rem 0.75rem 1rem;
		}

		.footer-links {
			flex-direction: column;
			gap: 0.5rem;
		}

		.footer-separator {
			display: none;
		}
	}
</style>
