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
- 🎵 **Spotify Widget**: Shows your current player state and playlists when
  connected
- 🐙 **GitHub Personal Repositories**: Shows your personal GitHub repositories
  when logged in
- 🏢 **Organization Projects**: Shows projects from all your GitHub
  organizations in tile format
- 🔐 **GitHub OAuth**: Sign-in to view your GitHub projects and organization
  repositories
- 🎶 **Spotify OAuth**: Connect your Spotify account to see your current player
  and playlists

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
   - Set the callback URL to: `http://localhost:5173/auth/callback/github`
   - Add your Client ID and Secret to the `.env` file
   - The app will request the following scopes: `read:user`, `user:email`,
     `read:org`, `repo`

5. (Optional) Configure Spotify OAuth:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications)
   - Create a new App
   - Set the Redirect URI to: `http://localhost:5173/auth/callback/spotify`
   - Add your Client ID and Client Secret to the `.env` file
   - The app will request the following scopes: `user-read-email`, `user-read-private`,
     `user-read-playback-state`, `user-read-currently-playing`, `user-read-recently-played`,
     `playlist-read-private`, `playlist-read-collaborative`

6. Start the development server:

```bash
npm run dev
```

7. Open [http://localhost:5173](http://localhost:5173) in your browser

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
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `AUTH_SECRET`
   - `AUTH_TRUST_HOST=true`

## Tech Stack

- **Framework**: SvelteKit 2
- **Language**: TypeScript
- **Styling**: CSS (Custom Properties)
- **Authentication**: Auth.js (NextAuth.js for SvelteKit)
- **Deployment**: Cloudflare Pages
- **Adapter**: @sveltejs/adapter-cloudflare

## License

MIT
