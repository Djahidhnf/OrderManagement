import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!id || !start || !end) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const cookieStore = cookies();
    const userId = (await cookieStore).get('userId')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setDate(endDate.getDate() + 1);

    const rows: any[] = await prisma.$queryRaw`
      SELECT
        orders.id,
        orders.client_name,
        orders.client_phone1,
        orders.client_phone2,
        orders.client_wilaya,
        orders.client_address,
        orders.products,
        orders.status,
        orders.benefit,
        orders.fee,
        orders.total,
        orders.return_fee,
        orders.order_date,
        seller.username  AS seller_name,
        delivery.username AS delivery_name,
        delivery.phone    AS delivery_phone,
        COALESCE(
          SUM(
            CASE
              WHEN orders.status = 'Livré'  THEN COALESCE(orders.benefit, 0)
              WHEN orders.status = 'Annulé' THEN -COALESCE(orders.return_fee, 0)
              ELSE 0
            END
          ) OVER (),
        0) AS total_benefit
      FROM orders
      LEFT JOIN users AS seller  ON orders.seller_id  = seller.id
      LEFT JOIN users AS delivery ON orders.delivery_id = delivery.id
      WHERE orders.seller_id  = ${Number(id)}
        AND orders.order_date >= ${startDate}
        AND orders.order_date <  ${endDate}
      ORDER BY orders.id DESC
    `;

    const result = rows.map(r => ({
      ...r,
      id: Number(r.id),
      benefit: r.benefit != null ? Number(r.benefit) : null,
      fee: r.fee != null ? Number(r.fee) : null,
      total: r.total != null ? Number(r.total) : null,
      return_fee: r.return_fee != null ? Number(r.return_fee) : null,
      total_benefit: Number(r.total_benefit),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to calculate salary' }, { status: 500 });
  }
}
