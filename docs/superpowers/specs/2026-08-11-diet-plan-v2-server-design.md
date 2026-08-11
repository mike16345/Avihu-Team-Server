# Diet Plan V2 Server Design

## Goal

Persist the approved Diet Plan V2 contract without splitting a trainee's active diet plan across
versions, breaking existing V1 consumers, or reusing the legacy nutrition-bearing Menu Item model.
The Server must support the Admin V2 quick-add workflow, shared parent-trainer catalog, and V2
presets while preserving the existing V1 API.

Barcode products, Smart Menu consumption, and daily Client logging are separate follow-up work.

## Product Rules

- A trainee has exactly one active diet plan.
- V1 and V2 plans share the existing `dietPlans` collection and route family.
- The stored plan's `version` selects its contract and is authoritative for existing plans.
- A trainer's configured diet-plan version is only the default for trainees without plans.
- Saving a different plan version replaces the trainee's current document; the previous version is
  not retained for rollback.
- Existing diet-plan documents without `version` are V1.
- V1 and V2 presets share the existing `dietPlanPresets` collection and route family.
- The trainer-authored V2 string catalog is a new collection and does not change legacy
  `menuItems`.
- Barcode-derived product data will eventually use another collection and is not part of this
  implementation.

## Shared Collection Without a Loose Shared Schema

V1 and V2 have incompatible meal structures. The Server must not represent them as one TypeScript
interface with many optional properties, store the payload in `Schema.Types.Mixed`, or introduce a
new storage envelope that would migrate every V1 document.

Instead, use separate strict TypeScript contracts, Joi validators, and Mongoose models which point
to the same physical collection:

```ts
type AnyDietPlan = IDietPlanV1 | IDietPlanV2;

DietPlanV1Model  -> dietPlans collection
DietPlanV2Model  -> dietPlans collection

DietPlanPresetV1Model -> dietPlanPresets collection
DietPlanPresetV2Model -> dietPlanPresets collection
```

The existing V1 exported types and models remain compatible. The V1 contract gains an optional
literal `version?: 1`; the V2 contract requires `version: 2`.

Mongoose discriminators are intentionally avoided. Their implicit discriminator filters make
legacy documents without a version harder to read and update. Explicit models keep version
selection visible in the repository and service code.

Collection names must be explicit shared constants so Mongoose pluralization cannot accidentally
create a second collection.

## Diet Plan V2 Contract

```ts
export const DIET_V2_MEAL_CATEGORIES = [
  "protein",
  "carbs",
  "fat",
  "vegetables",
  "addon",
] as const;

export type DietV2MealCategory = (typeof DIET_V2_MEAL_CATEGORIES)[number];
export type DietV2CatalogCategory = DietV2MealCategory | "freeCalories";

export interface DietV2PlanItem {
  name: string;
  catalogItemId?: string;
}

export interface DietV2Category {
  category: DietV2MealCategory;
  items: DietV2PlanItem[];
}

export interface DietV2MealMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DietV2FreeCalories {
  calories: number;
  description: string;
}

export interface DietV2Meal {
  id: string;
  name: string;
  categories: DietV2Category[];
  macros: DietV2MealMacros;
  freeCalories?: DietV2FreeCalories;
  supplements?: string[];
}

export interface IDietPlanV2Content {
  version: 2;
  meals: DietV2Meal[];
  highlights: string;
}

export interface IDietPlanV2SaveRequest extends IDietPlanV2Content {
  userId: string;
}

export interface IDietPlanV2Document extends IDietPlanV2SaveRequest {
  _id: string;
  trainerId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

Item names are literal snapshots. The Server does not extract quantities, units, portions, or
nutrition from text such as `100 grams Chicken breast`.

Every embedded V2 schema uses `{ _id: false }`. Meals already have stable string IDs, catalog
references have explicit `catalogItemId` values, and macro/category/free-calorie objects do not
need generated Mongo IDs.

`catalogItemId` is optional on requests and persisted as an ObjectId when resolved. It is never
required to render a plan because `name` remains the canonical display snapshot.

## Diet Plan V2 Preset Contract

V2 presets reuse the same editable plan-content definitions:

```ts
export interface IDietPlanPresetV2SaveRequest extends IDietPlanV2Content {
  name: string;
  goal?: "cutting" | "maintain" | "bulking";
  targetGender?: "women" | "men" | "both";
  dietTags?: DietV2DietTag[];
}

export interface IDietPlanPresetV2Document extends IDietPlanPresetV2SaveRequest {
  _id: string;
  trainerId: string;
  builtByTrainerId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

`trainerId` and `builtByTrainerId` exist only on persisted/response documents. They are resolved
from authentication context and are forbidden in save requests. The Server does not trust
client-supplied ownership fields.

Preset list requests select a version using a query parameter on the existing route family, for
example `GET /presets/dietPlans?version=2`. Create and update select the validator from the body.
Fetching by ID returns the stored version.

The legacy globally unique preset `name` index must be replaced with a trainer- and version-scoped
index. V2 stores a normalized preset name for reliable uniqueness:

```ts
{ trainerId: 1, version: 1, normalizedName: 1 }
```

Before changing production indexes, a migration check must confirm the existing index name and
report incompatible documents rather than relying on Lambda model initialization to change it.

## Version-Aware Reads and Replacement Writes

Reads query the shared collection by `userId` and normalize `version ?? 1` in the response. The
top-level consumer branches once on this discriminator; V1 and V2 components do not receive a
large union below that boundary.

Creates and updates validate with the selected version contract and use a complete replacement:

```ts
findOneAndReplace(
  { userId },
  validatedAndServerOwnedPlan,
  { upsert: true, returnDocument: "after" }
);
```

Replacement is required. A partial `$set` could leave V1-only fields on a V2 plan or V2-only fields
on a replacement V1 plan.

The database must enforce one active plan per `userId`. Before adding a unique index in production,
an explicit audit script must detect and report existing duplicate user IDs. It must not delete or
choose a winner automatically.

The existing `/dietPlans` route family remains. Missing `version` on a write selects V1 for
backward compatibility. A V1 response includes `version: 1` at the API boundary even when the
legacy stored document does not yet contain the field.

## Trainer Version Resolution

The Trainer model exposes `dietPlanVersion: 1 | 2`, defaulting to 1 for legacy trainers.
Subtrainers inherit the head trainer's configured value through the existing authentication
context.

The setting determines which builder is offered only when the trainee has no existing plan. It is
not copied to the User and does not override an existing plan's version.

## Trainer V2 Catalog

The trainer string catalog is a separate collection because it is a new entity with different
ownership and lifecycle from both diet plans and legacy `menuItems`:

```ts
export interface IDietV2CatalogItem {
  _id: string;
  trainerId: string;
  category: DietV2CatalogCategory;
  name: string;
  normalizedName: string;
  usageCount: number;
  lastUsedAt: Date;
}
```

The unique catalog key is:

```ts
{ trainerId: 1, category: 1, normalizedName: 1 }
```

Normalization trims outer whitespace, collapses internal whitespace, and lowercases for comparison.
The original display name remains available as `name`.

Consequences:

- the same normalized name cannot appear twice in one trainer/category catalog;
- the same name may appear in multiple categories;
- the same name may appear in multiple categories in one meal;
- Trainer A never blocks Trainer B;
- subtrainers use the head trainer's catalog;
- catalog name and category are immutable; and
- hard deletion removes future suggestions but never changes saved plan snapshots.

## Catalog API

The Admin contract is:

```http
GET    /menuItems/v2/popular
GET    /menuItems/v2/search?category=protein&q=chicken
DELETE /menuItems/v2/one?id=<catalog-item-id>
```

All routes require trainer/subtrainer access and derive `trainerId` from authentication context.
ID-based operations include trainer scope in the database predicate; they must not use an
unscoped base-repository ID helper.

Search requirements:

- require a valid catalog category;
- escape all regex syntax from user input;
- match normalized terms anywhere in a name;
- scope first by trainer and category;
- return a small bounded list, initially 12 items;
- rank text relevance first and popularity/recency second; and
- never return the full catalog to the Admin.

An unanchored substring cannot use a normal B-tree index for the text portion. The compound
trainer/category index still bounds the scan to one team's category. This is sufficient for the
initial expected per-trainer catalog size while keeping the service replaceable with Atlas Search
or another search index later.

Popular results return a small list for every catalog category, ordered by `usageCount` and then
`lastUsedAt`. A page-open popular request provides immediate quick-add choices and begins warming
the Lambda before typed search.

## V2 Save Orchestration

Plan and preset saves use the same V2 catalog-resolution service:

1. Resolve the authenticated head-trainer ownership ID and acting trainer ID.
2. For trainee plans, verify that the target User belongs to that trainer team.
3. Validate the complete V2 request before any writes.
4. Collect names from each meal category and nonblank free-calorie descriptions.
5. Normalize and deduplicate candidates by category plus normalized name.
6. Resolve supplied catalog IDs only when they belong to the same trainer, category, and normalized
   name.
7. Treat missing, stale, deleted, foreign, or mismatched IDs as unresolved candidates.
8. Bulk upsert unresolved candidates, increment `usageCount` once per distinct submitted candidate,
   and set `lastUsedAt`.
9. Treat a concurrent duplicate-key insertion as reuse, then re-query the winning record.
10. Persist plan name snapshots with the resolved catalog references.
11. Replace/upsert the plan or preset and return the stored document.

Popularity is intentionally approximate. The Server does not compare the previous plan with the
submitted plan. Any accepted V2 save increments every distinct included candidate once. React Hook
Form dirty state prevents the Admin from submitting unchanged forms, but Server correctness does
not depend on a client-provided dirty flag.

The catalog is a convenience index, not a financial or audit ledger. The initial implementation
does not use a multi-document Mongo transaction. A rare failure after catalog upsert but before plan
replacement can leave a harmless suggestion or overcount, which is acceptable under the approved
approximate-popularity rule. The plan replacement itself remains atomic.

## V2 Validation Rules

The Joi request contract and strict Mongoose schemas enforce:

- `version` is the literal number 2;
- at least one meal exists;
- meal IDs and names are nonempty;
- calories, protein, carbs, and fat are required finite nonnegative numbers;
- zero macro values are valid;
- category names use the approved enum;
- a category occurs at most once within one meal;
- item names are nonblank strings;
- normalized duplicate names are rejected only within the same meal category;
- duplicate names across categories are allowed;
- when `freeCalories` exists, both calories and description are required;
- `highlights` is a plan-level plain string; and
- `supplements` remains an optional meal-level `string[]` pass-through.

Unknown/transient fields such as `isNew` are rejected or stripped at the HTTP boundary and are not
persisted.

## Authorization and Tenant Boundaries

- Never trust client-provided `trainerId`, `builtByTrainerId`, or catalog ownership.
- Resolve head-trainer ownership through async authentication context.
- Subtrainers read and write the parent trainer's catalog and presets.
- Verify target User membership before trainer plan reads, writes, and deletes.
- A trainee may read only their own plan.
- Catalog deletes include both `_id` and authenticated `trainerId` in the query.
- Existing plan snapshots remain valid after a catalog item is deleted.

## Migration and Compatibility

No bulk V1 data-shape migration is required for application reads. Missing plan or preset versions
are normalized to V1.

Production rollout still requires explicit, idempotent migration checks for:

1. duplicate `dietPlans.userId` values before creating the unique index;
2. the existing global preset-name index before replacing it;
3. backfilling or normalizing preset version/index fields when needed; and
4. confirming the exact existing Mongoose-resolved collection names before making them constants.

Migration tools report unsafe state and stop. They do not delete, merge, or silently select
documents.

## Testing Boundary

Focused Jest and `mongodb-memory-server` coverage must include:

- an unversioned V1 document reads as version 1;
- existing V1 create/update behavior remains operational;
- a V1 plan can be atomically replaced with V2 without stale V1 fields;
- a V2 plan can be atomically replaced with V1 without stale V2 fields;
- one active plan per user is enforced;
- V2 shape, macro, category, and duplicate validation;
- same-name cross-category allowance;
- V2 preset create/list/update/delete by trainer and version;
- trainer-scoped catalog uniqueness and cross-trainer independence;
- subtrainer access to the parent catalog;
- foreign catalog IDs are never accepted as references;
- stale/deleted catalog IDs are safely re-resolved;
- concurrent catalog upsert duplicate-key handling;
- approximate usage increments once per distinct submitted category/name;
- bounded category-scoped search and popular ordering;
- catalog deletion does not mutate stored plans; and
- authenticated users cannot read or mutate another trainer team's resources.

## Explicitly Deferred

- Barcode scanning and barcode product storage.
- Smart Menu search over barcode products.
- Daily Client consumption synchronization.
- Plan-version history or rollback.
- V1-to-V2 content conversion.
- Rich-text highlights.
- Structured supplement dose units or supplement parsing.
- Atlas Search or another dedicated search service.

## Acceptance Criteria

- The existing V1 API remains backward-compatible.
- V1 and V2 plans occupy the same collection with one active document per user.
- Version changes replace the active document instead of creating parallel plans.
- V2 plans and presets round-trip the approved Admin contract without item nutrition or serving
  fields.
- V2 catalog suggestions are shared by a head trainer and subtrainers but isolated from other
  trainers.
- Searches and popular suggestions are bounded and category-specific.
- Saving a V2 plan or preset resolves catalog references and updates approximate popularity.
- Deleting a catalog suggestion never changes an existing plan or preset.
- Legacy `menuItems` and barcode work remain untouched.
