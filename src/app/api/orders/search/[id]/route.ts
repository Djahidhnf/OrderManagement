import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { serializeOrder } from '../../../../../../lib/serialize';

const SELLER_RELATION = 'users_orders_seller_idTousers';
const DELIVERY_RELATION = 'users_orders_delivery_idTousers';

const ORDER_INCLUDE = {
  [SELLER_RELATION]: { select: { username: true, phone: true } },
  [DELIVERY_RELATION]: { select: { username: true, phone: true } },
} as const;

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: key } = await context.params;
    const cookieStore = cookies();
    const userId = (await cookieStore).get('userId')?.value;
    const role = (await cookieStore).get('role')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Heuristic: short keys are order IDs, longer ones are phone numbers
    const searchWhere = key.length < 5
      ? { id: BigInt(key) }
      : { OR: [{ client_phone1: key }, { client_phone2: key }] };

    // Role filter
    const roleWhere: any = {};
    if (role === 'Vendeuse') roleWhere.seller_id = Number(userId);
    else if (role === 'Livreur') roleWhere.delivery_id = Number(userId);

    const orders = await prisma.orders.findMany({
      where: { ...searchWhere, ...roleWhere },
      include: ORDER_INCLUDE,
      orderBy: { id: 'desc' },
    });

    return NextResponse.json(orders.map(o =>
      serializeOrder(o, (o as any)[SELLER_RELATION], (o as any)[DELIVERY_RELATION])
    ));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Order search failed' }, { status: 500 });
  }
}