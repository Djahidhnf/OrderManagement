'use client'

import { redirect, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import {toast} from "react-hot-toast";


function MoreButton({order, setOrders}: {order: any, setOrders: any}) {

    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [showPopUp, setShowPopUp] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [note, setNote] = useState("")

    

    function handleClickDelete() {
        setOpen(false);
        setShowPopUp(true);
    }


    async function handleAddNote(e: React.FormEvent<HTMLFormElement>, id: string) {
      e.preventDefault();
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({
          note: note
        })
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur");
        return;
      }

      toast.success("Remarque ajouté avec succès");
      setShowNotes(false)
      router.push("/");

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


    async function handleModify(id:any) {
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
    
      <p><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12.001 2C17.5238 2 22.001 6.47715 22.001 12C22.001 17.5228 17.5238 22 12.001 22C10.1671 22 8.44851 21.5064 6.97086 20.6447L2.00516 22L3.35712 17.0315C2.49494 15.5536 2.00098 13.8345 2.00098 12C2.00098 6.47715 6.47813 2 12.001 2ZM8.59339 7.30019L8.39232 7.30833C8.26293 7.31742 8.13607 7.34902 8.02057 7.40811C7.93392 7.45244 7.85348 7.51651 7.72709 7.63586C7.60774 7.74855 7.53857 7.84697 7.46569 7.94186C7.09599 8.4232 6.89729 9.01405 6.90098 9.62098C6.90299 10.1116 7.03043 10.5884 7.23169 11.0336C7.63982 11.9364 8.31288 12.8908 9.20194 13.7759C9.4155 13.9885 9.62473 14.2034 9.85034 14.402C10.9538 15.3736 12.2688 16.0742 13.6907 16.4482C13.6907 16.4482 14.2507 16.5342 14.2589 16.5347C14.4444 16.5447 14.6296 16.5313 14.8153 16.5218C15.1066 16.5068 15.391 16.428 15.6484 16.2909C15.8139 16.2028 15.8922 16.159 16.0311 16.0714C16.0311 16.0714 16.0737 16.0426 16.1559 15.9814C16.2909 15.8808 16.3743 15.81 16.4866 15.6934C16.5694 15.6074 16.6406 15.5058 16.6956 15.3913C16.7738 15.2281 16.8525 14.9166 16.8838 14.6579C16.9077 14.4603 16.9005 14.3523 16.8979 14.2854C16.8936 14.1778 16.8047 14.0671 16.7073 14.0201L16.1258 13.7587C16.1258 13.7587 15.2563 13.3803 14.7245 13.1377C14.6691 13.1124 14.6085 13.1007 14.5476 13.097C14.4142 13.0888 14.2647 13.1236 14.1696 13.2238C14.1646 13.2218 14.0984 13.279 13.3749 14.1555C13.335 14.2032 13.2415 14.3069 13.0798 14.2972C13.0554 14.2955 13.0311 14.292 13.0074 14.2858C12.9419 14.2685 12.8781 14.2457 12.8157 14.2193C12.692 14.1668 12.6486 14.1469 12.5641 14.1105C11.9868 13.8583 11.457 13.5209 10.9887 13.108C10.8631 12.9974 10.7463 12.8783 10.6259 12.7616C10.2057 12.3543 9.86169 11.9211 9.60577 11.4938C9.5918 11.4705 9.57027 11.4368 9.54708 11.3991C9.50521 11.331 9.45903 11.25 9.44455 11.1944C9.40738 11.0473 9.50599 10.9291 9.50599 10.9291C9.50599 10.9291 9.74939 10.663 9.86248 10.5183C9.97128 10.379 10.0652 10.2428 10.125 10.1457C10.2428 9.95633 10.2801 9.76062 10.2182 9.60963C9.93764 8.92565 9.64818 8.24536 9.34986 7.56894C9.29098 7.43545 9.11585 7.33846 8.95659 7.32007C8.90265 7.31384 8.84875 7.30758 8.79459 7.30402C8.66053 7.29748 8.5262 7.29892 8.39232 7.30833L8.59339 7.30019Z"></path></svg> 0556706268</p>
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
                <button 
                    onClick={() => setShowNotes(true)}
                    className="cursor-pointer hover:bg-blue-100 w-40 py-2">Remarque
                </button>
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


            <div className={`${showNotes ? "block" : "hidden"} fixed top-0 left-0 h-screen w-screen z-3 bg-black/50 cursor-auto`}>
              <div className="bg-white h-[50%] w-150 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-4 rounded-xl">
                <p className="text-black border bg-white rounded-md h-[50%] p-2 overflow-y-auto" style={{whiteSpace: "pre-wrap"}}>{order.notes}</p>
                <form onSubmit={(e) => handleAddNote(e, order.id)}>
                  <input type="text" name="note" placeholder="Remarque"
                  className="border border-gray-600 rounded-md w-full h-8 my-5 text-black px-2"
                  onChange={(e) => setNote(e.target.value)}/>
                  <button type="submit" className="bg-blue-600 text-white h-8 w-30 px-3 rounded-sm hover:bg-blue-500 cursor-pointer">Enregistrer</button>
                  <button type="button" className="text-blue-600 border-blue-600 border w-30 h-8 px-3 rounded-sm hover:text-white hover:bg-blue-600 cursor-pointer ml-5"
                  onClick={() => setShowNotes(false)}>Annuler</button>
                </form>
              </div>
            </div>



        </>
    )
} 



export default MoreButton;