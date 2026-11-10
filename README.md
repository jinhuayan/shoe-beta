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

After a production build, `npm run test:auth` runs API integration tests using `TEST_DATABASE_URL`. It requires a loopback PostgreSQL database named `shoe_beta_auth_test`, applies migrations, and starts its own local server with a temporary secret. It checks registration, password rejection and hashing, session ownership, sign-out, expiry, restart persistence, origin checks, and missing configuration. Profile checks cover saving, updating, validation, and cross-account access. Fit record checks cover creation, repeated fittings, input limits, and ownership. It does not read `.env.local` or use the application database URL.

## Saved profiles

Sign in before entering questionnaire answers. After reviewing, choose **Save profile** to create or replace your account's saved measurements and climbing preferences. **Load saved profile** replaces the current answers and opens the review; loading is manual. Reloading or switching accounts clears unsaved answers, and signing out clears the form. Guest reviewing and recommendations remain available.

`GET /api/profile` returns the current account's validated questionnaire state, or `null` before its first save. `PUT /api/profile` accepts the questionnaire form fields. Both require a valid server-checked session; the server derives ownership from that session. Responses are private and uncached, and writes require a matching Origin. Invalid answers return 400, expired or missing sessions return 401, and unavailable services return 503.

The migration adds one `ClimbingProfile` row per user, containing both foot measurements and climbing preferences. Apply it with `DOTENV_CONFIG_PATH=.env.local npm run db:deploy` before deploying this change.

## Fit records

At `/fit-records`, signed-in users can add a climbing shoe they tried, the EU size worn, overall fit, optional 1–5 rating, and notes up to 1,000 characters. The current form accepts EU sizes from 20 to 55 in whole or half sizes; these are input limits, not sizing advice. Each save creates a separate record, so the same shoe can be tried in several sizes. Records appear newest first. Shoe details link to the form with that shoe preselected.

`GET /api/fit-records` returns the current account's records and catalogue shoe choices. `POST /api/fit-records` accepts JSON form values as strings: `shoeId`, `sizeEu`, `fit`, `rating`, and `notes`. Fit choices are `UNKNOWN`, `TIGHT`, `COMFORTABLE`, and `LOOSE`; an empty rating means unrated. Both operations require a server-validated session. The server sets ownership, returns private uncached responses, and checks the configured application Origin for writes.

Apply the new `FitRecord` migration with `DOTENV_CONFIG_PATH=.env.local npm run db:deploy` before deployment. User deletion cascades to their records after attached photos have been removed; a catalogue shoe referenced by a record cannot be deleted. Choose **Edit** on a saved record to change its shoe, size, fit, rating, or notes; **Cancel editing** discards those changes. **Delete** opens an inline confirmation. Only a confirmed successful deletion removes the record from the list. Failed requests retain the form and record for retry.

`PATCH /api/fit-records` accepts the same fields plus `id`; `DELETE /api/fit-records` accepts `{ "id": "..." }`. Both check the session and Origin, and match the record ID together with its owner in the database operation. Missing and other-account records return the same 404 response. No additional migration is needed for editing and deletion.

## Private photo API

The photo backend supports one JPEG or PNG per fit record, up to 2 MiB. Photo buttons will be added separately. The server checks the session, record ownership, declared MIME type, and file signatures. Signature checks do not fully decode images. Objects are private; object keys and original filenames are not returned to clients.

`/api/fit-records/[id]/photo` supports `POST` with one multipart `photo` field, `GET` for inline viewing, `GET ?download=1` for download, and `DELETE` to remove the photo. Writes require the configured application Origin. Another user's record returns 404. A second upload returns 409. Remove the photo before deleting its fit record; a restrictive foreign key also protects concurrent uploads from record deletion.

Uploads that fail storage or metadata creation attempt object cleanup. Photo deletion removes storage first, retaining metadata if storage fails so it can be retried. Storage and PostgreSQL do not share a transaction: a storage outage during cleanup can leave an orphan object requiring manual reconciliation. Requests fail with 503 when storage is unavailable or unconfigured. The existing CI integration test uses a local S3 HTTP test double with dummy credentials, not real Spaces; it covers upload, viewing/download, removal, access controls, limits, concurrent uploads, and failure recovery. Real Spaces connectivity still needs a smoke test after configuration.

### Configure DigitalOcean Spaces

1. In [DigitalOcean](https://cloud.digitalocean.com), open **Spaces Object Storage → Create Bucket**. Choose **Standard Storage**, a region, and a unique bucket name. Review the displayed charges before creating it; the first bucket starts a Spaces subscription. Keep CDN off for this private server-mediated flow. See [bucket creation](https://docs.digitalocean.com/products/spaces/how-to/create/).
2. Keep bucket file listing restricted and objects private. The upload API explicitly sets the private ACL. Do not add a public bucket policy.
3. Open **Spaces Object Storage → Access Keys → Create Access Key**. Choose **Limited access**, select this bucket, and grant **Read/Write/Delete**. Save the access key and one-time secret privately. See [access-key setup](https://docs.digitalocean.com/products/spaces/how-to/manage-access/).
4. Add these values to `.env.local`, and to the Vercel project's environment variables. Use a separate bucket/key for Preview. Do not use `NEXT_PUBLIC_` prefixes or commit secrets.

   ```dotenv
   SPACES_ENDPOINT="https://nyc3.digitaloceanspaces.com"
   SPACES_BUCKET="your-bucket-name"
   SPACES_ACCESS_KEY_ID="your-access-key"
   SPACES_SECRET_ACCESS_KEY="your-secret-key"
   ```

   Replace `nyc3` with the chosen region. Use the regional origin endpoint, without the bucket name or CDN hostname. The SDK uses `us-east-1` for signing and the endpoint selects the actual datacenter, following [DigitalOcean's SDK example](https://docs.digitalocean.com/products/spaces/reference/aws-sdks/). No browser-to-bucket CORS rule is needed because the app server transfers files.
5. Apply `DOTENV_CONFIG_PATH=.env.local npm run db:deploy`, restart local development, and redeploy Vercel after setting its variables. Test the API with a disposable signed-in account: upload, view, download, remove, and reject another account. Never send keys in chat or screenshots.

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
