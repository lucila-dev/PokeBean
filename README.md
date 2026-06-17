# PokeBean

A full-stack web app for managing your Pokémon TCG collection — scan cards from photos, browse a live catalog, and track what you own with filters and analytics.

## What it does

**Scan cards from photos**  
Upload a picture of a card and OpenAI Vision extracts the name, set, number, rarity, and description. The card is saved to your personal collection with its image.

**Browse the catalog**  
Search the PokeWallet API to find cards without scanning. Add them to your collection in one click, with infinite-scroll suggestions for popular Pokémon.

**Dashboard**  
View your collection as a card grid or table. Filter by set, year, and rarity; search by name; select and delete cards; track a manual market price per card.

**Analytics**  
Charts show how your collection breaks down by set, year, and rarity, and how it has grown over time.

**Profile & appearance**  
Update your display name and avatar. Light and dark themes with a persisted preference.

Each user has their own account and collection — register, log in, and your cards stay private to you.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL with Prisma ORM |
| Auth | NextAuth (credentials + JWT) |
| AI scanning | OpenAI API (GPT-4o-mini, vision) |
| Card catalog | PokeWallet API |
| Charts | Recharts |

## Project structure

- `app/` — pages and API routes (dashboard, browse, analytics, auth, card scan)
- `components/` — UI (forms, charts, card grid, navigation)
- `lib/` — auth, OpenAI, PokeWallet client, card formatting
- `prisma/` — schema and migrations

Built as **PokeBean** — a personal Pokémon card collection dashboard.
