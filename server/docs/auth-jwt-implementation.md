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

- Access tokens: HMAC-signed JWT-compatible format (header.payload.signature) with `exp` claim and minimal identity claims.
- Refresh strategy: opaque random token, hashed via SHA-256 before persistence.
- Secrets: `JWT_ACCESS_SECRET`.
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
