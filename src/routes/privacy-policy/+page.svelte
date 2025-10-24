<svelte:head>
	<title>Privacy Policy - Dashboard</title>
	<meta name="description" content="Privacy Policy for Dashboard" />
</svelte:head>

<div class="legal-page">
	<div class="legal-content">
		<h1>Privacy Policy</h1>
		
		<p class="last-updated">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

		<section>
			<h2>1. Introduction</h2>
			<p>
				This Privacy Policy explains how Dashboard ("we", "us", or "our") collects, uses, and protects your information when you use our Service.
			</p>
		</section>

		<section>
			<h2>2. Information We Collect</h2>
			<p>
				When you use Dashboard, we may collect the following types of information:
			</p>
			<ul>
				<li><strong>GitHub Account Information:</strong> When you sign in with GitHub, we collect your GitHub username, email address, and profile information.</li>
				<li><strong>Repository Data:</strong> We access your GitHub repositories and organization information to display them in the dashboard.</li>
				<li><strong>Widget Preferences:</strong> We store your widget layout and configuration preferences locally in your browser.</li>
				<li><strong>Usage Data:</strong> We may collect information about how you interact with the Service.</li>
			</ul>
		</section>

		<section>
			<h2>3. How We Use Your Information</h2>
			<p>
				We use the collected information for the following purposes:
			</p>
			<ul>
				<li>To provide and maintain the Service</li>
				<li>To display your GitHub repositories and organization projects</li>
				<li>To personalize your dashboard experience</li>
				<li>To improve and optimize the Service</li>
			</ul>
		</section>

		<section>
			<h2>4. Data Storage</h2>
			<p>
				Your widget preferences and layout configurations are stored locally in your browser's local storage. GitHub authentication is handled through Auth.js and follows OAuth 2.0 standards.
			</p>
		</section>

		<section>
			<h2>5. Third-Party Services</h2>
			<p>
				Dashboard integrates with the following third-party services:
			</p>
			<ul>
				<li><strong>GitHub:</strong> For authentication and repository data. Please review <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noopener noreferrer">GitHub's Privacy Policy</a>.</li>
				<li><strong>Weather APIs:</strong> For weather widget data.</li>
				<li><strong>Google Maps:</strong> For traffic widget data.</li>
			</ul>
		</section>

		<section>
			<h2>6. Data Security</h2>
			<p>
				We implement appropriate security measures to protect your information. However, no method of transmission over the Internet or electronic storage is 100% secure.
			</p>
		</section>

		<section>
			<h2>7. Your Rights</h2>
			<p>
				You have the right to:
			</p>
			<ul>
				<li>Access your personal information</li>
				<li>Revoke GitHub access at any time through your GitHub account settings</li>
				<li>Clear your local widget preferences by clearing your browser's local storage</li>
			</ul>
		</section>

		<section>
			<h2>8. Changes to This Privacy Policy</h2>
			<p>
				We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
			</p>
		</section>

		<section>
			<h2>9. Contact Us</h2>
			<p>
				If you have any questions about this Privacy Policy, please contact us through our GitHub repository.
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

	a {
		color: var(--primary-color);
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}

	strong {
		font-weight: 600;
	}
</style>
