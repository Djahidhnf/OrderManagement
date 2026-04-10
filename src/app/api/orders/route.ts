import { cookies } from "next/headers";
import pool from "../../../../lib/db";
import { NextResponse } from "next/server";


export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const userId = (await cookieStore).get("userId")?.value;
    const role = (await cookieStore).get("role")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Extract query parameters from the URL
    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    let query = `
      SELECT 
        orders.*,
        TO_CHAR(orders.order_date, 'DD/MM/YYYY') AS order_date,
        users.username AS delivery_name,
        users.phone AS delivery_phone
      FROM orders
      LEFT JOIN users ON orders.delivery_id = users.id
    `;

    const conditions: string[] = [];
    const values: any[] = [];

    // 🔥 filter by date
    if (start && end) {
      conditions.push(`
        orders.order_date >= $${values.length + 1}::date
        AND orders.order_date < $${values.length + 2}::date + interval '1 day'
      `);
      values.push(start, end);
    } else {  
      conditions.push(`
        orders.order_date >= CURRENT_DATE
        AND orders.order_date < CURRENT_DATE + interval '1 day'
      `);
    }

    // 🔒 Role-based filtering
    if (role === "Vendeuse") {
      conditions.push(`orders.seller_id = $${values.length + 1}`);
      values.push(userId);
    } else if (role === "Livreur") {
      conditions.push(`orders.delivery_id = $${values.length + 1}`);
      values.push(userId);
    } else if (role === "Confirmatrice") {
      conditions.push(`orders.client_wilaya != $${values.length + 1}`);
      values.push(`Alger`);
    }

    // Apply conditions
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY orders.id DESC`;

    const result = await pool.query(query, values);

    console.log(start, end + "///////////////////")
    console.log(result.rows) 

    return NextResponse.json(result.rows);

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database query failed" }, { status: 500 });
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