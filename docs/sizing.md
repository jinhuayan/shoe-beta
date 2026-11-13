# Sizing sources

Checked November 13, 2026. The curated rules use each exact variant's official SCARPA product-page FAQ and Technical Specs, not customer reviews. They are intentionally separate from catalogue suitability scoring. This small static guide is versioned with code; no new database entity or runtime scraping is needed.

| Model | Source | Interpretation used by the app | Listed EU sizes |
| --- | --- | --- | --- |
| Drago LV | [Product FAQ](https://us.scarpa.com/products/drago-lv) | Performance: street EU minus 1–2 | 35–45, halves |
| Instinct VS Men's | [Product FAQ](https://us.scarpa.com/products/instinct-vs-mens) | Performance: street EU minus 1–2 | 34–45, halves; 46–50, whole |
| Instinct VSR | [Product FAQ](https://us.scarpa.com/products/instinct-vsr) | Performance: street EU minus 1–2 | 35–47, halves |
| Helix Men's | [Product FAQ](https://us.scarpa.com/products/helix-mens) | Comfort: everyday EU baseline; performance: minus 0.5 | 39–47, halves; 48–50, whole |
| Vapor V | [Product FAQ](https://us.scarpa.com/products/vapor-v) | Performance: street EU minus 0.5–1 | 38–46, halves; 47–50, whole |

The source describes precision/performance fit; mapping it to the questionnaire's PERFORMANCE option is an application interpretation. For Helix, everyday sizing is treated as the user's EU street-size baseline under COMFORT. We do not create a BALANCED midpoint or map experience to a preference. Vapor V's everyday-size advice for newer climbers is retained as text, not turned into a COMFORT rule for everyone.

[Drago](https://us.scarpa.com/products/drago) mentions a half-to-full reduction without explicitly identifying EU units. [Origin VS](https://us.scarpa.com/products/origin-vs) discusses a half-EU reduction while comparing against Origin; its street-size baseline is unclear. Both retain notes without numerical calculation. Drago LV guidance must not be copied to Drago. La Sportiva and other uncovered models remain unavailable pending verified exact-model rules.

Candidates are discrete manufacturer-listed sizes within the computed interval. We do not round to an offered size, clamp an out-of-bounds interval, infer size from millimetres, assert that two foot shapes need the same size, or guarantee availability. Changing the user’s foot-length answer does not alter the reference; this limitation is displayed in results. Unknown or contradictory inputs/rules return an explanation rather than a number. A personal fitting remains necessary.

Validation covers exact variants, contrasting preferences, half sizes, whole-only sections, missing/invalid EU baselines, unsupported models, ambiguous source units and inconsistent rules. API integration checks that references do not reorder shoes and responses are uncached.
