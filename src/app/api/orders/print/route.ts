import { NextResponse } from "next/server";
import pool from "../../../../../lib/db";
import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        const {searchParams} = new URL(req.url);
        const date = searchParams.get('date');

        const cookieStore = cookies();
        const role = (await cookieStore).get("role")?.value;

        if (role === 'Livreur') {
            return NextResponse.json({error: "Denied"}, {status: 403});
        }
        
        const result = await pool.query(`
        SELECT 
            orders.*,
            users.username AS delivery_name,
            users.phone AS delivery_phone
        FROM orders
        LEFT JOIN users ON orders.delivery_id = users.id
        WHERE orders.client_wilaya != 'Alger'
        AND orders.order_date >= $1::date
        AND orders.order_date < $1::date + interval '1 day'
        `, [date]);

        return NextResponse.json(result.rows);

    } catch (err) {
        console.error(err);
        return NextResponse.json({error: "query failed"}, {status: 500})
    }
}