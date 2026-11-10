# Shoe Beta

A climbing-shoe project built with Next.js, TypeScript, Tailwind CSS, and PostgreSQL. The first feature is a read-only shoe catalogue.

## Run

Use Node.js 24. With nvm, run `nvm install` followed by `nvm use`.

```bash
npm ci
npm run dev
```

Open the Local URL printed in the terminal, normally http://localhost:3000. The home route redirects to `/shoes`.

## Check

```bash
npm run lint
npm run typecheck
npm run db:validate
npm run build
```

The scripts use Webpack for compatibility with the current development environment.

## Database setup

Prisma 7 is configured for PostgreSQL. Installation and builds generate Prisma Client automatically and can run before a database is configured.

To prepare a local connection:

1. Start PostgreSQL and create a separate database named `shoe_beta` using your local PostgreSQL role.
2. Copy `.env.example` to `.env` and replace the username and password placeholders:

   ```bash
   cp .env.example .env
   ```

The application uses `getDb()` from `src/lib/db.ts` in Server Components, Server Actions, or Route Handlers. The client is created when first requested and reused across requests and development reloads. Calling it requires `DATABASE_URL`; importing it does not open a connection. Keep this module on the server.

The `Shoe` model stores a unique slug, brand, model name, optional description, and a sample-data flag. Generated files under `src/generated/prisma/` are ignored by Git and ESLint. Local `.env` files stay ignored; `.env.example` is tracked as a template.

Apply the included migration, regenerate the client, and optionally load the sample catalogue:

```bash
npm run db:deploy
npm run db:generate
npm run db:seed
```

The seed inserts three **fictional** shoe entries marked as samples. Repeating it skips existing slugs, so it does not duplicate or overwrite records. It is development data, not verified product or sizing information.

The catalogue queries PostgreSQL on each request with a Server Component. It shows an empty state before shoes are added, a loading state while fetching, and a retry option if loading fails. A configured database with migrations applied is required to view the catalogue; production builds do not query it.

For future schema changes, use `npm run db:migrate -- --name NAME` and commit the generated migration. Use `npm run db:studio` to inspect a configured database.
