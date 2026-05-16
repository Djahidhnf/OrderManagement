import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { num } from '../../../../../lib/serialize';

const SALT_ROUNDS = 10;

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await prisma.users.findUnique({
      where: { id: Number(id) },
      select: { id: true, username: true, role: true, phone: true, salary: true },
    });

    if (!user) return NextResponse.json({}, { status: 404 });
    return NextResponse.json({ ...user, salary: num(user.salary) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({}, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { username, password, passwordConfirmation, phone, role } = body;

    if (password && password !== passwordConfirmation) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    const data: any = {};
    if (username !== undefined) data.username = username;
    if (phone !== undefined) data.phone = phone;
    if (role !== undefined) data.role = role;
    if (password) {
      data.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const user = await prisma.users.update({
      where: { id: Number(id) },
      data,
      select: { id: true, username: true, role: true, phone: true, salary: true },
    });

    return NextResponse.json({ ...user, salary: num(user.salary) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'User patch failed' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await prisma.users.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    if (err.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete user: linked to existing orders' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'User deletion failed' }, { status: 500 });
  }
}
