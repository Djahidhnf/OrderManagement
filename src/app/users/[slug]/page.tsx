'use client'


import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import toast from "react-hot-toast";


function ModifyUser({ params }: { params: { slug: string } }) {
    const slug = params.slug;
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


    const [user, setUser] = useState<any>(null);


    useEffect(() => {
        async function queryUser() {
            const result = await fetch(`/api/users/${slug}`);
            const data = await result.json();
            setUser(data);
        }

        queryUser();
    }, [slug])


    useEffect(() => {
        if (!user) return;
        
        setUsername(user.username);
        setPhone(user.phone);
        setRole(user.role);

    }, [user])


    async function handleSubmit(e: React.FormEvent<HTMLFormElement>, slug: string) {
        e.preventDefault();
        await fetch(`/api/users/${slug}`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                username: username,
                password: password,
                passwordConfirmation: passwordConfirmation,
                phone: phone,
                role: role,
            })
        })
        toast.success("Utilisateur modifié avec succès")
        router.push("/users")
    }

    function handleCancel(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();
        router.push("/users");
    }

    return (
    
        <div className="text-black mt-20">
            <form action="/api/users" method="POST" onSubmit={(e) => handleSubmit(e, slug)}>
                <div className="bg-foreground rounded-xl p-5 w-[80%] mx-auto flex justify-between">
                    <div className="w-[45%] flex flex-col gap-y-3">
                        <input type="text" placeholder="Nom d'utilisateur *" required
                        className="bg-white h-8 px-2"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}/>
                        <input type="password" placeholder="Mot de pass"
                        className="bg-white h-8 px-2"
                        onChange={(e) => setPassword(e.target.value)}/>
                        <input type="password" placeholder="Confirmer Mot de pass"
                        className="bg-white h-8 px-2"
                        onChange={(e) => setPasswordConfirmation(e.target.value)}/>
                    </div>
                    <div className="w-[45%] flex flex-col gap-y-3">
                        <input type="phone" placeholder="Telephone *" required
                        className="bg-white h-8 px-2"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}/>
                        <select name="role" id="" required
                        className="bg-white h-8 px-2"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}>
                            <option value="">Selectioner le role *</option>
                            <option value="Admin">Admin</option>
                            <option value="Livreur">Livreur</option>
                            <option value="Vendeuse">Vendeuse</option>
                            <option value="Assistante">Assistante</option>
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
    )
} 




export default ModifyUser;