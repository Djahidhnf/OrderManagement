'use client'

import { useEffect, useState } from "react";

function SalaryForm({users}: {users: any[]}) {

    const [salary, setSalary] = useState<number | null>(null);
    const [id, setId] = useState<number | null>(null);
    const [user, setUser] = useState<string>("")
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("")

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const res = await fetch(`/api/users/salary?id=${id}&start=${start}&end=${end}`)
        const data = await res.json()
        setSalary(data)
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
                    <option value="">L'utilisateur</option>
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
                <div>
                    <p className="text-xl mt-10 font-normal">
                    Le Salaire de {user} du {start} jusqu'au {end} est:
                    <span className="text-green-800 font-bold text-2xl px-2">
                        {salary} DA
                    </span>
                    </p>
                </div>
                )}
              
        </div>
    )
}


export default SalaryForm;
