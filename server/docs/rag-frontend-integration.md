# Frontend Integration Guide: Fitness RAG Chatbot

This guide explains how client applications integrate with the Lambda-backed RAG chatbot, including payload formats, streaming tips, and how to surface citations and notices to end users.

## Endpoints

| Method & Path      | Purpose                                                                               |
| ------------------ | ------------------------------------------------------------------------------------- |
| `POST /rag/query`  | Submit a user question and receive either a JSON payload or a streaming SSE response. |
| `POST /rag/ingest` | Admin-only ingestion of curated context chunks for a user’s private corpus.           |

Attach the same authentication headers required by the rest of your API Gateway stack (JWT, API key, etc.). Every query must supply a `userId`; the backend enforces per-user rate limits entirely in MongoDB.

## Query Request Payload

```json
{
  "userId": "<mongo-id>",
  "sessionId": "optional-client-session",
  "question": "string",
  "stream": true,
  "topK": 5,
  "threshold": 0.55,
  "cacheThreshold": 0.9,
  "metadata": { "goal": "hypertrophy" }
}
```

Field notes:

- `stream` toggles Server-Sent Events (default `false`).
- `topK`, `threshold`, and `cacheThreshold` override the environment defaults when present.
- `metadata` passes through to Pinecone filters alongside the built-in user/language filters.

The controller extracts these fields and forwards them to `RagAnswerService` for processing.【F:server/src/controllers/ragController.ts†L27-L69】 Missing `userId` or `question` produces HTTP 400.【F:server/src/rag/answer.service.ts†L196-L205】

## Non-Streaming Responses

When `stream` is `false`, the Lambda returns JSON:

```json
{
  "reason": "ANSWER_GENERATED",
  "answer": "...text with [^1] markers...",
  "citations": [{ "marker": "[^1]", "sourceId": "plan-1", "page": 2, "score": 0.78 }],
  "usage": { "promptTokens": 123, "completionTokens": 98, "totalTokens": 221 },
  "cached": false,
  "notice": "optional fallback notice",
  "language": "he"
}
```

- `reason` reveals the flow branch (`CACHE_HIT`, `NOT_FITNESS`, `RETRIEVAL_EMPTY`, `ANSWER_GENERATED`).【F:server/src/rag/types.ts†L5-L49】
- `answer` already contains inline `[^i]` markers that correspond to the `citations` array order.【F:server/src/rag/answer.service.ts†L389-L455】
- `notice` surfaces only when the service defaulted to Hebrew because the input language was unsupported.【F:server/src/rag/answer.service.ts†L396-L430】
- `language` echoes the detected/target language for display logic.【F:server/src/controllers/ragController.ts†L55-L63】

Rate-limit violations respond with HTTP 429 and `{ "message": "rate limit exceeded" }`.【F:server/src/rag/answer.service.ts†L55-L90】

## Streaming with Server-Sent Events

Set `stream: true` to receive newline-delimited SSE frames (`Content-Type: text/event-stream`).【F:server/src/controllers/ragController.ts†L34-L53】 Client responsibilities:

1. Open a streaming `fetch`/`EventSource` request and read the response body incrementally.
2. For each `data: ...` line, JSON-decode the payload.
3. Append `payload.delta` tokens to the transcript.
4. Watch for the final trailer where `payload.done === true`; extract `citations` and `usage`, then close the stream.

Example frame sequence:

```
data: {"delta":"השאלה זוהתה..."}

data: {"delta":"● בצעו..."}

data: {"done":true,"citations":[{"marker":"[^1]","sourceId":"plan-1"}],"usage":{"promptTokens":120,"completionTokens":95,"totalTokens":215}}
```

Cache hits stream the cached answer followed by the trailer—no `usage` object is present because OpenAI was not called.【F:server/src/rag/answer.service.ts†L216-L269】 If retrieval scores never cross the threshold, the service emits a localized “I don’t know from the provided context.” message and ends the stream immediately.【F:server/src/rag/answer.service.ts†L331-L386】

## Language Policy for Frontend UX

Language detection prefers Hebrew or English and falls back to Hebrew (with a notice) for all other inputs.【F:server/src/rag/language.ts†L1-L30】 When a fallback occurs, the service prepends the policy notice to streamed and buffered answers and returns it in `notice` as well.【F:server/src/rag/answer.service.ts†L396-L430】 UI tips:

- Display the notice prominently (banner or toast).
- Render the answer verbatim—no extra translation or marker stripping.
- Keep `[^…]` markers in place so they align with the citations list.

## Citations & Context

Citations include `marker`, `sourceId`, optional `page`, and the Pinecone `score`. They are generated in the same order as the trimmed context blocks sent to OpenAI.【F:server/src/rag/answer.service.ts†L389-L407】【F:server/src/rag/answer.service.ts†L441-L455】 Present them alongside the answer (e.g., numbered list) and map `sourceId` to human-friendly titles from your content catalog.

## Semantic Cache Awareness

Before retrieval, the service embeds the normalized question and queries the semantic cache namespace. A match above the configured threshold returns immediately with `reason: "CACHE_HIT"`, `cached: true`, and the stored citations—no new tokens spent.【F:server/src/rag/answer.service.ts†L202-L269】 Consider showing a subtle “answered from cache” hint in the UI when `cached` is true.

## Error Handling Summary

| Status | Cause                                                   | UI Suggestion                          |
| ------ | ------------------------------------------------------- | -------------------------------------- |
| 400    | Missing `userId`/`question` or malformed ingest payload | Prompt user to correct the form.       |
| 403    | Ingest attempted without admin privileges               | Show “Admins only” message.            |
| 429    | Rate limit exceeded in the current 60s window           | Display a cooldown timer or retry CTA. |
| 500    | Unexpected backend failure                              | Offer retry and log the incident.      |

Source references: validation and rate limit enforcement in `RagAnswerService`, admin guard in `RagController`.【F:server/src/rag/answer.service.ts†L55-L90】【F:server/src/rag/answer.service.ts†L528-L559】【F:server/src/controllers/ragController.ts†L18-L101】

All responses include the standard API headers; streaming adds SSE headers for EventSource compatibility.【F:server/src/controllers/ragController.ts†L44-L53】

## Ingestion Workflow (Admin UI)

Admins provide `userId`, `sourceId`, `lang`, visibility, and chunk payloads. The service normalizes whitespace, deduplicates via SHA-256 hashes, stores chunks in Mongo, and mirrors embeddings into the Pinecone `corpus` namespace before returning `{ "inserted": <count> }`.【F:server/src/rag/answer.service.ts†L536-L598】

## Observability Hooks

Each query logs a structured event containing reason, language, latency, retrieved IDs, and token usage, and persists a Mongo trace for offline evaluation.【F:server/src/rag/answer.service.ts†L237-L515】 Align your client telemetry (e.g., session IDs) with the `sessionId` field to simplify cross-system debugging.

## Implementation Checklist

1. **Authentication:** Reuse the existing API auth headers for every request.
2. **Request Builder:** Capture the question, `userId`, optional filters, and desired streaming mode.
3. **Streaming Parser:** Implement an SSE reader that yields `delta` tokens and final trailer metadata.
4. **UI Rendering:** Preserve the answer text with its `[^…]` markers, show `notice` when provided, and render citations alongside the reply.
5. **Error UX:** Handle 4xx/5xx responses gracefully (cooldown timers, retry flows, support links).
6. **Admin Tools:** Offer a simple form or script for `/rag/ingest` that batches curated chunks and reports inserted counts.

Following these steps keeps the frontend aligned with semantic caching, HE/EN language policy, and the chatbot’s citation contract.
