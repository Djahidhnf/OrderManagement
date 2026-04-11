'use client'

import { stringify } from "querystring";
import React, { useState } from "react";
import toast from "react-hot-toast";

type Props = {
  setOrders: React.Dispatch<React.SetStateAction<any>>;
};



function DateSearch({setOrders}: Props) {

    const today = new Date(). toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    const [showPopUp, setShowPopUp] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const res = await fetch(`/api/orders?start=${startDate}&end=${endDate}`)
        const data = await res.json();

        if (!res.ok) {
            toast.error("Search failed")
        }
        setOrders(data)
        setShowPopUp(false)

    }


    

    return (

        <>
            <button className="mr-10 self-end cursor-pointer"
            onClick={() => setShowPopUp(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="rgba(255,255,255,1)"><path d="M17 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H7V1H9V3H15V1H17V3ZM4 9V19H20V9H4ZM6 11H8V13H6V11ZM11 11H13V13H11V11ZM16 11H18V13H16V11Z"></path></svg>
            </button>


            <div className={`${showPopUp ? "block" : "hidden"} fixed top-0 left-0 h-screen w-screen z-3 bg-black/50 cursor-auto`}>
                <div className={`flex flex-col justify-between bg-white text-black w-120 h-50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-4 rounded-xl`}>
                    <h1 className="text-center text-xl">Recherche par date</h1>
                    <form className="flex flex-col justify-between items-between h-full w-full" onSubmit={handleSubmit}>

                        <div className=" pt-5 flex justify-between">
                            <div className="flex">
                                <p className="bg-background text-white px-2 rounded-l-md flex items-center h-8">Du</p>
                                <input type="date" name="from" id="" className="bg-white border rounded-r-md h-8 px-2"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}/>
                            </div>
                            
                            <div className="flex">
                                <p className="bg-background text-white px-2 rounded-l-md flex items-center">Au</p>
                                <input type="date" name="from" id="" className="bg-white border rounded-r-md h-8 px-2"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}/>
                            </div>
                        </div>

                    <div className="flex justify-between">
                        <button className="w-30 h-10 px-3 cursor-pointer rounded-md bg-blue-600 text-white hover:bg-blue-600/80"
                        type="submit">Recherche</button>
                        <button className="w-30 h-10 px-3 cursor-pointer rounded-md border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                        onClick={() => setShowPopUp(false)}>Annuler</button>
                    </div>
                    </form>
                    
                </div>
            </div>



            {/* <form className="flex justify-between w-full lg:w-120">
                <div className="flex bg-foreground h-8 rounded-l-md items-center">
                    <p className="bg-foreground h-8 px-2 rounded-l-md">Du</p>
                    <input type="date" name="from" id="" className="bg-gray-700 text-gray-500 px-2"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}/>
                </div>
                <input type="date" name="to" id="" className="bg-gray-700 text-gray px-2"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}/>
            </form> */}
        </>
    )
}



export default DateSearch;