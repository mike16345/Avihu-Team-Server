# RAG Chatbot Overview

## Components

- **src/rag/prompts.ts** — Central system prompt injected on every OpenAI call.
- **src/rag/openai.ts** — Lightweight HTTP client for OpenAI chat completions and embeddings with automatic system prompt injection and optional streaming support.
- **src/rag/pinecone.ts** — Minimal Pinecone REST helper that resolves the index host dynamically and exposes query/upsert/delete helpers plus metadata filters.
- **src/rag/answer.service.ts** — Main orchestration for rate limiting, semantic cache reuse, Pinecone retrieval, OpenAI generation, cache persistence, logging, and MongoDB traces.
- **src/rag/dietQuestionClassifier.ts** — Keyword-based fitness/health classifier that preserves the previous diet-only control flow semantics.
- **src/rag/language.ts** — HE/EN detector with fallback notice handling.
- **src/rag/db.ts** — Singleton repository accessors for cache, traces, sources, and rate-limit documents.
- **src/rag/index.ts** — Exports a shared `RagAnswerService` instance.

## Persistence

- **MongoDB collections**
  - `RagCache` (`src/models/ragCacheModel.ts`): Stores normalized questions, answers, language, citations, embedding snapshot, and reuse metadata.
  - `RagTrace` (`src/models/ragTraceModel.ts`): Lightweight trace log for observability (question, answer preview, usage, reason).
  - `RagRateLimit` (`src/models/ragRateLimitModel.ts`): Sliding-window timestamps for per-user rate limiting.
  - `RagSource` (`src/models/ragSourceModel.ts`): Canonical storage for ingested context chunks with dedupe hashes.

- **Repositories** under `src/repositories/Rag` wrap CRUD/upsert helpers for each model.

## Lambda Surface

- **src/controllers/ragController.ts** exposes two actions:
  - `POST /rag/query` handles chat requests (streaming or JSON) via `ragAnswerService`.
  - `POST /rag/ingest` upserts source chunks after verifying the provided `adminUserId` belongs to an admin.
- **src/functions/rag/index.ts** wires the controller through the shared `handleApiCall` router.

## Runtime Flow

1. Rate limit enforcement per user (Mongo sliding window).
2. Language detection (HE/EN/other → HE) and fallback notice setup.
3. Semantic cache lookup (Pinecone namespace `semantic-cache` + Mongo document) with 0.9 default threshold.
4. Fitness/health classifier gate with localized rejection message when irrelevant.
5. Pinecone retrieval (`corpus` namespace) with lang-preferring filter, threshold fallback, and trimmed context sentences.
6. OpenAI generation at temperature 0.2 with streaming support, citations, and fallback message when no context meets threshold.
7. Cache persistence (Mongo + Pinecone) for successful, cited answers and trace logging for observability.
8. Structured console log `evt: "rag.query"` summarizing latency, tokens, retrieved IDs, and reason code.

## Tuning Knobs

- Environment-driven: `RAG_RETRIEVAL_TOP_K`, `RAG_RETRIEVAL_THRESHOLD`, `RAG_CACHE_THRESHOLD`, `RAG_RATE_LIMIT_WINDOW_MS`, `RAG_RATE_LIMIT_MAX_REQUESTS`, `OPENAI_CHAT_MODEL`, `OPENAI_EMBEDDING_MODEL` (all optional).
- Request-level: `topK`, `threshold`, `cacheThreshold`, `stream`, and metadata filters.
- Pinecone namespaces: `semantic-cache` (cache) and `corpus` (canonical content).

## Operational Notes

- Streaming responses emit `data: {"delta"}` chunks followed by a trailer `data: {"done":true,...}`.
- Non-streaming responses return `{ reason, answer, citations, usage, cached, notice, language }`.
- Ingestion requires an `adminUserId` belonging to an admin user.
- Rate limit exceedance returns HTTP 429 with `{ message: "rate limit exceeded" }`.
- Language fallback notice: `השאלה זוהתה בשפה שאינה נתמכת, התשובה מסופקת בעברית בהתאם למדיניות.` prefixed to answers when input is neither HE nor EN.

## Example Requests

> Replace `YOUR_API_GATEWAY_URL` with the deployed base URL and set the `x-api-key`/authorization headers that your environment requires.

### 1. English Fitness Question (JSON response)

```bash
curl -X POST "https://YOUR_API_GATEWAY_URL/rag/query" \
  -H "Content-Type: application/json" \
  -d '{
        "userId": "64fabc12d9012f001234abcd",
        "sessionId": "web-123",
        "question": "What are three mobility drills to loosen tight hamstrings before a run?",
        "stream": false,
        "topK": 5,
        "threshold": 0.55
      }'
```

### 2. Hebrew Nutrition Question (streaming SSE)

```bash
curl -N -X POST "https://YOUR_API_GATEWAY_URL/rag/query" \
  -H "Content-Type: application/json" \
  -d '{
        "userId": "64fabc12d9012f001234abcd",
        "sessionId": "ios-442",
        "question": "מה אפשר לאכול אחרי אימון כוח כדי לתמוך בהתאוששות?",
        "stream": true,
        "cacheThreshold": 0.9
      }'
```

### 3. Non-supported Language (auto-fallback to Hebrew)

```bash
curl -X POST "https://YOUR_API_GATEWAY_URL/rag/query" \
  -H "Content-Type: application/json" \
  -d '{
        "userId": "64fabc12d9012f001234abcd",
        "sessionId": "web-987",
        "question": "Quels exercices doux puis-je faire pendant une semaine de récupération?",
        "stream": false
      }'
```

Expected behavior: the answer begins with the fallback notice and continues in Hebrew with `[^i]` citations.

### 4. Content Ingestion (admin only)

```bash
curl -X POST "https://YOUR_API_GATEWAY_URL/rag/ingest" \
  -H "Content-Type: application/json" \
  -d '{
        "adminUserId": "64fa0000d9012f0098765432",
        "userId": "64fabc12d9012f001234abcd",
        "sourceId": "post-run-guide",
        "chunks": [
          {
            "id": "post-run-guide-1",
            "text": "Perform light dynamic stretches such as leg swings and walking lunges for 5-7 minutes to maintain mobility.",
            "metadata": { "lang": "en", "tags": ["mobility", "running"] }
          },
          {
            "id": "post-run-guide-2",
            "text": "Refuel within 60 minutes with carbohydrates and 20-30 grams of protein to support glycogen replenishment and repair.",
            "metadata": { "lang": "en", "tags": ["nutrition", "recovery"] }
          }
        ]
      }'
```
