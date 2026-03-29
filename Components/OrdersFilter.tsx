'use client'

import { useState } from "react";

type Props = {
  filter: string;
  setFilter: React.Dispatch<React.SetStateAction<string>>;
};

function OrderFilter({ filter, setFilter }: Props) {

    console.log()



    return (
          <ul className="flex lg:justify-between items-end w-full lg:w-120 gap-x-3 text-gray-400">
            <li className={`${filter === ""? "text-white" : ""} cursor-pointer`}
            onClick={() => setFilter("")}>Tout</li>
            <li className={`${filter === "Nouveau"? "text-white" : ""} cursor-pointer`}
            onClick={() => setFilter("Nouveau")}>Nouveaux</li>
            <li className={`${filter === "En route"? "text-white" : ""} cursor-pointer`}
            onClick={() => setFilter("En route")}>En route</li>
            <li className={`${filter === "Livré"? "text-white" : ""} cursor-pointer`}
            onClick={() => setFilter("Livré")}>Livré</li>
            <li className={`${filter === "Annulé"? "text-white" : ""} cursor-pointer`}
            onClick={() => setFilter("Annulé")}>Annulé</li>
          </ul>
    )
}


export default OrderFilter;