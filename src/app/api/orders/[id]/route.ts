import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { serializeOrder } from '../../../../../lib/serialize';
import { toPrisma } from '../../../../../lib/status';

// Exact relation field names from prisma/schema.prisma
const SELLER_RELATION = 'users_orders_seller_idTousers';
const DELIVERY_RELATION = 'users_orders_delivery_idTousers';

const ORDER_INCLUDE = {
  [SELLER_RELATION]: { select: { username: true, phone: true } },
  [DELIVERY_RELATION]: { select: { username: true, phone: true } },
} as const;

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const order = await prisma.orders.findUnique({
      where: { id: BigInt(id) },
      include: ORDER_INCLUDE,
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(
      serializeOrder(order, (order as any)[SELLER_RELATION], (order as any)[DELIVERY_RELATION])
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const orderId = BigInt(id);

    const cookieStore = cookies();
    const role = (await cookieStore).get('role')?.value;

    const body = await req.json();
    const {
      client_name, client_phone1, client_phone2, client_wilaya, client_address,
      products, delivery_id, benefit, total, status, fee, note, returnFee,
    } = body;

    // Role guards
    if (role === 'Assistante' && status !== 'En route' && status !== 'Nouveau') {
      return NextResponse.json({ error: 'Denied' }, { status: 403 });
    }
    if (role === 'Livreur' && status !== 'Livré' && note === undefined) {
      return NextResponse.json({ error: 'Denied' }, { status: 403 });
    }
    if (role === 'Vendeuse') {
      return NextResponse.json({ error: 'Denied' }, { status: 403 });
    }
    if (role === 'Confirmatrice' && status !== 'Annulé' && note === undefined) {
      return NextResponse.json({ error: 'Denied' }, { status: 403 });
    }

    const data: any = {};

    // Notes: append with role prefix (requires pre-fetch)
    if (note !== undefined) {
      const current = await prisma.orders.findUnique({
        where: { id: orderId },
        select: { notes: true },
      });
      const formatted = new Date().toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
      const prefix = role === 'Livreur' ? 'Liv' : role === 'Admin' ? 'Ad' : 'Cnf';
      data.notes = `${current?.notes ?? ''}[${prefix} - ${formatted}] - ${note}\n`;
    }

    if (client_name !== undefined) data.client_name = client_name;
    if (client_phone1 !== undefined) data.client_phone1 = client_phone1;
    if (client_phone2 !== undefined) data.client_phone2 = client_phone2;
    if (client_wilaya !== undefined) data.client_wilaya = client_wilaya;
    if (client_address !== undefined) data.client_address = client_address;
    if (products !== undefined) data.products = products;
    if (delivery_id !== undefined) data.delivery_id = delivery_id ? Number(delivery_id) : null;
    if (benefit !== undefined) data.benefit = benefit;
    if (total !== undefined) data.total = total;
    if (fee !== undefined) data.fee = fee;
    if (returnFee !== undefined) data.return_fee = returnFee;

    // Map display status string to Prisma enum identifier
    if (status !== undefined) data.status = toPrisma(status);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updated = await prisma.orders.update({
      where: { id: orderId },
      data,
      include: ORDER_INCLUDE,
    });

    return NextResponse.json(
      serializeOrder(updated, (updated as any)[SELLER_RELATION], (updated as any)[DELIVERY_RELATION])
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
  }
}
