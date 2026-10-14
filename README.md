# FreshTunes — React (Keyless & Serverless)

A mobile-first music discovery web app. Runs 100% client-side with **no YouTube API key** and **no cloud/serverless backend** required.

## Features

- Responsive mobile and desktop UI
- **Keyless & Serverless**: Client-side video discovery using open public instances (Invidious / Piped) with automatic failovers & curated fallbacks
- Hindi, English, all-music, trending, and random modes
- Paste YouTube URLs or search keywords directly
- Click a video to play it in the embedded YouTube player
- Local recent-play history stored in browser `localStorage` to reduce repeat recommendations

## Run locally

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. No `.env` or API keys needed!

## Deploy to Vercel or GitHub Pages

1. Push this repository to GitHub.
2. Import into **Vercel** or deploy to **GitHub Pages / Netlify**.
3. No Environment Variables needed. Vercel automatically deploys it as a static Vite app.

## Tech stack

- React 18
- Vite
- Lucide React
- Public Keyless Discovery APIs & Fallbacks
- Embedded YouTube iFrame Player
# fresh-tune
