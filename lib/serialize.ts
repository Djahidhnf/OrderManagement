import { toDisplay } from './status';

type Relation = { username: string; phone: string | null } | null;

// Pass seller and delivery explicitly so this function doesn't need to know
// the auto-generated Prisma relation names.
export function serializeOrder(
  order: any,
  seller: Relation,
  delivery: Relation,
): any {
  return {
    id: Number(order.id),
    seller_id: Number(order.seller_id),
    delivery_id: order.delivery_id != null ? Number(order.delivery_id) : null,
    client_name: order.client_name,
    client_phone1: order.client_phone1,
    client_phone2: order.client_phone2 ?? null,
    client_wilaya: order.client_wilaya ?? null,
    client_address: order.client_address,
    products: order.products ?? null,
    benefit: order.benefit != null ? Number(order.benefit) : null,
    total: order.total != null ? Number(order.total) : null,
    fee: order.fee != null ? Number(order.fee) : null,
    return_fee: order.return_fee != null ? Number(order.return_fee) : null,
    notes: order.notes ?? null,
    status: toDisplay(String(order.status)),
    order_date: order.order_date,
    formatted_date: order.order_date?.toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    }) ?? null,
    seller_name: seller?.username ?? null,
    seller_phone: seller?.phone ?? null,
    delivery_name: delivery?.username ?? null,
    delivery_phone: delivery?.phone ?? null,
    order_kind: order.order_kind ?? 'livraison',
    ship_date: order.ship_date
      ? (order.ship_date instanceof Date
          ? order.ship_date.toISOString().split('T')[0]
          : String(order.ship_date))
      : null,
  };
}

// Shorthand for converting Prisma Decimal/BigInt scalars in non-order responses
export function num(val: any): number | null {
  return val != null ? Number(val) : null;
}
