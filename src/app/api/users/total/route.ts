import { NextResponse } from "next/server"
import pool from "../../../../../lib/db";

export async function GET(req: Request) {
    try {
        
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id")
        const date = searchParams.get("date")

        

        const result = await pool.query(`
            SELECT
            COALESCE (SUM(total), 0) AS total_sum
            FROM orders
            WHERE delivery_id = $1
                AND status = 'Livré'
                AND order_date >= $2::date
                AND order_date < $2::date + interval '1 day'`, [id, date])


        return NextResponse.json(result.rows[0].total_sum)


    } catch (err) {
        console.error(err)
        return NextResponse.json({error: "failed to calculate total"}, {status: 500})
    }
}