-- CreateEnum
CREATE TYPE "order_type" AS ENUM ('livraison', 'echange');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "order_kind" "order_type" NOT NULL DEFAULT 'livraison',
ADD COLUMN "ship_date" DATE;
