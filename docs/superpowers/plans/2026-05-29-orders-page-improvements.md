# Orders Page Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist date filter in URL, re-fetch when status filter changes with smart date defaults (Nouveau = all time, others = this month), and remove orders from the filtered view immediately when their status changes.

**Architecture:** Date range moves from component-local state into URL query params (`?start=&end=`). A single `useEffect` in `page.tsx` watches `[userId, searchParams, filter]` and decides the date range: URL params win, then filter-based defaults. `StateButton` gains a `setOrders` prop and patches the orders array in-place on status change so the filtered view reacts immediately.

**Tech Stack:** Next.js App Router, `useSearchParams` / `useRouter` (next/navigation), React state, Prisma via `/api/orders`

---

## File Map

| File | Change |
|---|---|
| `src/app/api/orders/route.ts` | Remove today-default; no date params → no restriction |
| `src/app/page.tsx` | Unified fetch effect on `[userId, searchParams, filter]`; Suspense wrapper for `useSearchParams` |
| `Components/DateSearch.tsx` | Drop `setOrders` prop; write `?start=&end=` to URL via `router.push` |
| `Components/TableRow.tsx` | Thread `setOrders` down to `StateButton` |
| `Components/stateButton.tsx` | Accept `setOrders`; patch orders array on status change |

---

### Task 1: API — remove today default

**Files:**
- Modify: `src/app/api/orders/route.ts`

- [ ] **Step 1: Remove the today fallback in `GET`**

Replace the date-range block (lines 30–42) with:

```ts
let dateWhere: any = {};
if (start && end) {
  const gte = new Date(start);
  const lt = new Date(end);
  lt.setDate(lt.getDate() + 1);
  dateWhere = { order_date: { gte, lt } };
}
```

And update the `findMany` call:

```ts
const orders = await prisma.orders.findMany({
  where: { ...dateWhere, ...roleWhere },
  include: ORDER_INCLUDE,
  orderBy: { id: 'desc' },
});
```

The full updated `GET` becomes:

```ts
export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const userId = (await cookieStore).get('userId')?.value;
    const role = (await cookieStore).get('role')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    let dateWhere: any = {};
    if (start && end) {
      const gte = new Date(start);
      const lt = new Date(end);
      lt.setDate(lt.getDate() + 1);
      dateWhere = { order_date: { gte, lt } };
    }

    const roleWhere: any = {};
    if (role === 'Vendeuse') roleWhere.seller_id = Number(userId);
    else if (role === 'Livreur') roleWhere.delivery_id = Number(userId);
    else if (role === 'Confirmatrice') roleWhere.client_wilaya = { not: 'Alger' };

    const orders = await prisma.orders.findMany({
      where: { ...dateWhere, ...roleWhere },
      include: ORDER_INCLUDE,
      orderBy: { id: 'desc' },
    });

    return NextResponse.json(orders.map(o =>
      serializeOrder(o, (o as any)[SELLER_RELATION], (o as any)[DELIVERY_RELATION])
    ));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify manually**

Run `npm run dev`, open browser, confirm the page loads without errors. No automated test needed for this isolated change.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/orders/route.ts
git commit -m "feat: remove today-default from GET /api/orders; no date params returns all orders"
```

---

### Task 2: `StateButton` — patch orders array on status change

**Files:**
- Modify: `Components/stateButton.tsx`

- [ ] **Step 1: Add `setOrders` prop and call it on success**

Replace the entire file content with:

```tsx
'use client'
import { useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"

function StateButton({
  state,
  id,
  setOrders,
}: {
  state: any;
  id: number;
  setOrders: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const [open, setOpen] = useState(false)
  const [orderState, setOrderState] = useState(state)

  async function handleChange(newState: string, id: number) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newState }),
    });

    const data = await res.json();
    if (data.error === "Denied") {
      toast.error('Access denied')
      return;
    }

    setOrderState(newState)
    setOrders((prev: any[]) => prev.map(o => o.id === id ? { ...o, status: newState } : o))
    setOpen(false);
  }

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => { document.removeEventListener("mousedown", handleClick); };
  }, []);

  return (
    <div className="relative">
      <div className={`w-30 px-5 mx-auto border cursor-pointer rounded-xl text-center ${
        orderState === "Nouveau"   ? "text-blue-600 border border-blue-600 bg-blue-600/20" :
        orderState === "En route"  ? "bg-yellow-600/20 text-yellow-600 border-yellow-600" :
        orderState === "Livré"     ? "bg-green-600/20 text-green-600 border-green-600" :
        orderState === "Annulé"    ? "bg-red-600/20 text-red-600 border-red-600" : ""
      }`}
      onClick={() => setOpen(!open)}>{orderState}
      </div>

      <div ref={ref} className={`absolute right-0 bg-background rounded-xl shadow z-4 ${open ? "block" : "hidden"}`}>
        <button onClick={() => handleChange("Nouveau", id)}
          className={`hover:text-gray-700 rounded-t-xl hover:bg-gray-400 cursor-pointer w-30 h-10 block bg-blue-700/50 ${orderState === "Nouveau" ? "text-white" : "text-blue-600"}`}>Nouveau</button>
        <button onClick={() => handleChange("En route", id)}
          className={`hover:text-gray-700 hover:bg-gray-400 cursor-pointer w-30 h-10 block bg-yellow-700/60 ${orderState === "En route" ? "text-white" : "text-yellow-600"}`}>En route</button>
        <button onClick={() => handleChange("Livré", id)}
          className={`hover:text-gray-700 hover:bg-gray-400 cursor-pointer w-30 h-10 block bg-green-700/50 ${orderState === "Livré" ? "text-white" : "text-green-600"}`}>Livré</button>
        <button onClick={() => handleChange("Annulé", id)}
          className={`hover:text-gray-700 rounded-b-xl hover:bg-gray-400 cursor-pointer w-30 h-10 block bg-red-700/50 ${orderState === "Annulé" ? "text-white" : "text-red-600"}`}>Annulé</button>
      </div>
    </div>
  )
}

export default StateButton;
```

- [ ] **Step 2: Commit**

```bash
git add Components/stateButton.tsx
git commit -m "feat: StateButton updates orders array in place on status change"
```

---

### Task 3: `TableRow` — thread `setOrders` to `StateButton`

**Files:**
- Modify: `Components/TableRow.tsx`

- [ ] **Step 1: Pass `setOrders` to `StateButton`**

In `TableRow.tsx`, find the `<StateButton>` usage and add the `setOrders` prop:

```tsx
<StateButton state={order.status} id={order.id} setOrders={setOrders} />
```

Full file after change:

```tsx
'use client'

import { useRouter } from "next/navigation";
import MoreButton from "./MoreButton";
import StateButton from "./stateButton";

export default function TableRow({orders, filter, setOrders}: {orders: any[], filter: string, setOrders: any}) {
  const router = useRouter();

  function handleDoubleClick(id: number) {
    router.push(`/order/${id}`);
  }

  return (
    <>
      {(filter ? orders.filter(o => o.status === filter) : orders)
        .map((order) => (
          <tr key={order.id} className="hover:bg-foreground cursor-pointer"
            onDoubleClick={() => handleDoubleClick(order.id)}>
            <td className="border border-gray-600 px-5 w-1/15 py-1">
              <MoreButton order={order} setOrders={setOrders} />
            </td>
            <td className="border border-gray-600 px-5 w-1/16 py-1">{order.id}</td>
            <td className="border border-gray-600 px-5 w-1/16">{order.seller_name}</td>
            <td className="border border-gray-600 px-5 w-2/16 py-1">
              {order.client_name}<br />
              {order.client_phone1} - {order.client_phone2}<br />
              {order.client_wilaya} - {order.client_address}
            </td>
            <td className="border border-gray-600 px-5 w-3/16 py-1" style={{whiteSpace: 'pre-wrap'}}>{order.products}</td>
            <td className="border border-gray-600 px-5 w-3/16 py-1 text-xs" style={{whiteSpace: 'pre-wrap'}}>{order.notes}</td>
            <td className="border border-gray-600 px-5 w-2/16 py-1">
              {order.delivery_name}<br />
              {order.delivery_phone}<br />
              {order.delivery_name && order.fee + "DA"}
            </td>
            <td className="border border-gray-600 px-5 w-1/16 py-1">{order.formatted_date}</td>
            <td className="border border-gray-600 px-5 w-1/16 py-1">{order.total}</td>
            <td className="border border-gray-600 px-5 w-1/16 py-1">
              <StateButton state={order.status} id={order.id} setOrders={setOrders} />
            </td>
          </tr>
        ))}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add Components/TableRow.tsx
git commit -m "feat: thread setOrders down to StateButton via TableRow"
```

---

### Task 4: `DateSearch` — write date range to URL params

**Files:**
- Modify: `Components/DateSearch.tsx`

- [ ] **Step 1: Replace `setOrders` with URL-param write**

`DateSearch` no longer needs the `setOrders` prop. It reads initial dates from URL params and pushes new params on submit.

Replace the entire file with:

```tsx
'use client'

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

function DateSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(searchParams.get('start') ?? today);
  const [endDate, setEndDate] = useState(searchParams.get('end') ?? today);
  const [showPopUp, setShowPopUp] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error("Sélectionnez une plage de dates");
      return;
    }
    router.push(`/?start=${startDate}&end=${endDate}`);
    setShowPopUp(false);
  }

  return (
    <>
      <button className="mr-10 self-end cursor-pointer"
        onClick={() => setShowPopUp(true)}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="rgba(255,255,255,1)"><path d="M17 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H7V1H9V3H15V1H17V3ZM4 9V19H20V9H4ZM6 11H8V13H6V11ZM11 11H13V13H11V11ZM16 11H18V13H16V11Z"></path></svg>
      </button>

      <div className={`${showPopUp ? "block" : "hidden"} fixed top-0 left-0 h-screen w-screen z-3 bg-black/50 cursor-auto`}>
        <div className="flex flex-col justify-between bg-white text-black w-120 h-50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-4 rounded-xl">
          <h1 className="text-center text-xl">Recherche par date</h1>
          <form className="flex flex-col justify-between items-between h-full w-full" onSubmit={handleSubmit}>
            <div className="pt-5 flex justify-between">
              <div className="flex">
                <p className="bg-background text-white px-2 rounded-l-md flex items-center h-8">Du</p>
                <input type="date" name="from" className="bg-white border rounded-r-md h-8 px-2"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="flex">
                <p className="bg-background text-white px-2 rounded-l-md flex items-center">Au</p>
                <input type="date" name="to" className="bg-white border rounded-r-md h-8 px-2"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-between">
              <button className="w-30 h-10 px-3 cursor-pointer rounded-md bg-blue-600 text-white hover:bg-blue-600/80"
                type="submit">Recherche</button>
              <button className="w-30 h-10 px-3 cursor-pointer rounded-md border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                type="button"
                onClick={() => setShowPopUp(false)}>Annuler</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default DateSearch;
```

- [ ] **Step 2: Commit**

```bash
git add Components/DateSearch.tsx
git commit -m "feat: DateSearch persists date range in URL query params"
```

---

### Task 5: `page.tsx` — unified fetch effect + Suspense wrapper

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Rewrite page.tsx**

`useSearchParams` requires a Suspense boundary in Next.js App Router. Split into `HomeContent` (has the logic) and `Home` (wraps with Suspense). The fetch effect watches `[userId, searchParams, filter]` and computes the URL based on the priority rule: URL params > Nouveau (no limit) > this month.

`DateSearch` no longer takes a `setOrders` prop — remove it from the JSX.

Replace the entire file with:

```tsx
'use client'
import AddButton from "../../Components/AddButton";
import { Toaster } from "react-hot-toast";
import TableRow from "../../Components/TableRow";
import { useRouter, useSearchParams } from "next/navigation";
import OrderFilter from "../../Components/OrdersFilter";
import Searchbar from "../../Components/Searchbar";
import { useEffect, useState, Suspense } from "react";
import PrintOrders from "../../Components/PrintOrders";
import Scan from "../../Components/Scan";
import DateSearch from "../../Components/DateSearch";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userId, setUserId] = useState<number | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const res = await fetch("/api/check-session");
      if (!res.ok) { router.push("/login"); return; }
      const data = await res.json();
      setUserId(Number(data.userId));
      setLoading(false);
    }
    checkSession();
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    const start = searchParams.get('start');
    const end = searchParams.get('end');

    let url = '/api/orders';
    if (start && end) {
      url = `/api/orders?start=${start}&end=${end}`;
    } else if (filter !== 'Nouveau') {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0];
      const today = now.toISOString().split('T')[0];
      url = `/api/orders?start=${monthStart}&end=${today}`;
    }

    async function fetchOrders() {
      const res = await fetch(url);
      if (!res.ok) { setOrders([]); return; }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    }

    fetchOrders();
  }, [userId, searchParams, filter]);

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <main className="text-white mx-5 h-screen pt-30 w-vw relative">
        <div className="flex flex-col lg:flex-row gap-y-5 lg:justify-between w-full">
          <OrderFilter filter={filter} setFilter={setFilter} />
          <Searchbar setOrders={setOrders} />
          <div className="flex">
            <DateSearch />
            <PrintOrders />
            <Scan />
          </div>
          <AddButton path="/order" />
        </div>

        <div className="overflow-y-auto h-[85%] w-full border border-gray-600 mt-5">
          <table className="w-full min-w-225 text-left h-fit">
            <thead className="sticky top-0 z-2 bg-foreground border border-gray-600">
              <tr className="h-10">
                <th className="px-5 border border-gray-600 w-1/16"></th>
                <th className="px-5 border border-gray-600 w-1/16">ID</th>
                <th className="px-5 border border-gray-600 w-1/16">Vendeuse</th>
                <th className="px-5 border border-gray-600 w-2/16">Client</th>
                <th className="px-5 border border-gray-600 w-3/16">Produits</th>
                <th className="px-5 border border-gray-600 w-2/16">Remarque</th>
                <th className="px-5 border border-gray-600 w-1/16">Livreur</th>
                <th className="px-5 border border-gray-600 w-1/16">Date</th>
                <th className="px-5 border border-gray-600 w-1/16">Total</th>
                <th className="px-5 border border-gray-600 w-1/16">Etat</th>
              </tr>
            </thead>
            <tbody>
              <TableRow orders={orders} filter={filter} setOrders={setOrders} />
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
```

- [ ] **Step 2: Verify in browser**

With `npm run dev` running:
1. Load `/` — should show this month's orders (no filter set, no URL params)
2. Click "Nouveaux" filter — should re-fetch all Nouveau orders (no date limit)
3. Click "Tout" — should re-fetch this month's orders
4. Use DateSearch to set a range — URL should update to `/?start=X&end=Y`, orders update, refresh should keep that range
5. Change order status while "Nouveau" filter is active — order should disappear from the list immediately without a refresh

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: unified fetch effect with filter-driven date range and URL param persistence"
```
