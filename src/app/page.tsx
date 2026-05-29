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
