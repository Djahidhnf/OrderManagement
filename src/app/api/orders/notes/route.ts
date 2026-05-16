import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const cookieStore = cookies();
    const userId = (await cookieStore).get('userId')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const order = await prisma.orders.findUnique({
      where: { id: BigInt(id) },
      select: { notes: true },
    });

    return NextResponse.json({ notes: order?.notes ?? null });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}