import { NextResponse } from "next/server"
import pool from "../../../../../lib/db";

export async function GET(req: Request) {
    try {
        
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id")
        const start = searchParams.get("start")
        const end = searchParams.get("end")

        const result = await pool.query(`
            SELECT 
            COALESCE(SUM(benefit), 0) AS total_benefit
            FROM orders
            WHERE seller_id = $1
            AND order_date >= $2
            AND order_date < $3::date + interval '1 day'
            AND status = 'Livré'`, [id, start, end])

            console.log(result.rows[0])

        return NextResponse.json(result.rows[0].total_benefit)


    } catch (err) {
        console.error(err)
        return NextResponse.json({error: "failed to calculate salary"}, {status: 500})
    }
}