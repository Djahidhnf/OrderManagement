# UI Filter and Fee Changes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three independent UI improvements — Vendeuse can set delivery fee, today's order count moves to a page header, and a delivery-user dropdown filters the orders table client-side.

**Architecture:** All changes are purely frontend. No API routes change. Tasks 1 and 2 are single/dual file edits. Task 3 fetches `/api/users` in `page.tsx` and threads a `deliveryFilter` prop through to `TableRow`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4

---

### Task 1: Remove `disabled` from fee select

**Files:**
- Modify: `src/app/order/page.tsx:200-206`

- [ ] **Step 1: Edit fee select — remove `disabled` prop**

In `src/app/order/page.tsx`, find the fee `<select>` around line 200:

```tsx
<select name="fee" id=""
className="w-full lg:w-[20%] bg-white px-2 h-8"
onChange={(e) => setDeliveryFee(Number(e.target.value))}
disabled={user?.role === "Vendeuse"}>
    <option value="">Tarif Livraison</option>
    <option value="500">500 DA</option>
    <option value="600">600 DA</option>
</select>
```

Replace with:

```tsx
<select name="fee" id=""
className="w-full lg:w-[20%] bg-white px-2 h-8"
onChange={(e) => setDeliveryFee(Number(e.target.value))}>
    <option value="">Tarif Livraison</option>
    <option value="500">500 DA</option>
    <option value="600">600 DA</option>
</select>
```

- [ ] **Step 2: Verify manually**

Run `npm run dev`. Log in as Vendeuse. Go to `/order`. Confirm:
- Fee select is **enabled** (not grayed out)
- Delivery person select is **still disabled** (still has `disabled={user?.role === "Vendeuse"}`)

- [ ] **Step 3: Commit**

```bash
git add src/app/order/page.tsx
git commit -m "feat: allow vendeuse to set delivery fee on order creation"
```

---

### Task 2: Move today's count to page header; strip counts from OrdersFilter

**Files:**
- Modify: `Components/OrdersFilter.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Rewrite OrdersFilter — remove `counts` prop and badge logic**

Replace the entire content of `Components/OrdersFilter.tsx` with:

```tsx
'use client'

type Props = {
  filter: string;
  setFilter: React.Dispatch<React.SetStateAction<string>>;
};

function OrderFilter({ filter, setFilter }: Props) {
  return (
    <ul className="flex lg:justify-between items-end w-full lg:w-120 gap-x-3 text-gray-400">
      <li className={`${filter === "" ? "text-white" : ""} cursor-pointer`}
      onClick={() => setFilter("")}>Tout</li>
      <li className={`${filter === "Nouveau" ? "text-white" : ""} cursor-pointer`}
      onClick={() => setFilter("Nouveau")}>Nouveaux</li>
      <li className={`${filter === "En route" ? "text-white" : ""} cursor-pointer`}
      onClick={() => setFilter("En route")}>En route</li>
      <li className={`${filter === "Livré" ? "text-white" : ""} cursor-pointer`}
      onClick={() => setFilter("Livré")}>Livré</li>
      <li className={`${filter === "Annulé" ? "text-white" : ""} cursor-pointer`}
      onClick={() => setFilter("Annulé")}>Annulé</li>
    </ul>
  );
}

export default OrderFilter;
```

- [ ] **Step 2: Add header and update OrderFilter usage in page.tsx**

In `src/app/page.tsx`, find the `return` block inside `HomeContent`. The current opening of the main content area looks like:

```tsx
<main className="text-white mx-5 h-screen pt-30 w-vw relative">

  <div className="flex flex-col lg:flex-row gap-y-5 lg:justify-between w-full">
    <OrderFilter filter={filter} setFilter={setFilter} counts={todayCounts} />
```

Replace with:

```tsx
<main className="text-white mx-5 h-screen pt-30 w-vw relative">

  <h2 className="text-white text-lg font-semibold mb-2">
    Commandes d'aujourd'hui: {todayCounts[''] ?? 0}
  </h2>

  <div className="flex flex-col lg:flex-row gap-y-5 lg:justify-between w-full">
    <OrderFilter filter={filter} setFilter={setFilter} />
```

- [ ] **Step 3: Verify manually**

Run `npm run dev`. Confirm:
- Header "Commandes d'aujourd'hui: N" appears above the filter row
- Filter buttons show no count badges
- Clicking filter buttons still toggles the status filter correctly
- Count in header reflects actual today's orders

- [ ] **Step 4: Commit**

```bash
git add Components/OrdersFilter.tsx src/app/page.tsx
git commit -m "feat: move today's order count to page header, strip counts from filter buttons"
```

---

### Task 3: Add client-side delivery user filter

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `Components/TableRow.tsx`

- [ ] **Step 1: Add state and user fetch to page.tsx**

In `src/app/page.tsx`, add two state declarations after the existing `useState` calls (after line 21 where `todayCounts` is declared):

```tsx
const [livreurs, setLivreurs] = useState<{id: number, username: string}[]>([]);
const [deliveryFilter, setDeliveryFilter] = useState<number | null>(null);
```

Then add a `useEffect` after the `fetchTodayCounts` effect (after the closing `}, [userId]);` around line 79):

```tsx
useEffect(() => {
  async function fetchLivreurs() {
    const res = await fetch('/api/users');
    if (!res.ok) return;
    const data = await res.json();
    setLivreurs(Array.isArray(data) ? data.filter((u: any) => u.role === 'Livreur') : []);
  }
  fetchLivreurs();
}, []);
```

- [ ] **Step 2: Add delivery filter select to the controls row**

In `src/app/page.tsx`, find the controls `<div>` containing the icon buttons:

```tsx
<div className="flex">
  <DateSearch />
  <PrintOrders />
  <Scan />
</div>
```

Replace with:

```tsx
<div className="flex items-center gap-x-2">
  <select
    className="bg-foreground text-white border border-gray-600 px-2 h-8 rounded"
    onChange={(e) => setDeliveryFilter(e.target.value ? Number(e.target.value) : null)}
  >
    <option value="">Tous les livreurs</option>
    {livreurs.map(l => (
      <option key={l.id} value={l.id}>{l.username}</option>
    ))}
  </select>
  <DateSearch />
  <PrintOrders />
  <Scan />
</div>
```

- [ ] **Step 3: Pass deliveryFilter to TableRow**

In `src/app/page.tsx`, find:

```tsx
<TableRow orders={orders} filter={filter} setOrders={setOrders} />
```

Replace with:

```tsx
<TableRow orders={orders} filter={filter} setOrders={setOrders} deliveryFilter={deliveryFilter} />
```

- [ ] **Step 4: Update TableRow to accept and apply deliveryFilter**

In `Components/TableRow.tsx`, replace the component signature on line 10:

```tsx
export default function TableRow({orders, filter, setOrders}: {orders: any[], filter: string, setOrders: any}) {
```

With:

```tsx
export default function TableRow({orders, filter, setOrders, deliveryFilter}: {orders: any[], filter: string, setOrders: any, deliveryFilter?: number | null}) {
```

Then replace the filter expression on line 23:

```tsx
{(filter ? orders.filter(o => o.status === filter) : orders)
```

With:

```tsx
{orders.filter(o =>
  (!filter || o.status === filter) &&
  (!deliveryFilter || o.delivery_id === deliveryFilter)
)
```

- [ ] **Step 5: Verify manually**

Run `npm run dev`. Confirm:
- Delivery filter dropdown appears in the toolbar with livreur names
- Selecting a livreur shows only their orders
- Combining with a status filter applies both simultaneously
- Selecting "Tous les livreurs" resets to all orders
- No console errors

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx Components/TableRow.tsx
git commit -m "feat: add client-side delivery user filter to orders table"
```
