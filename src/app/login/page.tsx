'use client'

import { useRouter } from "next/navigation";
import { useState } from "react";

function login() {

    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        const res = await fetch(`/api/login`, {
            method: "POST",
            headers: {
                "Application-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        })

        const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    router.push("/");
    }


    return (
        <div className="bg-background h-screen w-screen text-black absolute z-20">
            <form className="h-100 w-[90%] lg:w-120 bg-foreground rounded-md absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col justify-evenly"
            onSubmit={handleLogin}>
                <div className="flex flex-col items-center gap-y-5">
                    <h1 className="text-3xl text-white mb-10">Ce Connecter</h1>
                    <input type="text" name="username" placeholder="Nom d'utilisateur *" required
                    className="h-8 bg-white px-2 w-[80%]"
                    onChange={(e) => setUsername(e.target.value)}/>
                    <input type="password" name="password" placeholder="Mot de passe *" required 
                    className="h-8 bg-white px-2 w-[80%]"
                    onChange={(e) => setPassword(e.target.value)}/>
                </div>
                <div className="flex justify-center">
                    <button className="bg-blue-600 text-white hover:bg-blue-600/80 cursor-pointer h-8 px-3 w-[80%] rounded-sm">Connecter</button>
                </div>
            </form>
        </div>
    )
}



export default login;