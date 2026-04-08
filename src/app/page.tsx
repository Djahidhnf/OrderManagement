'use client'
import AddButton from "../../Components/AddButton";
import { Toaster } from "react-hot-toast";
import TableRow from "../../Components/TableRow";
import { useRouter } from "next/navigation";
import OrderFilter from "../../Components/OrdersFilter";
import Searchbar from "../../Components/Searchbar";
import { useEffect, useState } from "react";
import PrintOrders from "../../Components/PrintOrders";



export default function Home() {

  const router = useRouter();


  const [userId, setUserId] = useState<number | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("");

  // Check session
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSession() {
      const res = await fetch("/api/check-session");

      if (!res.ok) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      setUserId(Number(data.userId));
      setLoading(false);
    }

    checkSession();
  }, [router]);


  // Fetch orders
  useEffect(() => {
  if (!userId) return;

  async function fetchOrders() {
    const res = await fetch("/api/orders");

    if (!res.ok) {
      console.error("API failed");
      setOrders([]); // prevent crash
      return;
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("Invalid data:", data);
      setOrders([]);
      return;
    }

    setOrders(data);
  }

  fetchOrders();
}, [userId]);

  // Filtered orders
  const filteredOrders =
    filter === ""
      ? orders
      : orders.filter(order => order.status === filter);

  if (loading) return <div>Loading...</div>; // prevent flicker
  
  return (
    <>
      <Toaster position="top-center" reverseOrder={false}/>

      <main className="text-white mx-5 h-[90vh] w-vw relative">
        <h1 className="text-3xl mb-5 mt-20">Gestion des Commandes</h1>
        <div className="flex flex-col lg:flex-row gap-y-5 lg:justify-between w-full">
          <OrderFilter filter={filter} setFilter={setFilter} />
          <Searchbar setOrders={setOrders} />
            <PrintOrders/>
            <AddButton path="/order"/>
          
        </div>

        

        <div className="overflow-y-auto max-h-[70%] w-full border-b border-gray-600 mt-5">
          <table className="w-full min-w-225 text-left">
            <thead className="sticky top-0 bg-foreground border border-gray-600">
              <tr className=" h-10">
                <th className="px-5 border border-gray-600 w-1/15"></th>
                <th className="px-5 border border-gray-600 w-1/15">ID</th>
                <th className="px-5 border border-gray-600 w-2/15">Client</th>
                <th className="px-5 border border-gray-600 w-3/15">Produits</th>
                <th className="px-5 border border-gray-600 w-2/15">Remarque</th>
                <th className="px-5 border border-gray-600 w-1/15">Livreur</th>
                <th className="px-5 border border-gray-600 w-1/15">Date</th>
                <th className="px-5 border border-gray-600 w-1/15">Total</th>
                <th className="px-5 border border-gray-600 w-1/15">Etat</th>
              </tr>
            </thead>
            <tbody > 
              <TableRow orders={orders} filter={filter} setOrders={setOrders}/>
            </tbody>
          </table>
        </div>
      </main>
    </>
  );



}
