# Auth JWT Implementation

## Overview

Implemented foundational authentication hardening for a future multi-tenant platform:

- Added JWT-style short-lived access tokens with minimal identity claims (`userId`, `role`, optional `sessionId`).
- Added refresh-token session creation, validation, and revocation using hashed opaque refresh tokens.
- Added `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me` routes (wired through existing users lambda handler).
- Hardened login to normalize emails and return generic invalid-credentials errors.
- Added safe user projection and status-aware checks (`hasAccess`, invite/onboarding gate).

Out of scope and intentionally not implemented:

- Full RBAC/permissions system, trainer scoping, ownership checks, plan limits, and asset authorization.

## Auth Flow

1. **Login (`POST /auth/login`)**
   - Validate credentials via existing `AuthService` and `PasswordsService`.
   - Create short-lived access token.
   - Create hashed refresh session (`type: auth_refresh`) with expiry/revocation metadata.
2. **Access token usage**
   - Bearer token sent in `Authorization`.
   - Verified signature + expiration.
   - User loaded from DB in `/auth/me` for status/source-of-truth checks.
3. **Refresh (`POST /auth/refresh`)**
   - Refresh token hashed and looked up in DB.
   - Reject invalid/revoked/expired token or inactive/missing user.
   - Return fresh access token.
4. **Logout (`POST /auth/logout`)**
   - Revoke refresh session in DB (`revokedAt`).
5. **Current user (`GET /auth/me`)**
   - Verify access token and load current user from DB.
   - Return safe user shape only.

## Endpoints

- `POST /auth/login`: logs user in and returns `{ accessToken, refreshToken, sessionId, user }`.
- `POST /auth/refresh`: returns `{ accessToken, user }` after refresh validation.
- `POST /auth/logout`: revokes refresh token session.
- `GET /auth/me`: returns safe user profile for valid access token.

## Middleware

No standalone `requireAuth`/`requireRole` middleware module was introduced yet; equivalent logic is currently applied inside `/auth/me` flow via token extraction + verification + DB user lookup. This is a known follow-up task.

## Token Design

- Access tokens: signed and verified with `jsonwebtoken` using `HS256`.
- Access signing secret: `JWT_ACCESS_SECRET`, required and must be at least 32 characters long.
- Access token TTL: `JWT_ACCESS_EXPIRES_IN`, default `15m`. Values like `15m`, `1h`, and `7d` are supported, and bare numeric strings like `900` are treated as seconds.
- Refresh strategy: opaque random token from `crypto.randomBytes(48).toString("hex")`, hashed via SHA-256 before persistence.
- Authorization truth remains DB-backed (user existence/status checked on authenticated flows).

## Environment Variables

- `JWT_ACCESS_SECRET` (required): HMAC secret for access token signing.
- `JWT_ACCESS_EXPIRES_IN` (optional, default `15m`): access token TTL (supports `m/h/d` or seconds).
- `JWT_REFRESH_EXPIRES_IN_MS` (optional, default 30 days in ms): refresh session TTL.

## User Status Rules

Current implementation maps:

- `hasAccess=false` => blocked for login/refresh/me.
- `onboardingStep!==completed` => blocked on normal login (pending invite equivalent gate).

## Security Decisions

- Generic invalid credential messaging for unknown user/wrong password.
- Password verification stays in `PasswordsService` using bcrypt.
- Safe user projection strips sensitive fields.
- Refresh token revocation persisted in DB.
- Password hashes/token hashes are never returned in auth responses.

## Tests

Added unit tests for:

- access token signing/verification
- malformed token rejection
- expired token rejection
- refresh token hashing determinism

## Future Extension Notes

Next steps should add reusable middleware modules:

- `requireAuth`
- `requireRole`
- then extension to `requirePermission`, `requireTrainerScope`, `requireResourceOwnership`, and plan checks.

## Follow-up Work

- Add first-class `status` field (`active/inactive/suspended/pending_invite`) on user model.
- Implement refresh rotation (not only validation + revoke).
- Add comprehensive integration tests covering endpoint-level login/refresh/logout/me scenarios.

## Access Token Transport (Bearer Header)

- Access tokens must be sent only via HTTP header:
  - `Authorization: Bearer <accessToken>`
- Header parsing supports both key variants because runtimes normalize casing differently:
  - `Authorization`
  - `authorization`
- Access tokens sent in query params or request body are rejected/ignored.

### Backend Extraction Flow

1. Read request headers.
2. Call `extractBearerToken(headers)` from `src/utils/utils.ts`.
3. Validate strict format `Bearer <token>`.
4. Verify token via `JwtAuthService.verifyAccessToken(token)`.
5. Use verified claims (`userId`, `role`, `sessionId`) to load current DB user and continue.

If header is missing/malformed, not Bearer, token is invalid/expired, or verification fails: return `401 Unauthorized`.

### Example Protected Request

```http
GET /auth/me HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Refresh Token Behavior

- Refresh tokens are **not** access tokens and are not sent as Bearer access tokens.
- Refresh tokens are used only with `POST /auth/refresh`.
- Refresh endpoint returns a newly issued access token (and rotated refresh token), then subsequent protected requests must send the new access token in the Authorization Bearer header.

## Security Notes

- Never log raw access tokens or refresh tokens.
- Use HTTPS in production so Authorization headers are protected in transit.
- Missing/malformed/expired/invalid access tokens return `401 Unauthorized`.

## Current Endpoint Behavior

- `POST /auth/login`: issues access + refresh tokens.
- `POST /auth/refresh`: validates refresh token and returns new access token (+ rotated refresh token).
- `POST /auth/logout`: revokes refresh token session.
- `GET /auth/me` (protected): requires `Authorization: Bearer <accessToken>`.

## Frontend Integration Guide

This section is the implementation contract for frontend agents and clients.

### Auth Modes

The preferred auth mode is JWT Bearer auth:

```http
Authorization: Bearer <accessToken>
```

Legacy API key auth is still accepted for backward compatibility:

```http
X-API-KEY: <legacy-api-key>
```

JWT auth wins when both `Authorization: Bearer <accessToken>` and `X-API-KEY` are present. Frontend clients should not send both except during controlled migration testing. `X-API-KEY` support is temporary and should not be used for new frontend work.

### Public And Protected Routes

Public auth routes:

- `POST /auth/login`
- `POST /auth/refresh`

Protected auth routes:

- `POST /auth/logout`
- `GET /auth/me`

Other protected API routes should send the same Bearer access token header. Do not send `userId`, `role`, permissions, trainer IDs, client IDs, or ownership claims as trusted auth data in request body or query params. Client-provided IDs may be used as route/resource inputs, but backend services must validate authorization server-side.

### Token Storage

Recommended frontend storage:

- Keep `accessToken` in memory when possible.
- Persist the refresh token only if the product requires session restore after reload.
- If persistence is required, prefer the most restrictive storage available in the app platform.
- Never store tokens in logs, analytics payloads, URLs, or error reporting metadata.

Browser clients should avoid putting access tokens in `localStorage` when a safer app-specific storage option is available. If this app currently uses `localStorage`, isolate token access behind one auth storage helper so it can be replaced later.

### Request Contract

Protected requests must include only the access token:

```ts
const response = await fetch(url, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

Access tokens must never be sent in:

- query params
- request body
- cookies unless a future backend cookie auth design explicitly supports it
- custom headers other than `Authorization`

Refresh tokens must never be sent as Bearer tokens. Use refresh tokens only with `POST /auth/refresh`.

### Endpoint Shapes

Login request:

```ts
POST /auth/login
{
  "email": "user@example.com",
  "password": "password"
}
```

Login response:

```ts
{
  "accessToken": "jwt-access-token",
  "refreshToken": "opaque-refresh-token",
  "sessionId": "session-id",
  "user": {
    "_id": "user-id",
    "email": "user@example.com",
    "role": "trainer"
  }
}
```

Refresh request:

```ts
POST /auth/refresh
{
  "refreshToken": "opaque-refresh-token"
}
```

Refresh response:

```ts
{
  "accessToken": "new-jwt-access-token",
  "refreshToken": "new-opaque-refresh-token",
  "user": {
    "_id": "user-id",
    "email": "user@example.com",
    "role": "trainer"
  }
}
```

If the backend returns no new `refreshToken`, keep the existing refresh token. If it returns a new `refreshToken`, replace the stored refresh token immediately.

Logout request:

```ts
POST /auth/logout
Authorization: Bearer <accessToken>

{
  "refreshToken": "opaque-refresh-token"
}
```

Logout response can be treated as success if the HTTP status is `2xx`. After logout, clear all local auth state even if the network request fails.

Current user request:

```http
GET /auth/me
Authorization: Bearer <accessToken>
```

Current user response:

```ts
{
  "user": {
    "_id": "user-id",
    "email": "user@example.com",
    "role": "trainer"
  }
}
```

Frontend code should tolerate additional safe user fields, but must not require password hashes, token hashes, or internal auth secrets.

### App Startup Flow

On app startup:

1. Load any persisted refresh token.
2. If an access token is already available in memory, call `GET /auth/me`.
3. If there is no access token but a refresh token exists, call `POST /auth/refresh`.
4. Store the returned access token and optional rotated refresh token.
5. Call `GET /auth/me` to hydrate the user profile if the refresh response does not already include enough user data.
6. If refresh fails, clear auth state and show the logged-out experience.

Do not decode JWTs on the frontend as the source of truth for authorization. The frontend may decode a token only for non-security UX hints, such as estimating expiration time.

### 401 And Refresh Retry

For protected API requests:

1. Send `Authorization: Bearer <accessToken>`.
2. If the response is `401 Unauthorized`, pause the failed request.
3. If a refresh request is not already running, call `POST /auth/refresh`.
4. If refresh succeeds, update stored tokens and retry the original request once.
5. If refresh fails, clear auth state and redirect/show login.

Only retry the original request once after refresh. Do not retry indefinitely.

When multiple requests receive `401` at the same time, use a single shared refresh operation and queue retries behind it. Do not send many refresh requests in parallel.

Treat `403 Forbidden` differently from `401 Unauthorized` if the backend uses it:

- `401`: unauthenticated, expired, malformed, or invalid token; refresh or log out.
- `403`: authenticated but not allowed; do not refresh automatically.

### Fetch Wrapper Example

```ts
type AuthTokens = {
  accessToken?: string;
  refreshToken?: string;
};

let tokens: AuthTokens = {};
let refreshPromise: Promise<void> | null = null;

async function refreshAccessToken() {
  if (!tokens.refreshToken) throw new Error("Missing refresh token");

  const response = await fetch("/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  });

  if (!response.ok) throw new Error("Refresh failed");

  const body = await response.json();
  tokens.accessToken = body.accessToken;

  if (body.refreshToken) {
    tokens.refreshToken = body.refreshToken;
  }
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  if (tokens.accessToken) {
    headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  }

  let response = await fetch(input, { ...init, headers });

  if (response.status !== 401) {
    return response;
  }

  refreshPromise ??= refreshAccessToken().finally(() => {
    refreshPromise = null;
  });

  await refreshPromise;

  const retryHeaders = new Headers(init.headers);
  retryHeaders.set("Authorization", `Bearer ${tokens.accessToken}`);

  response = await fetch(input, { ...init, headers: retryHeaders });

  return response;
}
```

The frontend implementation should adapt this pattern to the app's existing API client instead of duplicating request logic throughout components.

### Frontend Security Rules

- Do not log raw access tokens, refresh tokens, or API keys.
- Do not put tokens in URLs.
- Do not include tokens in analytics events.
- Do not trust role/permission values from frontend state for backend authorization.
- Do not send refresh tokens to normal protected API routes.
- Do not use `X-API-KEY` for new frontend code.
- Clear tokens on logout, refresh failure, or repeated `401`.
- Use HTTPS in production.

### API Gateway Authorizer Boundary

The API Gateway Lambda authorizer authenticates identity only. It validates access-token signature and expiration and passes string context to target Lambdas:

```ts
event.requestContext.authorizer.userId;
event.requestContext.authorizer.role;
event.requestContext.authorizer.sessionId;
event.requestContext.authorizer.authMode;
```

The authorizer does not connect to MongoDB and does not perform full RBAC, trainer/client scoping, resource ownership, or plan-limit checks. Those checks belong in target Lambdas/services/middleware where route and resource context is available.
