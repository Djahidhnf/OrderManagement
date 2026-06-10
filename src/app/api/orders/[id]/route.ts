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

    const cookieStore = cookies();
    const userId = (await cookieStore).get('userId')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
    const userId = (await cookieStore).get('userId')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      client_name, client_phone1, client_phone2, client_wilaya, client_address,
      products, delivery_id, benefit, total, status, fee, note, returnFee,
    } = body;

    const data: any = {};

    // Pre-fetch needed for Confirmatrice wilaya check and salary adjustments
    const currentOrder = await prisma.orders.findUnique({
      where: { id: orderId },
      select: { notes: true, seller_id: true, delivery_id: true, benefit: true, fee: true, client_wilaya: true },
    });

    // Role guards
    if (role === 'Assistante') {
      if (status !== undefined && status !== 'En route' && status !== 'Nouveau') {
        return NextResponse.json({ error: 'Denied' }, { status: 403 });
      }
    }
    if (role === 'Livreur' && status !== 'Livré' && note === undefined) {
      return NextResponse.json({ error: 'Denied' }, { status: 403 });
    }
    if (role === 'Vendeuse') {
      if (note === undefined || status !== undefined) {
        return NextResponse.json({ error: 'Denied' }, { status: 403 });
      }
      if (Number(currentOrder?.seller_id) !== Number(userId)) {
        return NextResponse.json({ error: 'Denied' }, { status: 403 });
      }
    }
    if (role === 'Confirmatrice') {
      const allowedStatuses = ['En route', 'Annulé', 'Livré'];
      if (status !== undefined && !allowedStatuses.includes(status)) {
        return NextResponse.json({ error: 'Denied' }, { status: 403 });
      }
      if (status !== undefined && (!currentOrder?.client_wilaya || currentOrder.client_wilaya === 'Alger')) {
        return NextResponse.json({ error: 'Accès refusé: wilaya Alger' }, { status: 403 });
      }
    }

    if (note !== undefined && currentOrder) {
      const formatted = new Date().toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
      const prefix =
        role === 'Livreur'       ? 'Liv' :
        role === 'Admin'         ? 'Ad'  :
        role === 'Confirmatrice' ? 'Cnf' :
        role === 'Vendeuse'      ? 'Vnd' :
        role === 'Assistante'    ? 'Ass' : 'Usr';
      data.notes = `${currentOrder.notes ?? ''}[${prefix} - ${formatted}] - ${note}\n`;
    }

    // Salary adjustments (uses the same currentOrder from above)
    if (currentOrder) {
      // Adjust seller salary if benefit changed
      if (benefit !== undefined) {
        const delta = Number(benefit) - Number(currentOrder.benefit ?? 0);
        if (delta !== 0) {
          await prisma.users.update({
            where: { id: Number(currentOrder.seller_id) },
            data: { salary: { increment: delta } },
          });
        }
      }

      // Adjust delivery salary if fee or delivery_id changed
      const newDeliveryId = delivery_id !== undefined
        ? (delivery_id ? Number(delivery_id) : null)
        : (currentOrder.delivery_id ? Number(currentOrder.delivery_id) : null);
      const oldDeliveryId = currentOrder.delivery_id ? Number(currentOrder.delivery_id) : null;
      const newFee = fee !== undefined ? Number(fee) : Number(currentOrder.fee ?? 0);
      const oldFee = Number(currentOrder.fee ?? 0);

      if (oldDeliveryId !== newDeliveryId) {
        // Delivery person changed: reverse old fee, apply new fee
        if (oldDeliveryId && oldFee) {
          await prisma.users.update({
            where: { id: oldDeliveryId },
            data: { salary: { decrement: oldFee } },
          });
        }
        if (newDeliveryId && newFee) {
          await prisma.users.update({
            where: { id: newDeliveryId },
            data: { salary: { increment: newFee } },
          });
        }
      } else if (fee !== undefined && oldDeliveryId) {
        // Same delivery person, fee amount changed
        const delta = newFee - oldFee;
        if (delta !== 0) {
          await prisma.users.update({
            where: { id: oldDeliveryId },
            data: { salary: { increment: delta } },
          });
        }
      }
    }


    // Conditionally build update data object
    if (client_name !== undefined) data.client_name = client_name;
    if (client_phone1 !== undefined) data.client_phone1 = client_phone1;
    if (client_phone2 !== undefined) data.client_phone2 = client_phone2;
    if (client_wilaya !== undefined) data.client_wilaya = client_wilaya;
    if (client_address !== undefined) data.client_address = client_address;
    if (products !== undefined) data.products = products;

    if (delivery_id !== undefined)data.delivery_id = delivery_id ? Number(delivery_id) : null;

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
