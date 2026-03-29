import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  (await cookies()).delete("userId");
  (await cookies()).delete("role");
  (await cookies()).delete("username")
  return NextResponse.json({ ok: true });
}