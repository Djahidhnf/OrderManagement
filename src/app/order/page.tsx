'use client'

import { useRouter } from "next/navigation"
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Order() {
    const router = useRouter();
    const [user, setUser] = useState<{userId: number, role: string} | null>(null)
    const [authorized, setAuthorized] = useState<boolean | null>(null)

    useEffect(() => {
        async function checkAuth() {
            const res = await fetch("/api/check-session");

            if (!res.ok) {
                router.push("/login");
                return;
            }

            const data = await res.json();

            setUser({ userId: Number(data.userId), role: data.role });

            // ✅ FIXED LOGIC
            if (data.role === "Admin" || data.role === "Vendeuse") {
                setAuthorized(true);
            } else {
                setAuthorized(false);
            }
        }

        checkAuth();
    }, [router]);

    // ✅ Compute sellerID directly from user instead of using another useEffect
    const sellerID = user && (user.role === "Admin" || user.role === "Vendeuse") 
        ? Number(user.userId) 
        : null;

    const [clientName, setClientName] = useState("");
    const [clientPhone1, setClientPhone1] = useState("");
    const [clientPhone2, setClientPhone2] = useState("");
    const [clientWilaya, setClientWilaya] = useState("Alger")
    const [clientAddress, setClientAddress] = useState("");
    const [products, setProducts] = useState("");
    const [deliveryID, setDeliveryID] = useState<number | null>(null);
    const [price, setPrice] = useState(0)
    const [benefit, setBenefit] = useState(0);
    const [deliveryFee, setDeliveryFee] = useState(0);
    
    const [users, setUsers] = useState<unknown>([]);
    
    const total = Number(price) + Number(benefit) + Number(deliveryFee)
    
    const wilayas = ["Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Bejaia","Biskra","Bechar","Blida","Bouira","Tamanrasset","Tebessa","Tlemcen","Tiaret","Tizi Ouzou","Alger",
        "Djelfa","Jijel","Setif","Saida","Skikda","Sidi Bel Abbes","Annaba","Guelma","Constantine","Medea","Mostaganem","M'Sila","Mascara","Ouargla","Oran","El Bayadh","Illizi",
        "Bordj Bou Arreridj","Boumerdes","El Tarf","Tindouf","Tissemsilt","El Oued","Khenchela","Souk Ahras","Tipaza","Mila","Ain Defla","Naama","Ain Temouchent","Ghardaia","Relizane",
        "Timimoun","Bordj Badji Mokhtar","Ouled Djellal","Beni Abbes","In Salah","In Guezzam","Touggourt","Djanet","El M'Ghair","El Meniaa"];

    function handleCancel(e: React.MouseEvent) {
        e.preventDefault();
        router.push("/");
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        await fetch('/api/orders', {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                seller_id: sellerID,
                client_name: clientName,
                client_phone1: clientPhone1,
                client_phone2: clientPhone2,
                client_wilaya: clientWilaya,
                client_address: clientAddress,
                products: products,
                delivery_id: deliveryID,
                benefit: benefit,
                total: total,
                fee: deliveryFee,
            })
        })

        toast.success('Commande créé avec succès');
        router.push('/')
    }
    
    useEffect(() => {
        async function queryUsers() {
            const result = await fetch('/api/users');
            const data = await result.json();
            setUsers(data);
        }
        queryUsers();
    }, [])
    
    if (authorized === null) return <div>Loading...</div>;

    if (!authorized) {
        return (
            <div className="text-2xl font-bold text-white text-center mx-auto mt-50">
                <h1>Accès restreint</h1>
            </div>
        );
    }

    
    return (
        <>
            <div className="text-black mt-20 mb-10">
                
                <form action="/api/orders" method="POST" onSubmit={handleSubmit}>

                    <div className="bg-foreground rounded-xl p-5 w-[80%] mx-auto">
                        <h1 className="text-white text-2xl mb-5">Infos Client</h1>
                        <div className="w-full flex justify-between mb-5">
                            <input type="text" placeholder="Nom & prenom du destinataire *" name="clientName" required
                            className="bg-white w-[40%] h-8 px-2" 
                            onChange={(e) => setClientName(e.target.value)}/>
                            <div className="w-[50%] flex justify-between">
                                <input type="tel" placeholder="Telephone 1 *" name="clientPhone1" required
                                className="bg-white h-8 px-2 w-[45%]"
                                onChange={(e) => setClientPhone1(e.target.value)}/>
                                <input type="tel" placeholder="Telephone 2" name="clientPhone2"
                                className="bg-white h-8 px-2 w-[45%]" 
                                onChange={(e) => setClientPhone2(e.target.value)}/>
                            </div>
                        </div>
                        <div className="w-full flex justify-between">
                            <select name="wilaya" id="" defaultValue="Alger"
                            className="bg-white w-[40%] h-8 px-2"
                            onChange={(e) => setClientWilaya(e.target.value) }>
                                {wilayas.map(wilaya => (
                                    <option value={wilaya} key={wilaya}>{wilaya}</option>
                                ))}
                            </select>
                            <input type="text" placeholder="Addresse *" name="clientAddress" required
                            className="bg-white w-[50%] h-8 px-2"
                            onChange={(e) => setClientAddress(e.target.value)} />
                        </div>
                    </div>

                    <div className="bg-foreground rounded-xl p-5 my-5 w-[80%] mx-auto">
                        <h1 className="text-white text-2xl mb-5">Infos Commande</h1>
                        <textarea placeholder="Produits *" name="products" required
                        className="bg-white w-full px-2 h-20 "
                        onChange={(e) => setProducts(e.target.value)}>

                        </textarea>
                        <div className="w-[40%] flex justify-between my-5">
                            <input type="number" placeholder="Prix *" name="price" required
                            className="w-[40%] h-8  px-2 bg-white"
                            onChange={(e) => setPrice(Number(e.target.value))}/>
                            <input type="number" placeholder="Bénéfice" name="benefit"
                            className="w-[40%] h-8  px-2 bg-white"
                            onChange={(e) => setBenefit(Number(e.target.value))}/>
                        </div>
                        <div className="flex w-[40%]">
                            <div className="bg-background text-white h-8 px-3 w-50 rounded-l-md flex items-center">
                                <p>Total a collecter</p>
                            </div>
                            <input type="number" placeholder="Total a payer *" name="total" required
                            className="w-full h-8 px-2 bg-white"
                            value={total} readOnly/>
                        </div>
                    </div>

                    <div className="bg-foreground rounded-xl p-5 my-5 w-[80%] mx-auto flex flex-col gap-y-5">
                        <h1 className="text-white text-2xl mb-5">Infos Livreur</h1>
                        <select name="delivery" id=""
                        className="w-[40%] bg-white px-2 h-8"
                        onChange={(e) => setDeliveryID(Number(e.target.value))}
                        disabled={user?.role === "Vendeuse"}>
                            <option value="">Selectionez un Livreur</option>
                            <option value="null">aucun</option>
                            {users.map((user) => {
                                if (user.role == "Livreur") {
                                    return (
                                        <option key={user.id} value={user.id}>{user.username}</option>
                                    )
                                }
                            })}
                        </select>

                        <select name="fee" id=""
                        className="w-fit bg-white px-2 h-8"
                        onChange={(e) => setDeliveryFee(Number(e.target.value))}
                        disabled={user?.role === "Vendeuse"}>
                            <option value="">Tarif Livraison</option>
                            <option value="500">500 DA</option>
                            <option value="600">600 DA</option>
                        </select>
                    </div>

                    <div className="w-[80%] mx-auto rounded-xl">
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