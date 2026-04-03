import { NextResponse } from "next/server";
import pool from "../../../../../lib/db";

export async function GET(req: Request) {
    try {
        const {searchParams} = new URL(req.url);
        const id = searchParams.get('id');

        const result = await pool.query(`SELECT notes FROM orders where id = $1`, [id])


        return NextResponse.json(result.rows[0]);

    } catch (err) {
        console.error(err);
        return NextResponse.json({error: "failed to fetch notes"}, {status: 500})
    }
}