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
  const [todayCounts, setTodayCounts] = useState<Record<string, number>>({});
  const [livreurs, setLivreurs] = useState<{id: number, username: string}[]>([]);
  const [deliveryFilter, setDeliveryFilter] = useState<number | null>(null);

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
      const fifteenDaysAgo = new Date(now);
      fifteenDaysAgo.setDate(now.getDate() - 15);
      const start15 = fifteenDaysAgo.toISOString().split('T')[0];
      const today = now.toISOString().split('T')[0];
      url = `/api/orders?start=${start15}&end=${today}`;
    }

    async function fetchOrders() {
      const res = await fetch(url);
      if (!res.ok) { setOrders([]); return; }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    }

    fetchOrders();
  }, [userId, searchParams, filter]);

  useEffect(() => {
    if (!userId) return;
    async function fetchTodayCounts() {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/orders?start=${today}&end=${today}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;
      const counts: Record<string, number> = {
        '': data.length,
        'Nouveau': 0, 'En route': 0, 'Livré': 0, 'Annulé': 0,
      };
      for (const order of data) {
        counts[order.status] = (counts[order.status] ?? 0) + 1;
      }
      setTodayCounts(counts);
    }
    fetchTodayCounts();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchTodayCounts();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [userId]);

  useEffect(() => {
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const t = setTimeout(() => window.location.reload(), msUntilMidnight);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    async function fetchLivreurs() {
      const res = await fetch('/api/users');
      if (!res.ok) return;
      const data = await res.json();
      setLivreurs(Array.isArray(data) ? data.filter((u: any) => u.role === 'Livreur') : []);
    }
    fetchLivreurs();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <main className="text-white mx-5 h-screen pt-30 w-vw relative">

        <h2 className="text-white text-lg font-semibold mb-2">
          Commandes d'aujourd'hui: {todayCounts[''] ?? 0}
        </h2>

        <div className="flex flex-col lg:flex-row gap-y-5 lg:justify-between w-full">
          <OrderFilter filter={filter} setFilter={setFilter} />
          <Searchbar setOrders={setOrders} />
          <div className="flex items-end gap-x-2">
            <DateSearch />
            <PrintOrders />
            <Scan />
          </div>
          <AddButton path="/order" />
        </div>

        <div className="mt-5">
          <select
              className="md:self-end self-start bg-foreground text-white border border-gray-600 px-2 h-8 rounded"
              onChange={(e) => setDeliveryFilter(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Tous les livreurs</option>
              {livreurs.map(l => (
                <option key={l.id} value={l.id}>{l.username}</option>
              ))}
            </select>
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
              <TableRow orders={orders} filter={filter} setOrders={setOrders} deliveryFilter={deliveryFilter} />
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
