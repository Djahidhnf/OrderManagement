import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { prisma } from "../../../lib/prisma";
import { num } from "../../../lib/serialize";
import SalaryForm from "../../../Components/SalaryForm";
import DeliveryTotalForm from "../../../Components/DeliveryTotalForm";

export default async function Calculs() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  const role = cookieStore.get("role")?.value;

  if (!userId) redirect("/login");

  if (role !== "Admin" && role !== "Assistante") {
    return (
      <div className="text-2xl font-bold text-white text-center mx-auto mt-50">
        <h1>Accès restreint</h1>
      </div>
    );
  }

  const rawUsers = await prisma.users.findMany({
    orderBy: { id: "asc" },
    select: { id: true, username: true, role: true, salary: true, phone: true, active: true },
  });
  const users = rawUsers.map(u => ({ ...u, salary: num(u.salary) }));

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <main className="text-white mx-5 pt-30">
        {role === "Admin" && <SalaryForm users={users} />}
        <DeliveryTotalForm users={users} />
      </main>
    </>
  );
}
