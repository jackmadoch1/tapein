# TapeIn / ATR Tracker

Athletic training room check-in. Two teammates confirm it, then it counts on the weekly board.

Texas A&M maroon and white. Two tabs:

1. **Confirm** — tap *I went in*, then Yes / No on anyone else who checked in
2. **Leaderboard** — approved visit counts for the week (Monday–Sunday, US Central)

They need **2 yeses** for a visit to count.

## Deploy on Netlify (from this GitHub repo)

1. Go to [app.netlify.com](https://app.netlify.com/) and sign in with **GitHub**.
2. Click **Add new site → Import an existing project**.
3. Choose **GitHub** and authorize Netlify if asked.
4. Select the repo **tapein** (`jackmadoch1/tapein`).
5. On build settings:
   - **Build command:** `echo 'static docs + functions'` (already in `netlify.toml`)
   - **Publish directory:** `docs`
6. Click **Deploy site**. Wait until it says **Published**.
7. Open the `*.netlify.app` URL. Create an account. Teammates use that same URL — they will see each other’s check-ins.

Create an account on that Netlify URL. Everyone who opens the same Netlify site shares one board — check-ins, photos, messages, and the leaderboard.

## Source

This repo also has the full multi-user app (accounts + weekly database). Netlify is hosting the simple site in `docs/`.
