# Vendeuse Search-All-Orders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let `Vendeuse` users search all orders (any seller), while preventing them from adding notes to or deleting orders they don't own, and hiding now-irrelevant menu actions.

**Architecture:** Drop the `seller_id` filter for `Vendeuse` in the order search endpoint. Add server-side ownership checks (`seller_id === userId`) to the two mutation endpoints Vendeuse can already call (`PATCH /api/orders/[id]` for notes, `DELETE /api/orders` for deletion). On the frontend, thread `userId` and `role` from `page.tsx` → `TableRow` → `MoreButton` so the "Modifier"/"Remarque"/"Supprimer" menu items are hidden for Vendeuse on orders they don't own.

**Tech Stack:** Next.js App Router, Prisma (`prisma.orders`, `prisma.users`), cookie-based session, React state via props.

---

## File Map

| File | Change |
|---|---|
| `src/app/api/orders/search/[id]/route.ts` | Remove `Vendeuse` branch from `roleWhere` — search returns all sellers' orders |
| `src/app/api/orders/[id]/route.ts` | `PATCH`: add ownership check to the existing `Vendeuse` guard |
| `src/app/api/orders/route.ts` | `DELETE`: require `seller_id === userId` for the `Vendeuse` delete path |
| `src/app/page.tsx` | Capture `role` from `/api/check-session`; pass `userId` + `role` to `TableRow` |
| `Components/TableRow.tsx` | Accept and forward `userId` + `role` to `MoreButton` |
| `Components/MoreButton.tsx` | Accept `userId` + `role`; hide "Modifier" for Vendeuse; hide "Remarque"/"Supprimer" for Vendeuse on orders they don't own |

---

### Task 1: Search API — drop seller filter for Vendeuse

**Files:**
- Modify: `src/app/api/orders/search/[id]/route.ts:33-36`

- [ ] **Step 1: Remove the `Vendeuse` branch from `roleWhere`**

Current code (lines 33-36):

```ts
    // Role filter
    const roleWhere: any = {};
    if (role === 'Vendeuse') roleWhere.seller_id = Number(userId);
    else if (role === 'Livreur') roleWhere.delivery_id = Number(userId);
```

Replace with:

```ts
    // Role filter
    const roleWhere: any = {};
    if (role === 'Livreur') roleWhere.delivery_id = Number(userId);
```

- [ ] **Step 2: Verify manually**

Run `npm run dev`. Log in as a `Vendeuse` user. In the searchbar, search for the ID (or phone number) of an order belonging to a *different* seller. Confirm it now appears in the results (previously it would have returned empty).

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/orders/search/[id]/route.ts"
git commit -m "feat: allow Vendeuse to search all orders, not just their own"
```

---

### Task 2: PATCH ownership check (notes)

**Files:**
- Modify: `src/app/api/orders/[id]/route.ts:81-85`

- [ ] **Step 1: Add ownership check to the Vendeuse guard**

Current code (lines 81-85):

```ts
    if (role === 'Vendeuse') {
      if (note === undefined || status !== undefined) {
        return NextResponse.json({ error: 'Denied' }, { status: 403 });
      }
    }
```

Replace with:

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

`currentOrder` is already fetched above this block (it's used for the salary-adjustment logic and Confirmatrice wilaya check), so no extra query is needed.

- [ ] **Step 2: Verify manually**

With `npm run dev` running and logged in as `Vendeuse`:
1. Open the "Remarque" popup on one of your own orders, add a note, submit → should succeed (toast "Remarque ajouté avec succès").
2. Find an order belonging to another seller (via the now-expanded search), and `PATCH /api/orders/<id>` with `{ "note": "test" }` (e.g. via browser devtools fetch or curl with the session cookies) → should return `{"error":"Denied"}` with status 403.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/orders/[id]/route.ts"
git commit -m "fix: Vendeuse can only add notes to their own orders"
```

---

### Task 3: DELETE ownership check

**Files:**
- Modify: `src/app/api/orders/route.ts:139-141`

- [ ] **Step 1: Require seller ownership for the Vendeuse delete path**

Current code (lines 139-141):

```ts
    if (role !== 'Admin' && !(role === 'Vendeuse' && order.status === 'Nouveau')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
```

Replace with:

```ts
    const vendeuseCanDelete = role === 'Vendeuse'
      && order.status === 'Nouveau'
      && Number(order.seller_id) === Number(userId);

    if (role !== 'Admin' && !vendeuseCanDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
```

- [ ] **Step 2: Verify manually**

With `npm run dev` running and logged in as `Vendeuse`:
1. Create a new order (status `Nouveau`), then delete it via "Supprimer" → should succeed.
2. Find a `Nouveau` order belonging to another seller (via search), call `DELETE /api/orders?id=<id>` → should return `{"error":"Forbidden"}` with status 403, and the order must still exist afterward.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/orders/route.ts
git commit -m "fix: Vendeuse can only delete their own Nouveau orders"
```

---

### Task 4: `page.tsx` — capture role, pass userId + role to TableRow

**Files:**
- Modify: `src/app/page.tsx:17-18, 25-34, 157`

- [ ] **Step 1: Add a `role` state next to `userId`**

Current (lines 17-18):

```tsx
  const [userId, setUserId] = useState<number | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
```

Replace with:

```tsx
  const [userId, setUserId] = useState<number | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
```

- [ ] **Step 2: Set `role` in the session check effect**

Current (lines 25-34):

```tsx
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
```

Replace with:

```tsx
  useEffect(() => {
    async function checkSession() {
      const res = await fetch("/api/check-session");
      if (!res.ok) { router.push("/login"); return; }
      const data = await res.json();
      setUserId(Number(data.userId));
      setRole(data.role);
      setLoading(false);
    }
    checkSession();
  }, [router]);
```

- [ ] **Step 3: Pass `userId` and `role` to `TableRow`**

Current (line 157):

```tsx
              <TableRow orders={orders} filter={filter} setOrders={setOrders} deliveryFilter={deliveryFilter} />
```

Replace with:

```tsx
              <TableRow orders={orders} filter={filter} setOrders={setOrders} deliveryFilter={deliveryFilter} userId={userId} role={role} />
```

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: pass userId and role from page.tsx to TableRow"
```

---

### Task 5: `TableRow.tsx` — forward userId + role to MoreButton

**Files:**
- Modify: `Components/TableRow.tsx:10, 32`

- [ ] **Step 1: Accept `userId` and `role` props**

Current (line 10):

```tsx
export default function TableRow({orders, filter, setOrders, deliveryFilter}: {orders: any[], filter: string, setOrders: any, deliveryFilter?: number | null}) {
```

Replace with:

```tsx
export default function TableRow({orders, filter, setOrders, deliveryFilter, userId, role}: {orders: any[], filter: string, setOrders: any, deliveryFilter?: number | null, userId?: number | null, role?: string | null}) {
```

- [ ] **Step 2: Forward both props to `MoreButton`**

Current (line 32):

```tsx
                <MoreButton order={order} setOrders={setOrders}/>
```

Replace with:

```tsx
                <MoreButton order={order} setOrders={setOrders} userId={userId} role={role}/>
```

- [ ] **Step 3: Commit**

```bash
git add Components/TableRow.tsx
git commit -m "feat: thread userId and role down to MoreButton"
```

---

### Task 6: `MoreButton.tsx` — hide menu items Vendeuse can't use on others' orders

**Files:**
- Modify: `Components/MoreButton.tsx:8, 189-206`

- [ ] **Step 1: Accept `userId` + `role` props and compute `isOwnOrder`**

Current (line 8):

```tsx
function MoreButton({order, setOrders}: {order: any, setOrders: any}) {
```

Replace with:

```tsx
function MoreButton({order, setOrders, userId, role}: {order: any, setOrders: any, userId?: number | null, role?: string | null}) {
```

Then, immediately after the existing state declarations (after the line `const [note, setNote] = useState("")`), add:

```tsx

    const isOwnOrder = Number(order.seller_id) === Number(userId);
```

- [ ] **Step 2: Conditionally render menu items**

Current menu block (lines 189-206):

```tsx
            <div ref={ref} className={`absolute w-40 bg-white rounded-xl text-black z-3 shadow flex-col ${open? "flex" : 'hidden'}`}>
                <button 
                    onClick={() => handlePrint(order)}
                    className="cursor-pointer hover:bg-blue-100 rounded-t-xl w-40 py-2">Imprimer
                </button>
                <button 
                    onClick={() => handleModify(order.id)}
                    className="cursor-pointer hover:bg-blue-100 w-40 py-2">Modifier
                </button>
                <button 
                    onClick={() => setShowNotes(true)}
                    className="cursor-pointer hover:bg-blue-100 w-40 py-2">Remarque
                </button>
                <button 
                    onClick={() => handleClickDelete()}
                    className="cursor-pointer hover:bg-blue-100 rounded-b-xl w-40 py-2">Supprimer
                </button>
            </div>
```

Replace with:

```tsx
            <div ref={ref} className={`absolute w-40 bg-white rounded-xl text-black z-3 shadow flex-col ${open? "flex" : 'hidden'}`}>
                <button 
                    onClick={() => handlePrint(order)}
                    className={`cursor-pointer hover:bg-blue-100 rounded-t-xl w-40 py-2 ${role === 'Vendeuse' && !isOwnOrder ? 'rounded-b-xl' : ''}`}>Imprimer
                </button>
                {role !== 'Vendeuse' && (
                    <button 
                        onClick={() => handleModify(order.id)}
                        className="cursor-pointer hover:bg-blue-100 w-40 py-2">Modifier
                    </button>
                )}
                {(role !== 'Vendeuse' || isOwnOrder) && (
                    <button 
                        onClick={() => setShowNotes(true)}
                        className="cursor-pointer hover:bg-blue-100 w-40 py-2">Remarque
                    </button>
                )}
                {(role !== 'Vendeuse' || isOwnOrder) && (
                    <button 
                        onClick={() => handleClickDelete()}
                        className="cursor-pointer hover:bg-blue-100 rounded-b-xl w-40 py-2">Supprimer
                    </button>
                )}
            </div>
```

Notes on the rounding classes:
- Non-Vendeuse: unchanged — 4 buttons, `Imprimer` rounded top, `Supprimer` rounded bottom.
- Vendeuse, own order: `Imprimer`, `Remarque`, `Supprimer` (Modifier hidden) — `Supprimer` is still last, keeps `rounded-b-xl`.
- Vendeuse, other's order: only `Imprimer` renders — gets both `rounded-t-xl` and `rounded-b-xl` via the conditional.

- [ ] **Step 3: Verify manually**

With `npm run dev` running, log in as `Vendeuse`:
1. Open the "⋮" menu on one of your own orders → should show Imprimer, Remarque, Supprimer (no Modifier), all corners rounded correctly.
2. Search for and open the menu on another seller's order → should show only "Imprimer", fully rounded.
3. Log in as `Admin` (or another role) and confirm the menu still shows all four items as before.

- [ ] **Step 4: Commit**

```bash
git add Components/MoreButton.tsx
git commit -m "feat: hide Modifier/Remarque/Supprimer for Vendeuse on others' orders"
```

---

## End-to-End Verification

With `npm run dev` running:

1. Log in as `Vendeuse`. Search (by ID or phone) for an order belonging to another seller — it appears in results.
2. On that order's row, the "⋮" menu shows only "Imprimer".
3. On your own orders, the menu shows "Imprimer", "Remarque", "Supprimer" — all functional.
4. Confirm `/order/[id]` (Modifier target) is still inaccessible to Vendeuse for any order (pre-existing, unchanged behavior — "Accès restreint").
5. Log in as `Admin`, `Assistante`, `Confirmatrice`, `Livreur` in turn — confirm no behavior change for their menus, search, or order lists.
