'use client'

import React, { useState } from "react";
import toast from "react-hot-toast";


function Scan() {

    const [showPopUp, setShowPopUp] = useState(false)

    async function handleScan(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const barcode = formData.get("barcode") as string;
        const form = e.currentTarget;

        try {
            const res = await fetch(`/api/orders/${barcode}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: "Annulé"
                }) 
            });

            const data = await res.json();

            if (data.error === "Denied") {
                toast.error('Access denied');
                return;
            }

            form.reset();

        } catch (err) {
            console.error(err);
        }
    }


    return (
        <>
            <button className="cursor-pointer ml-10 self-end"
            onClick={() => setShowPopUp(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="rgba(255,255,255,1)"><path d="M21 16V21H3V16H5V19H19V16H21ZM3 11H21V13H3V11ZM21 8H19V5H5V8H3V3H21V8Z"></path></svg>
            </button>



            <div className={`${showPopUp ? "block" : "hidden"} fixed top-0 left-0 h-screen w-screen z-3 bg-black/50 cursor-auto`}>
                <div className={`flex flex-col justify-between items-center bg-white text-black w-100 h-50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-4 rounded-xl`}>
                    <div className="flex flex-col w-full">
                        <button className="size-8 rounded-full hover:bg-gray-200 cursor-pointer hover:text-white"
                        onClick={() => setShowPopUp(false)}>X</button>
                        <h1 className="self-center">Scannez le code barre</h1>
                        <form onSubmit={handleScan} className="w-full justify-self-center mt-5">
                            <input type="text" name="barcode" placeholder="Code a barre" required autoFocus
                            className="text-black h-8 rounded-md border px-2 w-full text-center"/>

                            <button type="submit" hidden />
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}


export default Scan;