'use client'

type Props = {
  filter: string;
  setFilter: React.Dispatch<React.SetStateAction<string>>;
  counts: Record<string, number>;
};

function OrderFilter({ filter, setFilter, counts }: Props) {
  const fmt = (key: string) => counts[key] !== undefined ? ` (${counts[key]})` : '';

  return (
    <ul className="flex lg:justify-between items-end w-full lg:w-120 gap-x-3 text-gray-400">
      <li className={`${filter === "" ? "text-white" : ""} cursor-pointer`}
      onClick={() => setFilter("")}>Tout{fmt('')}</li>
      <li className={`${filter === "Nouveau" ? "text-white" : ""} cursor-pointer`}
      onClick={() => setFilter("Nouveau")}>Nouveaux{fmt('Nouveau')}</li>
      <li className={`${filter === "En route" ? "text-white" : ""} cursor-pointer`}
      onClick={() => setFilter("En route")}>En route{fmt('En route')}</li>
      <li className={`${filter === "Livré" ? "text-white" : ""} cursor-pointer`}
      onClick={() => setFilter("Livré")}>Livré{fmt('Livré')}</li>
      <li className={`${filter === "Annulé" ? "text-white" : ""} cursor-pointer`}
      onClick={() => setFilter("Annulé")}>Annulé{fmt('Annulé')}</li>
    </ul>
  );
}

export default OrderFilter;
