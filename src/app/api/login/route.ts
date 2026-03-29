import bcrypt from "bcrypt";
import pool from "../../../../lib/db";
import { NextResponse } from "next/server";

import { cookies } from "next/headers";
import crypto from "crypto";

export async function POST(req: Request) {
    try {

        const { username, password } = await req.json();
        
        const result = await pool.query(
            `SELECT * FROM users WHERE username = $1`,
            [username]
        );
        
        const user = result.rows[0];
        
        if (!user) {
            return Response.json({ error: "Invalid credentials" }, { status: 401 });
        }
        
        const valid = await bcrypt.compare(password, user.password);
        
        if (!valid) {
            return Response.json({ error: "Invalid credentials" }, { status: 401 });
        }
        
        const res = NextResponse.json({ ok: true });

        // Set HTTP-only cookie
        res.cookies.set({
            name: "userId",
            value: String(user.id),
            httpOnly: true,   // <- prevents client JS access
            path: "/",        // accessible on all routes
            maxAge: 60 * 60 * 24, // 1 day
            sameSite: "lax",  // optional but recommended
        });

        res.cookies.set("role", user.role, { httpOnly: true, path: "/" });
        res.cookies.set("username", user.username, {httpOnly: true, path: "/"});

        return res;
            } catch (err) {
                console.log(err)
                return NextResponse.json({error: "Authentication failed"}, {status: 500})
            }
}