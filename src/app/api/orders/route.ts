import { cookies } from "next/headers";
import pool from "../../../../lib/db";
import { NextResponse } from "next/server";


export async function GET(req: Request) {
  try {

    const cookieStore = cookies();
    const userId = (await cookieStore).get("userId")?.value;
    const role = (await cookieStore).get("role")?.value;

    if (!userId) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }
    

        let query = `
      SELECT 
        orders.*,
        TO_CHAR(orders.order_date, 'DD/MM/YYYY') AS order_date,
        users.username AS delivery_name,
        users.phone AS delivery_phone
      FROM orders
      LEFT JOIN users ON orders.delivery_id = users.id
    `;

    const values: any[] = [];

    // 🔥 Role-based filtering
    if (role === "Vendeuse") {
      query += ` WHERE orders.seller_id = $1`;
      values.push(userId);
    } 
    else if (role === "Livreur") {
      query += ` WHERE orders.delivery_id = $1`;
      values.push(userId);
    } 
    // Admin → no filter

    query += ` ORDER BY orders.id DESC`;

    const result = await pool.query(query, values);

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database query failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {    
    const body = await req.json();

      const {
        seller_id,
        client_name,
        client_phone1,
        client_phone2,
        client_wilaya,
        client_address,
        products,
        delivery_id,
        benefit,
        total,
        fee
      } = body;


    const result = await pool.query(`INSERT INTO orders (seller_id, client_name, client_phone1, client_phone2, client_wilaya, client_address, products, delivery_id, benefit, total, fee)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`, [seller_id, (client_name).toLowerCase(), client_phone1, client_phone2, client_wilaya, client_address, products, delivery_id, benefit, total, fee]);

    // 2. Add benefit to seller salary
    if (benefit) {
      await pool.query(
        `UPDATE users
         SET salary = salary + $1
         WHERE id = $2`,
        [Number(benefit), seller_id]
      );
    }

        // 3. Add fee to delivery salary
    if (delivery_id && fee) {
      await pool.query(
        `UPDATE users
         SET salary = salary + $1
         WHERE id = $2`,
        [Number(fee), delivery_id]
      );
    }

    return NextResponse.json(result.rows[0]);

  } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Database query failed" }, { status: 500 });
  }
}


export async function PATCH(req: Request) {
  try {

    const {searchParams} = new URL(req.url);
    const id = searchParams.get('id');

    const body = await req.json();
    

    if (!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

      const {
        client_name,
        client_phone1,
        client_phone2,
        client_wilaya,
        client_address,
        products,
        delivery_id,
        benefit,
        total,
      } = body;

      const fields: string[] = [];
      const values: any[] = [];

      if (client_name !== undefined) { fields.push(`client_name = $${values.length + 1}`); values.push(client_name); }
      if (client_phone1 !== undefined) { fields.push(`client_phone1 = $${values.length + 1}`); values.push(client_phone1); }
      if (client_phone2 !== undefined) { fields.push(`client_phone2 = $${values.length + 1}`); values.push(client_phone2); }
      if (client_wilaya !== undefined) { fields.push(`client_wilaya = $${values.length + 1}`); values.push(client_wilaya); }
      if (client_address !== undefined) { fields.push(`client_address = $${values.length + 1}`); values.push(client_address); }
      if (products !== undefined) { fields.push(`products = $${values.length + 1}`); values.push(products); }
      if (delivery_id !== undefined) { fields.push(`delivery_id = $${values.length + 1}`); values.push(delivery_id); }
      if (benefit !== undefined) { fields.push(`benefit = $${values.length + 1}`); values.push(benefit); }
      if (total !== undefined) { fields.push(`total = $${values.length + 1}`); values.push(total); }


      if (fields.length === 0) {
        return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
      }

      // Append the id at the end
      values.push(id);

      const query = `UPDATE orders SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING *`;
      const result = await pool.query(query, values);

      return NextResponse.json(result.rows[0]);

  } catch (err) {
    console.log(err);
    return NextResponse.json({error: "Database query failed"}, { status: 500});
  }
}


export async function DELETE(req: Request) {
  try {
    const {searchParams} = new URL(req.url);
    const id = searchParams.get('id')

    const cookieStore = cookies();
    const role = (await cookieStore).get("role")?.value;
    
    if(!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    const order = await pool.query("SELECT status FROM orders WHERE id = $1", [id]);
    const status = order.rows[0].status;



    if (
      role !== "Admin" &&
      !(role === "Vendeuse" && status === "Nouveau")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

        // Delete the order
    const result = await pool.query("DELETE FROM orders WHERE id = $1 RETURNING *", [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: result.rows[0] });

  } catch (err) {
      console.log(err);
      return NextResponse.json({error: "Database query failed"}, { status: 500});
  }
}