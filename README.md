## Solace Candidate Assignment

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

Install dependencies

```bash
npm i
```

Run the development server:

```bash
npm run dev
```

## Database set up

The app is configured to return a default list of advocates. This will allow you to get the app up and running without needing to configure a database. If you’d like to configure a database, you’re encouraged to do so. You can uncomment the url in `.env` and the line in `src/app/api/advocates/route.ts` to test retrieving advocates from the database.

1. Feel free to use whatever configuration of postgres you like. The project is set up to use docker-compose.yml to set up postgres. The url is in .env.

```bash
docker compose up -d
```

- `docker-compose ps` - to validate it's running
- `docker exec -it solace-candidate-assignment-main-db-1 psql -U postgres -d solaceassignment` - to access the DB
- `\dt` - to show tables (should be 0 now) 

2. Create a `solaceassignment` database.

3. Push migration to the database

```bash
npx drizzle-kit push
```

- `\dt` - to show tables (should exist now)

4. Seed the database

```bash
curl -X POST http://localhost:3000/api/seed
```

- `SELECT * FROM advocates` - to validate the seeding succeeded
- `curl http://localhost:3000/api/advocates` to validate the endpoint

## Extra Improvements

- Adding database logging
- Supporting ever larger datasets by paginating based on the `createdAt` field
- Indexing the `createdAt` field
    - ISSUE: `drizzle-kit` did not generate or run migrations: "out of date"
    Fixed by updating to `@latest`
    - Verified index by `\d advocates` in psql
- Because all the `createdAt` dates are the same, adding the `id` to the cursor

