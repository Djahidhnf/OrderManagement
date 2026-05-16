import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { serializeOrder } from '../../../../../lib/serialize';

const SELLER_RELATION = 'users_orders_seller_idTousers';
const DELIVERY_RELATION = 'users_orders_delivery_idTousers';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 });

    const cookieStore = cookies();
    const userId = (await cookieStore).get('userId')?.value;
    const role = (await cookieStore).get('role')?.value;

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (role === 'Livreur') {
      return NextResponse.json({ error: 'Denied' }, { status: 403 });
    }

    const gte = new Date(date);
    const lt = new Date(date);
    lt.setDate(lt.getDate() + 1);

    const orders = await prisma.orders.findMany({
      where: {
        client_wilaya: { not: 'Alger' },
        order_date: { gte, lt },
      },
      include: {
        [SELLER_RELATION]: { select: { username: true, phone: true } },
        [DELIVERY_RELATION]: { select: { username: true, phone: true } },
      },
    });

    return NextResponse.json(orders.map(o =>
      serializeOrder(o, (o as any)[SELLER_RELATION], (o as any)[DELIVERY_RELATION])
    ));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }
}