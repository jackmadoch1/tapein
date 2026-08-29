# TapeIn

Athletic training room check-in. Two teammates confirm it, then it counts on the weekly board.

**Live site:** [jackmadoch1.github.io/tapein](https://jackmadoch1.github.io/tapein/)

Texas A&M maroon and white. Two tabs:

1. **Confirm** — tap *I went in*, then Yes / No on anyone else who checked in
2. **Leaderboard** — approved visit counts for the week (Monday–Sunday, US Central)

They need **2 yeses** for a visit to count.

## Accounts

Create an account with a name. Sign out and make another account in the same browser to confirm each other.

The GitHub Pages site stores data in this browser (so a teammate on another phone will not see your check-ins). The source in this repo is the full multi-user app with real accounts.

## Source app

React + TanStack Start, with sign-in and a weekly database. That version needs a host that can run a server (not GitHub Pages).
