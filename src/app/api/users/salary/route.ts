import { NextResponse } from "next/server"
import pool from "../../../../../lib/db";

export async function GET(req: Request) {
    try {
        
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id")
        const start = searchParams.get("start")
        const end = searchParams.get("end")

        const result = await pool.query(`
            SELECT orders.*,
                seller.username AS seller_name,
                delivery.username AS delivery_name,

                COALESCE(
                    SUM(
                    CASE 
                        WHEN orders.status = 'Livré' THEN COALESCE(orders.benefit, 0)
                        WHEN orders.status = 'Annulé' THEN -COALESCE(orders.return_fee, 0)
                        ELSE 0
                    END
                    ) OVER (), 
                0) AS total_benefit
            FROM orders

            -- seller
            LEFT JOIN users AS seller 
            ON orders.seller_id = seller.id

            -- delivery
            LEFT JOIN users AS delivery 
            ON orders.delivery_id = delivery.id

            WHERE orders.seller_id = $1
            AND orders.order_date >= $2::date
            AND orders.order_date < $3::date + interval '1 day'

            ORDER BY orders.id DESC;`, [id, start, end])



            console.log(result.rows)

        return NextResponse.json(result.rows)


    } catch (err) {
        console.error(err)
        return NextResponse.json({error: "failed to calculate salary"}, {status: 500})
    }
}