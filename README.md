# Pokemon Card Collection Dashboard

A full-stack web app to scan Pokemon TCG cards with your phone or camera, extract details via OpenAI Vision, store them in a database, and view a dashboard with analytics.

## What you need

- Node.js 18+
- An [OpenAI API key](https://platform.openai.com/api-keys) (billing enabled; GPT-4o-mini is used for low cost)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy the example env and add your keys:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:

   - `DATABASE_URL` — PostgreSQL connection string. **See [SETUP-POSTGRES.md](./SETUP-POSTGRES.md)** for a free database (Neon or Supabase) or local setup.
   - `NEXTAUTH_SECRET` — A random string used to sign JWTs (use a strong value in production).
   - `NEXTAUTH_URL` — App URL (e.g. `http://localhost:3000` in dev).
   - `OPENAI_API_KEY=sk-your-key-here` — For card scanning (Vision API).

3. **Database**

   Run migrations to create tables (User, Card) in PostgreSQL:

   ```bash
   npx prisma migrate dev
   ```

   For quick schema sync during development you can use `npm run db:push` instead; for production, prefer `prisma migrate deploy`.

4. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

5. **Background image (optional)**

   Place `Cute-Pokemons-Wallpaper.jpg` in the `public/` folder to use it as the site background. If the file is missing, a warm fallback color is used.

## OpenAI billing

Each time you **successfully** scan a card (Add card → choose image → Scan & save), the app sends the image to **OpenAI’s Vision API** (gpt-4o-mini). That request uses tokens and will appear on your [OpenAI usage/billing](https://platform.openai.com/usage) page.

If you don’t see any usage:

- Confirm `OPENAI_API_KEY` is set in `.env` (no quotes needed) and the key is valid.
- Make sure you’ve completed at least one scan without errors (e.g. “Scan & save” finishes and you see “Card saved”).
- Check that the key’s organization has billing enabled and that you’re viewing the correct project in the OpenAI dashboard.

After a successful scan, the API response includes a header `X-OpenAI-Used: true` (visible in the browser Network tab) to confirm the request went through.

## Usage

- **Register / Log in**: Create an account or sign in. Cards are stored per user.
- **Dashboard**: View your cards with thumbnail, name, description, set, year, rarity. Filter by year, set, rarity.
- **Add card**: Upload a photo of a card; the app sends it to OpenAI, extracts name, set, year, rarity, etc., and saves to your collection.
- **Analytics**: Charts for your collection over time, by year, by set, by rarity.

## Tech stack

- **Next.js 14** (App Router), **React**, **TypeScript**, **Tailwind CSS**
- **Prisma** + **PostgreSQL**
- **NextAuth** (Credentials + JWT) for auth
- **OpenAI API** (gpt-4o-mini with vision)
- **Recharts** for analytics

## Scripts

- `npm run dev` — start dev server
- `npm run build` / `npm run start` — production
- `npm run db:migrate` — run Prisma migrations (e.g. `prisma migrate dev`)
- `npm run db:push` — sync schema to DB without migrations (dev only)
- `npm run db:studio` — open Prisma Studio to inspect data
