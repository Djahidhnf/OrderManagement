'use client'

import { redirect, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import {toast} from "react-hot-toast";


function MoreButton({order, setOrders}: {order: any, setOrders: any}) {

    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [showPopUp, setShowPopUp] = useState(false);


    

    function handleClickDelete() {
        setOpen(false);
        setShowPopUp(true);
    }


    async function handleDelete(id: any) {
  const res = await fetch(`/api/orders?id=${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const data = await res.json();
    toast.error(data.error || "Erreur");
    return;
  }

  toast.success("Commande supprimé avec succès");

  setOrders((prev : any) => prev.filter((order: any) => order.id !== id));
}


    function handleModify(id:any) {
        router.push(`/order/${id}`);
    }


    function handlePrint(order: any) {
  const printWindow = window.open('', '', 'width=800,height=600');
  if (!printWindow) return;

  printWindow.document.write(`
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
    }

    .container {
      width: 100%;
      max-width: 400px;
      margin: auto;
    }

    .box {
      border: 1px solid black;
      border-radius: 5px;
      padding: 8px 12px;
      margin-bottom: 8px;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    li {
      margin-bottom: 4px;
    }

    .bold {
      font-weight: bold;
    }
  </style>
</head>

<body>
  <div class="container">

    <div class="box">
      <p>0556706268</p>
    </div>

    <div class="box">
      <ul>
        <li>Nom client: <span class="bold">${order.client_name}</span></li>
        <li>Adresse client: <span class="bold">${order.client_wilaya} - ${order.client_address}</span></li>
        <li>Numero client: <span class="bold">${order.client_phone1} - ${order.client_phone2}</span></li>
      </ul>
    </div>

    <div class="box">
      <p>Produits: <span class="bold">${order.products}</span></p>
    </div>

    <div class="box">
      <ul>
        <li>Frais Livraison: <span class="bold">${order.fee} DA</span></li>
        <li>Total a ramasser: <span class="bold">${order.total} DA</span></li>
        <li>${order.order_date}</li>
      </ul>
    </div>

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


    
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
    function handleClick(e: MouseEvent) {
        if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        }
    }

    document.addEventListener("mousedown", handleClick);

    return () => {
        document.removeEventListener("mousedown", handleClick);
    };
    }, []);


    return (
        <>
            <div ref={ref}>
                <button 
                    className="text-blue-600 bg-blue-600/20 border border-blue-600 rounded-full size-6 cursor-pointer"
                    onClick={() => setOpen(!open)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M4.5 10.5C3.675 10.5 3 11.175 3 12C3 12.825 3.675 13.5 4.5 13.5C5.325 13.5 6 12.825 6 12C6 11.175 5.325 10.5 4.5 10.5ZM19.5 10.5C18.675 10.5 18 11.175 18 12C18 12.825 18.675 13.5 19.5 13.5C20.325 13.5 21 12.825 21 12C21 11.175 20.325 10.5 19.5 10.5ZM12 10.5C11.175 10.5 10.5 11.175 10.5 12C10.5 12.825 11.175 13.5 12 13.5C12.825 13.5 13.5 12.825 13.5 12C13.5 11.175 12.825 10.5 12 10.5Z"></path></svg>
                </button>
            </div>


            <div ref={ref} className={`absolute w-40 bg-white rounded-xl text-black z-3 shadow flex-col ${open? "flex" : 'hidden'}`}>
                <button 
                    onClick={() => handlePrint(order)}
                    className="cursor-pointer hover:bg-blue-100 rounded-t-xl w-40 py-2">Imprimer
                </button>
                <button 
                    onClick={() => handleModify(order.id)}
                    className="cursor-pointer hover:bg-blue-100 w-40 py-2">Modifier
                </button>
                {/* <button 
                    onClick={() => setOpen(false)}
                    className="cursor-pointer hover:bg-blue-100 w-40 py-2">Copier
                </button> */}
                <button 
                    onClick={() => handleClickDelete()}
                    className="cursor-pointer hover:bg-blue-100 rounded-b-xl w-40 py-2">Supprimer
                </button>
            </div>


            <div className={`${showPopUp ? "block" : "hidden"} fixed top-0 left-0 h-screen w-screen z-3 bg-black/50 cursor-auto`}>
                <div className={`flex flex-col justify-between bg-white text-black w-100 h-50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-4 rounded-xl`}>
                    <div className="flex flex-col items-start">
                        <button className="rounded-full hover:bg-gray-200 size-7 cursor-pointer"
                        onClick={() => setShowPopUp(false)}>X</button>
                        <h1 className="text-center text-2xl self-center">Voulez vous Supprimer la commande {order.id}</h1>
                    </div>
                    <div className="flex justify-between">
                        <button className="w-30 h-10 px-3 cursor-pointer rounded-md bg-red-600 text-white hover:bg-red-600/80"
                        onClick={() => handleDelete(order.id)}>Supprimer</button>
                        <button className="w-30 h-10 px-3 cursor-pointer rounded-md border border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                        onClick={() => setShowPopUp(false)}>Annuler</button>
                    </div>
                </div>
            </div>



        </>
    )
} 



export default MoreButton;