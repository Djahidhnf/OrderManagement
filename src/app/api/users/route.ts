import { NextRequest, NextResponse } from "next/server";
import pool from "../../../../lib/db";
import bcrypt from "bcrypt";
const saltRounds = 10;

export async function GET(req: Request) {
    try {

        const users = await pool.query('SELECT * FROM users ORDER BY id ASC');
        return NextResponse.json(users.rows)

    } catch (err) {
        console.error(err);
        return NextResponse.json({error: "Users query failed"}, {status: 500});
    }
}


export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {username, password, passwordConfirmation, phone, role} = body;
        const salary = 0;

        console.log(username, password, passwordConfirmation, phone, role);

        if (password != passwordConfirmation) {
            return NextResponse.json({error: "Passwords do not match"})
        }


        const hash = await bcrypt.hash(password, saltRounds);
        
        
        const result = await pool.query(`INSERT INTO users (username, password, phone, role, salary) 
        VALUES ($1, $2, $3, $4, $5) RETURNING *`, [username, hash, phone, role, salary]);
        return NextResponse.json(result.rows[0]);


    } catch (err) {
        console.error(err);
        return NextResponse.json({error: "User creation failed"}, {status: 500})
    }
}