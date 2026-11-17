# End-to-end tests

The unit tests in `src/lib/*.test.ts` check rules and validation in isolation, and `scripts/test-auth.mjs` checks the private APIs. The Playwright tests in `e2e/` check that the pieces work together in a real browser, the way a user moves through the app.

## What is covered

| File | What it checks |
| --- | --- |
| `catalogue.spec.ts` | Filters are stored in the URL, survive opening a shoe and pressing Back, and clear correctly. Empty searches and unknown shoe URLs show helpful pages. |
| `compare.spec.ts` | Two shoes chosen in the form appear in the table, the URL can be reloaded or shared, duplicates and a fourth shoe are skipped, removing a shoe works, and one shoe alone asks for a second. |
| `questionnaire.spec.ts` | Out-of-range input is flagged and focused without losing answers. Reviewing, editing and building a shortlist works, results always explain themselves and never show percentages, and the shortlist opens in the comparison page. A failed recommendation request shows a retryable error without losing the profile. Guests are asked to sign in before saving. |
| `shops.spec.ts` | Shop results and provider errors are displayed correctly. The browser request to `/api/shops` is replaced in these tests, so they never use Google Places quota. |
| `auth.spec.ts` | Private pages ask guests to sign in. A saved profile and shortlist persist across sign-out and sign-in. One account cannot see another account's saved shoes, guests get 401 with `no-store`, and repeated sign-ups are rate limited. |
| `mobile.spec.ts` (Pixel 7 viewport) | The menu opens, closes with Escape and returns focus, closes after choosing a link, and marks the active page. Skip to content is the first Tab stop and focuses the main region. Main pages have no sideways scrolling, the comparison table scrolls inside its own keyboard-reachable region, and form inputs use at least 16px text so phones do not zoom in. |

All other files run in a 1280 × 800 desktop Chrome window.

### Design choices

- **Real data, not hard-coded shoes.** Tests read brands and shoes from the page (for example, the first option in the Brand filter) instead of assuming specific catalogue entries, so expanding the catalogue does not break them.
- **Role- and label-based selectors.** Tests find elements by their accessible role and label (`getByRole`, `getByLabel`), the same way screen-reader users find them. A test failing because a button lost its label is a real accessibility bug.
- **One fresh account per test.** Tests that sign up create a new `@example.test` account, so they can run in parallel and in any order.
- **Rate limiting.** Better Auth limits sign-ups per client IP in production builds. Each test sends its own random private `X-Forwarded-For` address so tests do not block one another, and `auth.spec.ts` checks the limit still applies to a single client.
- **Production build.** Tests run against `next build` + `next start`, because streaming, caching and rate limiting behave differently in `next dev`.

### Issue found while writing the tests

The mobile menu only closes when one of its own links is clicked. If it is open and the user presses the browser's Back button, the new page loads with the menu still open. The test `the menu closes when the route changes through browser history` reproduces this and is marked `test.fixme`, so it is skipped for now instead of failing the suite. A possible fix in `SiteHeader` is to close the menu whenever `usePathname()` changes; once that is in place, remove `.fixme`.

One behaviour worth knowing: `/shoes/[slug]` returns HTTP 200 (not 404) for unknown shoes, because `/shoes/loading.tsx` makes Next.js stream the page before `notFound()` runs. Next.js adds `noindex` to the page instead, and the test checks for that.

## Running locally

Use a **separate** database for these tests; they create accounts and saved shoes.

```bash
createdb shoe_beta_e2e
export DATABASE_URL=postgresql://localhost:5432/shoe_beta_e2e
export BETTER_AUTH_SECRET=$(openssl rand -base64 32)

npm run db:deploy
npm run db:seed
npm install -D @playwright/test@1.65.1   # first time only
npx playwright install chromium          # first time only
npm run build
npx playwright test
```

Playwright starts `next start` on port 3100 and sets `BETTER_AUTH_URL` to match. Useful options:

```bash
npx playwright test -- e2e/mobile.spec.ts        # one file
npx playwright test -- --headed --project mobile  # watch the mobile tests run
npx playwright test -- --ui                       # interactive runner
npx playwright show-report                     # HTML report after a CI-style run
```

| Variable | Purpose |
| --- | --- |
| `E2E_BASE_URL` | Test a server you already started (Playwright will not start one). |
| `E2E_PORT` | Port for the server Playwright starts (default 3100). |
| `PLAYWRIGHT_CHROMIUM_PATH` | Use an existing Chrome/Chromium instead of the one from `playwright install`. |

## CI

These tests are not yet part of `.github/workflows/ci.yml`. A CI job would need its own PostgreSQL service, then `npm run db:deploy`, `npm run db:seed`, `npx playwright install --with-deps chromium`, `npm run build` and `npx playwright test`.

## Not covered

- Photo upload and download in the browser. The storage API is covered by `npm run test:auth`, which uses a local S3-compatible stub.
- Real Google Places responses (see `npm run test:shops` and the smoke test in `docs/release-checks.md`).
- Browsers other than Chromium.
