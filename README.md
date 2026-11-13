# Shoe Beta

A climbing-shoe project built with Next.js, TypeScript, Tailwind CSS, and PostgreSQL. The first feature is a read-only shoe catalogue.

## Model-specific size references

Recommendations now include a separate `sizeReference` for each shoe. It never changes the suitability score or ordering. Five exact SCARPA variants have numeric guidance: Drago LV, Instinct VS Men's, Instinct VSR, Helix Men's, and Vapor V. Drago and Origin VS have source notes only because the numeric baseline/unit is ambiguous. Other models report unavailable rather than borrowing a brand-wide adjustment.

Shoe details include a guest calculator, and comparison tables include the model notes. The calculator keeps answers in page state; it does not save or alter a profile, prefill a fitting, or place measurements in a shared URL. Recommendation responses are `no-store`.

The calculation requires a valid EU street size and a preference covered by the exact guide. Only sizes listed in that product's technical specification are returned. Whole-size sections are respected without rounding; intervals outside the listed bounds are rejected rather than clamped. Foot length, width, heel volume, toe shape, experience, and suitability scores do not establish a size. These are manufacturer-based starting points to try, with no fit or inventory guarantee.

See [sizing sources and decisions](docs/sizing.md). No migration, seed, credentials, or live API is required. Guidance is versioned in `src/lib/shoe-sizing.ts`; its review date is fixed until the source is checked again.

## Private saved shoes

Signed-in users can save a shoe from its details, save the whole recommendation shortlist, or add a shoe on `/saved-shoes`. Saving the same shoe again is harmless. Saved shoes persist across sign-ins and reloads; removing one is reversible by saving it again. Removal does not delete the shoe or any fit records. Select two or three public shoes to open a shareable comparison. Saved shoes are private; comparison links include public shoe slugs only.

Apply `DOTENV_CONFIG_PATH=.env.local npm run db:deploy` before deploying this version. The `SavedShoe` migration adds an account/shoe pair with a unique key. Account deletion removes its saved list; a referenced shoe cannot be deleted. No new environment variables or seed changes are needed.

`GET /api/saved-shoes` returns the current account's saved shoes and public catalogue choices. `POST` accepts `{ "slugs": ["scarpa-drago"] }` with one to three slugs, inserts missing pairs only, and reports `added`. A batch containing unavailable or sample shoes is rejected as a whole. `DELETE` accepts `{ "shoeId": "..." }`. Sessions determine ownership; request-supplied user IDs are ignored. Writes validate Origin and all responses are private/no-store. Missing and other-account entries return the same 404 response. Saved entries later marked as samples remain removable but cannot be selected for public comparison.

The existing local `test:auth` suite covers account isolation, validation, concurrent saves, idempotence, expiry, restart persistence, and removal with dummy credentials. Loading and write failures retain the list and offer retry/reload.

## Shoe comparison

Open `/compare` to choose up to three different public catalogue shoes. The table shows downturn, stiffness, closure, forefoot width, heel volume, manufacturer sources/review dates, and links to record a fitting. Catalogue cards and shoe details can preselect a shoe; questionnaire results link to a comparison of the whole shortlist.

Selections are repeated `shoe` URL parameters, such as `/compare?shoe=scarpa-drago&shoe=scarpa-helix-mens`. Their order is preserved. Duplicate, oversized, missing, and fictional sample entries are skipped with a notice; only the first three distinct valid-length slugs are considered. Replace a selection in the form, use **Remove**, or clear the comparison. Reloading and sharing the URL preserve the selection without an account or browser storage.

**Show only differing attributes** (`differences=1`) hides equal attribute rows while keeping sources and fitting links visible. Equal Unknown labels do not establish equal fit, and no sizes or fit scores are inferred. The mobile table scrolls horizontally within its labelled, keyboard-focusable region. **Copy comparison link** copies only shoe selections and the view flag; it includes no profile or private fit data. If clipboard access is blocked, copy the address-bar URL instead. A failed catalogue load offers retry while keeping the URL.

No migration, seed changes, or new environment variables are required for comparison. Unit tests cover selection normalization, safe URL encoding, and difference rules; the existing `test:auth` integration suite also checks public comparison against local PostgreSQL.

## Run

Use Node.js 24. With nvm, run `nvm install` followed by `nvm use`.

```bash
npm ci
npm run dev
```

Open the Local URL printed in the terminal, normally http://localhost:3000. The home route redirects to `/shoes`.

Click a shoe name to open its details at `/shoes/[slug]`. Unknown shoe URLs show a not-found page with a link back to the catalogue.

Search climbing shoes by brand or model and filter by brand, downturn, stiffness, and closure. Filters are saved in the URL and kept when opening a shoe and returning to the catalogue. Invalid or repeated filter values are ignored.

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

Width and heel-volume matching compare qualitative catalogue labels with questionnaire answers. The current real-shoe seed leaves both attributes unknown, so they do not earn matching points. Fictional samples are used only as test fixtures and are excluded from public recommendations. Toe shape and measurements are not scored. Size references use verified model-specific EU rules for covered preferences; foot length is not converted. See the sizing reference section.

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

The photo backend supports one JPEG or PNG per fit record, up to 2 MiB. Each saved record has photo upload controls. After upload, use **View photo**, **Download photo**, or **Remove photo**. Removal has a confirmation and cancel step; remove the photo before deleting its record. File errors keep the chosen file available for retry. The server checks the session, record ownership, declared MIME type, and file signatures. Signature checks do not fully decode images. Objects are private; object keys and original filenames are not returned to clients.

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

## Shop search

`/shops` is available to guests. Enter a city or neighbourhood to request up to ten Google Places Text Search (New) matches for climbing shoe retailers. Results show addresses, Google Maps links, temporary-closure flags, and provider attributions. They are search candidates, not verified climbing shoe stock or a distance-sorted list. Call ahead before visiting. The header and shoe details link to the search page.

`POST /api/shops` accepts `{ "location": "Toronto, ON" }`. It normalizes 2–100 characters, validates Origin against the request Host, and sends a server-side request with a restricted field mask and an eight-second timeout. It returns 400 for invalid input, 403 for a mismatched/missing Origin, 429 for quota/busy responses, 504 for timeouts, and 503 for missing configuration or provider failures. Upstream errors and keys are not returned. Searches and results are not saved to the database, browser storage, or a server cache. A warm server instance allows 20 searches per minute across all users; this is a basic throttle, not a deployment-wide spending limit. Google Cloud quotas must also be configured.

### Configure Google Places

1. In Google Cloud, create/select a project and review billing before enabling **Places API (New)**. [Setup instructions](https://developers.google.com/maps/documentation/places/web-service/get-api-key).
2. Create a server API key restricted to **Places API (New)**. Configure API quotas in Cloud Console and billing alerts. Alerts do not cap spending; choose quotas suitable for the team's budget. Browser referrer restrictions are not suitable for this server-side key; use supported server restrictions for your hosting setup.
3. Set `GOOGLE_PLACES_API_KEY` in `.env.local` and Vercel's environment variables, then restart/redeploy. Keep it out of Git and do not add a `NEXT_PUBLIC_` prefix. Preview should use its own restricted key/quota.
4. The requested display-name/address/Maps-link fields use the Text Search Pro field tier; review [field billing](https://developers.google.com/maps/documentation/places/web-service/text-search) before making live requests. No live Google requests were made during local validation.
5. Review the public `/privacy` and `/terms` project notices with the team before public deployment. The results use the unmodified official Google Maps logo, plus provider credits, following [attribution guidance](https://developers.google.com/maps/documentation/places/web-service/policies). The official SVG comes from Google's attribution asset bundle.

Run `npm run test:shops` after a build to exercise a local HTTP provider with dummy keys, including malformed responses, unsafe links, empty results, failures, timeouts, and quotas. The test-only `PLACES_TEST_ENDPOINT` accepts only HTTP loopback URLs and is disabled on Vercel; it is not a deployment setting. Local fixture results are explicitly marked as demo data. Real Google connectivity and result relevance need a smoke test after the key is configured.

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

The Prisma Postgres integration supplies `DATABASE_URL_POOLED` for application requests and a direct `DATABASE_URL` for migrations. The app prefers the pooled URL and falls back to the direct URL. Use a separate test database for Preview and the production database for Production; a local `localhost` database will not work on Vercel. From a trusted shell configured for each target database, run `npm run db:deploy` before deploying code that needs a new schema. With a direct URL in `.env.local`, run `DOTENV_CONFIG_PATH=.env.local npm run db:deploy`. Catalogue seeding is a separate manual step. The build generates Prisma Client but does not migrate or seed a database. Redeploy after changing environment variables. See [Prisma Postgres on Vercel](https://www.prisma.io/docs/guides/postgres/vercel).

## Database setup

Prisma 7 is configured for PostgreSQL. Installation and builds generate Prisma Client automatically and can run before a database is configured.

To prepare a local connection:

1. Start PostgreSQL and create a separate database named `shoe_beta` using your local PostgreSQL role.
2. Copy `.env.example` to `.env` and replace the username and password placeholders:

   ```bash
   cp .env.example .env
   ```

The application uses `getDb()` from `src/lib/db.ts` in Server Components, Server Actions, or Route Handlers. The client is created when first requested and reused across requests and development reloads. Calling it requires `DATABASE_URL_POOLED` or `DATABASE_URL`; importing it does not open a connection. Prisma commands and the seed use the direct `DATABASE_URL`. Keep this module on the server.

The `Shoe` model stores a unique slug, brand, model name, optional description, optional manufacturer URL/review date, a sample-data flag, and climbing attributes: downturn, stiffness, closure, forefoot width, and heel volume. New attributes default to `UNKNOWN` for existing records. Generated files under `src/generated/prisma/` are ignored by Git and ESLint. Local `.env` files stay ignored; `.env.example` is tracked as a template.

Apply the included migration, regenerate the client, and load the sourced catalogue:

```bash
npm run db:deploy
npm run db:generate
npm run db:seed
```

Restart the dev server after applying migrations and regenerating Prisma Client.

The seed adds 20 real SCARPA and La Sportiva climbing shoes. Every entry includes its official product URL and a fixed review date. Repeating it skips existing slugs and preserves all edits. Existing fictional shoes and their fit records remain in the database, but samples are excluded from public catalogue searches and recommendations. Existing sample detail links and private records still work.

Apply the source-field migration before deploying this version, then seed the target database:

```bash
DOTENV_CONFIG_PATH=.env.local npm run db:deploy
DOTENV_CONFIG_PATH=.env.local npm run db:seed
```

`/shoes` supports brand, keyword, downturn, stiffness, and closure filters together. Keywords match every word across brand/model, without case sensitivity. Detail links preserve the search. Unknown attributes are unverified and do not earn recommendation points; width-only answers can produce an empty shortlist with this dataset. See [catalogue sources and normalization](docs/catalogue.md).

The catalogue queries PostgreSQL on each request with a Server Component. It shows an empty state before shoes are added, a loading state while fetching, and a retry option if loading fails. A configured database with migrations applied is required to view the catalogue; production builds do not query it.

For future schema changes, use `npm run db:migrate -- --name NAME` and commit the generated migration. Use `npm run db:studio` to inspect a configured database.
