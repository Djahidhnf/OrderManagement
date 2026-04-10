'use client'

import React, { useState } from "react";
import toast from "react-hot-toast";

function PrintOrders() {

    const [showPopUp, setShowPopUp] = useState(false)
    const [date, setDate] = useState("");
    const [orders, setOrders] = useState<any>([])

function handlePrint(orders: any[]) {
  const printWindow = window.open('', '', 'width=800,height=600');
  if (!printWindow) return;

  const ordersHTML = orders.map(order => `
    <div class="order">
      <div class="left">
        <p>
          id: ${order.id}<br/>
          ${order.client_name}<br/>
          ${order.client_phone1} - ${order.client_phone2}<br/>
          ${order.client_wilaya} - ${order.client_address}
        </p>
      </div>

      <div class="middle">
        <p style="white-space: pre-wrap;">${order.products}</p>
      </div>

      <div class="right">
        <p>
          ${order?.delivery_name || "livreur non assigne"}<br/>
          ${order.delivery_phone || ""}<br/>
          Frais: ${order.fee} DA<br/>
          Total: ${order.total} DA<br/>
          ${order.status}
        </p>
      </div>
    </div>
  `).join(""); // 🔥 important

  printWindow.document.write(`
    <html>
    <head>
      <style>

        .container {
          background: white;
          padding: 10px;
        }

        .order {
          display: flex;
          justify-content: space-between;
          gap: 5px;
          border: 1px solid black;
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 5px;
        }

        .left, .right {
          flex: 1;
        }

        .middle {
          flex: 1;
          border-left: 1px solid black;
          border-right: 1px solid black;
          padding: 0 10px;
        }

        h1 {
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>

      <div class="container">
        <p>
          Nombre de commandes hors wilaya le ${date}:
          <strong>${orders.length}</strong>
        </p>

        ${ordersHTML}
      </div>

      <script>
        window.onload = function() {
          window.print();
          window.close();
        }
      </script>

    </body>
    </html>
  `);

  printWindow.document.close();
  setShowPopUp(false)
}


    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const res = await fetch(`/api/orders/print?date=${date}`);
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Erreur");
          return;
        }

        setOrders(data);
        handlePrint(data);
    }

    return (
        <>
            <button className="cursor-pointer self-end"
            onClick={() => setShowPopUp(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="rgba(255,255,255,1)"><path d="M7 17H17V22H7V17ZM19 20V15H5V20H3C2.44772 20 2 19.5523 2 19V9C2 8.44772 2.44772 8 3 8H21C21.5523 8 22 8.44772 22 9V19C22 19.5523 21.5523 20 21 20H19ZM5 10V12H8V10H5ZM7 2H17C17.5523 2 18 2.44772 18 3V6H6V3C6 2.44772 6.44772 2 7 2Z"></path></svg>
            </button>



            <div className={`${showPopUp ? "block" : "hidden"} fixed top-0 left-0 h-screen w-screen z-3 bg-black/50 cursor-auto`}>
                <div className={`flex flex-col justify-between bg-white text-black w-100 h-50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-4 rounded-xl`}>
                    <h1 className="text-center">Imprimer les commandes hors wilaya</h1>
                    <form className="flex flex-col h-full justify-between items-center pt-5" onSubmit={(e) => handleSubmit(e)}>
                        <input type="date" required
                        className="border border-black rounded-md h-8 px-2"
                        onChange={(e) => setDate(e.target.value)}/>
                    <div className="flex justify-between w-full">
                        <button type="submit"
                        className="w-30 h-10 px-3 cursor-pointer rounded-md bg-blue-600 text-white hover:bg-blue-500">Imprimer</button>
                        <button className="w-30 h-10 px-3 cursor-pointer rounded-md border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                        onClick={() => setShowPopUp(false)}>Annuler</button>
                    </div>                    
                    </form>
                </div>

                
            </div>
        </>
    )
}


export default PrintOrders;