'use client'

import { useRouter } from "next/navigation";
import MoreButton from "./MoreButton";
import StateButton from "./stateButton";




export default function TableRow({orders, filter, setOrders}: {orders: any[], filter: string, setOrders: any}) {
    const router = useRouter();



    function handleDoubleClick(id: number) {
      router.push(`/order/${id}`);
    }

  return (
    <>
      
      {(filter ? orders.filter(o => o.status === filter) : orders)
      .map((order) => (
        <tr key={order.id} className="hover:bg-foreground cursor-pointer" 
        onDoubleClick={() => handleDoubleClick(order.id)}>
            <td className="border border-gray-600 px-5 w-1/15 py-1">
                <MoreButton order={order} setOrders={setOrders}/>
            </td>
            <td className="border border-gray-600 px-5 w-1/16 py-1">{order.id}</td>
            <td className="border border-gray-600 px-5 w-1/16">{order.seller_name}</td>
            <td className="border border-gray-600 px-5 w-2/16 py-1">
                {order.client_name}<br/>
                {order.client_phone1} - {order.client_phone2}<br/>
                {order.client_wilaya} - {order.client_address}
            </td>
            <td className="border border-gray-600 px-5 w-3/16 py-1" style={{whiteSpace: 'pre-wrap'}}>{order.products}</td>
            <td className="border border-gray-600 px-5 w-3/16 py-1 text-xs" style={{whiteSpace: 'pre-wrap'}}>{order.notes}</td>
            <td className="border border-gray-600 px-5 w-2/16 py-1">
                {order.delivery_name}<br/>
                {order.delivery_phone}<br/>
                {order.delivery_name && order.fee + "DA"}</td>
            <td className="border border-gray-600 px-5 w-1/16 py-1">
                {order.formatted_date}
            </td>
            <td className="border border-gray-600 px-5 w-1/16 py-1">{order.total}</td>
            <td className="border border-gray-600 px-5 w-1/16 py-1">
                <StateButton state={order.status} id={order.id} />
            </td>
        </tr>
      ))}
    </>
  );
}