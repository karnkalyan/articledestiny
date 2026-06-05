# ArticleDestiny

ArticleDestiny is a Next.js publishing app with articles, author profiles, comments, likes, reading history, SEO settings, AdSense slots, and an admin panel.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Configure `.env`:

```bash
DATABASE_URL="mysql://admin:quantumSql%40123@127.0.0.1:3306/articledestiny"
JWT_SECRET="change-this-secret"
```

3. Push the Prisma schema and seed the database:

```bash
npm run db:push
npm run db:seed
```

4. Start the app:

```bash
npm run dev
```

The app runs at `http://localhost:3400`.

## Clean Local Database And Seed Again

This deletes all tables in the configured database, recreates them from `prisma/schema.prisma`, and inserts seed users, author profiles, site data, and articles.

```bash
npm run db:reset
```

## Docker Run

Build and start the app plus MySQL:

```bash
docker compose up -d --build
```

View logs:

```bash
docker compose logs -f web
```

Stop containers but keep MySQL data:

```bash
docker compose down
```

## Clean Docker Database And Insert Seed Data

This removes the MySQL volume, rebuilds the app, pushes the schema, and runs the seed on startup.

```bash
docker compose down -v
docker compose up -d --build
docker compose logs -f web
```

If the containers are already running and you only want to reset the schema and seed:

```bash
docker compose exec web npm run db:reset
```

## Seeded Accounts

```text
karnkalyan@gmail.com       admin123
admin@articledestiny.com   admin123
user@articledestiny.com    user123
```

On a clean seed, Karn Kalyan is created with `id = 3`, so the public profile is `/author/3`.

## Important Routes

```text
/                         Home/catalog
/author/[id]              Public author profile
/author/[id]/edit         Profile editor for the signed-in user
/admin                    Admin panel
/admin/write              Story composer
```

## Notes

- Docker Compose uses MySQL 8.4 and exposes the app on port `3400`.
- `npm run db:reset` is destructive. Use it only when you want a clean database.
- Public author cards only show profile fields marked visible in the profile editor.
