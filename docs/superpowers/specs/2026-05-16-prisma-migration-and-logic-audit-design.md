# Design: Prisma Migration + Logic Audit

**Date:** 2026-05-16  
**Scope:** Replace raw `pg` pool queries with Prisma Client across all API routes, then audit all routes for logic and security issues.  
**Approach:** Migrate first (mechanical), audit second (findings-driven).

---

## Part 1: Prisma Migration

### 1.1 Schema & Setup

1. Run `prisma db pull` to introspect the live PostgreSQL database. This regenerates `prisma/schema.prisma` with:
   - Correct `datasource` and `generator` blocks
   - Accurate enum values including French characters and spaces (`'En route'`, `'Livré'`, `'Annulé'`) with `@map` annotations
   - Any columns present in the real DB but missing from the current schema (e.g., `active` on `users`)

2. Run `prisma generate` to build the typed Prisma Client.

3. `lib/prisma.ts` is already written correctly as a Next.js-safe singleton — no changes needed. It becomes the sole DB access point.

4. Delete `lib/db.ts` after all pool references are removed.

### 1.2 Files to Migrate

| File | Methods | Notes |
|---|---|---|
| `lib/auth.ts` | `getUser()` | Simple user lookup by id |
| `api/login/route.ts` | POST | User lookup + bcrypt compare |
| `api/orders/route.ts` | GET, POST, DELETE | GET has dynamic date + role filters |
| `api/orders/[id]/route.ts` | GET, PATCH | PATCH has dynamic partial update |
| `api/orders/notes/route.ts` | GET | Single-field lookup |
| `api/orders/print/route.ts` | GET | Date-filtered query with JOIN |
| `api/orders/search/[id]/route.ts` | GET | Dynamic search (by id or phone) + role filter |
| `api/users/route.ts` | GET, POST | GET returns all users |
| `api/users/[id]/route.ts` | GET, PATCH, DELETE | PATCH has dynamic partial update |
| `api/users/salary/route.ts` | GET | Window function — use `$queryRaw` |
| `api/users/total/route.ts` | GET | Simple aggregate |

**Unaffected files** (no pool usage):
- `api/orders/barcode/route.ts` — bwip-js only
- `api/check-session/route.ts` — cookie reads only
- `api/logout/route.ts` — cookie clears only

### 1.3 Special Cases

**`TO_CHAR` date formatting**  
Queries using `TO_CHAR(order_date, 'DD/MM/YYYY HH24:MI')` return a `formatted_date` string.  
Replace with JavaScript formatting after fetch:
```ts
const formatted = date.toLocaleString('fr-FR', {
  day: '2-digit', month: '2-digit', year: '2-digit',
  hour: '2-digit', minute: '2-digit'
});
```
Applied in: `api/orders/route.ts`, `api/orders/[id]/route.ts`, `api/orders/search/[id]/route.ts`.

**Window function in `api/users/salary/route.ts`**  
Uses `SUM(...) OVER ()` — not supported by Prisma Client.  
Keep as `prisma.$queryRaw` with a tagged template literal. All other routes use the Prisma API.

**Notes append pattern**  
Current SQL: `notes = COALESCE(notes, '') || $1`  
Replace with: fetch current `notes` via `prisma.order.findUnique`, append in JS (`(existing ?? '') + newNote`), then `prisma.order.update`.

**Dynamic partial updates**  
`PATCH /orders/[id]` and `PATCH /users/[id]` build SQL dynamically via `fields[]`/`values[]` arrays.  
Replace with a conditional Prisma `data` object:
```ts
const data = {
  ...(client_name !== undefined && { clientName: client_name }),
  ...(status !== undefined && { status }),
  // ...etc
};
await prisma.order.update({ where: { id: orderId }, data });
```

---

## Part 2: Logic Audit

After migration, audit every route against the following categories. Findings are fixed inline as discovered.

### 2.1 Audit Categories

| Category | Description |
|---|---|
| **Missing auth guards** | Routes that read/write data without verifying `userId` or `role` cookie |
| **Role escalation** | Whether role checks can be bypassed or are incomplete |
| **Salary side-effects** | Update/delete paths that should reverse salary changes made at order creation but don't |
| **Password exposure** | Routes returning the `password` hash in responses |
| **User creation access** | Whether unauthenticated callers can POST to `/api/users` |
| **Status transition logic** | Whether per-role status rules are consistent and correct |

### 2.2 Known Candidates (spotted during design)

These are confirmed issues to fix during the audit — not an exhaustive list:

1. **`GET /api/orders/notes`** — No auth check. Any caller can read order notes.
2. **`GET /api/orders/[id]`** — Auth check is commented out. Any caller can read any order.
3. **`GET /api/orders/print`** — Only checks `role` cookie; doesn't verify `userId`, so an unauthenticated request with a forged `role` cookie passes.
4. **`GET /api/users/salary`** — No auth check.
5. **`POST /api/users`** — No role check; any authenticated (or unauthenticated) caller can create a user.
6. **`GET /api/users`** — Returns `password` hash for every user.
7. **Salary not reversed on order delete** — `DELETE /api/orders` removes the order but does not subtract `benefit` from the seller's salary or `fee` from the delivery person's salary.
8. **Salary not adjusted on order edit** — `PATCH /api/orders/[id]` can change `benefit` and `fee` values but does not update salaries.
9. **Login `active` check** — `if (!result.rows[0].active)` will be `undefined` (falsy) if the `active` column doesn't exist or is NULL, blocking all logins. Confirm column exists after `prisma db pull`.

### 2.3 Audit Approach

Go route-by-route in this order: auth routes → order routes → user routes. For each route:
1. Verify session/role guard is present and correct
2. Check all data mutations for side-effect correctness (salary, status)
3. Check response payloads for sensitive field exposure
4. Fix issues in place, one route at a time

---

## Out of Scope

- Writing automated tests (decided: code review only)
- Changing DB schema (enums, columns) beyond what `prisma db pull` generates
- Frontend changes
- Adding new features
