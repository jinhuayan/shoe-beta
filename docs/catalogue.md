# Climbing shoe catalogue

`prisma/catalogue.ts` contains 40 real models or variants across six brands. The original 20 SCARPA and La Sportiva entries were reviewed on November 13, 2026; 20 Evolv, Tenaya, Mad Rock and Unparallel entries were reviewed on November 15. Each row links to an official product page and keeps its own review date. This is a curated catalogue, not a live product feed. Names distinguish the listed variants; no gender-based foot-fit assumptions are made. Descriptions are short summaries rather than manufacturer copy. No prices, inventory, photos, or sizing conversions are imported.

SCARPA's technical **PROFILE** field is used for downturn: Flat → NEUTRAL, Moderately Downturned → MODERATE, Highly Downturned → AGGRESSIVE. The Veloce's technical profile takes precedence over the more general “neutral shape” wording in its description. La Sportiva's explicit slight downturn maps to MODERATE, and drastic downturn to AGGRESSIVE. An unspecified degree of downturn remains UNKNOWN; asymmetry alone is insufficient.

SOFT is used only where the manufacturer explicitly describes soft shoe construction. Rubber softness, sensitivity claims, midsole material, and relative comparisons do not establish a stiffness category. Unverified closures remain UNKNOWN. Vapor S is grouped as SLIPPER because SCARPA describes slipper construction, with its Nano Strap adjustment explained in the summary.

La Sportiva's [official laces table](https://www.lasportiva.com/media/docs/LACES_table.pdf) also confirms the lace-up models (Tarantulace, Finale, Miura, TC Pro, Katana Lace). Individual product pages are linked in the seed and details.

Forefoot width and heel volume remain UNKNOWN throughout this set. Overall volume, LV naming, a rounded toe box, and customer reviews do not establish these specific attributes. These labels do not establish measurements, fit guarantees, or sizes. Model-specific manufacturer sizing notes are handled separately in the [sizing reference](sizing.md).

The seed inserts missing slugs only. To revise an existing entry, update it deliberately after checking the source; changing the seed does not overwrite database edits. Set the review date only when that entry is checked again. Do not delete shoes referenced by fit records to refresh the catalogue.


## Brand coverage

| Brand | Models or variants |
| --- | ---: |
| SCARPA | 10 |
| La Sportiva | 10 |
| Evolv | 5 |
| Tenaya | 5 |
| Mad Rock | 5 |
| Unparallel | 5 |

The first set covered two brands to keep source review manageable. The expansion adds more choices for browsing and comparison without changing the recommendation rules. Brand is a filter, not a scoring signal; larger coverage does not guarantee a different brand in every shortlist.

## Sources for the expansion

The following product pages were checked on November 15, 2026. Fields not established by the source remain UNKNOWN.

| Brand | Official product sources |
| --- | --- |
| Evolv | [Defy (Medium Volume)](https://www.evolvsports.com/defy-_medium-volume_-66-0000062501), [Shaman](https://www.evolvsports.com/shaman-66-0000062203), [2026 Zenist](https://www.evolvsports.com/2026-zenist-66-0000062605), [Kronos](https://www.evolvsports.com/kronos-66-0000002475), [Rave](https://www.evolvsports.com/rave-66-0000004105) |
| Tenaya | [Tanta](https://tenaya.net/en/item/tanta/), [Ra](https://tenaya.net/en/item/ra/), [Oasi](https://tenaya.net/en/item/oasi/), [Mastia](https://tenaya.net/en/item/mastia/), [Indalo](https://tenaya.net/en/item/indalo/) |
| Mad Rock | [Rover](https://madrock.com/collections/climbing/products/rover), [Phoenix](https://madrock.com/collections/climbing/products/phoenix-2019), [Drone 2 HV](https://madrock.com/collections/climbing/products/drone-2-0-hv), [Shark 3 HV](https://madrock.com/collections/climbing/products/shark-3-0), [Remora HV](https://madrock.com/products/remora-hv) |
| Unparallel | [TN Pro](https://www.unparallelsports.com/product/tn-pro/), [Flagship](https://www.unparallelsports.com/product/flagship/), [Regulus](https://www.unparallelsports.com/product/regulus/), [Up Mocc](https://www.unparallelsports.com/product/up-mocc/), [Up Rise VCS](https://www.unparallelsports.com/product/up-rise-vcs/) |

Evolv's explicit slight camber for Defy and slight down-camber for Kronos map to MODERATE. Shaman's aggressive profile maps to AGGRESSIVE. The official [PSR overview](https://www.evolvsports.com/en-us/power-sensitivity-rating) identifies Rave as flat, which maps to NEUTRAL. PSR measures sensitivity and edging power; its numbers are not converted into stiffness. A softer heel or a comparison with another model does not establish overall stiffness. The 2026 Zenist is kept separate from earlier Zenist variants. Shaman and 2026 Zenist specify straps without naming the fastening mechanism, so closure remains UNKNOWN; Defy and Kronos explicitly identify hook-and-loop closures.

Tenaya's explicit moderate curvature for Tanta and Ra maps to MODERATE, and Mastia's aggressive curvature maps to AGGRESSIVE. Oasi is described as curved without a degree; Indalo's general aggressive-shape wording does not separate downturn from asymmetry, so both retain UNKNOWN downturn. Tenaya's rigidity and foot-width response scales are not converted into our stiffness or width categories.

Mad Rock separates profile from asymmetry. Its neutral, moderate and highly aggressive profiles map to NEUTRAL, MODERATE and AGGRESSIVE. Explicit soft and stiff construction map directly. Shark 3's balanced stiffness maps to MEDIUM as a project interpretation; Rover's supportive wording has no defined level and remains UNKNOWN. Remora's elastic closure maps to SLIPPER. HV is preserved in model names, but average-to-wide fit guidance cannot establish one forefoot-width category or a measured heel volume.

Unparallel explicitly lists aggressive downturn for TN Pro, Flagship and Regulus. Its moderate asymmetry for Up Mocc and Up Rise VCS is not a downturn category. Midsole hardness, rubber hardness and comparisons between models are not treated as overall shoe stiffness. Closure follows the official Velcro or elastic specification.

The new models have no verified EU sizing rules in the app. Manufacturer notes using other units, measured-size baselines or general brand advice are not converted into numeric references. Existing model-specific rules remain separate in the [sizing guide](sizing.md).

## Updating an existing database

From a trusted shell with the target database's direct URL in `.env.local`, run:

```bash
DOTENV_CONFIG_PATH=.env.local npm run db:seed
```

On a database containing the original 20 slugs, this adds 20 rows. Repeating it adds none. Existing IDs, descriptions, saved shoes and fit records are preserved. The brand filter reads its choices from the database, so the four new brands appear after seeding. No schema migration is required for this expansion.
