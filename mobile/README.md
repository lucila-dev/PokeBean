# PokeBean mobile (Expo)

Native Android / iOS app that uses the same backend as [pokebean.uk](https://pokebean.uk).

## Run locally

1. From the **repo root**, start the web API (if testing against local):

```bash
npm run dev
```

2. In another terminal:

```bash
cd mobile
npm install
npm start
```

3. Scan the QR code with **Expo Go** (iOS/Android), or press `i` / `a` for simulator.

### Pointing at production vs local API

- Default in production builds: `https://pokebean.uk`
- Local Next.js on a physical phone: create `mobile/.env`:

```bash
EXPO_PUBLIC_API_URL=http://YOUR_MAC_LAN_IP:3000
```

- Android emulator → host machine: `http://10.0.2.2:3000`
- iOS simulator → `http://localhost:3000`

## What’s included

- Sign in / register (same accounts as the website)
- Collection (2-column grid)
- Browse + add to collection
- Profile / sign out

## Not yet

- Camera scan
- Push notifications
- App Store / Play Store listing (needs EAS + developer accounts)

## Store builds (later)

```bash
npm i -g eas-cli
eas login
eas build:configure
eas build --platform all
```
