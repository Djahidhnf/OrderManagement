'use client'
import { useRouter } from "next/navigation";


function AddButton(path: {path: string}) {
    
    const router = useRouter();

    function handleAddButton() {
        router.push(`${path.path}`);
    }

    return (
        <button className="text-xl text-white bg-blue-500 px-5 py-2 rounded-sm cursor-pointer hover:bg-blue-500/80"
        onClick={() => handleAddButton()}>Ajouter</button>
    );
}





export default AddButton;