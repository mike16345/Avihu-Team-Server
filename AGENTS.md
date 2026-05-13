# AGENTS.md

## Purpose

This file is the source of truth for coding agents working in this repository.
It documents the current backend architecture, auth model, testing setup, data-access rules, deployment flow, and repo-specific safety constraints.

Treat this document as a guide to how the repo works today, not as a statement that every current pattern is ideal.
Where the repo shows inconsistencies or risks, they are called out explicitly under `Recommended Improvements`.

## Repository Overview

- Root contains one real application: `server/`.
- There is no frontend application in this repository today.
- Main stack:
  - Node.js
  - TypeScript (`server/tsconfig.json`)
  - AWS Lambda style handlers
  - MongoDB with Mongoose
  - Joi validation
  - Jest + `ts-jest`
  - `jsonwebtoken` for access JWTs
- Major directories in `server/`:
  - `src/functions/`: Lambda entrypoints and route maps
  - `src/controllers/`: request handlers / orchestration
  - `src/services/`: business logic and cache invalidation
  - `src/repositories/`: database access and trainer/global scoping
  - `src/models/`: Mongoose schemas and many Joi validation schemas
  - `src/middleware/`: request validation and pre-handler checks
  - `src/guards/`: auth and role/access checks
  - `src/utils/`: parsing, response helpers, auth context, cache, pagination, S3 helpers, etc.
  - `src/rag/`: separate RAG/chat subsystem
  - `tests/`: unit/integration-style tests and model/schema tests
  - `config/`: lambda deployment mapping
  - `docs/`: implementation notes

## Architecture

### Main Request Flow

Current repo evidence shows this request pipeline:

1. Lambda entrypoint in `server/src/functions/**/index.ts`
2. Route map lookup via `handleApiCall` in `server/src/functions/baseHandler.ts`
3. Optional bearer-token parsing into request-local auth context
4. DB connection via `server/src/db/connect.ts`
5. Route access enforcement via `enforceRequestUserAccess` in `server/src/guards/AdminAccessGuard.ts`
6. Route middleware execution
7. Optional validator execution
8. Controller method
9. Service method
10. Repository call
11. Mongoose model / MongoDB
12. JSON response shaping

### Layers and Responsibilities

#### 1. Route / Lambda Layer

- Files live in `server/src/functions/**/index.ts`.
- Each module defines an `ApiRouteHandlers` map keyed as `"${METHOD} ${PATH}"`.
- Example: `server/src/functions/users/index.ts`.
- Route objects should declare:
  - `handler`
  - `access`
  - optional `middlewares`
- New routes should always use explicit route objects.
- `server/src/utils/lambdaHelpers.ts` still supports legacy bare function handlers and defaults them to `public`, but that is marked as temporary behavior and should not be used for new work.

#### 2. Base Handler

- `server/src/functions/baseHandler.ts` is the central request orchestrator.
- It:
  - builds `routeKey`
  - extracts bearer auth context if an `Authorization` header exists, even for public routes
  - opens the DB connection
  - enforces route access on non-public routes
  - stores `event.authUser`
  - updates async auth context
  - runs middleware and validators before the controller
  - normalizes API headers
  - converts HTTP-like errors to JSON responses

Do not reimplement request orchestration in individual lambdas unless a handler is truly exceptional.

#### 3. Controllers

- Most controllers extend `BaseController` in `server/src/controllers/BaseController.ts`.
- Controllers should orchestrate request extraction, call services, and return responses.
- They should not contain heavy business logic or raw DB query logic unless the existing subsystem already does so and you are making a surgical change.
- Some controllers do use custom logic beyond generic CRUD. Examples:
  - `server/src/controllers/userController.ts`
  - `server/src/controllers/AgreementAdminController.ts`
  - `server/src/controllers/ragController.ts`

#### 4. Services

- Most services extend `BaseService` in `server/src/services/baseService.ts`.
- Services are the intended home for business logic, cross-repository coordination, and cache invalidation.
- `BaseService` wraps common CRUD and cache behavior.
- Services often compose other services. Example:
  - `server/src/services/userService.ts` creates a user, hashes an initial password, sends welcome email, and rolls back on failure.

#### 5. Repositories

- Most repositories extend `BaseRepository` in `server/src/repositories/BaseRepository.ts`.
- Repositories are the intended home for DB access and query scoping.
- `BaseRepository` handles:
  - trainer/global scope configuration
  - soft-delete filtering via `isDeleted`
  - scope injection on create/query/update
  - pagination helper queries
- Repository scope is declared in the constructor:
  - trainer-scoped: `super(Model, { type: "trainer", field: "trainerId" })`
  - global: `super(Model, { type: "global" })`

#### 6. Models and Interfaces

- TypeScript interfaces generally live in `server/src/interfaces/`.
- Mongoose schemas/models live in `server/src/models/`.
- Many model files also export Joi validation schemas. Example:
  - `server/src/models/userModel.ts`
  - `server/src/models/dietPlanModel.ts`

### Supporting Abstractions

- Auth context:
  - `server/src/utils/authContext.ts`
  - uses `AsyncLocalStorage`
  - repositories rely on this for trainer scoping
- Response helpers:
  - `server/src/utils/utils.ts`
  - `createServerResponse`, `createResponse`, `createResponseWithData`
- Pagination:
  - `server/src/utils/pagination.ts`
  - query parsing in `extractPaginationParamsFromEvent`
- Middleware runner:
  - `server/src/utils/lambdaHelpers.ts`
- Shared cache:
  - `server/src/utils/cache.ts`

### Special Subsystems

- `server/src/rag/` is its own subsystem for chat/RAG behavior.
- RAG routes still go through the same lambda/controller flow, but use separate repositories, models, config, and OpenAI/Pinecone integrations.
- Example entrypoint: `server/src/functions/rag/index.ts`

### Where New Features Should Go

For ordinary API features:

1. Add/update interface in `src/interfaces/` if needed.
2. Add/update Mongoose model and Joi schema in `src/models/`.
3. Add/update repository methods in `src/repositories/`.
4. Add business logic in `src/services/`.
5. Add/update controller methods in `src/controllers/`.
6. Wire routes in `src/functions/**/index.ts`.
7. Add middleware validation in `src/middleware/` when appropriate.
8. Add tests in `tests/`.

Business logic should usually live in services.
It should not be spread across lambda entrypoints, random utility files, or controllers unless a nearby subsystem already follows that pattern and your task must stay surgical.

## Auth and Access Control

### Current Auth Model

Auth is implemented with:

- access JWTs in `server/src/services/JwtAuthService.ts`
- opaque refresh tokens backed by DB sessions in the same service
- route access enforcement in `server/src/guards/AdminAccessGuard.ts`
- request-local auth context in `server/src/utils/authContext.ts`

### Access JWT Rules

- Access tokens are signed and verified with `jsonwebtoken`.
- Algorithm is `HS256`.
- Secret source: `process.env.JWT_ACCESS_SECRET`.
- Secret must exist and be at least 32 characters.
- TTL source: `process.env.JWT_ACCESS_EXPIRES_IN`, default `15m`.
- Bare numeric strings like `900` are treated as seconds.
- Access token verification rejects:
  - malformed tokens
  - wrong secret / bad signature
  - expired tokens
  - tokens missing `sessionId`
  - tokens missing all identity fields (`sub`, `userId`, `_id`)
  - tokens with `type` present and not equal to `"access"`

### Refresh Token Rules

- Refresh tokens are not JWTs.
- They are generated as opaque random tokens from `crypto.randomBytes(48).toString("hex")`.
- Only SHA-256 hashes are stored.
- Refresh session data is stored in `Session` documents with `type: "auth_refresh"`.
- Refresh token validation/rotation/revocation lives in `JwtAuthService`.

Do not replace refresh tokens with JWTs unless explicitly asked.

### Header Rules

- Protected requests must send:
  - `Authorization: Bearer <accessToken>`
- Header matching is case-insensitive.
- `extractBearerToken` in `server/src/utils/utils.ts` rejects:
  - missing header
  - malformed header
  - non-Bearer schemes
- Tests confirm auth is header-only:
  - `server/tests/auth-header-transport.test.ts`

Do not trust access tokens from query params or request bodies.

### Route Access Rules

Route access is declared in route maps with `access` from `RouteAccess`:

- `public`
- `authenticated`
- `subtrainer`
- `trainer`
- `admin`

Current role hierarchy in `AdminAccessGuard`:

- `public`: no auth required
- `authenticated`: any logged-in user
- `subtrainer`: `subTrainer`, `trainer`, `admin`
- `trainer`: `trainer`, `admin`
- `admin`: `admin` only

Underlying user roles come from `IUser["role"]` and currently include:

- `admin`
- `user`
- `trainer`
- `subTrainer`

Protected routes are enforced by `handleApiCall` before middleware and validators.
Tests confirm this ordering in `server/tests/base-handler-auth.test.ts`.

### `event.authUser` and Async Auth Context

On protected routes:

- `enforceRequestUserAccess` loads the user and stores it on `event.authUser`.
- `handleApiCall` then updates the async auth context.

Downstream code can access request-local identity via:

- `getAuthContext()`
- `requireAuthContext()`
- `requireTrainerAuthContext()`

This auth context is important because trainer-scoped repositories depend on it.

### Trainer / Tenant Scoping

Trainer scoping is enforced mainly in `BaseRepository` via async auth context:

- trainer-scoped repositories inject `trainerId` into queries and creates
- client-supplied `trainerId` is overwritten on create/update in scoped paths
- soft-delete filtering is automatically added for models with `isDeleted`

Tests for this behavior:

- `server/tests/base-repository-scope.test.ts`

Examples of trainer-scoped repositories:

- `server/src/repositories/User/UserRepository.ts`
- `server/src/repositories/Blogs/BlogRepository.ts`
- `server/src/repositories/Presets/*`
- `server/src/repositories/Agreements/AgreementTemplateRepository.ts`

Examples of global repositories:

- `server/src/repositories/Sessions/SessionRepository.ts`
- `server/src/repositories/Trainer/TrainerRepository.ts`
- `server/src/repositories/Rag/*`

### Non-Negotiable Auth Safety Rules

- Do not bypass `access` declarations in route maps.
- Do not hardcode `userId`, `trainerId`, `adminId`, or role values.
- Do not trust client-provided `trainerId` or `userId` as authorization proof.
- Do not duplicate authorization logic in random controllers or services.
- Do not log raw JWTs, refresh tokens, passwords, cookies, or secrets.
- Do not create unscoped repository/model queries for trainer-owned data.
- Prefer `event.authUser` and auth context over request-body identity fields.

### Important Current Risks

Current repo evidence suggests there are auth/scoping sharp edges:

- `BaseRepository.findById`, `updateById`, `deleteById`, and `hardDeleteById` do not apply trainer scope.
- Some custom repositories override base methods and bypass scope/soft-delete patterns. Example: `server/src/repositories/LeadsRepository.ts`.
- Some admin-only controllers still perform extra client-supplied `adminId` checks. Examples:
  - `server/src/controllers/AgreementAdminController.ts`
  - `server/src/controllers/ragController.ts`

Do not extend these patterns casually.
If you touch auth-sensitive behavior, keep changes small and document the security implications.

## Code Style and Conventions

### TypeScript and Module Style

- Compiler config is in `server/tsconfig.json`.
- `strict` is enabled.
- `module` is `commonjs`.
- `esModuleInterop` is enabled.

Import/export style is mixed:

- some classes use default exports
- others use named exports

Follow the local style of the file/module you are editing instead of performing broad export refactors.

### Formatting

Prettier config exists at both repo root and `server/.prettierrc`:

- double quotes
- semicolons
- width 100
- tab width 2
- trailing commas `es5`
- LF line endings

There is no local `prettier` npm script.
CI has a workflow that auto-formats changed files on PRs.

### Naming Conventions

Current naming is not fully consistent.
Follow nearby patterns rather than renaming unrelated files.

Observed conventions:

- Lambda route folders:
  - mostly plural nouns or domain names under `src/functions/`
  - examples: `users`, `workoutPlans`, `agreements`, `rag`
- Controllers:
  - usually `SomethingController.ts`
- Services:
  - usually `somethingService.ts` or `SomethingService.ts`
- Repositories:
  - folder-per-domain under `src/repositories/`
- Interfaces:
  - usually `IThing.ts`
- Validation:
  - often exported as `ThingSchemaValidation` from model files
  - middleware names often `validateThing`

Known inconsistencies you should preserve unless explicitly asked to normalize:

- `server/src/services/baseService.ts` is lowercase while many imports use `BaseService`
- `server/src/repositories/MuscleMeasurments/` is misspelled
- route/module casing is mixed (`OneTimePassword`, `MuscleMeasurements`, `users`)

### Validation Conventions

- Joi is the main validation library.
- Many model files export both Mongoose schema and Joi schema.
- Middleware functions usually return:
  - `{ isValid: true, message?: string }`
  - `{ isValid: false, message: string }`
- Common helper:
  - `validateBody(event, schema)` in `server/src/utils/utils.ts`

Some validation middleware also does async repository checks, for example `server/src/middleware/usersMiddleware.ts`.
Prefer keeping request validation in middleware, but put business rules in services.

### Error Handling

Patterns in the repo:

- repositories throw objects like `{ status, message }`
- auth helpers throw `{ statusCode, message }`
- controllers usually `catch` and return `errorResponse(...)`
- `handleApiCall` converts HTTP-like thrown objects to JSON responses

Preserve existing status-code behavior when editing nearby code.
Do not leak low-level library errors to API callers if the surrounding code already normalizes them.

### Response Formatting

Primary helpers live in `server/src/utils/utils.ts`:

- `createServerResponse(status, message, data)`
- `createResponse(status, message)`
- `createResponseWithData(status, data, message)`

Typical success shape:

```json
{
  "message": "...",
  "data": ...
}
```

Current repo evidence suggests error response shape is not perfectly uniform:

- many controller errors still return `{ message, data: undefined }`
- `handleApiCall` HTTP-like errors return `{ message }`

Do not normalize this globally unless explicitly asked.

### Constants and Shared Config

- shared constants live in `server/src/constants/`
- status codes live in `server/src/enums/StatusCode.ts`
- Lambda deployment mapping lives in `server/config/lambdas.json`

Add new shared constants to the closest existing constants/config file.
Avoid sprinkling repeated literals through controllers and services.

### Environment Variables

Runtime env access is scattered and mostly direct via `process.env`.
There is no single centralized runtime env validation layer today.

Important envs used in current codebase include:

- `MONGO_URI`
- `DB_NAME_DEV`
- `DB_NAME_PROD`
- `JWT_ACCESS_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN_MS`
- `EMAIL`
- `APP_PASSWORD`
- `AWS_BUCKET`
- `AMAZON_REGION`
- `ACCESS_KEY`
- `SECRET_KEY`
- `OPENAI_API_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX`
- several `RAG_*` variables in `server/src/rag/config.ts`

Deployment scripts load `.env.local` with `dotenv`.
Application runtime itself relies on the environment already being present.

Do not hardcode env-specific values in source files.

## Feature Development Guide

When adding or changing a feature, prefer this sequence:

1. Find the owning lambda module under `server/src/functions/`.
2. Read its route map and existing controller/service/repository stack.
3. Add/update the TypeScript interface in `server/src/interfaces/` if the data shape changes.
4. Add/update the Mongoose schema in `server/src/models/`.
5. Add/update Joi validation in the model file or matching middleware.
6. Add repository methods only for DB access.
7. Add service methods for business rules, orchestration, and cache invalidation.
8. Add/update controller methods for request parsing and response shaping.
9. Wire the route in the lambda `index.ts` file with explicit `access`.
10. Add middleware validation where needed.
11. Add tests in `server/tests/`.
12. Run the relevant test commands.

### What Belongs Where

- Route declaration:
  - lambda `index.ts`
- Request parsing / HTTP response:
  - controller
- Business rules:
  - service
- DB queries and query scoping:
  - repository
- Schema definitions:
  - model file
- Request validation:
  - middleware / Joi schema

### Preferred Change Style

- Make small, surgical edits.
- Reuse base classes and helpers instead of building parallel abstractions.
- Preserve public API behavior unless the task explicitly changes behavior.
- Avoid broad renames, file moves, or style-only refactors during feature work.

## Testing Guide

### Tooling

- Jest
- `ts-jest`
- Node test environment
- `mongodb-memory-server` for many model-level tests

Config files:

- `server/jest.config.js`
- `server/jest.setup.js`

### Test Locations and Naming

- Tests live under `server/tests/`
- Naming convention: `*.test.ts`
- Current test categories include:
  - auth tests
  - base handler/auth flow tests
  - base repository scoping tests
  - deploy/config tests
  - schema/model tests under `server/tests/models/`

### How Tests Run

- `jest.setup.js` starts an in-memory MongoDB unless `SKIP_MONGO_MEMORY_SERVER=true`.
- Some tests use explicit mocks/spies instead of DB access.

### What New Features Should Test

Write tests in the same change unless explicitly told otherwise.

Preferred coverage:

- Unit tests for:
  - service business logic
  - auth/permission logic
  - validator behavior
  - utility helpers
  - repository scoping helpers
- Integration-style tests for:
  - route access
  - auth behavior
  - middleware ordering
  - request parsing / response shape
- Model/schema tests for:
  - Mongoose validation
  - Joi validation

### Existing Mocking Patterns

- `jest.mock(...)` for DB connect and guards
- `jest.spyOn(...)` for methods like `JwtAuthService.verifyAccessToken`
- service/controller property replacement using `as any` in tests when necessary
- in-memory Mongo for schema tests

Follow the nearby testing style of the area you are changing.

### Test Quality Rules

- Do not delete tests just to make CI pass.
- Do not weaken assertions just to avoid failures.
- Do not update behavior-sensitive tests blindly.
- Do not skip auth/scoping tests when changing protected flows.
- If a test is failing due to an unrelated baseline issue, say so explicitly.

## Database and Repository Rules

### Database Stack

- MongoDB
- Mongoose ODM

Connection setup:

- `server/src/db/connect.ts`

### Model Structure

Common pattern:

- interface in `src/interfaces/`
- Mongoose schema/model in `src/models/`
- Joi validation schema often in the same model file

### Soft Delete

- `BaseRepository` automatically filters `isDeleted: false` when the schema has an `isDeleted` field.
- Deletion methods use soft delete where supported.

Do not bypass this by switching to raw `findByIdAndDelete` / `findOneAndDelete` unless the entity is intentionally hard-deleted.

### Scoping Rules

Trainer-scoped repositories rely on auth context.
That means:

- the request must have a valid auth context before trainer-scoped queries run
- repository methods should preserve scope injection
- direct model calls can bypass scope and must be treated as sensitive

### Query Safety Rules

- Prefer repository methods that already apply scope and soft-delete rules.
- Be especially careful with `findById`, `updateById`, and delete-by-id flows on trainer-owned entities.
- If you must write direct model queries in a service or controller, manually apply trainer scoping and soft-delete safety.
- Never add unscoped cross-tenant queries for trainer-owned data.

### Adding New Models

When introducing a new model:

1. Create interface in `src/interfaces/`
2. Create Mongoose schema/model in `src/models/`
3. Add Joi validation if the entity is API-facing
4. Create repository and decide `trainer` vs `global` scope
5. Create service extending `BaseService` if appropriate
6. Add controller and route wiring
7. Add tests

### Current Data-Access Risks

Current repo evidence suggests:

- some custom repositories bypass base scoping behavior
- some global-vs-trainer choices should be reviewed carefully per entity
- trainer scoping is strongest on query/filter-based methods, weaker on ID-based methods

Future agents should avoid making this worse.

## API Rules

### Route Declaration Pattern

Routes are declared in module-local maps such as:

- `server/src/functions/users/index.ts`
- `server/src/functions/analytics/index.ts`
- `server/src/functions/presets/index.ts`

Use explicit route keys:

- `GET /users`
- `POST /users/auth/login`

### Validation and Parsing

- Query params:
  - `extractQueryFromEvent`
- JSON body:
  - `extractBodyFromEvent`
- Pagination:
  - `extractPaginationParamsFromEvent`
  - supports `page` / `_page`, `limit` / `_limit`
  - supports JSON-encoded `query` and `sort` query params

### Status Code Conventions

- Uses `StatusCode` enum from `server/src/enums/StatusCode.ts`
- Typical patterns:
  - `200 OK` for reads/updates
  - `201 CREATED` for creates
  - `400 BAD_REQUEST` for validation/required-param issues
  - `401 UNAUTHORIZED` for auth failure
  - `403 FORBIDDEN` for role/access failure or inactive access
  - `404 NOT_FOUND` for missing records
  - `500` for unhandled server errors

### Headers / CORS

Shared headers are in `server/src/constants/Constants.ts`:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: *`
- `Access-Control-Allow-Headers: Content-Type,Authorization`

There is no cookie-based auth flow in the current repo.
Do not introduce cookies casually; current auth expects bearer headers.

### API Error Rules

- Use the existing helpers and `BaseController.errorResponse`.
- Prefer returning safe, normalized messages.
- Do not leak raw library errors or secrets.
- Keep auth failures mapped to `Unauthorized` / `Forbidden` behavior already used nearby.

## Commands

There is no root `package.json`.
Run app commands from `server/`.

### Install

```bash
cd server
npm ci
```

### Tests

All tests:

```bash
cd server
npm test
```

CI-style all tests:

```bash
cd server
npm test -- --runInBand
```

Targeted test file:

```bash
cd server
npx jest tests/auth-jwt-foundation.test.ts --runInBand
```

Deploy-config coverage test:

```bash
cd server
SKIP_MONGO_MEMORY_SERVER=true npx jest tests/deployAllLambdas.test.ts --runInBand
```

### Deployment / Packaging

Single lambda deploy via package script:

```bash
cd server
npm run deploy -- env=api
```

Other supported env keys from `server/deploy.js`:

- `api`
- `otp`
- `signedUrl`
- `rag`

Deploy all lambdas:

```bash
cd server
npm run deploy-all-lambdas
```

Create lambda:

```bash
cd server
npm run create-lambda -- FUNCTION_NAME
```

Configure API Gateway resource:

```bash
cd server
npm run configure-api-gateway -- path=resourcePath function=LambdaName proxy=true
```

### Commands Not Currently Defined

These expected commands are not currently defined as npm scripts:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm start`

`server/nodemon.json` and `server/Dockerfile` reference missing start/dev scripts, so do not assume a working local dev server command exists.

## Agent Safety Rules

- Do not bypass auth or route access declarations.
- Do not trust client-provided `trainerId`, `userId`, `adminId`, or role fields for authorization.
- Do not introduce unscoped database queries for trainer-owned data.
- Do not remove tests to make CI pass.
- Do not weaken assertions or skip auth/scoping tests casually.
- Do not log secrets, JWTs, refresh tokens, cookies, password hashes, or sensitive user data.
- Do not hardcode environment-specific values.
- Do not change public API behavior without explicit instruction.
- Do not rewrite large unrelated areas while implementing a focused change.
- Prefer small, reviewable patches that follow the existing module structure.

## Recommended Improvements

These are not the current baseline; they are follow-up work future agents should consider only when explicitly in scope.

### 1. Close Trainer-Scoping Gaps

- Review `BaseRepository` ID-based methods so trainer scope applies consistently.
- Audit custom repositories such as `server/src/repositories/LeadsRepository.ts` that bypass base behavior.

### 2. Establish a Green Typecheck Baseline

- Add a real typecheck script.
- Fix the existing TypeScript errors across repositories/services.
- Resolve casing inconsistencies like `baseService.ts` vs `BaseService` imports.

### 3. Centralize Runtime Env Validation

- Create a shared runtime config/env loader instead of scattered `process.env` usage.

### 4. Clean Up Stale Dev Tooling

- Either add working `dev` / `start` scripts or update/remove:
  - `server/Dockerfile`
  - `server/nodemon.json`

### 5. Reduce Client-Supplied Admin Checks

- Prefer server-derived authenticated identity over `adminId` from query/body in admin-only flows.
