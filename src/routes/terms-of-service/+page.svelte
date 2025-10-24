<svelte:head>
	<title>Terms of Service - Dashboard</title>
	<meta name="description" content="Terms of Service for Dashboard" />
</svelte:head>

<div class="legal-page">
	<div class="legal-content">
		<h1>Terms of Service</h1>
		
		<p class="last-updated">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

		<section>
			<h2>1. Acceptance of Terms</h2>
			<p>
				By accessing and using Dashboard ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
			</p>
		</section>

		<section>
			<h2>2. Use License</h2>
			<p>
				Permission is granted to temporarily use the Service for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
			</p>
			<ul>
				<li>modify or copy the materials;</li>
				<li>use the materials for any commercial purpose;</li>
				<li>attempt to decompile or reverse engineer any software contained in the Service;</li>
				<li>remove any copyright or other proprietary notations from the materials;</li>
				<li>transfer the materials to another person or "mirror" the materials on any other server.</li>
			</ul>
		</section>

		<section>
			<h2>3. Disclaimer</h2>
			<p>
				The Service is provided "as is". We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
			</p>
		</section>

		<section>
			<h2>4. Limitations</h2>
			<p>
				In no event shall Dashboard or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the Service.
			</p>
		</section>

		<section>
			<h2>5. Third-Party Services</h2>
			<p>
				The Service may integrate with third-party services such as GitHub. Your use of these third-party services is subject to their respective terms of service and privacy policies.
			</p>
		</section>

		<section>
			<h2>6. Modifications</h2>
			<p>
				We may revise these terms of service at any time without notice. By using this Service you are agreeing to be bound by the then current version of these terms of service.
			</p>
		</section>

		<section>
			<h2>7. Contact Information</h2>
			<p>
				If you have any questions about these Terms of Service, please contact us through our GitHub repository.
			</p>
		</section>
	</div>
</div>

<style>
	.legal-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	.legal-content {
		background-color: var(--surface);
		border-radius: 0.5rem;
		padding: 2rem;
		box-shadow: 0 1px 3px var(--shadow);
	}

	h1 {
		color: var(--text-primary);
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.last-updated {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin-bottom: 2rem;
		font-style: italic;
	}

	section {
		margin-bottom: 2rem;
	}

	h2 {
		color: var(--text-primary);
		font-size: 1.25rem;
		margin-bottom: 1rem;
	}

	p {
		color: var(--text-primary);
		line-height: 1.8;
		margin-bottom: 1rem;
	}

	ul {
		margin-left: 2rem;
		margin-bottom: 1rem;
	}

	li {
		color: var(--text-primary);
		line-height: 1.8;
		margin-bottom: 0.5rem;
	}
</style>
