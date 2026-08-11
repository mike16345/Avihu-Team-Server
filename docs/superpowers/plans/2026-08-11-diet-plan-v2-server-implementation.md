# Diet Plan V2 Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add version-aware V1/V2 diet-plan and preset persistence, a parent-trainer-scoped V2 string catalog, and trainer diet-plan version selection without breaking V1 APIs.

**Architecture:** V1 and V2 use separate strict contracts and Mongoose models pointed at the existing physical collections. A version-aware service chooses validation and complete-document replacement, while a new trainer-scoped catalog service resolves literal item snapshots during V2 saves. Trainer creation persists `dietPlanVersion`; existing plans remain authoritative.

**Tech Stack:** Node.js, TypeScript, AWS Lambda route maps, Mongoose 8, Joi 17, Jest 29, ts-jest, mongodb-memory-server.

## Global Constraints

- Existing plan and preset documents without `version` are V1.
- One active diet-plan document exists per `userId`; version changes replace that document.
- V1 and V2 plans share the existing `dietPlans` collection and route family.
- V1 and V2 presets share the existing `dietPlanPresets` collection and route family.
- Legacy `menuItems` is untouched; V2 catalog strings use a new trainer-scoped collection.
- Client-supplied `trainerId` and `builtByTrainerId` are forbidden and replaced by auth context.
- Same-category normalized duplicate names are invalid; cross-category duplicates are allowed.
- Popularity is approximate and increments once per distinct submitted category/name per accepted save.
- Barcode products, Client logging, version history, conversion, rich text, and structured supplements are out of scope.
- Follow `AGENTS.md`: route -> controller -> service -> repository -> model, explicit access, scoped queries, and tests with every behavior change.

---

### Task 1: Trainer diet-plan version contract

**Files:**
- Modify: `server/src/interfaces/ITrainer.ts`
- Modify: `server/src/models/trainerModel.ts`
- Create: `server/tests/models/trainerModel.test.ts`

**Interfaces:**
- Produces: `TRAINER_DIET_PLAN_VERSIONS`, `TrainerDietPlanVersion`, and `ITrainer.dietPlanVersion`.
- Produces: Mongoose/Joi default and validation for the literal numbers `1 | 2`.

- [ ] **Step 1: Write failing model and Joi tests**

Add tests proving that a missing version stores as `1`, an explicit `2` survives persistence, and Joi rejects `3`:

```ts
expect((await TrainerModel.create(buildTrainer())).dietPlanVersion).toBe(1);
expect((await TrainerModel.create(buildTrainer({ dietPlanVersion: 2 }))).dietPlanVersion).toBe(2);
expect(TrainerSchemaValidation.validate(buildTrainer({ dietPlanVersion: 3 })).error).toBeDefined();
```

The production mutation caught is accepting an unsupported version or failing to provide the legacy-safe default.

- [ ] **Step 2: Verify RED**

Run: `cd server && npx jest tests/models/trainerModel.test.ts --runInBand`

Expected: FAIL because `dietPlanVersion` is absent and Joi strips it.

- [ ] **Step 3: Implement the contract**

Add:

```ts
export const TRAINER_DIET_PLAN_VERSIONS = [1, 2] as const;
export type TrainerDietPlanVersion = (typeof TRAINER_DIET_PLAN_VERSIONS)[number];
```

Define the Mongoose path as required with `default: 1` and Joi as
`Joi.number().valid(...TRAINER_DIET_PLAN_VERSIONS).default(1)`.

- [ ] **Step 4: Verify GREEN**

Run: `cd server && npx jest tests/models/trainerModel.test.ts --runInBand`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/interfaces/ITrainer.ts server/src/models/trainerModel.ts server/tests/models/trainerModel.test.ts
git commit -m "feat(trainers): store diet plan version"
```

### Task 2: Strict V2 plan and preset contracts

**Files:**
- Modify: `server/src/interfaces/IDietPlan.ts`
- Create: `server/src/interfaces/IDietPlanV2.ts`
- Create: `server/src/models/dietPlanV2Schemas.ts`
- Modify: `server/src/models/dietPlanModel.ts`
- Modify: `server/src/models/dietPlanPresetModel.ts`
- Create: `server/tests/models/dietPlanV2.test.ts`

**Interfaces:**
- Produces: `IDietPlanV2Content`, `IDietPlanV2SaveRequest`, `IDietPlanV2Document`, `IDietPlanPresetV2SaveRequest`, and `IDietPlanPresetV2Document`.
- Produces: `DietPlanV2Model`, `DietPlanPresetV2Model`, `DietPlanV2SchemaValidation`, and `DietPlanPresetV2SchemaValidation`.
- Produces: shared `DIET_PLANS_COLLECTION` and `DIET_PLAN_PRESETS_COLLECTION` constants used by V1 and V2 models.

- [ ] **Step 1: Write failing V2 schema tests**

Cover literal snapshots, required finite nonnegative macros, optional complete free calories,
optional `string[]` supplements, one category occurrence per meal, same-category normalized
duplicate rejection, and cross-category duplicate allowance. Persist a V1 model and V2 model into
the same collection and assert both are returned by a raw collection query.

```ts
const duplicate = buildV2Plan({
  protein: [{ name: " Chicken   breast " }, { name: "chicken breast" }],
});
expect(DietPlanV2SchemaValidation.validate(duplicate).error).toBeDefined();

const crossCategory = buildV2Plan({
  protein: [{ name: "Rice" }],
  carbs: [{ name: "rice" }],
});
expect(DietPlanV2SchemaValidation.validate(crossCategory).error).toBeUndefined();
```

The production mutations caught are loosening required macros, storing unknown categories, or
incorrectly deduplicating across categories.

- [ ] **Step 2: Verify RED**

Run: `cd server && npx jest tests/models/dietPlanV2.test.ts --runInBand`

Expected: FAIL because V2 contracts/models do not exist.

- [ ] **Step 3: Implement focused contracts and schema factories**

Keep V1 `IDietPlan` exported and add `version?: 1`. Build `_id: false`, strict embedded schemas for
item, category, macros, free calories, and meal. Export a reusable V2 content definition so plan and
preset cannot drift. Point V2 models at the explicit existing collection constants.

Implement Joi duplicate validation with a custom category-array rule that normalizes by trimming,
collapsing whitespace, and lowercasing. Do not store `normalizedName` inside plan snapshots.

- [ ] **Step 4: Verify GREEN and V1 regressions**

Run:

```bash
cd server
npx jest tests/models/dietPlanV2.test.ts tests/models/dietPlan.test.ts tests/models/dietPlanPresets.test.ts --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/interfaces server/src/models/dietPlanModel.ts server/src/models/dietPlanPresetModel.ts server/src/models/dietPlanV2Schemas.ts server/tests/models
git commit -m "feat(diet-plans): add strict v2 contracts"
```

### Task 3: Trainer-scoped V2 catalog

**Files:**
- Create: `server/src/interfaces/IDietV2CatalogItem.ts`
- Create: `server/src/models/dietV2CatalogItemModel.ts`
- Create: `server/src/repositories/MenuItems/DietV2CatalogRepository.ts`
- Create: `server/src/services/dietV2CatalogService.ts`
- Create: `server/src/controllers/dietV2CatalogController.ts`
- Modify: `server/src/functions/menuItems/index.ts`
- Create: `server/src/middleware/dietV2CatalogMiddleware.ts`
- Create: `server/tests/diet-v2-catalog.test.ts`

**Interfaces:**
- Produces: `normalizeDietV2CatalogName(name: string): string`.
- Produces: `DietV2CatalogRepository.search(category, normalizedQuery, limit)`, `getPopular(limit)`, `deleteScoped(id)`, and `resolveAndTouch(candidates)`.
- Produces the Admin routes `/menuItems/v2/popular`, `/menuItems/v2/search`, and `/menuItems/v2/one`.

- [ ] **Step 1: Write failing repository/service tests**

Use real auth context and mongodb-memory-server. Prove compound tenant/category/name uniqueness,
cross-trainer independence, category-scoped substring search, bounded results, popularity order,
parent-trainer scope, and deletion by `_id + trainerId`.

```ts
await runWithAuthContext({ userId: subTrainerId, trainerId: parentId, role: "subTrainer" }, async () => {
  await service.resolveAndTouch([{ category: "protein", name: "100g Chicken breast" }]);
  expect((await service.search("protein", "chicken"))[0].trainerId.toString()).toBe(parentId);
});
```

The production mutations caught are unscoped ID deletion, global duplicate blocking, and returning
other categories or trainer data.

- [ ] **Step 2: Verify RED**

Run: `cd server && npx jest tests/diet-v2-catalog.test.ts --runInBand`

Expected: FAIL because catalog components do not exist.

- [ ] **Step 3: Implement model, scoped repository, and service**

Add the unique `{ trainerId, category, normalizedName }` index and popular sort index. Repository
methods must call `applyScopeToQuery`/`withScopedSoftDeleteFilter` or include authenticated scope
explicitly; never use unscoped `findById`/`hardDeleteById`.

Escape regex metacharacters before substring search. Limit search to 12 and popular to a small
constant per category. Resolve candidates through unordered `bulkWrite`, tolerate only duplicate
key code `11000`, re-query winners, increment each distinct candidate once, and return a mapping by
`category + normalizedName`.

- [ ] **Step 4: Add routes and request validation**

Declare all three route objects with `access: "subtrainer"`. Validate category enum, bounded query
length, and ObjectId format. Controller methods only extract params and shape responses.

- [ ] **Step 5: Verify GREEN**

Run: `cd server && npx jest tests/diet-v2-catalog.test.ts tests/base-repository-scope.test.ts --runInBand`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/src/interfaces/IDietV2CatalogItem.ts server/src/models/dietV2CatalogItemModel.ts server/src/repositories/MenuItems/DietV2CatalogRepository.ts server/src/services/dietV2CatalogService.ts server/src/controllers/dietV2CatalogController.ts server/src/functions/menuItems/index.ts server/src/middleware/dietV2CatalogMiddleware.ts server/tests/diet-v2-catalog.test.ts
git commit -m "feat(diet-plans): add trainer v2 catalog"
```

### Task 4: Version-aware plan replacement and catalog orchestration

**Files:**
- Modify: `server/src/repositories/DietPlan/DietPlanRepository.ts`
- Modify: `server/src/services/dietPlanService.ts`
- Modify: `server/src/controllers/dietPlanController.ts`
- Modify: `server/src/middleware/dietPlanMiddleware.ts`
- Create: `server/tests/diet-plan-versioned-save.test.ts`

**Interfaces:**
- Produces: `DietPlanRepository.findActiveByUserId`, `findActiveById`, and `replaceActiveByUserId`.
- Produces: `DietPlanService.saveActivePlan(request, actingUser)` and normalized read results with `version` always present.

- [ ] **Step 1: Write failing replacement tests**

Persist an unversioned V1 document and assert it reads as version 1. Replace V1 with V2 and assert
all V1-only paths are absent. Replace V2 with V1 and assert V2-only paths are absent. Assert one
document remains for the user. Save V2 with new/stale/foreign catalog IDs and assert all returned
references belong to the authenticated trainer and match category/name.

The production mutations caught are `$set` instead of replacement, trusting foreign IDs, and
selecting a trainer default instead of the stored plan version.

- [ ] **Step 2: Verify RED**

Run: `cd server && npx jest tests/diet-plan-versioned-save.test.ts --runInBand`

Expected: FAIL because the current service calculates V1 calories for every document and updates
partially.

- [ ] **Step 3: Implement version-aware validation and repository reads**

Middleware parses the body once and chooses V2 validation only for `version === 2`; missing version
uses the existing V1 schema. Repository raw/lean reads normalize missing version at the service
boundary. V1 reads may populate legacy menu items; V2 reads never populate catalog references.

- [ ] **Step 4: Implement V2 save orchestration and replacement**

Before writes, verify the target User belongs to the authenticated head trainer. Collect category
items plus nonblank free-calorie descriptions, call catalog `resolveAndTouch`, replace all supplied
IDs with verified resolved IDs, stamp authenticated ownership, and use `findOneAndReplace({ userId })`.
V1 saves retain existing total-calorie calculation and also use replacement for version switches.

- [ ] **Step 5: Verify GREEN and V1 controller regressions**

Run:

```bash
cd server
npx jest tests/diet-plan-versioned-save.test.ts tests/models/dietPlan.test.ts tests/utils/dietPlan.test.ts --runInBand
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/src/repositories/DietPlan/DietPlanRepository.ts server/src/services/dietPlanService.ts server/src/controllers/dietPlanController.ts server/src/middleware/dietPlanMiddleware.ts server/tests/diet-plan-versioned-save.test.ts
git commit -m "feat(diet-plans): save active plan by version"
```

### Task 5: Version-aware presets with catalog resolution

**Files:**
- Modify: `server/src/repositories/Presets/DietPlanPresetRepository.ts`
- Modify: `server/src/services/dietPlanPresetsService.ts`
- Modify: `server/src/controllers/dietPlanPresetController.ts`
- Modify: `server/src/middleware/dietPlanMiddleware.ts`
- Create: `server/tests/diet-plan-v2-presets.test.ts`

**Interfaces:**
- Produces: version-filtered preset listing on the existing route family.
- Reuses: `DietV2CatalogService.resolveAndTouch` and V2 content schemas from Tasks 2-3.

- [ ] **Step 1: Write failing preset tests**

Prove V2 create/update resolves catalog entries, list `version=2` excludes V1 and unversioned
presets, list `version=1` includes unversioned presets, subtrainers use parent scope while
`builtByTrainerId` reflects the acting user, and update by ID cannot cross trainer scope.

The production mutations caught are the existing unscoped `updateById`, mixed-version lists, and
client-controlled builder ownership.

- [ ] **Step 2: Verify RED**

Run: `cd server && npx jest tests/diet-plan-v2-presets.test.ts --runInBand`

Expected: FAIL because preset CRUD is V1-only and ID updates are unscoped.

- [ ] **Step 3: Implement scoped versioned preset operations**

Add explicit repository query/update/delete methods using both `_id` and trainer scope. Normalize
missing version to 1 on reads. Service selects V1/V2 validation, stamps ownership, resolves V2
catalog entries, and fully replaces V2 preset content while preserving `_id`, `trainerId`, and
timestamps.

Do not automatically drop the production global name index from Lambda startup. Add the compound
index definition plus the migration audit in Task 6.

- [ ] **Step 4: Verify GREEN and V1 preset regressions**

Run:

```bash
cd server
npx jest tests/diet-plan-v2-presets.test.ts tests/models/dietPlanPresets.test.ts --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/repositories/Presets/DietPlanPresetRepository.ts server/src/services/dietPlanPresetsService.ts server/src/controllers/dietPlanPresetController.ts server/src/middleware/dietPlanMiddleware.ts server/tests/diet-plan-v2-presets.test.ts
git commit -m "feat(diet-plans): persist v2 presets"
```

### Task 6: Migration audits, access regressions, and complete verification

**Files:**
- Create: `server/scripts/auditDietPlanV2Migration.ts`
- Create: `server/tests/diet-plan-v2-migration-audit.test.ts`
- Modify when required: `server/tests/deployAllLambdas.test.ts`
- Modify: `docs/superpowers/specs/2026-08-11-diet-plan-v2-server-design.md`

**Interfaces:**
- Produces a read-only audit that reports duplicate `dietPlans.userId`, actual collection/index
  names, and preset documents requiring version/normalized-name backfill.

- [ ] **Step 1: Write failing audit tests**

Against isolated collections, assert safe state exits successfully and duplicate users/global
preset index incompatibility produce a nonzero result with exact document/index identifiers. The
test must call the audit function; it must not grep script text.

- [ ] **Step 2: Verify RED**

Run: `cd server && npx jest tests/diet-plan-v2-migration-audit.test.ts --runInBand`

Expected: FAIL because the audit does not exist.

- [ ] **Step 3: Implement the read-only audit**

Use aggregation and `listIndexes`; never mutate or delete data. Export the audit function for Jest
and provide a CLI wrapper that sets a failing process exit code when unsafe state exists.

- [ ] **Step 4: Run targeted and full verification**

Run:

```bash
cd server
npx tsc --noEmit
npm test -- --runInBand
```

Expected: all tests pass and TypeScript exits zero. If repository-wide pre-existing type errors are
present, record the complete command output and verify every changed file with the narrowest valid
TypeScript/Jest checks rather than weakening tests.

- [ ] **Step 5: Review auth and collection boundaries**

Confirm every new protected route declares explicit access, every catalog/preset ID predicate
includes trainer scope, V2 never calls legacy calorie calculation/population, and no `/dietPlans/v2`
route or second plan collection exists.

- [ ] **Step 6: Commit**

```bash
git add server/scripts/auditDietPlanV2Migration.ts server/tests/diet-plan-v2-migration-audit.test.ts server/tests/deployAllLambdas.test.ts docs/superpowers
git commit -m "test(diet-plans): verify v2 rollout safety"
```
