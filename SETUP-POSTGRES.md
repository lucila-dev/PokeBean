# PostgreSQL setup for PokeBean

The app uses PostgreSQL. Easiest option: use a **free cloud database** (no install).

---

## Option A: Neon (recommended, free)

1. Go to **[neon.tech](https://neon.tech)** and sign up (free).
2. Create a new project (e.g. name: `pokemon-dashboard`).
3. In the dashboard, open **Connection details** and copy the connection string. It looks like:
   ```txt
   postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
4. Paste it into your `.env` as `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
   ```
5. In the project root, run:
   ```bash
   npx prisma migrate dev
   ```
   When prompted for a migration name, you can use `init` or press Enter.
6. Start the app: `npm run dev`.

---

## Option B: Supabase (free)

1. Go to **[supabase.com](https://supabase.com)** and create a project.
2. In the project: **Settings → Database** → copy the **URI** (connection string).
3. Put it in `.env` as `DATABASE_URL` (use the **Session mode** URI; it includes the password).
4. Run:
   ```bash
   npx prisma migrate dev
   ```
5. Start the app: `npm run dev`.

---

## Option C: Local PostgreSQL

If you prefer running Postgres on your Mac:

1. **Install** (fix Homebrew permissions first if needed):
   ```bash
   brew install postgresql@16
   brew link postgresql@16
   ```
2. **Start** Postgres:
   ```bash
   brew services start postgresql@16
   ```
3. **Create a database**:
   ```bash
   createdb pokemon_dashboard
   ```
4. In `.env`:
   ```env
   DATABASE_URL="postgresql://localhost:5432/pokemon_dashboard"
   ```
   If your Mac user has a Postgres password, use:
   `postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/pokemon_dashboard`
5. Run migrations and start the app:
   ```bash
   npx prisma migrate dev
   npm run dev
   ```

---

After any option, you can open **Prisma Studio** to view data:

```bash
npm run db:studio
```
