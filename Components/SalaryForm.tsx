/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from "react";

function SalaryForm({users}: {users: never[]}) {

    const [salary, setSalary] = useState<number | null>(null);
    const [orders, setOrders] = useState<any[]>([])
    const [id, setId] = useState<number | null>(null);
    const [user, setUser] = useState<string>("")
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("")

    

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const res = await fetch(`/api/users/salary?id=${id}&start=${start}&end=${end}`)
        const data = await res.json()
        setSalary(data[0].total_benefit)
        setOrders(data)
    }




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
          ${order.client_wilaya} - ${order.client_address}<br/>
          ${order.seller_name || "Vendeuse non assigne"}<br/>Benefice: ${order.benefit}
        </p>
      </div>

      <div class="middle">
        <p style="white-space: pre-wrap;">${order.products}</p>
      </div>

      <div class="right">
        <p>
          ${order?.delivery_name || "wordexpress"}<br/>
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
}

    return (
        <div className="bg-foreground h-50 mt-10 w-[60%] p-5">
                <h1 className="text-xl">Calculer le Salaire</h1>

            <form action="" className="py-3 rounded-md flex justify-between" onSubmit={handleSubmit}>
                <select required name="id"
                className="bg-white h-8 w-[50%] text-black"
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            const selected = e.target.selectedOptions[0];

                            setId(Number(selected.value));
                            setUser(selected.text);
                          }}>
                    <option value="">L&apos;utilisateur</option>
                  {users.map((user: any) => {
                    if (user.role === "Vendeuse") {
                      return (
                        <option key={user.id} value={user.id}>{user.username}</option>
                      )
                    }
                  })}
                </select>
                  <div className="flex">
                    <label htmlFor="start" className="bg-background rounded-l-md px-3 flex items-center">Du</label>
                    <input type="date" name="start" required
                    className="bg-white text-black h-8 px-3 rounded-r-md"
                    onChange={(e) => setStart(e.target.value)}/>
                  </div>
                  <div className="flex">
                    <label htmlFor="end" className="bg-background rounded-l-md px-3 flex items-center">Au</label>
                    <input type="date" name="end" required
                    className="bg-white text-black h-8 px-3 rounded-md"
                    onChange={(e) => setEnd(e.target.value)}/>
                  </div>

                <button type="submit" className="rounded-full bg-background hover:bg-background/40 cursor-pointer px-2">
                  Calculer
                </button>

            </form>

            {salary !== null && (
              <>
                <div className="flex w-full justify-between">
                    <p className="text-xl mt-10 font-normal">
                      Le Salaire de {user} du {start} jusqu&apos;au {end} est:
                      <span className="text-green-800 font-bold text-2xl px-2">
                          {salary} DA
                      </span>
                    </p>
                    <button className="cursor-pointer self-end"
                    onClick={() => handlePrint(orders)}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="rgba(255,255,255,1)"><path d="M7 17H17V22H7V17ZM19 20V15H5V20H3C2.44772 20 2 19.5523 2 19V9C2 8.44772 2.44772 8 3 8H21C21.5523 8 22 8.44772 22 9V19C22 19.5523 21.5523 20 21 20H19ZM5 10V12H8V10H5ZM7 2H17C17.5523 2 18 2.44772 18 3V6H6V3C6 2.44772 6.44772 2 7 2Z"></path></svg>
                    </button>
                </div>
                
              </>
                )}
              
        </div>
    )
}


export default SalaryForm;
