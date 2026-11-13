# Climbing shoe catalogue

Reviewed on November 13, 2026. `prisma/catalogue.ts` is a curated starting set, not a live product feed. Each row links to the official SCARPA or La Sportiva product page. Names distinguish the listed variants; no gender-based foot-fit assumptions are made. Descriptions are short summaries rather than manufacturer copy. No prices, inventory, photos, or sizing conversions are imported.

SCARPA's technical **PROFILE** field is used for downturn: Flat → NEUTRAL, Moderately Downturned → MODERATE, Highly Downturned → AGGRESSIVE. The Veloce's technical profile takes precedence over the more general “neutral shape” wording in its description. La Sportiva's explicit slight downturn maps to MODERATE, and drastic downturn to AGGRESSIVE. An unspecified degree of downturn remains UNKNOWN; asymmetry alone is insufficient.

SOFT is used only where the manufacturer explicitly describes soft shoe construction. Rubber softness, sensitivity claims, midsole material, and relative comparisons do not establish a stiffness category. Unverified closures remain UNKNOWN. Vapor S is grouped as SLIPPER because SCARPA describes slipper construction, with its Nano Strap adjustment explained in the summary.

La Sportiva's [official laces table](https://www.lasportiva.com/media/docs/LACES_table.pdf) also confirms the lace-up models (Tarantulace, Finale, Miura, TC Pro, Katana Lace). Individual product pages are linked in the seed and details.

Forefoot width and heel volume remain UNKNOWN throughout this set. Overall volume, LV naming, a rounded toe box, and customer reviews do not establish these specific attributes. We do not infer measurements, fit guarantees, or recommended EU sizes.

The seed inserts missing slugs only. To revise an existing entry, update it deliberately after checking the source; changing the seed does not overwrite database edits. Set the review date only when that entry is checked again. Do not delete shoes referenced by fit records to refresh the catalogue.
