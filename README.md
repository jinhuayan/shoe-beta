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

At `/questionnaire`, visitors can enter foot measurements, foot shape, climbing experience, discipline, and fit preference, then review and edit their answers. Measurements are optional and every choice supports “Unsure”. Reviewing answers works without a database or account and keeps them only in the current page state. Reloading clears them. Choose **Find climbing shoes** after reviewing to request a shortlist from the configured catalogue.

The form accepts foot lengths from 100–400 mm in 0.1 mm increments and EU street sizes from 20–55 in half-size increments. These are input limits, not sizing rules; no conversion or downsizing formula is applied.

## First recommendation rules

`POST /api/recommendations` accepts the same form fields as the questionnaire (multipart or URL-encoded form data). It validates them again, reads the catalogue, and returns up to three shoes with reasons and tradeoffs. Invalid submissions return 400; catalogue failures return 503 and can be retried without re-entering answers. No profile is stored.

| Input | Rule | Points |
| --- | --- | --- |
| Beginner or comfort priority | Prefer neutral downturn; apply once even when both are selected | +2 neutral, −2 other known downturns |
| Bouldering | Prefer soft construction for sensitivity | +1 soft, 0 otherwise |
| Sport climbing | Prefer medium or stiff construction for support | +1 medium/stiff, 0 otherwise |
| Trad climbing | Prefer stiff construction for support | +1 stiff, 0 otherwise |

Unknown attributes contribute zero points and appear as tradeoffs. Only positive totals are shortlisted, with ties sorted by brand, model, then slug. With no applicable rules, the response is `insufficient`; with no positive candidates it is `empty`. Performance preference and advanced experience do not automatically favour aggressive downturn. Balanced, mixed, and unsure choices add no rule yet.

The general starting points come from [SCARPA's shoe guide](https://www.scarpa.co.uk/blogs/blog/how-to-choose-a-climbing-shoe) and [construction guidance](https://scarpa.com/collections/climbing-shoes). The trad-support rule is our inference from long-route guidance. Weights and cutoffs are project choices, not manufacturer ratings or measured fit probabilities. Terrain can change which construction is suitable; reasons and tradeoffs describe these limited rules, not a guarantee of comfort or performance.

Foot width, toe shape, heel volume, and measurements are not scored because the catalogue has no model-specific fit data yet. Size estimation remains unavailable; neither street size nor foot length is converted into a climbing shoe size. Fictional samples stay marked as samples in results.

## Check

```bash
npm run lint
npm run typecheck
npm test
npm run db:validate
npm run build
```

The scripts use Webpack for compatibility with the current development environment.

## CI and deployment

[GitHub Actions](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs) runs `.github/workflows/ci.yml` for pull requests targeting `main` (including new commits on an open PR) and pushes to `main`. It installs dependencies with `npm ci`, reads Node.js 24 from `.nvmrc`, then runs lint, typecheck, tests, Prisma validation, and the production build. These checks need no database or secrets; they do not test a live database connection. A feature-branch push without a PR does not trigger this workflow.

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

CI and Vercel deployments run independently by default. Protect `main` with required pull requests and require the `check` job from the `CI` workflow to pass before merging. Enable the requirement after its first GitHub run, require branches to be up to date, and avoid bypassing the rule. See [required status checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

To also hold production promotion until the checks for the deployed commit pass, open the Vercel project's **Settings → Deployment Checks → Add Checks**, choose GitHub, and select `check` from this workflow after its first run. Keep automatic production domain assignment enabled. Vercel can build in parallel with CI, then promote the deployment after the selected check succeeds. See [Vercel Deployment Checks](https://vercel.com/docs/deployment-checks). Branch protection alone only gates merging, not the subsequent production promotion.

Set `DATABASE_URL` in Vercel's environment variables to a hosted PostgreSQL database reachable from Vercel. Use a separate test database for Preview and the production database for Production; a local `localhost` database will not work there. From a trusted shell configured for each target database, run `npm run db:deploy` before deploying code that needs a new schema. Sample seeding is optional and separate. The build generates Prisma Client but does not migrate or seed a database. Redeploy after changing environment variables. See [Vercel environment variables](https://vercel.com/docs/environment-variables).

## Database setup

Prisma 7 is configured for PostgreSQL. Installation and builds generate Prisma Client automatically and can run before a database is configured.

To prepare a local connection:

1. Start PostgreSQL and create a separate database named `shoe_beta` using your local PostgreSQL role.
2. Copy `.env.example` to `.env` and replace the username and password placeholders:

   ```bash
   cp .env.example .env
   ```

The application uses `getDb()` from `src/lib/db.ts` in Server Components, Server Actions, or Route Handlers. The client is created when first requested and reused across requests and development reloads. Calling it requires `DATABASE_URL`; importing it does not open a connection. Keep this module on the server.

The `Shoe` model stores a unique slug, brand, model name, optional description, a sample-data flag, and climbing attributes: downturn, stiffness, and closure. New attributes default to `UNKNOWN` for existing records. Generated files under `src/generated/prisma/` are ignored by Git and ESLint. Local `.env` files stay ignored; `.env.example` is tracked as a template.

Apply the included migration, regenerate the client, and optionally load the sample catalogue:

```bash
npm run db:deploy
npm run db:generate
npm run db:seed
```

Restart the dev server after applying migrations and regenerating Prisma Client.

The seed inserts three **fictional climbing shoes** marked as samples. Repeating it skips existing slugs and preserves names and descriptions. Existing sample shoes receive climbing attributes only when all three are still `UNKNOWN`; edited attributes and non-sample records are preserved. This is development data, not verified product or sizing information.

The catalogue queries PostgreSQL on each request with a Server Component. It shows an empty state before shoes are added, a loading state while fetching, and a retry option if loading fails. A configured database with migrations applied is required to view the catalogue; production builds do not query it.

For future schema changes, use `npm run db:migrate -- --name NAME` and commit the generated migration. Use `npm run db:studio` to inspect a configured database.
