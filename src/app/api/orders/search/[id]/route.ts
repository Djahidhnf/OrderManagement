import { NextResponse } from "next/server";
import pool from "../../../../../../lib/db";
import { cookies } from "next/headers";


// export async function GET(
//     req: Request,
//     context: { params: Promise<{ id: string }> }
// ) {
//     try {
//         const {id} = await context.params;
//         const key = id


//         if (!isNaN(Number(key))) {
//                 const result = await pool.query(`SELECT * FROM orders WHERE id = $1`, [Number(key)]);
//                 return NextResponse.json(result.rows)
//             } else {
//                 const result = await pool.query(`SELECT * FROM orders Where client_name = $1`, [(key).toLowerCase()]);
//                 return NextResponse.json(result.rows)
//             }
        
//     } catch(err) {
//         console.error(err);
//         return NextResponse.json({error: "order search failed"}, {status: 500})
//     }
// }

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

    let baseQuery = `SELECT * FROM orders`;
    const conditions: string[] = [];
    const values: any[] = [];

    // 🔍 Search condition
    if (!isNaN(Number(key))) {
      conditions.push(`id = $${values.length + 1}`);
      values.push(Number(key));
    } else {
      conditions.push(`LOWER(client_name) = $${values.length + 1}`);
      values.push(key.toLowerCase());
    }

    // 🔒 Role-based filtering
    if (role === "Vendeuse") {
      conditions.push(`seller_id = $${values.length + 1}`);
      values.push(userId);
    } else if (role === "Livreur") {
      conditions.push(`delivery_id = $${values.length + 1}`);
      values.push(userId);
    }
    // Admin → no restriction

    // Build final query
    const query = `
      ${baseQuery}
      WHERE ${conditions.join(" AND ")}
      ORDER BY id DESC
    `;

    const result = await pool.query(query, values);

    return NextResponse.json(result.rows);

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "order search failed" }, { status: 500 });
  }
}