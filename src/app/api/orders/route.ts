import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { serializeOrder } from '../../../../lib/serialize';

// Exact relation field names from prisma/schema.prisma
const SELLER_RELATION = 'users_orders_seller_idTousers';
const DELIVERY_RELATION = 'users_orders_delivery_idTousers';

const ORDER_INCLUDE = {
  [SELLER_RELATION]: { select: { username: true, phone: true } },
  [DELIVERY_RELATION]: { select: { username: true, phone: true } },
} as const;

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const userId = (await cookieStore).get('userId')?.value;
    const role = (await cookieStore).get('role')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    // Date range: provided or default to today
    let gte: Date;
    let lt: Date;
    if (start && end) {
      gte = new Date(start);
      lt = new Date(end);
      lt.setDate(lt.getDate() + 1);
    } else {
      gte = new Date();
      gte.setHours(0, 0, 0, 0);
      lt = new Date(gte);
      lt.setDate(lt.getDate() + 1);
    }

    // Role-based filter
    const roleWhere: any = {};
    if (role === 'Vendeuse') roleWhere.seller_id = Number(userId);
    else if (role === 'Livreur') roleWhere.delivery_id = Number(userId);
    else if (role === 'Confirmatrice') roleWhere.client_wilaya = { not: 'Alger' };

    const orders = await prisma.orders.findMany({
      where: { order_date: { gte, lt }, ...roleWhere },
      include: ORDER_INCLUDE,
      orderBy: { id: 'desc' },
    });

    return NextResponse.json(orders.map(o =>
      serializeOrder(o, (o as any)[SELLER_RELATION], (o as any)[DELIVERY_RELATION])
    ));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      seller_id, client_name, client_phone1, client_phone2,
      client_wilaya, client_address, products,
      delivery_id, benefit, total, fee,
    } = body;

    const order = await prisma.orders.create({
      data: {
        seller_id: Number(seller_id),
        client_name: String(client_name).toLowerCase(),
        client_phone1,
        client_phone2: client_phone2 ?? null,
        client_wilaya: client_wilaya ?? null,
        client_address,
        products: products ?? null,
        delivery_id: delivery_id ? Number(delivery_id) : null,
        benefit: benefit ?? null,
        total: total ?? null,
        fee: fee ?? null,
      },
    });

    // Increment seller salary by benefit
    if (benefit) {
      await prisma.users.update({
        where: { id: Number(seller_id) },
        data: { salary: { increment: Number(benefit) } },
      });
    }

    // Increment delivery salary by fee
    if (delivery_id && fee) {
      await prisma.users.update({
        where: { id: Number(delivery_id) },
        data: { salary: { increment: Number(fee) } },
      });
    }

    return NextResponse.json({ ...order, id: Number(order.id) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }
}


export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
    }

    const cookieStore = cookies();
    const role = (await cookieStore).get('role')?.value;

    const order = await prisma.orders.findUnique({ where: { id: BigInt(id) } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (role !== 'Admin' && !(role === 'Vendeuse' && order.status === 'Nouveau')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Reverse salary effects of this order
    if (order.benefit && order.seller_id) {
      await prisma.users.update({
        where: { id: Number(order.seller_id) },
        data: { salary: { decrement: Number(order.benefit) } },
      });
    }
    if (order.delivery_id && order.fee) {
      await prisma.users.update({
        where: { id: Number(order.delivery_id) },
        data: { salary: { decrement: Number(order.fee) } },
      });
    }

    await prisma.orders.delete({ where: { id: BigInt(id) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }
}
