# Project Proposal: Shoe Beta

**Course:** ECE1724: Advanced Web Development, Fall 2026  
**Repository:** [github.com/jinhuayan/shoe-beta](https://github.com/jinhuayan/shoe-beta)  
**Status:** Working draft

| Team member | Student number | Email |
| --- | --- | --- |
| Jenny Qin | 1006960068 | yide.qin@mail.utoronto.ca |
| Jinhua Yan | 1012858686 | sudojinhua.yan@mail.utoronto.ca |
| Ouyi Yang | 1012421407 | ouyi.yang@mail.utoronto.ca |

## 1. Motivation

Climbing shoes can be hard to choose, especially when buying online. Two people may wear the same street shoe size but have different foot widths, toe shapes, and heels. Even within one brand, different models may fit differently. Choosing a smaller size does not necessarily fix a shoe that has the wrong shape.

The choice also depends on what the climber wants to do. A beginner looking for a comfortable indoor shoe may have different needs from someone looking for a shoe for harder bouldering. Size charts and reviews help, but it takes time to compare them and work out which advice applies to your own feet.

Shoe Beta will help beginner to advanced climbers choose models and estimated sizes based on their feet, climbing preferences, and shoes they have worn before. Users will see why a shoe is suggested and find nearby shops where they could try it. The aim is to narrow down choices before buying, while making clear that an estimate cannot replace trying shoes on.

## 2. Objectives, Architecture, and Key Features

### 2.1 Main features

Users will be able to:

- Create an account and save their foot and climbing profiles.
- Enter foot length, street size, width, toe shape, heel volume, experience, and comfort preference.
- Add shoes they have worn and describe the fit, including tight areas or empty space.
- Browse and filter a shoe catalogue.
- Get recommendations with estimated size ranges and reasons.
- Save favourites and compare up to three models.
- Upload, view, and download optional photos attached to fit records.
- Search for nearby climbing or outdoor shops.

Price comparison is an extra feature we may add if a suitable data source is available.

### 2.2 Architecture and tools

We plan to use the **Next.js full-stack approach**.

| Part | Planned tools |
| --- | --- |
| Frontend and server code | TypeScript and Next.js with the App Router |
| UI | React, Tailwind CSS, and shadcn/ui |
| Database | PostgreSQL with Prisma ORM |
| File storage | DigitalOcean Spaces |
| Accounts and sessions | Better Auth |

Server Components will load shoe and account data. Client Components will handle the profile form, filters, and comparison selection. Server Actions will save profiles, fit records, and favourites. API Routes will handle recommendations and nearby-shop requests.

Database queries and recommendation rules will stay in separate server modules. Keeping everything in one Next.js project should make integration easier for three people than maintaining separate applications. PostgreSQL will store the related user, shoe, and fit data, with Prisma used for the schema and queries. The server will validate form input before saving it.

### 2.3 Database and application flow

| Entity | Information stored |
| --- | --- |
| User | Account information and links to the user's records. |
| FootProfile | Measurements, street size, width, toe shape, and heel volume. |
| ClimbingProfile | Experience, climbing styles, and comfort preference. |
| Shoe | Brand, model, variant, sizes, stiffness, downturn, and intended uses. |
| ShoeFitProfile | Width, heel and overall volume, sizing notes, and uncertain attributes. |
| FitRecord | User, shoe, worn size, fit rating, tight or loose areas, and comments. |
| Favourite | A user's saved shoe. |
| Upload | Owner, fit record, storage key, file type, and size. |

Each user will have one foot profile and one climbing profile, and can have many fit records and favourites. A shoe can have records from different users. Variants with different fit characteristics will have separate entries. Images will belong to a user and a fit record. Foreign keys will maintain these relationships.

After the user saves a profile, the recommendation route will read their profile, shoe history, and shoe data. It will calculate the results and return models, size estimates, and reasons to the UI. Updating a profile and requesting recommendations again will use the new information.

### 2.4 Recommendation approach

We plan to start with a rule-based system. It will compare foot characteristics and climbing preferences with the shoe data. For example, a narrow shoe would receive a lower score for a wide forefoot. Heel volume, toe shape, stiffness, climbing style, and comfort preference will also affect ranking.

The app will explain each result, including possible fit concerns. We will define the rules and their relative importance, then check them using different sample profiles. Unknown attributes will be labelled rather than treated as confirmed matches. Scores will rank shoes, rather than represent a percentage chance of correct fit.

Size estimation will be separate. It will consider foot length, street size, model-specific sizing notes, preferred fit, and previous shoes where useful comparisons are available. We will not apply one downsizing rule to every model. Results may give a range, such as EU 35.5 to 36, and explain the intended fit. If information is insufficient, an estimate will be unavailable.

We will prepare a small dataset and record the basis for its fit and sizing notes. Rules are practical for our timeline because we can inspect and test the calculations without a large training dataset. Collecting reliable shoe information will be an early task.

### 2.5 Cloud storage and advanced features

**Cloud file storage:** Users can attach photos to fit records. DigitalOcean Spaces will store the files; PostgreSQL will store their keys and record links. The server will check ownership, file type, and size. Users can retrieve and download their images, and attachment deletion will remove the stored file. This is a core requirement, not one of our advanced features.

Our two planned advanced features are:

**Authentication and authorization:** Better Auth will support registration, login, and sessions. Users can only change their own profiles, fit records, favourites, and uploads. The server will check sessions and record ownership for protected operations.

**External API integration:** The server will call a places service to search near a user-selected location. Results will show store names, addresses, distance estimates, and map links. We will choose the provider after a small prototype checks relevance and cost. The course allows external API integration without requiring a particular provider. Empty results and service errors will not block recommendations. A nearby-shop result will not confirm that a shoe or size is in stock.

### 2.6 UI, scope, and verification

The form will use short steps and explain terms such as heel volume. Users can select "unsure" and change earlier answers. Results will show models, size estimates, reasons, and concerns. Comparisons will use consistent attributes. Pages will work on desktop and mobile, with clear loading and error messages.

We will aim for about 30 shoe variants. Exact inventory, price alerts, automatic learning, and measuring feet from photos are outside the core scope. This leaves time to complete the full user flow.

We will test rules with profiles that differ in width, heel volume, and comfort preference, including missing information. We will check valid size ranges and whether explanations agree with calculations. API tests will cover profile saving, ownership, and file retrieval. We will also test the full login-to-recommendation flow and shop-service failures. Known fit examples will help review usefulness, although they will not prove sizing accuracy for everyone.

## 3. Project Plan and Team Responsibilities

### 3.1 Development plan

| Period | Main work |
| --- | --- |
| Oct 12 to 25 | Agree on scope, sketch the UI, define the schema, and collect initial shoe data. Start React components and database queries. Submit team formation by Oct 25. |
| Oct 26 to Nov 8 | Build the Next.js structure, accounts, profiles, and first recommendation flow. Test the shop API choice. Each member submits the same proposal by Nov 8. |
| Nov 9 to 18 | Add uploads, fit records, favourites, comparison, and shop search. Expand the dataset. Complete the individual health check by Nov 18. |
| Nov 19 to 26 | Test the integrated application and prepare the demo. Submit the introduction by Nov 25 and slides by Nov 26. |
| Nov 27 to Dec 6 | Fix issues and finish the README, AI record, and 2 to 5 minute video. Submit the final repository by Dec 6. |

The presentation will show work completed by November 26, whichever presentation date we are assigned.

### 3.2 Initial responsibilities

This is a proposed task split for the team to confirm.

| Member | Main responsibilities |
| --- | --- |
| Jenny Qin | Profile form, catalogue and results pages, comparison UI, responsive styling, and frontend checks. |
| Jinhua Yan | Shoe data, database schema, recommendation and sizing logic, explanations, and recommendation tests. |
| Ouyi Yang | Authentication, permissions, fit-record and upload handling, shop API integration, and deployment setup. |

We will share code reviews, integration testing, documentation, and presentation preparation. GitHub issues will track tasks, with changes made through feature branches and pull requests.

Profile and shoe fields need to be agreed early because the UI and recommendation logic depend on them. We will connect the main flow using a small dataset first, then add shoes and supporting features. Weekly integration checks will help us find problems before the final stage.

Incomplete shoe data and unreliable external results are the main risks. We will investigate them early, reduce the catalogue if needed, and leave price comparison until core features work. The README will include setup steps, environment variables, migrations, seed data, and the demo link.

## 4. Initial Team Reasoning and AI-Assisted Exploration

### 4.1 Initial Team Reasoning

Jinhua's starting idea was a modern climbing shoe sizing and recommendation website. The main observation was that everyone has a different foot shape, so street size alone may not be enough. The original idea included beginner to advanced recommendations, nearby shops, and price comparison, with more features added later.

The first possible directions were comparing sizes between shoes and helping users choose both a model and a size. The stack, data model, and rules had not been selected. Unanswered questions included how to describe foot and shoe shapes, obtain reliable sizing information, and access prices or shop availability.

Jenny’s first idea focused on how sizing would work. She thought each shoe could have one fixed rule, like “go half a size down from your street size,” and the site would apply it to the user’s street size. For choosing models, she suggested labelling both feet and shoes as narrow, medium, or wide and matching them. She was not sure if one rule per shoe would be enough, since the right size can also depend on foot shape and how tight the climber wants the shoe. She also did not know how to describe foot and shoe shapes in a way that users could fill in easily.

### 4.2 Exploration and Evaluation

AI helped expand the idea into profiles, shoe history, recommendations, and a development plan. It suggested rules instead of machine learning and making live prices optional. These remain proposed choices for the team to review.

One change after reviewing the AI draft was to use the course website as the technical reference instead of outside websites. We checked the tools against the syllabus and project guidelines and added Prisma to the plan. This connects the design to what is taught or documented for the project.

We also kept size estimates and reasons instead of precise fit predictions. The earlier AI suggestion included match percentages, but we lack evidence to treat them as accurate probabilities. We plan to check the rules with sample profiles and known fit examples.

We will record representative AI interactions, what we changed or accepted, and how we verified results in `ai-session.md`.
