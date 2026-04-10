'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";


function UsersButton({user}: {user: any}) {

    const [openDelete, setOpenDelete] = useState(false)
    const [openActive, setOpenActive] = useState(false)
    const router = useRouter();


    async function handleActive(id: string) {
        await fetch(`/api/users/${id}`, {
            method: "PATCH",
            headers: {"Application-Type": "application/json"},
            body: JSON.stringify({
                active: !user.active
            })
        });
        router.push('/users')
        toast.success(`${user.username} est ${!user.active? "active" : "inactive"}`)
        setOpenActive(false)
    }


    async function handleDelete(id: string) {
        await fetch(`/api/users/${id}`, {
            method: "DELETE",
            headers: {"Application-Type": "application/json"}
        })
        router.refresh();
        toast.success(`${user.username} est supprimé`)
    }


    function handleModify(id: string) {
        router.push(`/users/${id}`)
    }


    return (
        <>
            <div className="flex justify-evenly items-center">
                { user.role !== "Admin" &&
                    <>
                        <button className="rounded-full p-1 hover:bg-gray-600 cursor-pointer"
                        onClick={() => setOpenDelete(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="rgba(208,0,0,1)"><path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM9 11V17H11V11H9ZM13 11V17H15V11H13ZM9 4V6H15V4H9Z"></path></svg>
                        </button>

                        <button className="rounded-full p-1 hover:bg-gray-600 cursor-pointer"
                        onClick={() => setOpenActive(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="rgba(58,120,250,1)"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM17.4571 9.45711L11 15.9142L6.79289 11.7071L8.20711 10.2929L11 13.0858L16.0429 8.04289L17.4571 9.45711Z"></path></svg>
                        </button>
                    </>
                }

                <button className="rounded-full p-1 hover:bg-gray-600 cursor-pointer"
                onClick={() => handleModify(user.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="rgba(55,149,245,1)"><path d="M12.8995 6.85453L17.1421 11.0972L7.24264 20.9967H3V16.754L12.8995 6.85453ZM14.3137 5.44032L16.435 3.319C16.8256 2.92848 17.4587 2.92848 17.8492 3.319L20.6777 6.14743C21.0682 6.53795 21.0682 7.17112 20.6777 7.56164L18.5563 9.68296L14.3137 5.44032Z"></path></svg>
                </button>         
            </div>



            <div className={`${openActive ? "block" : "hidden"} fixed top-0 left-0 h-screen w-screen z-3 bg-black/50 cursor-auto`}>
                <div className={`flex flex-col justify-between bg-white text-black w-100 h-50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-4 rounded-xl`}>
                    <div className="flex flex-col items-start">
                        <button className="rounded-full hover:bg-gray-200 size-7 cursor-pointer"
                        onClick={() => setOpenActive(false)}>X</button>
                        <h1 className="text-center text-2xl self-center">{user.active? `Voulez vous Desactiver l'utilisateur ${user.username}` : `Voulez vous Activer l'utilisateur ${user.username}`}</h1>
                    </div>
                    <div className="flex justify-between">
                        <button className="w-30 h-10 px-3 cursor-pointer rounded-md bg-blue-600 text-white hover:bg-blue-600/80"
                        onClick={() => handleActive(user.id)}>{user.active? "Desactiver" : "Activer"}</button>
                        <button className="w-30 h-10 px-3 cursor-pointer rounded-md border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                        onClick={() => setOpenActive(false)}>Annuler</button>
                    </div>
                </div>
            </div>

            <div className={`${openDelete ? "block" : "hidden"} fixed top-0 left-0 h-screen w-screen z-3 bg-black/50 cursor-auto`}>
                <div className={`flex flex-col justify-between bg-white text-black w-100 h-50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-4 rounded-xl`}>
                    <div className="flex flex-col items-start">
                        <button className="rounded-full hover:bg-gray-200 size-7 cursor-pointer"
                        onClick={() => setOpenActive(false)}>X</button>
                        <h1 className="text-center text-2xl self-center">Voulez vous supprimer {user.username}</h1>
                    </div>
                    <div className="flex justify-between">
                        <button className="w-30 h-10 px-3 cursor-pointer rounded-md bg-red-600 text-white hover:bg-red-600/80"
                        onClick={() => handleDelete(user.id)}>Supprimer</button>
                        <button className="w-30 h-10 px-3 cursor-pointer rounded-md border border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                        onClick={() => setOpenDelete(false)}>Annuler</button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default UsersButton;