'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";


function UsersButton({user}: {user: any}) {


    const [open, setOpen] = useState(false)
    const router = useRouter();


    async function handleDelete(id: string) {
        await fetch(`/api/users/${id}`, {
            method: "DELETE",
            headers: {
                "Application-Type": "application/json"
            }
        });
        router.push('/users')
        toast.success("Utilisateur supprimé avec succès")
    }


    function handleModify(id: string) {
        router.push(`/users/${id}`)
    }


    return (
        <>
            <div className="flex justify-evenly items-center">
                { user.role !== "Admin" &&
                    <button className="rounded-full p-1 hover:bg-gray-600 cursor-pointer"
                    onClick={() => setOpen(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="rgba(180,0,0,1)"><path d="M17 4H22V6H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V6H2V4H7V2H17V4ZM9 9V17H11V9H9ZM13 9V17H15V9H13Z"></path></svg>
                    </button>
                }
                <button className="rounded-full p-1 hover:bg-gray-600 cursor-pointer"
                onClick={() => handleModify(user.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="rgba(55,149,245,1)"><path d="M12.8995 6.85453L17.1421 11.0972L7.24264 20.9967H3V16.754L12.8995 6.85453ZM14.3137 5.44032L16.435 3.319C16.8256 2.92848 17.4587 2.92848 17.8492 3.319L20.6777 6.14743C21.0682 6.53795 21.0682 7.17112 20.6777 7.56164L18.5563 9.68296L14.3137 5.44032Z"></path></svg>
                </button>
            </div>

            <div className={`${open ? "block" : "hidden"} fixed top-0 left-0 h-screen w-screen z-3 bg-black/50 cursor-auto`}>
                <div className={`flex flex-col justify-between bg-white text-black w-100 h-50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-4 rounded-xl`}>
                    <div className="flex flex-col items-start">
                        <button className="rounded-full hover:bg-gray-200 size-7 cursor-pointer"
                        onClick={() => setOpen(false)}>X</button>
                        <h1 className="text-center text-2xl self-center">Voulez vous Supprimer l'utilsateur {user.username}</h1>
                    </div>
                    <div className="flex justify-between">
                        <button className="w-30 h-10 px-3 cursor-pointer rounded-md bg-red-600 text-white hover:bg-red-600/80"
                        onClick={() => handleDelete(user.id)}>Supprimer</button>
                        <button className="w-30 h-10 px-3 cursor-pointer rounded-md border border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                        onClick={() => setOpen(false)}>Annuler</button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default UsersButton;