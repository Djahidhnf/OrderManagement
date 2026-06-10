# Vendeuse Search-All-Orders Design

**Date:** 2026-06-10
**Scope:** Allow `Vendeuse` users to search all orders (not just their own), while preventing them from editing, deleting, or adding notes to orders they don't own.

---

## Background

`Vendeuse` users currently cannot search other users' orders: `GET /api/orders/search/[id]` filters results to `seller_id = userId` for this role. The goal is to lift that restriction so a Vendeuse can find any order by ID/phone.

Two existing actions available to Vendeuse have **no ownership check** today and are only protected incidentally by the search filter:

- `PATCH /api/orders/[id]` — Vendeuse may attach a note (`note` field) to any order ID.
- `DELETE /api/orders?id=...` — Vendeuse may delete any order with `status === 'Nouveau'`.

Once search is opened up, these become a real access-control gap: a Vendeuse could discover another seller's order ID via search and then delete it or add notes to it directly via the API. Full edit ("Modifier" → `/order/[slug]`) is already blocked for Vendeuse on all orders via the page-level `authorized` check (allowed roles: `Admin`, `Assistante`, `Confirmatrice`), so no change is needed there for the API/page itself — only the dead UI button needs hiding.

---

## Change 1 — Search API: Remove Vendeuse Seller Filter

**File:** `src/app/api/orders/search/[id]/route.ts`

**Current:**
```ts
const roleWhere: any = {};
if (role === 'Vendeuse') roleWhere.seller_id = Number(userId);
else if (role === 'Livreur') roleWhere.delivery_id = Number(userId);
```

**New:** Remove the `Vendeuse` branch entirely. `Livreur` filtering is unchanged. With no `roleWhere` entry, Vendeuse search behaves like Admin's — matches across all sellers.

```ts
const roleWhere: any = {};
if (role === 'Livreur') roleWhere.delivery_id = Number(userId);
```

---

## Change 2 — PATCH Ownership Check (Notes)

**File:** `src/app/api/orders/[id]/route.ts`

**Current Vendeuse guard:**
```ts
if (role === 'Vendeuse') {
  if (note === undefined || status !== undefined) {
    return NextResponse.json({ error: 'Denied' }, { status: 403 });
  }
}
```

**New:** Add an ownership check using `currentOrder.seller_id` (already fetched earlier in the handler):

```ts
if (role === 'Vendeuse') {
  if (note === undefined || status !== undefined) {
    return NextResponse.json({ error: 'Denied' }, { status: 403 });
  }
  if (Number(currentOrder?.seller_id) !== Number(userId)) {
    return NextResponse.json({ error: 'Denied' }, { status: 403 });
  }
}
```

This blocks notes (and any other field-edit attempt smuggled in the same request) on orders the Vendeuse doesn't own, while leaving notes on their own orders working as before.

---

## Change 3 — DELETE Ownership Check

**File:** `src/app/api/orders/route.ts`

**Current:**
```ts
if (role !== 'Admin' && !(role === 'Vendeuse' && order.status === 'Nouveau')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**New:** Require seller ownership for the Vendeuse branch:

```ts
const vendeuseCanDelete = role === 'Vendeuse'
  && order.status === 'Nouveau'
  && Number(order.seller_id) === Number(userId);

if (role !== 'Admin' && !vendeuseCanDelete) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## Change 4 — Frontend: Hide Actions That Would Be Denied

**Files:** `src/app/page.tsx`, `Components/TableRow.tsx`, `Components/MoreButton.tsx`

1. `page.tsx`: `/api/check-session` already returns `role`; capture it alongside `userId` and pass both `userId` and `role` down to `TableRow`.
2. `TableRow.tsx`: accept `userId` and `role` props, forward to `MoreButton` per row.
3. `MoreButton.tsx`: accept `userId` and `role` props. When `role === 'Vendeuse'`:
   - Hide "Modifier" entirely (already non-functional for Vendeuse on any order — page-level gate blocks it; this just removes the dead button).
   - Show "Remarque" and "Supprimer" only when `Number(order.seller_id) === Number(userId)`.
   - "Imprimer" remains visible always (read-only, no API mutation).
   - Other roles: no change to the menu.

---

## Out of Scope

- No change to `Searchbar.tsx` itself — it just calls the search endpoint, which now returns broader results.
- No change to `/api/orders` (main list) role filtering — Vendeuse's default order list (today's/15-day view) still shows only their own orders, per existing behavior. This change only affects the search-by-ID/phone path.
- No change to `Livreur`, `Admin`, `Assistante`, `Confirmatrice` behavior anywhere.
- Vendeuse still cannot reach the full edit form (`/order/[slug]`) for any order, own or others' — pre-existing restriction, unchanged.
