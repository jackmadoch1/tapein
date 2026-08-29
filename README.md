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
5. On the build settings screen:
   - **Build command:** leave empty
   - **Publish directory:** `docs`
6. Click **Deploy site**.
7. When the deploy is **Published**, click the site URL (it looks like `something.netlify.app`). That is the live app.

Create an account on that Netlify URL. Sign out and make a second account in the **same browser** to confirm visits.

## Source

This repo also has the full multi-user app (accounts + weekly database). Netlify is hosting the simple site in `docs/`.
