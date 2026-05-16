import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { toPrisma } from '../../../../../lib/status';

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const userId = (await cookieStore).get('userId')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const date = searchParams.get('date');

    if (!id || !date) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const gte = new Date(date);
    const lt = new Date(date);
    lt.setDate(lt.getDate() + 1);

    const agg = await prisma.orders.aggregate({
      _sum: { total: true },
      where: {
        delivery_id: Number(id),
        status: toPrisma('Livré') as any,
        order_date: { gte, lt },
      },
    });

    return NextResponse.json(Number(agg._sum.total ?? 0));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to calculate total' }, { status: 500 });
  }
}
