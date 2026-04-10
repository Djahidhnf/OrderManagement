'use client'

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";


function AddUser() {
    const router = useRouter();

    useEffect(() => {
        async function checkAuth() {
        const res = await fetch("/api/check-session");
        if (!res.ok) router.push("/login");
        }
        checkAuth();
    }, []);

    const [username, setUsername] = useState("")
    const [phone, setPhone] = useState("")
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [role, setRole] = useState("")


    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const result = await fetch('/api/users', {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                username: username,
                password: password,
                passwordConfirmation: passwordConfirmation,
                phone: phone,
                role: role,
            })
        })

        const data = await result.json();
        if (data.error) {
            toast.error("Les mots de passe ne sont pas identiques")
            return;
        }
        
        toast.success("Utilisateur crée avec succès")
        router.push("/users")
        
    }

    function handleCancel(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();
        router.push("/users");
    }

    return (
        <>
            <Toaster position="top-center" reverseOrder={false}/>
            <div className="text-black mt-20">
                <form action="/api/users" method="POST" onSubmit={handleSubmit}>
                    <div className="bg-foreground rounded-xl p-5 w-[80%] mx-auto flex justify-between">
                        <div className="w-[45%] flex flex-col gap-y-3">
                            <input type="text" placeholder="Nom d'utilisateur *" required
                            className="bg-white h-8 px-2"
                            onChange={(e) => setUsername(e.target.value)}/>
                            <input type="password" placeholder="Mot de pass *" required
                            className="bg-white h-8 px-2"
                            onChange={(e) => setPassword(e.target.value)}/>
                            <input type="password" placeholder="Confirmer Mot de pass *" required
                            className="bg-white h-8 px-2"
                            onChange={(e) => setPasswordConfirmation(e.target.value)}/>
                        </div>
                        <div className="w-[45%] flex flex-col gap-y-3">
                            <input type="phone" placeholder="Telephone *" required
                            className="bg-white h-8 px-2"
                            onChange={(e) => setPhone(e.target.value)}/>
                            <select name="role" id="" required
                            className="bg-white h-8 px-2"
                            onChange={(e) => setRole(e.target.value)}>
                                <option value="">Selectioner le role *</option>
                                <option value="Admin">Admin</option>
                                <option value="Livreur">Livreur</option>
                                <option value="Vendeuse">Vendeuse</option>
                                <option value="Assistante">Assistante</option>
                                <option value="Confirmatrice">Confirmatrice</option>
                            </select>
                        </div>
                    </div>
                    <div className="w-[80%] mx-auto rounded-xl mt-5">
                        <button className="h-10 px-3 rounded-sm text-white bg-blue-500 cursor-pointer hover:bg-blue-500/80"
                        type="submit">Enregister</button>
                        <button className="h-10 px-3 rounded-sm text-blue-500 border border-blue-500 ml-5 cursor-pointer hover:bg-blue-500 hover:text-white"
                        onClick={(e) => handleCancel(e)}>Annuler</button>
                    </div>
                </form>
            </div>
        </>    
    )
} 




export default AddUser;