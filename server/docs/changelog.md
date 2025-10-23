# RAG Service Changelog

## 2025-10-22 — Daily Quota & Pause Guards

### Backend Summary
- Added a Mongo-backed per-user daily quota counter enforced ahead of the existing sliding-window limiter.
- Introduced a Mongo-configurable pause switch with a 60s in-memory cache to short-circuit queries while maintenance is underway.
- Surfaced structured error payloads for quota exhaustion (`code: "DAILY_LIMIT_REACHED"`) and system pauses (`code: "SERVICE_PAUSED"`).

### Frontend Implementation Notes
1. **Daily quota handling**
   - Treat HTTP 429 responses that include `code: "DAILY_LIMIT_REACHED"` as a hard stop for the rest of the UTC day.
   - Read the `limit` integer and `resetAt` ISO timestamp from the payload; display both in your UI (banner, modal, or toast).
   - Disable submission controls until `resetAt` passes or the backend resumes normal responses.
2. **System pause handling**
   - For HTTP 503 responses carrying `code: "SERVICE_PAUSED"`, show the returned `message` verbatim to the user.
   - Hide or disable the ask interface and provide an optional passive retry button.
   - Polling is optional; a manual retry after the pause is lifted is sufficient.
3. **Telemetry**
   - Log these states client-side (e.g., analytics events `rag.daily_quota_hit` and `rag.service_paused`) with the associated user/session identifiers to aid support triage.

These steps keep the frontend in lockstep with the new operational guardrails without altering the existing streaming or caching flows.
