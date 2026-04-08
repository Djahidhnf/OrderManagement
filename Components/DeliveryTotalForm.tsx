/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useState } from "react";




function DeliveryTotalForm({users}: {users: never[]}) {


        const [total, setTotal] = useState<number | null>(null);
        const [id, setId] = useState<number | null>(null);
        const [user, setUser] = useState<string>("")
        const [date, setDate] = useState("")
    
        async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
            e.preventDefault();
            const res = await fetch(`/api/users/total?id=${id}&date=${date}`)
            const data = await res.json()
            setTotal(data)
        }


    return (
        <div className="bg-foreground h-50 mt-10 w-[60%] p-5">
            <h1 className="text-xl">Calculer Total du Livreur</h1>
            <form className="py-3 rounded-md flex justify-between" onSubmit={handleSubmit}>
                <select required name="id"
                className="bg-white h-8 w-[50%] text-black"
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            const selected = e.target.selectedOptions[0];

                            setId(Number(selected.value));
                            setUser(selected.text);
                          }}>
                    <option value="">L&apos;utilisateur</option>
                  {users.map((user: any) => {
                    if (user.role === "Livreur") {
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
                    onChange={(e) => setDate(e.target.value)}/>
                </div>

                <button type="submit" className="rounded-full bg-background hover:bg-background/40 cursor-pointer px-2">
                  Calculer
                </button>
            </form>

            {total !== null && (
                <div>
                    <p className="text-xl mt-10 font-normal">
                    Le total que {user} doit vous rendre le {date} est:
                    <span className="text-green-800 font-bold text-2xl px-2">
                        {total} DA
                    </span>
                    </p>
                </div>
            )}
        </div>
    )


}



export default DeliveryTotalForm;