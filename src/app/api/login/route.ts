import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const user = await prisma.users.findUnique({ where: { username } });

    if (!user) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set({ name: 'userId', value: String(user.id), httpOnly: true, path: '/', maxAge: 60 * 60 * 24, sameSite: 'lax' });
    res.cookies.set('role', String(user.role), { httpOnly: true, path: '/' });
    res.cookies.set('username', user.username, { httpOnly: true, path: '/' });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}