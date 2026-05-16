import { cookies } from 'next/headers';
import pool from "../../../../lib/db";
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


export async function DELETE(req: Request) {
  try {
    const {searchParams} = new URL(req.url);
    const id = searchParams.get('id')

    const cookieStore = cookies();
    const role = (await cookieStore).get("role")?.value;
    
    if(!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    const order = await pool.query("SELECT status FROM orders WHERE id = $1", [id]);
    const status = order.rows[0].status;



    if (
      role !== "Admin" &&
      !(role === "Vendeuse" && status === "Nouveau")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

        // Delete the order
    const result = await pool.query("DELETE FROM orders WHERE id = $1 RETURNING *", [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: result.rows[0] });

  } catch (err) {
      console.log(err);
      return NextResponse.json({error: "Database query failed"}, { status: 500});
  }
}






export async function POST(req: Request) {
  try {    
    const body = await req.json();

      const {
        seller_id,
        client_name,
        client_phone1,
        client_phone2,
        client_wilaya,
        client_address,
        products,
        delivery_id,
        benefit,
        total,
        fee
      } = body;

          const result = await pool.query(`INSERT INTO orders (seller_id, client_name, client_phone1, client_phone2, client_wilaya, client_address, products, delivery_id, benefit, total, fee)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`, [seller_id, (client_name).toLowerCase(), client_phone1, client_phone2, client_wilaya, client_address, products, delivery_id, benefit, total, fee]);

    // 2. Add benefit to seller salary
    if (benefit) {
      await pool.query(
        `UPDATE users
         SET salary = salary + $1
         WHERE id = $2`,
        [Number(benefit), seller_id]
      );
    }

            // 3. Add fee to delivery salary
    if (delivery_id && fee) {
      await pool.query(
        `UPDATE users
         SET salary = salary + $1
         WHERE id = $2`,
        [Number(fee), delivery_id]
      );
    }

    return NextResponse.json(result.rows[0]);

  } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Database query failed" }, { status: 500 });
  }
}