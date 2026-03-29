// app/api/check-session/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
      const cookies = Object.fromEntries(
        cookieHeader
          .split("; ")
          .map(c => c.split("="))
          .map(([k, v]) => [k, decodeURIComponent(v)])
      );

      const userId = cookies["userId"];
      const username = cookies["username"];  // store username at login
      const role = cookies["role"];

      if (!userId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }

      return NextResponse.json({ userId, username, role });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to verify session" }, { status: 500 });
  }
}
