# Workout Plan History — Server Endpoints to Implement

The admin panel now ships a Plan History feature: every workout-plan
change preserves the previous plan instead of overwriting it, the
trainer can browse history, and restore an old plan with one click.

The schema additions are already on `feature/avihu-new-design` (see
`workoutHistoryFields` + `workoutHistoryValidationFields` in
`server/src/models/workoutPlanModel.ts`). All fields are optional and
additive — no migration needed.

**Three new endpoints are required.** All operate on the existing
`workoutPlans` collection (no second collection).

---

## Core invariant

> **At most ONE document per `userId` has `archivedAt = null` at any
> moment.** That's the active plan the mobile app already reads.

A compound index `{ userId: 1, archivedAt: 1 }` is added in the schema
file. The mobile app continues to read via the existing endpoint —
just add `archivedAt: null` to that query so historical docs are
excluded.

```ts
// existing read, updated:
WorkoutPlan.findOne({ userId, archivedAt: null });
```

---

## Endpoint 1 — GET `/workoutPlans/history?userId=...`

Returns all archived (non-active) plan docs for the user.

```ts
const history = await WorkoutPlan.find({
  userId: req.query.userId,
  archivedAt: { $ne: null },
}).sort({ assignedAt: -1 });

return res.json({ data: history });
```

**Used by:** the "Plan history" panel in the trainee profile.

---

## Endpoint 2 — POST `/workoutPlans/swap?userId=...`

Atomically archive the current active plan + insert a new active one.

Request body: `ICompleteWorkoutPlan` (the new plan) — may include the
optional history fields `temporaryUntil`, `assignmentLabel`,
`assignedBy`, `restoreToPlanId`.

```ts
const session = await mongoose.startSession();
await session.withTransaction(async () => {
  // 1. Find the current active plan (if any).
  const current = await WorkoutPlan.findOne({ userId, archivedAt: null }).session(session);

  // 2. Build the new active plan from the request body.
  const newDoc = new WorkoutPlan({
    ...req.body,
    userId,
    archivedAt: null,
    assignedAt: new Date(),
  });
  await newDoc.save({ session });

  // 3. Archive the old one (if it existed).
  if (current) {
    current.archivedAt = new Date();
    current.replacedByPlanId = newDoc._id;
    await current.save({ session });
  }
});

return res.json({ data: newDoc });
```

**Used by:** the "החלפת תוכנית לזמן מוגבל" button.

**Note**: if your Mongo deployment doesn't support transactions
(single-node replica set required), fall back to a sequential
`update + insert` — the race window is tiny and the worst case is
two active docs that the next read can fix with a `findOne().sort()`
tiebreaker. Document this trade-off either way.

---

## Endpoint 3 — POST `/workoutPlans/restore?userId=...&archivedPlanId=...`

Clones an archived plan back to active. Same atomic swap as #2 but
the new doc's body comes from the archived doc instead of the
request.

```ts
const session = await mongoose.startSession();
await session.withTransaction(async () => {
  const archived = await WorkoutPlan.findById(archivedPlanId).session(session);
  if (!archived || archived.userId !== userId) throw new Error("Not found");

  const current = await WorkoutPlan.findOne({ userId, archivedAt: null }).session(session);

  // Clone the archived doc as the new active one. We DO NOT undelete
  // the archived doc — that would silently mutate history. Always
  // create a fresh doc so the timeline stays append-only.
  const { _id, archivedAt, replacedByPlanId, temporaryUntil, restoreToPlanId, ...body } =
    archived.toObject();
  const newDoc = new WorkoutPlan({
    ...body,
    archivedAt: null,
    assignedAt: new Date(),
    assignedBy: req.body.assignedBy, // trainer doing the restore
    assignmentLabel: `שחזור: ${archived.assignmentLabel || ""}`.trim(),
  });
  await newDoc.save({ session });

  if (current) {
    current.archivedAt = new Date();
    current.replacedByPlanId = newDoc._id;
    await current.save({ session });
  }
});
```

**Used by:** the "שחזר" button on each history row + the banner
button on temporary plans.

---

## Permissions

Both `swap` and `restore` should respect existing trainer-on-user
authorization — the same check as the existing `updateWorkoutPlanByUserId`
endpoint. A sub-trainer can swap their own trainees' plans;
the main trainer can swap anyone they manage.

`assignedBy` should be stamped server-side from the authenticated
trainer's id (don't trust the client to set it).

---

## What the mobile app does

**Nothing.** The mobile app keeps calling `GET /workoutPlans/user`
exactly like today. Just ensure that endpoint filters
`archivedAt: null` so historical docs don't accidentally surface.

---

## Frontend hooks already in place

- `useWorkoutPlanApi.ts` — `getWorkoutPlanHistory`, `swapWorkoutPlan`, `restoreWorkoutPlan`
- `useWorkoutPlanHistoryQuery` — react-query for the history list
- `useSwapWorkoutPlan` / `useRestoreWorkoutPlan` — mutations w/ cache invalidation

Once the endpoints are live the UI lights up automatically — no
frontend changes needed on Mike's side.
