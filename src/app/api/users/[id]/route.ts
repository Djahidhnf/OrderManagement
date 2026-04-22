import { NextResponse } from "next/server";
import pool from "../../../../../lib/db";
import bcrypt from "bcrypt";
const saltRounds = 10;


export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {

    const {id} = await context.params;
    const result = await pool.query(
      `SELECT * FROM users
      WHERE users.id = $1`, [id]);

    return NextResponse.json(result.rows[0])

  } catch (err) {
    console.error(err);
    return NextResponse.json({})
  }
}



export async function PATCH(
    req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const {id} = await context.params;
    const userId = Number(id);
    const body = await req.json();

    const {username, password, passwordConfirmation, phone, role, active} = body;

    if (!id) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    if (password != passwordConfirmation) {
      return NextResponse.json({error: "passwords do not match"}, {status: 400});
    }
    


    const fields: string[] = [];
    const values: unknown[] = [];

    if (password) {
      const hash = await bcrypt.hash(password, saltRounds);
      if (password !== undefined && password !== "") { fields.push(`password = $${values.length + 1}`); values.push(hash); }
    }

      if (username !== undefined) { fields.push(`username = $${values.length + 1}`); values.push(username); }
      if (phone !== undefined) { fields.push(`phone = $${values.length + 1}`); values.push(phone); }
      if (role !== undefined) { fields.push(`role = $${values.length + 1}`); values.push(role); }
      if (active !== undefined) { fields.push(`active = $${values.length + 1}`); values.push(active);}
    

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(userId);

    const query = `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    return NextResponse.json(result.rows[0]);


  } catch (err) {
    console.error(err);
    return NextResponse.json({error: "User Patch failed"}, {status: 500})
  }

}



export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: result.rows[0] });

  } catch (err: any) {
    console.error(err);

    // 🔥 Handle foreign key constraint
    if (err.code === "23503") {
      return NextResponse.json(
        { error: "Cannot delete user: linked to existing orders" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "User deletion failed" },
      { status: 500 }
    );
  }
}