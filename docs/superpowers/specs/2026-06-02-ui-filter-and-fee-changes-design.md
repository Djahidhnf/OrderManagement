# UI Filter and Fee Changes Design

**Date:** 2026-06-02  
**Scope:** 3 independent UI changes across order creation form and main orders table

---

## Change 1 — Delivery Fee Editable by Vendeuse

**File:** `src/app/order/page.tsx`

**Problem:** Fee select is currently `disabled={user?.role === "Vendeuse"}`, blocking Vendeuse from setting a delivery fee.

**Fix:** Remove the `disabled` attribute from the fee `<select>` only. The delivery person `<select>` keeps `disabled={user?.role === "Vendeuse"}` — Vendeuse sets the fee amount but cannot assign a specific driver.

**No API changes needed.** The fee value is already submitted normally via `deliveryFee` state.

---

## Change 2 — Move Order Count to Page Header

**Files:** `src/app/page.tsx`, `Components/OrdersFilter.tsx`

**Problem:** Order counts appear as badges on filter buttons. Requirement: remove from buttons, show total today's count as a header above the page.

**Design:**
- `page.tsx`: Add `<h2>Commandes d'aujourd'hui: {todayCounts[''] ?? 0}</h2>` above the flex row containing `<OrderFilter>` and other controls.
- `OrdersFilter.tsx`: Remove `counts` prop usage. Strip `fmt()` function and badge rendering from buttons. The `counts` prop and its type can be removed entirely from the component signature.
- `page.tsx`: Stop passing `counts={todayCounts}` to `<OrderFilter>`. The `todayCounts` state and its fetch effect remain — the total count is still needed for the header.

---

## Change 3 — Delivery User Filter (Client-Side)

**Files:** `src/app/page.tsx`, `Components/TableRow.tsx`

**Design:**

### Data fetching (`page.tsx`)
- Add `useEffect` to fetch `/api/users` on mount (same endpoint used in `order/page.tsx`).
- Derive `livreurs` from the response: `users.filter(u => u.role === "Livreur")`.
- Add `deliveryFilter` state: `useState<number | null>(null)`.

### Filter UI (`page.tsx`)
- Add a `<select>` in the controls row next to `<DateSearch>` / `<PrintOrders>` / `<Scan>`.
- Options: a default "Tous les livreurs" (`value=""`) plus one `<option>` per Livreur.
- `onChange`: set `deliveryFilter` to `Number(e.target.value) || null`.

### Filtering logic (`TableRow.tsx`)
- Add `deliveryFilter?: number | null` to props.
- Replace current `orders.filter(o => !filter || o.status === filter)` with:
  ```ts
  orders.filter(o =>
    (!filter || o.status === filter) &&
    (!deliveryFilter || o.delivery_id === deliveryFilter)
  )
  ```
- Both filters compose — status + delivery can be active simultaneously.

### No API changes
All filtering is client-side on the already-loaded `orders` array.

---

## Out of Scope

- Pagination or server-side delivery filtering
- Any changes to salary logic, order status, or other API routes
