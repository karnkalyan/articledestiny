<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/97cf5eee-331c-4174-a69d-bb297c693c8c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Switching to MySQL (local)

1. Create a local MySQL 8.0 or 8.4 database named `articledestiny` and ensure root user has an empty password (or update the URL below to match your credentials). MySQL 9.x is not currently supported by Prisma.
2. Update `.env` or `.env.local` with the following `DATABASE_URL`:

```
DATABASE_URL="mysql://root@localhost:3306/articledestiny"
```

3. Run Prisma migrate & generate:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

4. Start the app: `npm run dev`

## AdSense / Ads

- Use the Admin panel at `/admin` → `AdS Slots Editor` to paste raw Google AdSense code into the `top`, `sidebar`, or `bottom` slots.
- The site renders ad HTML via an `AdSense` component which injects raw HTML. No geolocation or other frame permissions are requested.
