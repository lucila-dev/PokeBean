# Supabase setup for PokeBean

Use this for Vercel (production). Local dev can keep using Postgres on your Mac, or point at Supabase too.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. **New project** → pick a name (e.g. `pokebean`) and a database password (save it)
3. Wait until the project finishes provisioning

## 2. Copy connection strings

1. In Supabase: **Project Settings** → **Database**
2. Under **Connection string**, choose **URI**
3. Copy the **Transaction pooler** string (port **6543**) → this is `DATABASE_URL`
   - Add `?pgbouncer=true` at the end if it is not already there
4. Copy the **Session pooler** or **Direct** string (port **5432**) → this is `DIRECT_URL`

Replace `[YOUR-PASSWORD]` with your database password.

Example:

```
DATABASE_URL="postgresql://postgres.xxxxx:YOUR-PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxxx:YOUR-PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
```

## 3. Add env vars on Vercel

Vercel → your project → **Settings** → **Environment Variables**. Add:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Transaction pooler URI (6543) |
| `DIRECT_URL` | Direct / session URI (5432) |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `OPENAI_API_KEY` | Your OpenAI key |
| `POKEWALLET_API_KEY` | Your PokeWallet key |

Apply to **Production**, **Preview**, and **Development**.

## 4. Redeploy

**Deployments** → latest deploy → **⋯** → **Redeploy**

The build runs `prisma migrate deploy` and creates the `User` and `Card` tables automatically.

## 5. Create your account on production

Your local database and Supabase are separate. On `https://poke-bean.vercel.app`:

1. Open **Register**
2. Create a new account
3. Log in

## Optional: use Supabase locally

Put the same `DATABASE_URL` and `DIRECT_URL` in your local `.env`, then:

```bash
npx prisma migrate deploy
npm run dev
```
