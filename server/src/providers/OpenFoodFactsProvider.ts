const OPEN_FOOD_FACTS_FIELDS = [
  "code",
  "schema_version",
  "lang",
  "product_name",
  "product_name_he",
  "product_name_en",
  "brands",
  "image_front_url",
  "quantity",
  "product_quantity",
  "product_quantity_unit",
  "serving_size",
  "serving_quantity",
  "serving_quantity_unit",
  "nutrition_data_per",
  "nutriments",
  "last_modified_t",
  "data_quality_errors_tags",
  "data_quality_warnings_tags",
].join(",");

export type OpenFoodFactsLookupResult =
  | { status: "found"; product: Record<string, any> }
  | { status: "not_found" };

export class OpenFoodFactsProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenFoodFactsProviderError";
  }
}

export class OpenFoodFactsProvider {
  constructor(
    private readonly timeoutMs = 5000,
    private readonly fetchImplementation: typeof fetch = fetch
  ) {}

  async getProduct(barcode: string): Promise<OpenFoodFactsLookupResult> {
    const userAgent = process.env.OPEN_FOOD_FACTS_USER_AGENT?.trim();
    if (!userAgent) {
      throw new OpenFoodFactsProviderError("Open Food Facts integration is not configured.");
    }

    const url = new URL(
      `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(barcode)}`
    );
    url.searchParams.set("cc", "il");
    url.searchParams.set("lc", "he");
    url.searchParams.set("product_type", "food");
    url.searchParams.set("fields", OPEN_FOOD_FACTS_FIELDS);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImplementation(url, {
        method: "GET",
        headers: { "User-Agent": userAgent, Accept: "application/json" },
        signal: controller.signal,
      });

      if (response.status === 404) return { status: "not_found" };
      if (!response.ok) throw new OpenFoodFactsProviderError("Open Food Facts is unavailable.");

      const payload = (await response.json()) as Record<string, any>;
      if (!payload.product || typeof payload.product !== "object") {
        throw new OpenFoodFactsProviderError("Open Food Facts returned an invalid response.");
      }

      return { status: "found", product: payload.product };
    } catch (error) {
      if (error instanceof OpenFoodFactsProviderError) throw error;
      throw new OpenFoodFactsProviderError("Open Food Facts is unavailable.");
    } finally {
      clearTimeout(timeout);
    }
  }
}
