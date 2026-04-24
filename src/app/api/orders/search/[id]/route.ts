import { NextResponse } from "next/server";
import pool from "../../../../../../lib/db";
import { cookies } from "next/headers";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const key = id;

    const cookieStore = cookies();
    const userId = (await cookieStore).get("userId")?.value;
    const role = (await cookieStore).get("role")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Updated query with JOINs to get seller and delivery info
    const baseQuery = `
      SELECT 
        orders.*,
        TO_CHAR(orders.order_date, 'DD/MM/YYYY') AS order_date_formatted,
        seller.username AS seller_name,
        seller.phone AS seller_phone,
        delivery.username AS delivery_name,
        delivery.phone AS delivery_phone
      FROM orders
      LEFT JOIN users AS seller ON orders.seller_id = seller.id
      LEFT JOIN users AS delivery ON orders.delivery_id = delivery.id
    `;
    
    const conditions: string[] = [];
    const values: any[] = [];

    // 🔍 Search condition
    if (key.length < 5) {
      conditions.push(`orders.id = $${values.length + 1}`);
      values.push(Number(key));
    } else {
      conditions.push(`(
        orders.client_phone1 = $${values.length + 1}
        OR orders.client_phone2 = $${values.length + 1}
      )`);
      values.push(key);
    }

    // 🔒 Role-based filtering
    if (role === "Vendeuse") {
      conditions.push(`orders.seller_id = $${values.length + 1}`);
      values.push(userId);
    } else if (role === "Livreur") {
      conditions.push(`orders.delivery_id = $${values.length + 1}`);
      values.push(userId);
    }
    // Admin → no restriction

    // Build final query
    const query = `
      ${baseQuery}
      WHERE ${conditions.join(" AND ")}
      ORDER BY orders.id DESC
    `;
      
    const result = await pool.query(query, values);
    console.log(result.rows);

    return NextResponse.json(result.rows);

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "order search failed" }, { status: 500 });
  }
}