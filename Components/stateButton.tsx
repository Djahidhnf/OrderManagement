'use client'
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"



function StateButton({state, id}: {state: any, id: number}) {

    const [open, setOpen] = useState(false)
    const [orderState, setOrderState] = useState(state)


    const router = useRouter();

    async function handleChange(newState: string, id: number) {

        const res = await fetch(`/api/orders/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: newState
            })
        });

        const data = await res.json();
        if (data.error === "Denied") {
            toast.error('Access denied')
            return;
        }


        setOrderState(newState)
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
    
        return () => {
            document.removeEventListener("mousedown", handleClick);
        };
        }, []);


    return (
        <div className="relative">
            <div className={`w-30 px-5 mx-auto border cursor-pointer rounded-xl text-center ${
                orderState === "Nouveau"? "text-blue-600 border border-blue-600 bg-blue-600/20" :
                orderState === "En route"? "bg-yellow-600/20 text-yellow-600 border-yellow-600" :
                orderState === "Livré"? "bg-green-600/20 text-green-600 border-green-600" :
                orderState === "Annulé"? "bg-red-600/20 text-red-600 border-red-600" : ""
            }`}
            onClick={() => setOpen(!open)}>{orderState}
            </div>

            <div ref={ref} className={`absolute right-0 bg-background rounded-xl shadow z-4 ${open? "block" : "hidden"}`}>
                <button
                 onClick={() => handleChange("Nouveau", id)}
                 className={`hover:text-gray-700 rounded-t-xl hover:bg-gray-400 cursor-pointer w-30 h-10 block bg-blue-700/50 ${orderState === "Nouveau"? "text-white " : "text-blue-600"}`}>Nouveau</button>
                <button
                 onClick={() => handleChange("En route", id)}
                 className={`hover:text-gray-700 hover:bg-gray-400 cursor-pointer w-30 h-10 block bg-yellow-700/60 ${orderState === "En route"? "text-white " : " text-yellow-600"}`}>En route</button>
                <button
                 onClick={() => handleChange("Livré", id)}
                 className={`hover:text-gray-700 hover:bg-gray-400 cursor-pointer w-30 h-10 block bg-green-700/50 ${orderState === "Livré"? "text-white " : "text-green-600"}`}>Livré</button>
                <button
                 onClick={() => handleChange("Annulé", id)}
                 className={`hover:text-gray-700 rounded-b-xl hover:bg-gray-400 cursor-pointer w-30 h-10 block bg-red-700/50 ${orderState === "Annulé"? "text-white " : "text-red-600"}`}>Annulé</button>
            </div>
        </div>
    )
}


export default StateButton;