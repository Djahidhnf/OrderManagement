import { cookies } from 'next/headers';
import { prisma } from './prisma';

export async function getUser() {
  const userId = (await cookies()).get('userId')?.value;
  if (!userId) return null;

  return prisma.users.findUnique({
    where: { id: Number(userId) },
    select: { id: true, username: true, role: true },
  });
}