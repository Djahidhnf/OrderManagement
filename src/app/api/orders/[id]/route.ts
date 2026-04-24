import { NextResponse } from "next/server";
import pool from "../../../../../lib/db";
import { cookies } from "next/headers";


export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
    try {

        const {id} = await context.params;

        const cookieStore = cookies();
        const userId = (await cookieStore).get("userId")?.value;
        const role = (await cookieStore).get("role")?.value;

        


        
        const result = await pool.query(`
            SELECT 
                orders.id,
                orders.client_name,
                orders.client_phone1,
                orders.client_phone2,
                orders.client_wilaya,
                orders.client_address,
                orders.status,
                orders.products,
                orders.benefit,
                orders.total,
                orders.fee,
                orders.return_fee,
                TO_CHAR(orders.order_date, 'DD/MM/YYYY') AS order_date,
                d.username AS delivery_name,
                d.phone AS delivery_phone,
                s.username AS seller_name,
                s.phone AS seller_phone
            FROM orders
            LEFT JOIN users d ON orders.delivery_id = d.id
            LEFT JOIN users s ON orders.seller_id = s.id
          
            WHERE orders.id = $1
        `, [id]);

        
        return NextResponse.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        return NextResponse.json({error: "Query failed"})
    }
}






export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {



    const { id } = await context.params;
    const orderId = Number(id);

    const cookieStore = cookies();
    const role = (await cookieStore).get("role")?.value;
        
    if (!id) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const body = await req.json();

    let {
      client_name,
      client_phone1,
      client_phone2,
      client_wilaya,
      client_address,
      products,
      delivery_id,
      benefit,
      total,
      status,
      fee,
      note,
      returnFee,
    } = body;


    if (role === "Assistante" && status !== "En route" && status !== "Nouveau") {
      return NextResponse.json({error: "Denied"}, {status: 403});
    } else if (role === "Livreur" && status !== "Livré" && note === undefined) {
      return NextResponse.json({error: "Denied"}, {status: 403});
    } else if (role === "Vendeuse") {
      return NextResponse.json({error: "Denied"}, {status: 403});
    } else if (role === "Confirmatrice" && status !== "Annulé" && note === undefined) {
      return NextResponse.json({error: "Denied"}, {status: 403});
    }


    // if (delivery_id === null) {
    //   status = "Nouveau";
    // }


    const fields: string[] = [];
    const values: any[] = [];

  const now = new Date();
  const formatted = now.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
});

if (note !== undefined && role === "Livreur") {
  fields.push(`notes = COALESCE(notes, '') || $${values.length + 1}`);
  values.push(`[Liv - ${formatted}] - ${note}\n`);
} else if (note !== undefined && role === "Admin") {
  fields.push(`notes = COALESCE(notes, '') || $${values.length + 1}`);
  values.push(`[Ad - ${formatted}] - ${note}\n`);
} else if (note !== undefined && role === "Confirmatrice") {
  fields.push(`notes = COALESCE(notes, '') || $${values.length + 1}`);
  values.push(`[Cnf - ${formatted}] - ${note}\n`);
}


      if (client_name !== undefined) { fields.push(`client_name = $${values.length + 1}`); values.push(client_name); }
      if (client_phone1 !== undefined) { fields.push(`client_phone1 = $${values.length + 1}`); values.push(client_phone1); }
      if (client_phone2 !== undefined) { fields.push(`client_phone2 = $${values.length + 1}`); values.push(client_phone2); }
      if (client_wilaya !== undefined) { fields.push(`client_wilaya = $${values.length + 1}`); values.push(client_wilaya); }
      if (client_address !== undefined) { fields.push(`client_address = $${values.length + 1}`); values.push(client_address); }
      if (products !== undefined) { fields.push(`products = $${values.length + 1}`); values.push(products); }
      if (delivery_id !== undefined) { fields.push(`delivery_id = $${values.length + 1}`); values.push(delivery_id); }
      if (benefit !== undefined) { fields.push(`benefit = $${values.length + 1}`); values.push(benefit); }
      if (total !== undefined) { fields.push(`total = $${values.length + 1}`); values.push(total); }
      if (status !== undefined) { fields.push(`status = $${values.length + 1}`); values.push(status); }
      if (fee !== undefined) { fields.push(`fee = $${values.length + 1}`); values.push(fee)}
      if (returnFee !== undefined) {fields.push(`return_fee = $${values.length + 1}`); values.push(returnFee)}
    


    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    console.log(fields +'\n' + values)

    values.push(orderId);

    const query = `
      UPDATE orders
      SET ${fields.join(", ")}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    return NextResponse.json(result.rows[0], {status: 200});
    

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database update failed" }, { status: 500 });
  }
}
