# Global Food Catalog Server Design

**Date:** 2026-08-13

## Objective

Build a global, normalized food catalog on the Server, with Open Food Facts as the first
provider and barcode lookup as the first ingestion path. The catalog must return incomplete
provider data without inventing values, refresh cached provider data after 30 days without
making a cached product unavailable, support future non-barcode foods and search, and preserve
future Admin corrections across provider refreshes.

This is a Server design. Re-enabling and implementing the Client Smart Menu is a follow-up
sub-project after this contract is available. The existing trainer-owned V2 quick-add string
catalog is not changed by this work.

## Decisions

- The domain is named `FoodCatalog`, not `BarcodeFoods`.
- The persisted entity is `FoodCatalogItem` in the global `foodcatalogitems` collection.
- Open Food Facts is accessed only by a provider adapter. Provider response shapes do not leak
  into controllers, persistence consumers, or Client contracts.
- Barcode values remain strings so leading zeroes are preserved.
- Catalog items are global and do not have `trainerId` ownership.
- Missing provider values are stored and returned as `null`; explicit provider zeroes remain
  `0`.
- Hebrew, English, and original product names are stored independently. Hebrew is preferred for
  the current Client, then English, then the original/default name.
- A manufacturer/provider serving is preferred. If no normalized serving is available, the
  catalog supplies an explicit 100 g or 100 ml fallback when the basis unit is known.
- The stored definition of one serving is separate from a user's chosen consumed amount.
- Products refresh after 30 days.
- A provider failure never makes an already cached product unavailable.
- A short refresh lease prevents simultaneous stale lookups from stampeding Open Food Facts.
- Product lookups and reported consumptions have separate global analytics counters.
- Regular users cannot mutate global catalog values.
- Admin overrides are supported in Server routes and persistence now, but no Admin UI is in
  scope.
- Admin overrides are field-level overlays and always win in effective Client responses.

## Alternatives Considered

### 1. Direct Open Food Facts proxy

Every scan would call Open Food Facts and return the provider response. This is the smallest
initial implementation but couples Client behavior to a changing external schema, amplifies
Lambda cold-start and provider latency, provides poor outage behavior, and does not gradually
build the intended internal catalog. Rejected.

### 2. Asynchronous ingestion only

The scan would enqueue ingestion and return a pending state while a worker populates the
catalog. This isolates provider latency and scales well, but makes the core "fast, no thinking"
scan experience worse and adds queue/worker complexity before it is required. Rejected for the
initial implementation.

### 3. Synchronous cache-through catalog with stale fallback

The Server checks Mongo first, fetches Open Food Facts on a miss, and synchronously refreshes a
stale cached item when it can acquire a refresh lease. Concurrent stale requests receive cached
data. Provider failures fall back to cached data. This meets the product experience while
keeping a stable internal contract. Selected.

## Domain Boundaries

```text
Authenticated Client
        |
        v
Food Catalog Lambda
        |
        +--> FoodCatalogController
        |        |
        |        v
        |    FoodCatalogService
        |        |
        |        +--> FoodCatalogRepository --> MongoDB
        |        |
        |        +--> OpenFoodFactsProvider --> Open Food Facts API v3
        |                    |
        |                    v
        |            OpenFoodFactsNormalizer
        |
        +--> explicit route access enforcement
```

The provider adapter owns HTTP configuration, response parsing, timeouts, the identifying
`User-Agent`, and provider-specific status handling. The normalizer owns source-field selection,
unit conversion, localized names, missing-field reporting, serving fallback, and deterministic
content hashing.

The repository is global-scoped because catalog items are intentionally shared across trainers
and users.

## Data Model

### Shared nutrition values

```ts
interface NutritionValues {
  calories: number | null; // kcal
  protein: number | null; // g
  carbohydrates: number | null; // g
  fat: number | null; // g
  saturatedFat: number | null; // g
  sugars: number | null; // g
  fiber: number | null; // g
  sodium: number | null; // g
  salt: number | null; // g
}
```

All stored nutrient units are normalized. Values are finite and nonnegative when present.

### Provider data

```ts
interface FoodCatalogProviderData {
  identifiers: {
    barcode: string | null;
    barcodeAliases: string[];
    providerId: string | null;
  };
  names: {
    he: string | null;
    en: string | null;
    original: string | null;
    originalLanguage: string | null;
  };
  brand: string | null;
  imageUrl: string | null;
  package: {
    description: string | null;
    quantity: number | null;
    unit: "g" | "ml" | null;
  };
  serving: {
    description: string;
    quantity: number;
    unit: "g" | "ml";
    source: "open_food_facts" | "fallback_100";
  } | null;
  nutrition: {
    basisUnit: "g" | "ml" | null;
    per100: NutritionValues;
    perServing: NutritionValues;
  };
  dataQuality: {
    status: "complete" | "partial";
    missingFields: string[];
    errors: string[];
    warnings: string[];
  };
}
```

If Open Food Facts supplies a normalized serving quantity and unit, it is saved as the serving.
If not, a 100 g or 100 ml serving is synthesized only when the basis unit can be determined and
is marked `fallback_100`. The source free-text serving and package descriptions are preserved.

`per100` uses normalized `_100g` provider fields. `perServing` uses reliable provider normalized
serving values when available and otherwise may be calculated from `per100` and a known serving
quantity. Calculated values remain deterministic and do not replace missing values with zero.

### Admin override overlay

```ts
interface FoodCatalogAdminOverrides {
  names?: Partial<FoodCatalogProviderData["names"]>;
  brand?: string | null;
  imageUrl?: string | null;
  package?: Partial<FoodCatalogProviderData["package"]> | null;
  serving?: Partial<NonNullable<FoodCatalogProviderData["serving"]>> | null;
  nutrition?: {
    basisUnit?: "g" | "ml" | null;
    per100?: Partial<NutritionValues>;
    perServing?: Partial<NutritionValues>;
  };
  updatedAt: Date;
  updatedBy: ObjectId;
  reason?: string;
}
```

Effective data is a deep, field-level merge where an existing Admin override wins over provider
data. Provider refreshes update provider data only. Clearing an individual override restores the
current provider value; clearing all overrides restores all current provider values.

Ordinary Client responses return effective data and `hasAdminOverrides`; they do not expose the
provider/override internals. Admin inspection returns provider, override, and effective views.

### Catalog document

```ts
interface FoodCatalogItem {
  _id: ObjectId;
  providerData: FoodCatalogProviderData;
  adminOverrides: FoodCatalogAdminOverrides | null;
  search: {
    normalizedNames: string[];
    normalizedBrand: string | null;
    aliases: string[];
  };
  source: {
    provider: "open_food_facts" | "admin" | "future_provider";
    providerId: string | null;
    schemaVersion: number | null;
    sourceLastModifiedAt: Date | null;
    normalizedDataHash: string;
    lastFetchAttemptAt: Date | null;
    lastSuccessfulFetchAt: Date | null;
    nextRefreshAt: Date | null;
    consecutiveFailures: number;
    refreshLeaseUntil: Date | null;
  };
  analytics: {
    lookupCount: number;
    consumptionCount: number;
    lastLookedUpAt: Date | null;
    lastConsumedAt: Date | null;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

The initial implementation persists the selected provider fields required by this contract, not
the provider's full arbitrary product document. This bounds document size while preserving the
source values needed to compute effective responses. The source and provider timestamps preserve
provenance and refresh behavior.

### Indexes

- Unique partial index on `providerData.identifiers.barcode` when a barcode exists.
- Multikey lookup index on `providerData.identifiers.barcodeAliases`.
- Partial unique compound index on `source.provider` and `source.providerId` when a provider ID
  exists.
- Index on `source.nextRefreshAt` for future maintenance jobs.
- Descending index on `analytics.consumptionCount` for future popular-food queries.

Trainer-authored V2 quick-add strings are not inserted into this collection. A future trainer
catalog search can use `FoodCatalogItem` as a structured suggestion source, then save a catalog
reference and immutable nutritional snapshot into a diet plan without removing free-form entry.

## Open Food Facts Normalization

The provider request uses the current API v3 product-by-code endpoint and requests only selected
fields:

```text
code,schema_version,lang,product_name,product_name_he,product_name_en,
brands,image_front_url,quantity,product_quantity,product_quantity_unit,
serving_size,serving_quantity,serving_quantity_unit,nutrition_data_per,
nutriments,last_modified_t,data_quality_errors_tags,data_quality_warnings_tags
```

The request sends `cc=il`, `lc=he`, and an identifying `User-Agent` configured from environment.
Language-specific names are requested explicitly because locale parameters do not translate a
missing product name.

Normalization rules:

1. Validate and preserve the barcode as a canonical string; never parse it as a JavaScript
   number.
2. Trim textual values; blank strings become `null`.
3. Save Hebrew, English, and original/default names independently.
4. Select display name in this order: Hebrew, English, original, then a localized unknown-product
   fallback at response time.
5. Parse normalized provider quantities only when finite, positive, and paired with `g` or `ml`.
6. Use `energy-kcal_100g`, `proteins_100g`, `carbohydrates_100g`, `fat_100g`,
   `saturated-fat_100g`, `sugars_100g`, `fiber_100g`, `sodium_100g`, and `salt_100g`.
7. Use matching `_serving` fields when reliable serving data exists. Calculate from per-100 data
   when a normalized serving quantity exists and a serving nutrient is missing.
8. Preserve explicit zero and map absent, invalid, negative, or non-finite nutrient values to
   `null`.
9. Derive kcal from normalized kJ only when normalized kcal is absent, recording the result in
   deterministic normalized data rather than pretending the provider supplied kcal.
10. Collect missing core nutrition paths and provider quality errors/warnings. Partial products
    are valid and returned.
11. Generate a stable hash from normalized provider data, excluding fetch timestamps, leases,
    and analytics.

Open Food Facts API v3 is evolving, so the adapter must ignore unknown fields and the normalizer
must only depend on documented requested fields:

- https://openfoodfacts.github.io/documentation/docs/Product-Opener/v3/products/get-api-v3-product-code/
- https://openfoodfacts.github.io/documentation/docs/Product-Opener/schemas/schemas/product/
- https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/ref-api-and-product-schema-change-log/

## Cache and Refresh Behavior

The refresh interval is 30 days. The lease duration and provider timeout are implementation
constants with conservative defaults and tests using an injected clock.

### Fresh cache hit

1. Find by canonical barcode or barcode alias.
2. Atomically increment `lookupCount` and set `lastLookedUpAt`.
3. Return effective data with `cache.status = "hit"`.

### Cache miss

1. Fetch Open Food Facts synchronously.
2. Normalize the response.
3. Upsert by canonical barcode/provider identity.
4. Initialize or increment lookup analytics atomically.
5. Return effective data with `cache.status = "created"`.

### Stale cache hit

1. Attempt to atomically acquire a short refresh lease.
2. If another request owns the lease, increment lookup analytics and immediately return cached
   effective data with `cache.status = "hit"`.
3. The lease owner calls Open Food Facts synchronously.
4. If normalized data changed, update provider data and hash, advance successful refresh fields,
   release the lease, increment lookup analytics, and return `cache.status = "refreshed"`.
5. If data is identical, retain provider data, advance successful refresh fields, release the
   lease, increment lookup analytics, and return `cache.status = "hit"`.
6. On timeout, provider error, malformed response, or not-found response, preserve cached product
   and overrides, advance attempt/failure/backoff fields, release the lease, increment lookup
   analytics, and return `cache.status = "stale_fallback"`.

An uncached provider 404 is negatively cached for 24 hours. An uncached transient provider error
is negatively cached for approximately five minutes. Negative-cache records are separate from
valid `FoodCatalogItem` documents so unavailable barcodes never masquerade as products.

## API Contract

### Lookup by barcode

```http
GET /foodCatalog/barcodes/{barcode}
Access: authenticated
```

Returns effective catalog data, `hasAdminOverrides`, and cache status. It returns partial products
successfully. An uncached confirmed provider miss returns 404. An uncached provider failure
returns a safe upstream-unavailable response without provider internals.

### Report local consumption

```http
POST /foodCatalog/items/{itemId}/consumption
Access: authenticated
```

The current Client records consumption locally. It calls this endpoint in the background only
after local recording succeeds and does not block its UI on the response. The endpoint atomically
increments `consumptionCount` and `lastConsumedAt`. Analytics are intentionally approximate;
this endpoint does not create a consumed-food record or accept nutrition values.

### Apply Admin overrides

```http
PATCH /foodCatalog/items/{itemId}/admin-overrides
Access: admin
```

Accepts a validated partial field-level overlay plus optional reason. Authenticated Admin identity
is used for `updatedBy`; client-supplied identity is ignored/not accepted. Explicit null at an
overridable leaf clears that override and restores provider fallback for that leaf.

### Clear Admin overrides

```http
DELETE /foodCatalog/items/{itemId}/admin-overrides
Access: admin
```

Clears the complete overlay while retaining provider data.

No Admin UI is included.

## Security and Abuse Controls

- Barcode lookup and consumption routes require authentication.
- Override routes require the existing `admin` route access level.
- No route accepts `trainerId`, `userId`, role, or Admin identity as authorization evidence.
- Provider URLs are fixed in Server configuration; barcodes cannot control hosts or arbitrary
  URLs.
- Barcode syntax and maximum length are validated before database/provider use.
- Provider calls use a bounded timeout and safe error mapping.
- Provider response content is never logged wholesale.
- Analytics use atomic increments. Approximate analytics are not treated as billing, permissions,
  or health-critical truth.
- Consumption-report abuse can later be rate-limited without changing the product model or API
  meaning.

## External Data and Attribution

The catalog retains `source.provider` so Client attribution can be added when the Smart Menu UI is
implemented. Open Food Facts database reuse and attribution requirements must be respected in the
Client presentation and deployment documentation. This Server phase does not remove provenance
or present provider data as trainer-authored data.

## Testing Strategy

- Pure normalizer tests for localization fallback, serving parsing/fallback, all nutrient fields,
  explicit zero, missing/invalid values, unit conversion, kcal derivation, quality fields, and
  stable hashing.
- Model tests for nullable fields, finite/nonnegative nutrition, global ownership, partial unique
  indexes, analytics defaults, and override structure.
- Repository/service tests for fresh hit, miss/upsert, unchanged refresh, changed refresh,
  refresh failure fallback, lease contention, lease release, negative-cache behavior, atomic
  counters, and Admin overlay merging.
- Route/controller tests for authenticated lookup, authenticated consumption, Admin-only override
  mutation, input validation, safe errors, and response shape.
- Deployment configuration tests for the new Lambda mapping.
- Full Server regression test run before completion.

## Deployment Scope

The implementation adds a dedicated Food Catalog Lambda and deployment mapping. Final handoff must
list its exact configured `functionName`, plus any existing Lambda that becomes affected through a
changed shared runtime import. Documentation-only design and planning commits require no Lambda
redeployment.

## Explicitly Out of Scope

- Smart Menu Client design and barcode-scanner library selection.
- Uncommenting the Client tab before a usable Server endpoint exists.
- Admin UI for catalog corrections.
- Trainer quick-add schema changes.
- Server-persisted consumed-food history.
- Search endpoint implementation, autocomplete ranking, or plan macro autofill.
- Writing corrections back to Open Food Facts.
