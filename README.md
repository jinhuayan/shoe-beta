# Shoe Beta

A climbing-shoe project built with Next.js, TypeScript, Tailwind CSS, and PostgreSQL. The first feature is a read-only shoe catalogue.

## Run

Use Node.js 24. With nvm, run `nvm install` followed by `nvm use`.

```bash
npm ci
npm run dev
```

Open the Local URL printed in the terminal, normally http://localhost:3000. The home route redirects to `/shoes`.

Click a shoe name to open its details at `/shoes/[slug]`. Unknown shoe URLs show a not-found page with a link back to the catalogue.

Filter climbing shoes by downturn, stiffness, and closure. Filters are saved in the URL and kept when opening a shoe and returning to the catalogue. Invalid or repeated filter values are ignored.

At `/questionnaire`, visitors can enter foot measurements, foot shape, climbing experience, discipline, and fit preference, then review and edit their answers. Measurements are optional and every choice supports “Unsure”. Guest answers stay in the current page state. Signed-in users can explicitly save and load a profile. Choose **Find climbing shoes** after reviewing to request a shortlist from the configured catalogue.

The form accepts foot lengths from 100–400 mm in 0.1 mm increments and EU street sizes from 20–55 in half-size increments. These are input limits, not sizing rules; no conversion or downsizing formula is applied.

## First recommendation rules

`POST /api/recommendations` accepts the same form fields as the questionnaire (multipart or URL-encoded form data). It validates them again, reads the catalogue, and returns up to three shoes with reasons and tradeoffs. Invalid submissions return 400; catalogue failures return 503 and can be retried without re-entering answers. Recommendation requests do not save a profile.

| Input | Rule | Points |
| --- | --- | --- |
| Foot width | Compare with the shoe's listed forefoot width | +3 match, −3 known mismatch |
| Heel volume | Compare with the shoe's listed heel volume | +2 match, −2 known mismatch |
| Beginner or comfort priority | Prefer neutral downturn; apply once even when both are selected | +2 neutral, −2 other known downturns |
| Bouldering | Prefer soft construction for sensitivity | +1 soft, 0 otherwise |
| Sport climbing | Prefer medium or stiff construction for support | +1 medium/stiff, 0 otherwise |
| Trad climbing | Prefer stiff construction for support | +1 stiff, 0 otherwise |

Unknown attributes contribute zero points and appear as tradeoffs. Unsure foot-width and heel-volume answers add no rule. Only positive totals are shortlisted, with ties sorted by brand, model, then slug. With no applicable rules, the response is `insufficient`; with no positive candidates it is `empty`. Performance preference and advanced experience do not automatically favour aggressive downturn. Balanced, mixed, and unsure choices add no rule yet.

The general starting points come from [SCARPA's shoe guide](https://www.scarpa.co.uk/blogs/blog/how-to-choose-a-climbing-shoe) and [construction guidance](https://scarpa.com/collections/climbing-shoes). The trad-support rule is our inference from long-route guidance. Weights and cutoffs are project choices, not manufacturer ratings or measured fit probabilities. Terrain can change which construction is suitable; reasons and tradeoffs describe these limited rules, not a guarantee of comfort or performance.

Width and heel-volume matching compare qualitative catalogue labels with questionnaire answers. The sample labels are fictional fixtures for checking the rules, not verified product fit data. Toe shape and measurements are not scored. Size estimation remains unavailable; neither street size nor foot length is converted into a climbing shoe size. Fictional samples stay marked as samples in results.

## Check

```bash
npm run lint
npm run typecheck
npm test
npm run db:validate
npm run build
```

The scripts use Webpack for compatibility with the current development environment.

## Authentication API

[Better Auth](https://better-auth.com/docs/authentication/email-password) handles email/password accounts and database sessions under `/api/auth`. Visitors can register at `/sign-up` or sign in at `/sign-in`; success returns them to the climbing shoe catalogue. The shared header shows the current account and supports sign-out. Registration needs a name, email, and an 8–128 character password. Email verification and password-reset delivery are not configured yet.

Forms show errors without clearing the entered details, and disable submission while a request is pending. Guests can still browse the catalogue and use the questionnaire. An unavailable account service shows a retry option in the header without blocking guest pages.

Add `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` to your local `.env.local`. Generate a random secret with `openssl rand -base64 32`; use `http://localhost:3000` as the local URL. In Vercel, set the secret for Production and Preview, and set the Production URL to `https://shoe-beta-one.vercel.app`. Preview deployments use `VERCEL_URL` when `BETTER_AUTH_URL` is unset. Keep the secret stable across deployments and out of Git.

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/auth/sign-up/email` | POST | Register with `name`, `email`, and `password` |
| `/api/auth/sign-in/email` | POST | Sign in with `email` and `password` |
| `/api/auth/get-session` | GET | Read the current session, or `null` for a visitor |
| `/api/auth/sign-out` | POST | End the current session |

Apply migrations before deploying. The migration adds auth tables and leaves shoe data intact. Auth initializes on its first request, so builds and public pages do not require an auth secret. Missing configuration returns 503 from the auth API.

After a production build, `npm run test:auth` runs API integration tests using `TEST_DATABASE_URL`. It requires a loopback PostgreSQL database named `shoe_beta_auth_test`, applies migrations, and starts its own local server with a temporary secret. It checks registration, password rejection and hashing, session ownership, sign-out, expiry, restart persistence, origin checks, and missing configuration. Profile checks cover saving, updating, validation, and cross-account access. It does not read `.env.local` or use the application database URL.

## Saved profiles

Sign in before entering questionnaire answers. After reviewing, choose **Save profile** to create or replace your account's saved measurements and climbing preferences. **Load saved profile** replaces the current answers and opens the review; loading is manual. Reloading or switching accounts clears unsaved answers, and signing out clears the form. Guest reviewing and recommendations remain available.

`GET /api/profile` returns the current account's validated questionnaire state, or `null` before its first save. `PUT /api/profile` accepts the questionnaire form fields. Both require a valid server-checked session; the server derives ownership from that session. Responses are private and uncached, and writes require a matching Origin. Invalid answers return 400, expired or missing sessions return 401, and unavailable services return 503.

The migration adds one `ClimbingProfile` row per user, containing both foot measurements and climbing preferences. Apply it with `DOTENV_CONFIG_PATH=.env.local npm run db:deploy` before deploying this change.

## CI and deployment

[GitHub Actions](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs) runs `.github/workflows/ci.yml` for pull requests targeting `main` (including new commits on an open PR) and pushes to `main`. It installs dependencies with `npm ci`, reads Node.js 24 from `.nvmrc`, then runs lint, typecheck, tests, Prisma validation, the production build, and auth API tests against a temporary PostgreSQL service. It needs no production database or secrets. A feature-branch push without a PR does not trigger this workflow.

Use [Vercel's GitHub integration](https://vercel.com/docs/git/vercel-for-github) for CD. Configure the existing [Shoe Beta project](https://vercel.com/j-393b/shoe-beta) with these settings:

| Setting | Value |
| --- | --- |
| Git repository | `jinhuayan/shoe-beta` |
| Production branch | `main` |
| Root directory | Repository root (`.`), where `package.json` lives |
| Framework preset | Next.js |
| Node.js version | `24.x` |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | Next.js default |

With Git integration enabled, Vercel creates preview deployments for branch pushes and production deployments for updates to `main`. GitHub Actions does not upload a build or need a Vercel token for this setup. Vercel performs its own build.

GitHub CI and Vercel automatic deployments run independently. This setup does not require additional Vercel Deployment Checks.

The Prisma Postgres integration supplies `DATABASE_URL_POOLED` for application requests and a direct `DATABASE_URL` for migrations. The app prefers the pooled URL and falls back to the direct URL. Use a separate test database for Preview and the production database for Production; a local `localhost` database will not work on Vercel. From a trusted shell configured for each target database, run `npm run db:deploy` before deploying code that needs a new schema. With a direct URL in `.env.local`, run `DOTENV_CONFIG_PATH=.env.local npm run db:deploy`. Sample seeding is optional and separate. The build generates Prisma Client but does not migrate or seed a database. Redeploy after changing environment variables. See [Prisma Postgres on Vercel](https://www.prisma.io/docs/guides/postgres/vercel).

## Database setup

Prisma 7 is configured for PostgreSQL. Installation and builds generate Prisma Client automatically and can run before a database is configured.

To prepare a local connection:

1. Start PostgreSQL and create a separate database named `shoe_beta` using your local PostgreSQL role.
2. Copy `.env.example` to `.env` and replace the username and password placeholders:

   ```bash
   cp .env.example .env
   ```

The application uses `getDb()` from `src/lib/db.ts` in Server Components, Server Actions, or Route Handlers. The client is created when first requested and reused across requests and development reloads. Calling it requires `DATABASE_URL_POOLED` or `DATABASE_URL`; importing it does not open a connection. Prisma commands and the seed use the direct `DATABASE_URL`. Keep this module on the server.

The `Shoe` model stores a unique slug, brand, model name, optional description, a sample-data flag, and climbing attributes: downturn, stiffness, closure, forefoot width, and heel volume. New attributes default to `UNKNOWN` for existing records. Generated files under `src/generated/prisma/` are ignored by Git and ESLint. Local `.env` files stay ignored; `.env.example` is tracked as a template.

Apply the included migration, regenerate the client, and optionally load the sample catalogue:

```bash
npm run db:deploy
npm run db:generate
npm run db:seed
```

Restart the dev server after applying migrations and regenerating Prisma Client.

The seed inserts three **fictional climbing shoes** marked as samples. Repeating it skips existing slugs and preserves names and descriptions. Existing sample shoes receive downturn/stiffness/closure only when all three are `UNKNOWN`, and width/heel volume only when both are `UNKNOWN`. Edited attribute groups and non-sample records are preserved. This is development data, not verified product or sizing information.

The catalogue queries PostgreSQL on each request with a Server Component. It shows an empty state before shoes are added, a loading state while fetching, and a retry option if loading fails. A configured database with migrations applied is required to view the catalogue; production builds do not query it.

For future schema changes, use `npm run db:migrate -- --name NAME` and commit the generated migration. Use `npm run db:studio` to inspect a configured database.
