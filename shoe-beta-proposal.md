# Project Proposal: Shoe Beta

**Course:** ECE1724: Advanced Web Development, Fall 2026  
**Repository:** [github.com/jinhuayan/shoe-beta](https://github.com/jinhuayan/shoe-beta)

| Team member | Student number | Email |
| --- | --- | --- |
| Jenny Qin | 1006960068 | yide.qin@mail.utoronto.ca |
| Jinhua Yan | 1012858686 | sudojinhua.yan@mail.utoronto.ca |
| Ouyi Yang | 1012421407 | ouyi.yang@mail.utoronto.ca |

## 1. Motivation

Climbing shoes are difficult to choose online. Street shoe size alone does not capture foot width, toe shape, heel volume, or differences between shoe models. Even within one brand, the same labelled size can feel different. Beginners often prioritize comfort, whereas experienced climbers may want greater precision for bouldering or technical routes. Product charts and scattered reviews rarely explain how these tradeoffs apply to a particular climber.

**Shoe Beta** will help climbers narrow down both a suitable model and an **approximate size or size range**. Users provide foot measurements and climbing preferences, then receive explainable, rule-based recommendations. They can browse shoe details and find nearby outdoor or climbing stores to try shoes on. Size estimates are guidance, not guarantees; store results will not imply stock availability.

Visitors can explore recommendations without signing in. Registration and login enable persistent profiles, fitting records, and photos. This keeps the first-use experience simple while supporting secure personal data.

## 2. Objectives, Architecture, and Key Features

### 2.1 Scope and features

**Core:**

- **Authentication:** Register, log in, log out, and manage sessions; enforce access controls on private records.
- **Foot/climbing questionnaire:** Foot length, street size, width, toe shape, heel volume, experience, discipline, and comfort preference. Users may select “unsure”; signed-in users can save profiles.
- **Catalogue:** Browse/filter approximately **20–30 manually curated shoe models or variants** with documented characteristics and sizing notes.
- **Recommendations:** Rank shoes using transparent rules; show reasons and possible fit mismatches.
- **Size estimation:** Suggest a model-specific **reference EU size or range** based on measurements, street size, fitting preference, and available notes. Explicitly report insufficient information.
- **Nearby shops:** Query an external Places API using a user-entered location; list relevant stores, addresses, and map links.
- **Fit records and cloud photos:** Signed-in users can create, update, and delete records of shoes tried and attach at most one photo per record, with upload, view/download, and deletion.

**Optional after core completion:** Saved favourites, comparison of up to three shoes, and inventory/price lookup if dependable APIs are available. Live inventory is **not** part of nearby-shop search. No machine-learning training, automatic foot measurement from photos, or guaranteed fit prediction is planned.

### 2.2 Architecture and integration

We choose **Next.js full-stack (App Router)** rather than separate React and Express applications to reduce cross-service integration work for three developers.

| Layer | Technology and responsibility |
| --- | --- |
| UI | React/Next.js with TypeScript, Tailwind CSS, shadcn/ui, responsive layouts |
| Server | TypeScript; Server Components for initial data, Client Components for interactive forms; Server Actions for mutations and Route Handlers/API routes for recommendation and shop requests |
| Database | PostgreSQL with Prisma ORM for relational data |
| Identity | Better Auth for accounts and sessions |
| Files | DigitalOcean Spaces for uploaded photos |
| External service | Places API selected after checking relevance, quotas, and cost |

The questionnaire sends validated inputs to server-side recommendation modules, which read catalogue data through Prisma and return ranked models, size estimates, and explanations. Authenticated mutations save profiles and fitting records. API keys, storage credentials, and session secrets stay on the server. Using one Next.js project simplifies sharing types and coordinating UI and database changes, although integration testing remains necessary.

### 2.3 Data design and storage

| Entity | Main purpose |
| --- | --- |
| `User` plus auth tables | Account identity, sessions, and ownership |
| `FootProfile`, `ClimbingProfile` | One set of measurements and preferences per user |
| `Shoe`, `ShoeFitProfile` | Shoe catalogue, model fit attributes, sizing notes, sources, confidence |
| `FitRecord` | User, shoe, worn size, rating, tight/loose areas, notes |
| `Upload` | Fit-record owner, storage key, content type, file size |
| `Favourite` (optional) | Saved user–shoe relationship |

A user can have multiple fit records; a shoe can appear in records from many users. Each fit record permits at most one photo initially. PostgreSQL stores relationships and file metadata; Spaces stores the actual file. Before upload/download/delete, the server validates the authenticated user's ownership and file constraints. Public catalogue/recommendation requests do not require an account; saving private data does.

### 2.4 Recommendation and sizing rules

We will keep **model suitability** and **size estimation** separate. Suitability rules compare foot shape and climbing preferences with shoe width, heel volume, stiffness, downturn, and intended use. For example, a narrow-forefoot model will rank lower for a wide-footed user, with a corresponding explanation. Scores indicate relative ranking, **not fit probabilities**.

Sizing starts from foot length and street size, then applies **model-specific notes** and the user's comfort/performance preference. We will avoid a universal downsizing formula. Where supported, results show an approximate labelled EU size or range; otherwise they show “estimate unavailable.” We will document data sources and mark uncertain attributes rather than inventing precision.

The initial catalogue will be small enough to check manually. Tests will compare contrasting sample profiles, incomplete fields, boundary values, and contradictory sizing notes. These tests demonstrate consistency, not universal real-world fit accuracy.

### 2.5 Mandatory file handling and advanced features

**Cloud storage (core requirement):** Upload, retrieve/download, and delete a photo linked to a fit record through DigitalOcean Spaces, with size/type validation and database metadata. Basic upload/download is **not** counted as an advanced feature.

**Advanced feature 1 — Authentication and authorization:** Better Auth registration/login/logout, session management, protected server operations, and ownership checks for profiles, fit records, and files. Tests will reject unauthenticated and cross-account access.

**Advanced feature 2 — External API integration:** A server-side Places API request returning nearby shops and map links. We will test empty responses, API failure, and usage limits; failures will not block recommendations. Real-time inventory or price search is optional.

The UI will explain foot-shape terms and offer accessible form labels, responsive pages, and loading/error/empty states. End-to-end tests will cover visitor recommendations, authenticated saving, photos, and shop search.

## 3. Project Plan and Team Responsibilities

### 3.1 Milestones and dependencies

The schedule prioritizes one **working vertical slice** before adding supporting features. Dates below are targets, not claims that work has already been completed.

| Period | Deliverable / checkpoint |
| --- | --- |
| **By Nov 8** | Finalize proposal, schema and API contracts; scaffold Next.js; seed 8–10 shoes; demonstrate a basic questionnaire → recommendation → approximate-size path locally. Validate Better Auth and the Places provider in small prototypes. **Proposal due Nov 8.** |
| **Nov 9–15** | Complete catalogue and main responsive results UI; expand vetted shoe data toward 20–30 models. Implement registration/login and profile persistence; test recommendation rules and missing-data behavior. |
| **Nov 16–20** | Integrate fit-record CRUD and one-photo Spaces upload/download/delete. Add Places-based shop listings; test ownership, error responses, and full user journeys. **Individual health check due Nov 18.** |
| **Nov 21–26** | Freeze optional features; fix integration issues and complete all **mandatory core technologies**. Prepare a reliable local live demo and explain both advanced features (implemented or with concrete completion evidence/plan). **Introduction due Nov 25; slides due Nov 26. Only work completed by Nov 26 may be presented**, even on Dec 4. |
| **Nov 27–Dec 6** | Finish remaining advanced-feature work and regression/security checks; finalize README, setup instructions, `ai-session.md`, and 2–5-minute video. Deploy if feasible (deployment is optional). **Final GitHub repository due Dec 6.** |

If shoe data collection, authentication, or an external service stalls, we will reduce catalogue breadth and omit optional comparison/inventory rather than sacrifice the core flow. We will integrate weekly through small pull requests and test deployment-independent local operation before presentation.

### 3.2 Ownership and coordination

| Member | Initial responsibilities |
| --- | --- |
| **Jenny Qin** | Questionnaire, catalogue/results UI, login screens, responsive styling, frontend integration and tests |
| **Jinhua Yan** | Shoe dataset and source tracking, Prisma schema, recommendation/size rules, explanations, FitRecord data model, algorithm tests |
| **Ouyi Yang** | Better Auth server integration and ownership checks, FitRecord API with Jinhua, Spaces storage, Places API, deployment configuration |

Jinhua and Ouyi will agree early on user–fit-record–upload relationships and typed interfaces; Jenny will connect those interfaces to forms and authenticated views. All members share code review, integration tests, documentation, presentation, and demo checks. GitHub issues, branches, pull requests, and meaningful commits will track ownership and progress. Major risks are unreliable sizing notes, authentication integration, file access control, and Places API limitations; each has an early prototype or test checkpoint.

## 4. Initial Team Reasoning and AI-Assisted Exploration

### 4.1 Initial Team Reasoning

**Jinhua:** The original idea was a climbing shoe sizing and recommendation site because foot shape makes street size insufficient. Initial possibilities included matching shoe models, comparing sizes, and finding nearby stores or prices. Open questions concerned the shoe data, shape descriptions, and technical architecture.

**Jenny:** Initially suggested one fixed size adjustment for each model (for example, half a size smaller than street size) and matching feet and shoes labelled narrow, medium, or wide. She questioned whether one adjustment could account for foot shape and preferred tightness, and how users could easily describe their feet.

**Ouyi:** During subsequent scope discussions, emphasized approximate size recommendations and basic nearby-shop listings instead of inventory search. Ouyi raised concern about the time required for authentication. These were **later scope considerations**, not claims about the team's pre-AI initial discussion; their resolution is described below.

### 4.2 Exploration and Evaluation

AI-assisted exploration suggested user profiles, a curated catalogue, rule-based rankings, size estimates, fit records, photos, and optional commercial features. We narrowed the proposal after considering three-person capacity and the course requirements. Instead of adopting a universal shoe-size adjustment or claiming match probabilities, we chose model-specific sizing notes, visible uncertainty, and test profiles. We will check actual shoe information before accepting generated recommendations.

An intermediate draft made login optional to reduce workload. After reviewing the requirement for **at least two advanced features**, we restored authentication/authorization alongside the Places API integration. We also separated mandatory cloud upload/download from advanced features and excluded live inventory from core scope. These decisions reflect deliberate evaluation of feasibility rather than accepting every AI-suggested feature. Representative AI interactions and verification will be recorded in `ai-session.md`.
