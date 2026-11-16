# Release checks

Initial checks on November 14, 2026; Google Places follow-up on November 15 (Toronto time). This records what was tested; it is not a deployment approval.

## Production

Target: https://shoe-beta-one.vercel.app

The initial check used main commit `200dc95d22d5466e7a269d9d695ee3166b26c247` (PR #29). The previous UI PR #30 was still open, so the production UI did not yet include it or this change.

- Public catalogue, questionnaire, comparison and sign-in pages returned 200 without catalogue error boundaries.
- Guest recommendations returned ranked, non-sample catalogue shoes.
- Authentication returned a guest session; private APIs rejected unauthenticated requests with 401 and private/no-store cache controls.
- All 11 database migrations were applied, including fitting session details.
- Main [CI run](https://github.com/jinhuayan/shoe-beta/actions/runs/43672117620) and previous UI branch [CI run](https://github.com/jinhuayan/shoe-beta/actions/runs/43674457079) passed.
- After adding `GOOGLE_PLACES_API_KEY` for Production and redeploying, a live Toronto search on November 15 returned HTTP 200 with 10 shops and `demo: false`. Real Google Places connectivity passed.

These checks did not create production accounts, modify fit records or upload photos. Production private write flows and Preview environment settings are not covered by this pass.

## Local regression

- Lint, TypeScript and production build.
- 61 unit tests and shop-provider integration tests, including errors, timeouts, quotas and missing configuration.
- Auth/API integration tests against isolated PostgreSQL: migration upgrades preserve existing data; account, profile, saved shoe, fitting, context, photo and session flows pass.
- The default deployment smoke check also passes against that local server.
- Desktop, 768px tablet and 320px mobile catalogue/navigation review; no page overflow at the checked widths.
- Comparison recovery: stop only the disposable local database, open a comparison with a shoe selected, restart the database, then click Try again. The catalogue reloads and the selected shoe remains in the URL and form.

The revised climbing theme and recovery fix have not been deployed by this PR. No schema migration is needed.

## After deployment

```bash
npm run test:smoke -- https://shoe-beta-one.vercel.app
npm run test:smoke -- https://shoe-beta-one.vercel.app --shops
```

The second command makes one real Places request. Inspect the production deployment and runtime logs if it fails. Keep API keys and connection strings out of logs and Git.

## Catalogue expansion

Local checks on November 15, 2026 covered 40 models across six brands. The original 20 definitions and their November 13 review dates were preserved; the 20 new entries have November 15 review dates and official product sources.

- An isolated database upgrade added 20 missing shoes while preserving existing IDs and an edited description. Another seed run inserted zero rows and left the catalogue unchanged.
- New-brand filters and details loaded with source dates and explicit unavailable sizing guidance.
- All 62 unit tests, lint, the production build, and the auth/API integration suite passed.

This check did not seed the production database. Apply the updated seed separately to make the new brands visible there; no new migration is needed.
