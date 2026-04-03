'use client'
import { useRouter } from "next/navigation"
import React, { use, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Order({ params }: { params: { slug: string } }) {
  const slug = params.slug;
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
          if (data.role === "Admin" || data.role === "Assistante") {
            setAuthorized(true);
          } else {
            setAuthorized(false);
          }
        }
    
        checkAuth();
      }, []);

    const [order, setOrder] = useState<any>(null);
    const safeNumber = (value: any) => Number(value ?? 0);


    useEffect(() => {
        
        async function queryData() {
            const result = await fetch(`/api/orders/${params.slug}`);
            if (!result.ok) {
            console.error("Failed to fetch order");
            return;
            }

            const data = await result.json();
            setOrder(data);
            console.log(data)
        }
        
        queryData();
    }, [slug])
        
        const [clientName, setClientName] = useState("");
        const [clientPhone1, setClientPhone1] = useState("");
        const [clientPhone2, setClientPhone2] = useState("");
        const [clientWilaya, setClientWilaya] = useState("")
        const [clientAddress, setClientAddress] = useState("");
        const [products, setProducts] = useState("");
        const [deliveryID, setDeliveryID] = useState<number | null>(null);
        const [benefit, setBenefit] = useState(0);
        const [price, setPrice] = useState(0);
        const [status, setStatus] = useState("");
        const [fee, setFee] = useState(0);
        const [returnFee, setReturnFee] = useState(0);

        const total = price + benefit + fee;
        const [users, setUsers] = useState<any[]>([])


useEffect(() => {
    if (!order) return;

    setClientName(order.client_name);
    setClientPhone1(order.client_phone1);
    setClientPhone2(order.client_phone2);
    setClientWilaya(order.client_wilaya);
    setClientAddress(order.client_address);
    setProducts(order.products);
    setFee(safeNumber(order.fee))
    setDeliveryID(order.delivery_id ?? null);
    setStatus(order.status);
    setReturnFee(safeNumber(order.return_fee))
    

    setBenefit(safeNumber(order.benefit));
    setPrice(safeNumber(order.total) - Number(order.benefit) - Number(order.fee));


    console.log(fee);

}, [order]);

    
    
    const wilayas = ["Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Bejaia","Biskra","Bechar","Blida","Bouira","Tamanrasset","Tebessa","Tlemcen","Tiaret","Tizi Ouzou","Alger",
        "Djelfa","Jijel","Setif","Saida","Skikda","Sidi Bel Abbes","Annaba","Guelma","Constantine","Medea","Mostaganem","M'Sila","Mascara","Ouargla","Oran","El Bayadh","Illizi",
        "Bordj Bou Arreridj","Boumerdes","El Tarf","Tindouf","Tissemsilt","El Oued","Khenchela","Souk Ahras","Tipaza","Mila","Ain Defla","Naama","Ain Temouchent","Ghardaia","Relizane",
        "Timimoun","Bordj Badji Mokhtar","Ouled Djellal","Beni Abbes","In Salah","In Guezzam","Touggourt","Djanet","El M'Ghair","El Meniaa"];


    


    function handleCancel(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();
        router.push("/");
    }


    async function handleSubmit(e: React.FormEvent<HTMLFormElement>, id: any) {
        e.preventDefault();

        const res = await fetch(`/api/orders/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_name: clientName,
                client_phone1: clientPhone1,
                client_phone2: clientPhone2,
                client_wilaya: clientWilaya,
                client_address: clientAddress,
                products: products,
                delivery_id: deliveryID,
                benefit: benefit,
                total: total,
                status: status,
                fee: fee,
                returnFee: returnFee,
            })
        });

        const data = await res.json();

        if (!res.ok) {
            toast.error(data.error || "Erreur");
            return;
        }

        toast.success("Commande modifiée avec succès");
        router.push("/");
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
                
                <form onSubmit={(e) => handleSubmit(e, slug)}>

                    <div className="bg-foreground rounded-xl p-5 w-[80%] mx-auto">
                        <h1 className="text-white text-2xl mb-5">Infos Client</h1>
                        <div className="w-full flex justify-between mb-5">
                            <input type="text" placeholder="Nom & prenom du destinataire *" name="clientName" required
                            className="bg-white w-[40%] h-8 px-2" 
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}/>
                            <div className="w-[50%] flex justify-between">
                                <input type="tel" placeholder="Telephone 1 *" name="clientPhone1" required
                                className="bg-white h-8 px-2 w-[45%]"
                                value={clientPhone1}
                                onChange={(e) => setClientPhone1(e.target.value)}/>
                                <input type="tel" placeholder="Telephone 2" name="clientPhone2"
                                className="bg-white h-8 px-2 w-[45%]" 
                                value={clientPhone2}
                                onChange={(e) => setClientPhone2(e.target.value)}/>
                            </div>
                        </div>
                        <div className="w-full flex justify-between">
                            <select name="wilaya" id=""
                            className="bg-white w-[40%] h-8 px-2"
                            onChange={(e) => setClientWilaya(e.target.value) }
                            value={clientWilaya}>
                                {wilayas.map(wilaya => (
                                    <option value={wilaya} key={wilaya}>{wilaya}</option>
                                ))}
                            </select>
                            <input type="text" placeholder="Addresse *" name="clientAddress" required
                            className="bg-white w-[50%] h-8 px-2"
                            value={clientAddress}
                            onChange={(e) => setClientAddress(e.target.value)} />
                        </div>
                    </div>

                    <div className="bg-foreground rounded-xl p-5 my-5 w-[80%] mx-auto">
                        <h1 className="text-white text-2xl mb-5">Infos Commande</h1>
                        <textarea placeholder="Produits *" name="products" required
                        className="bg-white w-full px-2 h-20 "
                        value={products}
                        onChange={(e) => setProducts(e.target.value)}/>
                        <div className="w-[40%] flex justify-between my-5">
                            <input type="number" placeholder="Prix *" name="price" required
                            className="w-[40%] h-8  px-2 bg-white"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}/>
                            <input type="number" placeholder="Bénéfice" name="benefit"
                            className="w-[40%] h-8  px-2 bg-white"
                            value={benefit}
                            onChange={(e) => setBenefit(Number(e.target.value))}/>
                        </div>
                        <div>
                            <input type="number" placeholder="Total a ramasser *" name="total" required
                            className="w-[40%] h-8 px-2 bg-white"
                            value={total} readOnly/>
                        </div>
                    </div>

                    <div className="bg-foreground rounded-xl p-5 my-5 w-[80%] mx-auto flex flex-col gap-y-5">
                        <h1 className="text-white text-2xl mb-5">Infos Livreur</h1>
                        <select
                            className="w-[40%] bg-white px-2 h-8"
                            onChange={(e) => {
                                const value = e.target.value;
                                setDeliveryID(value === "" ? null : Number(value));
                            }}
                            value={deliveryID ?? ""}
                            >
                            <option value="">Selectionez un Livreur</option>
                            {users
                                .filter(user => user.role === "Livreur")
                                .map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.username}
                                </option>
                                ))}
                        </select>

                        <select name="fees" id=""
                        className="w-[15%] bg-white px-2 h-8"
                        value={fee?? ""}
                        onChange={(e) => setFee(Number(e.target.value))}>
                            <option value="">Frais Livraison</option>
                            <option value="500">500 DA</option>
                            <option value="600">600 DA</option>
                        </select>

                    </div>

                    { user?.role === "Admin" && 
                        <div className="bg-foreground rounded-xl p-5 my-5 w-[80%] mx-auto flex flex-col gap-y-5">
                            <h1 className="text-white text-2xl mb-5">Frais Retour</h1>
                            <select name="returnCharges" id="" 
                            className="w-[15%] bg-white px-2 h-8"
                            value={returnFee?? ""}
                            onChange={(e) => setReturnFee(Number(e.target.value))}>
                                <option value="">Frais Retour</option>
                                <option value="200">-200 DA</option>
                                <option value="500">-500 DA</option>
                            </select>
                        </div>
                    }

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