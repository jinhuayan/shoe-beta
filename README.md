# Shoe Beta

Initial Next.js setup with TypeScript and Tailwind CSS.

## Run

Use Node.js 24. With nvm, run `nvm install` followed by `nvm use`.

```bash
npm ci
npm run dev
```

Open the Local URL printed in the terminal, normally http://localhost:3000.

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

The schema currently contains no application models; Prisma 7 can still generate the client at this setup stage. Generated files under `src/generated/prisma/` are ignored by Git and ESLint. Local `.env` files stay ignored; `.env.example` is tracked as a template.

After adding the first models, create and apply a migration against the separate project database:

```bash
npm run db:migrate -- --name init
npm run db:generate
```

Use `npm run db:studio` to inspect a configured database. No migrations or database changes have been applied as part of this setup.
