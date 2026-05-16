import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { num } from '../../../../lib/serialize';

const SALT_ROUNDS = 10;

export async function GET() {
  try {
    const users = await prisma.users.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true, username: true, role: true,
        salary: true, phone: true,
      },
    });

    return NextResponse.json(
      users.map(u => ({ ...u, salary: num(u.salary) }))
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Users query failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { username, password, passwordConfirmation, phone, role } = await req.json();

    if (password !== passwordConfirmation) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.users.create({
      data: { username, password: hash, phone: phone ?? null, role, salary: 0 },
      select: { id: true, username: true, role: true, phone: true, salary: true },
    });

    return NextResponse.json({ ...user, salary: num(user.salary) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
  }
}