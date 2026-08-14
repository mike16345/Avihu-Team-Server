import {
  OpenFoodFactsProvider,
  OpenFoodFactsProviderError,
} from "../src/providers/OpenFoodFactsProvider";

describe("OpenFoodFactsProvider", () => {
  const originalUserAgent = process.env.OPEN_FOOD_FACTS_USER_AGENT;

  afterEach(() => {
    if (originalUserAgent === undefined) delete process.env.OPEN_FOOD_FACTS_USER_AGENT;
    else process.env.OPEN_FOOD_FACTS_USER_AGENT = originalUserAgent;
  });

  test("requests the selected Hebrew and English product fields with an identifying header", async () => {
    process.env.OPEN_FOOD_FACTS_USER_AGENT = "AvihuTeam/1.0 (dev@example.test)";
    let requestedUrl = "";
    let requestedHeaders: HeadersInit | undefined;
    const fakeFetch = jest.fn(async (input: URL | RequestInfo, init?: RequestInit) => {
      requestedUrl = input.toString();
      requestedHeaders = init?.headers;
      return new Response(JSON.stringify({ product: { code: "012345678905" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const result = await new OpenFoodFactsProvider(1000, fakeFetch).getProduct("012345678905");

    expect(result).toEqual({ status: "found", product: { code: "012345678905" } });
    const url = new URL(requestedUrl);
    expect(url.origin + url.pathname).toBe(
      "https://world.openfoodfacts.org/api/v3/product/012345678905"
    );
    expect(url.searchParams.get("lc")).toBe("he");
    expect(url.searchParams.get("cc")).toBe("il");
    expect(url.searchParams.get("fields")).toContain("product_name_he");
    expect(url.searchParams.get("fields")).toContain("product_name_en");
    expect(requestedHeaders).toMatchObject({
      "User-Agent": "AvihuTeam/1.0 (dev@example.test)",
    });
  });

  test("distinguishes a confirmed missing product from provider failure", async () => {
    process.env.OPEN_FOOD_FACTS_USER_AGENT = "AvihuTeam/1.0 (dev@example.test)";
    const missingFetch = jest.fn(async () => new Response(null, { status: 404 })) as any;
    const failingFetch = jest.fn(async () => new Response(null, { status: 503 })) as any;

    await expect(
      new OpenFoodFactsProvider(1000, missingFetch).getProduct("12345678")
    ).resolves.toEqual({
      status: "not_found",
    });
    await expect(
      new OpenFoodFactsProvider(1000, failingFetch).getProduct("12345678")
    ).rejects.toBeInstanceOf(OpenFoodFactsProviderError);
  });
});
