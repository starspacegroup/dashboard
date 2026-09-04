# Dashboard

A web dashboard with movable widgets, including weather, traffic, calendar, and
GitHub projects. Built with SvelteKit and designed to be hosted on Cloudflare
Pages.

## Features

- 🎯 **Movable Widgets**: Drag and drop widgets to customize your dashboard
  layout
- 🌤️ **Weather Widget**: Displays current weather information
- 🚗 **Traffic Widget**: Shows traffic conditions for common routes
- 📅 **Calendar Widget**: Displays upcoming events and appointments
- 🐙 **GitHub Personal Repositories**: Shows your personal GitHub repositories
  when logged in
- 🏢 **Organization Projects**: Shows projects from all your GitHub
  organizations in tile format
- 🔐 **GitHub OAuth**: Sign-in to view your GitHub projects and organization
  repositories
- 🟠 **Cloudflare Widget**: Connect a read-only Cloudflare API token to see
  traffic for your domains, deployment status for Pages projects, and
  invocation stats for Workers — with an Overview rollup and interactive
  charts. Tokens don't expire, so you stay connected across devices.
- 📊 **Google Analytics Widget**: Connect a GA4 property for realtime and
  historical traffic (needs `GA_OAUTH_CLIENT_ID`/`GA_OAUTH_CLIENT_SECRET`)
- 🪙 **Crypto Widget**: Spot price and chart for any CoinGecko-listed coin
- 🤖 **Copilot Usage**: Copilot engagement metrics for your organizations
- ☁️ **Cross-Device Sync**: Widget layout, location, and connections sync
  across browsers/devices for the same logged-in user (Cloudflare KV)

## Screenshots

### Dashboard with Widgets

![Dashboard](https://github.com/user-attachments/assets/adcd5230-362a-4fa0-a2bf-10a7f678d681)

### Movable Widgets

![Movable Widgets](https://github.com/user-attachments/assets/c2ff79c1-1834-4ab4-9a35-fe812ce67383)

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

1. Clone the repository:

```bash
git clone https://github.com/starspacegroup/dashboard.git
cd dashboard
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. (Optional) Configure GitHub OAuth:
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Create a new OAuth App
   - Set the callback URL to: `http://localhost:4200/auth/callback/github`
   - Add your Client ID and Secret to the `.env` file
   - The app will request the following scopes: `read:user`, `user:email`,
     `read:org`, `repo`, `read:project`, `manage_billing:copilot`

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:4200](http://localhost:4200) in your browser

### Local dev preview

On localhost, `npm run dev` skips sign-in and opens on a dashboard with one
widget of every type, each carrying sample data, so you can work on the UI
without connecting a GitHub, Google Analytics or Cloudflare account. A
`DEV PREVIEW · SAMPLE DATA` badge stays in the header while it is on.

From any other address the dev server answers on — a LAN IP, or the hostname
`npm run dev:tunnel` publishes — the sign-in page offers a **Continue as Dev
Preview** button beside the GitHub one, so you can open the dev dashboard on a
phone without registering an OAuth callback for that host. Signing out ends the
preview and gives you the real GitHub flow back, on any host.

⚠️ That means while your dev tunnel is up, anyone with the URL can click into the
sample dashboard. Take the tunnel down when you are done with it.

The GitHub, Analytics and Cloudflare numbers are generated, and the Traffic
widget draws a sample board when there is no `GOOGLE_MAPS_API_KEY` (set one and
you get the real map). Weather, geocoding and crypto are keyless APIs, so those
widgets show live data.

Set `DEV_AUTH_BYPASS=false` in `.env` to test the real sign-in flow. The preview
is compiled out of every build, so a deployed copy always goes through real
GitHub OAuth.

### Build

To build for production:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Deployment to Cloudflare Pages

This app is configured to deploy to Cloudflare Pages:

1. Push your code to GitHub
2. Connect your repository to Cloudflare Pages
3. Use the following build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `.svelte-kit/cloudflare`
4. Add your environment variables in Cloudflare Pages settings:
   - `GITHUB_ID`
   - `GITHUB_SECRET`
   - `AUTH_SECRET`
   - `AUTH_TRUST_HOST=true`
   - `DASHBOARD_STATE_ENCRYPTION_KEY_VERSION` (for example, `v1`)
   - `DASHBOARD_STATE_ENCRYPTION_KEYS` (a JSON keyring such as
     `{"v1":"<independently generated secret>"}`)

Dashboard snapshots use the active version in `DASHBOARD_STATE_ENCRYPTION_KEYS`,
not `AUTH_SECRET`. To rotate encryption keys, add the new version without
removing the old one, change `DASHBOARD_STATE_ENCRYPTION_KEY_VERSION`, deploy,
and retain both versions until old-version snapshots are next written or
deliberately migrated. Legacy plaintext and unversioned `enc:v1` snapshots move
to a separately keyed encrypted migration record on read, so that migration
cannot overwrite a concurrent normal write. Replacement and fallback values
coexist for a bounded propagation window because Workers KV does not make
cross-key writes and deletes visible atomically; the legacy value then expires.
Existing `enc:v1` snapshots fall back to the current `AUTH_SECRET`. If that
secret must rotate before migration finishes, temporarily set
`DASHBOARD_STATE_LEGACY_AUTH_SECRETS` to a JSON array containing the old value.

## Tech Stack

- **Framework**: SvelteKit 2
- **Language**: TypeScript
- **Styling**: CSS (Custom Properties)
- **Authentication**: Auth.js (NextAuth.js for SvelteKit)
- **Deployment**: Cloudflare Pages
- **Adapter**: @sveltejs/adapter-cloudflare

## License

MIT
