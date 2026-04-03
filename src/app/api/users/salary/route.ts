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
                COALESCE(SUM(
                    CASE 
                    WHEN status = 'Livré' THEN COALESCE(benefit)
                    WHEN status = 'Annulé' THEN -COALESCE(return_fee)
                    ELSE 0
                    END
                ), 0) AS total_benefit
                FROM orders
                WHERE seller_id = $1
                AND order_date >= $2::date
                AND order_date < $3::date + interval '1 day'`, [id, start, end])

            console.log(result.rows[0])

        return NextResponse.json(result.rows[0].total_benefit)


    } catch (err) {
        console.error(err)
        return NextResponse.json({error: "failed to calculate salary"}, {status: 500})
    }
}