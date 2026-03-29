// lib/auth.ts
import { cookies } from "next/headers";
import pool from "./db";

export async function getUser() {
  const userId = (await cookies()).get("userId")?.value;

  if (!userId) return null;

  const result = await pool.query(
    `SELECT id, username, role FROM users WHERE id = $1`,
    [userId]
  );

  return result.rows[0] || null;
}



// // lib/auth.ts
// import { cookies } from "next/headers";
// import jwt from "jsonwebtoken";
// import pool from "./db";

// export async function getUser() {
//   const token = (await cookies()).get("session")?.value;

//   if (!token) return null;

//   try {
//     const decoded = jwt.verify(token, process.env.SESSION_SECRET!) as {
//       userId: number;
//     };

//     const result = await pool.query(
//       `SELECT id, username, role FROM users WHERE id = $1`,
//       [decoded.userId]
//     );

//     return result.rows[0] || null;

//   } catch {
//     return null;
//   }
// }