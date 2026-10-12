# Project Proposal: Shoe Beta

**Course:** ECE1724: Advanced Web Development, Fall 2026  
**Project:** Personalized climbing shoe fit and shopping assistant  
**Repository:** [github.com/jinhuayan/shoe-beta](https://github.com/jinhuayan/shoe-beta)  
**Status:** Working draft

| Team member | Student number | Email |
| --- | --- | --- |
| Jenny Qin | 1006960068 | yide.qin@mail.utoronto.ca |
| Jinhua Yan | 1012858686 | sudojinhua.yan@mail.utoronto.ca |
| Ouyi Yang | 1012421407 | ouyi.yang@mail.utoronto.ca |

## 1. Motivation

Choosing climbing shoes online is difficult because size alone does not describe fit. Climbers with the same street size can have different forefoot widths, heel volumes, and toe shapes. Their preferred tightness also depends on climbing style and comfort preference. A shoe that works for one person may leave space around another person's heel or put excessive pressure on their toes.

Beginners may not know which characteristics matter, while experienced climbers may struggle to compare unfamiliar models with shoes they own. Product descriptions, size charts, and reviews help, but users must combine these sources themselves.

Shoe Beta will help beginner to advanced climbers identify suitable models and estimated sizes, understand the suggestions, and find nearby retailers. Recommendations will provide a starting point for trying shoes rather than a guarantee of fit.

## 2. Objectives, Architecture, and Key Features

### 2.1 Objectives and core functionality

The objective is to connect personal fit information, shoe characteristics, and retailer discovery. Users will be able to:

- Create an account and save foot measurements, foot shape, width, heel volume, climbing experience, preferred disciplines, and comfort preference.
- Record shoes previously worn, including model, size, overall fit, and areas that feel tight or loose.
- Browse and filter a curated shoe catalogue.
- Receive ranked model recommendations, estimated size ranges, and explanations.
- Save favourites and compare up to three shoes.
- Attach optional photos to fit records and retrieve or download them later.
- Search for nearby retailers from a selected location.

### 2.2 Architecture and technology choices

We propose the **Next.js full-stack approach** with the App Router and TypeScript throughout. Tailwind CSS and shadcn/ui will support responsive interfaces. PostgreSQL will hold relational data, and DigitalOcean Spaces will store images.

Following the [Next.js component model](https://nextjs.org/docs/app/getting-started/server-and-client-components), Server Components will load catalogue and account data; Client Components will handle the wizard, filters, and comparison. Server Actions will handle profile, fit-record, and favourite mutations. API Routes, implemented as App Router Route Handlers, will expose recommendations and retailer searches.

A server-side service layer will contain database access, recommendation rules, authorization, and external-service adapters. Shared TypeScript types and validation schemas will define UI/server data contracts. Input will also be validated on the server.

One Next.js codebase reduces coordination overhead while separating UI, business logic, and persistence. A separate Express backend would offer independent deployment, but our scope does not require that boundary.

### 2.3 Database design and data flow

| Entity | Main data and relationships |
| --- | --- |
| User | Account identity and authentication records; owns profiles, fit records, and favourites. |
| FootProfile / ClimbingProfile | One of each per user; measurements, foot characteristics, experience, disciplines, and fit preference. |
| ShoeModel | Brand, named model and variant, sizes, construction, stiffness, downturn, and intended uses. |
| ShoeFitProfile | Links to a shoe variant; qualitative fit attributes, sizing evidence, source links, and uncertainty notes. |
| FitRecord | Links a user to a shoe variant and worn size; comfort, tight or loose areas, and comments. |
| Favourite | Links a user to a saved shoe variant; unique user/shoe pair. |
| Upload | Links an image to its owner and fit record; object-storage key, file type, and size. |

Variants with different volume or construction will have separate entries so their fit data is not mixed. Foreign keys will preserve relationships, and owner-scoped queries will restrict access to personal records.

After the wizard saves a profile through a Server Action, the recommendation route loads the user's profile, fit history, and shoe data. It runs the scoring service and returns ranked results, size estimates, and reasons. Computing results on demand will reflect profile changes in subsequent requests.

### 2.4 Recommendation and sizing logic

We propose an explainable rule-based system. Model matching and size estimation will be separate calculations because selecting a suitable shape is different from selecting a size.

Model ranking will compare forefoot width, heel and overall volume, toe-box characteristics, climbing discipline, and comfort preference. Weighted compatibility rules will produce a ranking and short explanations such as “matches your narrow heel” or “stiffer option for your preferred climbing style.” The weights will be treated as design assumptions and reviewed using contrasting example profiles.

Missing attributes will remain unknown rather than being invented. Results will show how much relevant fit information is available. A compatibility score will describe the rule-based ranking, not a measured probability that a shoe will fit.

Size estimation will use measured foot length, available model-specific sizing evidence, desired fit, and previous shoe records where comparable evidence exists. We will avoid a universal rule such as always subtracting two sizes from street size. An output could suggest EU 35.5–36 and explain which end is intended for a more comfortable fit. If evidence is insufficient, the app will show that limitation instead of giving an exact estimate.

Manufacturer information and labelled qualitative fit observations will form the dataset. Fit records will provide personal context; automatic learning from community reports is outside the scope. Rules can be inspected and tested without a large training dataset.

### 2.5 Cloud file storage

Users will upload optional photos through their fit records. The server will check ownership, accepted image types, and file size before storing the image in DigitalOcean Spaces. PostgreSQL will store the object key and its relationship to the user and record.

Owners will view and download images through temporary access URLs. Attachment deletion will remove both storage and metadata. Images will support fit notes; photo-based measurement is outside the scope.

### 2.6 Advanced features

**Authentication and authorization:** Better Auth is proposed for registration, login, and sessions. Profiles, fit records, uploads, and favourites will require authentication. Protected Server Actions and API routes will verify sessions and record ownership.

**External API integration:** A server-side adapter will use [Google Places](https://developers.google.com/maps/documentation/places/web-service/nearby-search) to retrieve nearby retailer candidates within a selected area. Results will include store names, addresses, distance estimates, and map links. We will check retailer relevance during an early prototype, request only necessary fields, and handle empty results, timeouts, and quota errors. Store discovery will remain separate from product inventory: a nearby retailer result will not imply that a specific model or size is in stock.

### 2.7 User experience and feasible scope

The wizard will explain unfamiliar terms with diagrams and an “unsure” option. Users can revise steps without losing input. Results will emphasize size ranges, reasons, and fit concerns. Comparisons will use consistent attributes. Main flows will support mobile screens, keyboard navigation, loading states, and validation messages.

The initial catalogue will target approximately 30 shoe variants across several brands. Live price comparison is a stretch goal, dependent on a reliable source. We will not make scraping, exact local inventory, machine learning, or photo-based measurement dependencies of the core workflow.

Verification will cover contrasting profiles, missing data, available size boundaries, and explanations consistent with scoring results. Integration tests will check saved profiles, ownership restrictions, and upload retrieval. End-to-end checks will cover login, profile creation, recommendations, saving/comparison, and retailer failures. A small set of manually reviewed real fit examples will help assess usefulness; software tests alone will not establish sizing accuracy.

## 3. Project Plan and Team Responsibilities

### 3.1 Development stages

All dates below are in 2026. Course deadlines are at 11:59 PM Toronto time.

| Period | Planned outcome |
| --- | --- |
| Oct 1–18 | Agree on scope, schema, UI sketches, and recommendation assumptions; prototype authentication, storage, and retailer API access. |
| Oct 19–Nov 1 | Build a complete login-to-recommendation flow with a small seed dataset; submit team formation by Oct 25. |
| Nov 2–8 | Review early evidence, refine ownership and scope, and submit the identical proposal individually by Nov 8. |
| Nov 9–18 | Expand the catalogue; integrate fit records, uploads, favourites, comparison, and retailer search; complete the individual health check by Nov 18. |
| Nov 19–26 | Stabilize the demo and test main flows; submit the introduction by Nov 25 and slides by Nov 26. |
| Nov 27–Dec 6 | Complete verification, documentation, and the 2–5 minute video; finalize the repository deliverable by Dec 6. |

Presentation content will reflect work completed by November 26, regardless of the assigned presentation date.

### 3.2 Proposed initial ownership

The following division is tentative and will be reviewed with all three members.

| Member | Initial responsibilities |
| --- | --- |
| Jenny Qin | Frontend structure, profile wizard, catalogue/results UI, comparison, responsive design, and UI flow checks. |
| Jinhua Yan | Shoe dataset, relational schema, recommendation and sizing services, explanation generation, and recommendation tests. |
| Ouyi Yang | Authentication and access control, fit-record/upload services, retailer API integration, and deployment setup. |

Each member will own implementation and verification for their area. Architecture decisions, code review, integration, documentation, and presentation preparation will be shared.

We will use GitHub issues, feature branches, and pull requests. Shared profile and shoe contracts will be agreed early because the wizard and recommendation engine depend on them. A small seeded vertical flow will allow parallel development without waiting for the full catalogue. Weekly integration checks will keep the application runnable.

API access and data availability will be tested early. Incomplete evidence may require a smaller catalogue. Price features will be deferred if they threaten integration. The final repository will include setup instructions, migrations, seed data, environment-variable guidance, `README.md`, `ai-session.md`, and the demo link.

## 4. Initial Team Reasoning and AI-Assisted Exploration

### 4.1 Initial Team Reasoning

The idea began with Jinhua's independent suggestion of a modern climbing shoe selection website inspired by [SizeSquirrel](https://sizesquirrel.com/). Her original message proposed sizing and model recommendations considering foot shape for beginner to advanced climbers, nearby shops, and price search similar to Google Shopping, with further features added later.

Two early directions were a personalized sizing/recommendation tool and a shopping assistant combining recommendations with retailer information. The original idea did not specify a technical stack, recommendation formula, or data model. It left unanswered how to represent fit differences, obtain reliable sizing evidence, and access retailer prices or availability.

This records the original individual input. A pre-AI team discussion has not been documented, and this section should be reviewed and supplemented with the team's actual reasoning before submission.

### 4.2 Exploration and Evaluation

AI-assisted exploration suggested making personalized fit matching central, using explainable rules, and treating live pricing as optional. These are proposed design choices in this draft, rather than completed team decisions.

One useful example concerns the suggested match percentages and precise size predictions. Such outputs would need calibration evidence to support an accuracy claim. This draft therefore uses compatibility rankings, explicit evidence gaps, and estimated size ranges. We plan to evaluate the rules through contrasting profiles and manually reviewed fit examples before presenting them as useful recommendations.

This draft was checked against the supplied handout for required technologies and two advanced features; simple uploads count as core functionality. Team discussion and prototypes will assess service and dataset feasibility. Representative AI interactions, team decisions, and verification evidence will be documented in `ai-session.md`.
