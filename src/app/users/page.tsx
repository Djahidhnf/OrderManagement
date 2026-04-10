/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from "next/headers";
import AddButton from "../../../Components/AddButton"
import UsersButton from "../../../Components/UsersButton";
import { Toaster } from "react-hot-toast";
import { redirect } from "next/navigation";
import SalaryForm from "../../../Components/SalaryForm";
import DeliveryTotalForm from "../../../Components/DeliveryTotalForm";


async function Users() {

    const userId = (await cookies()).get("userId")?.value;
    const userRole = (await cookies()).get("role")?.value;
  
    if (!userId) {
      redirect("/login");
    }

    if (userRole !== "Admin") {
      return (
        <div className="text-2xl font-bold text-white text-center mx-auto mt-50">
          <h1>Accès restreint</h1>
        </div>
      )
    }



  const res = await fetch("http://localhost:3000/api/users");
  const users = await res.json();




    return (
      <>
        <Toaster position="top-center" reverseOrder={false}/>
        <main className="text-white mx-5 h-full mb-10 w-vw pt-30 relative">
          {/* <h1 className="text-3xl mb-5 mt-20">Gestion des Utilisateurs</h1> */}

          <div className="flex justify-end w-full">
            <AddButton path="/adduser"/>
          </div>

          <div className="w-full pr-1 overflow-x-auto">
            <table className="text-white bg-foreground text-left w-full min-w-225 mt-5">
              <thead className="sticky top-0 bg-foreground border border-gray-600">
                <tr className=" h-10">
                  <th className="px-5 border border-gray-600 w-1/10"></th>
                  <th className="px-5 border border-gray-600 w-1/10">ID</th>
                  <th className="px-5 border border-gray-600 w-3/10">Utilisateurs</th>
                  <th className="px-5 border border-gray-600 w-3/10">Telephone</th>
                  <th className="px-5 border border-gray-600 w-1/10">Role</th>
                  <th className="px-5 border border-gray-600 w-1/10">Status</th>
                </tr>
              </thead>
                <tbody>
                  {users.map((user: any) => {
                    return (
                      <tr className="h-10" key={user.id}>
                      <td className="border border-gray-600">
                          <UsersButton user={user}/>
                      </td>
                      <td className="border border-gray-600 pl-5">{user.id}</td>
                      <td className="border border-gray-600 pl-5">{user.username}</td>
                      <td className="border border-gray-600 pl-5">{user.phone}</td>
                      <td className="border border-gray-600 pl-5">{user.role}</td>
                      <td className={`border border-gray-600 pl-5 ${user.active? "text-green-700" : "text-red-700"}`}>{user.active? "Active" : "Inactive"}</td>
                  </tr>
                  )
                })}

                </tbody>
            </table>  
          </div>

          <div className="overflow-y-auto max-h-[70%] w-full border-b border-gray-600">
            <table className="w-full min-w-225">
              <tbody > 
                
                
              </tbody>
            </table>
          </div>

          <SalaryForm users={users} />

          <DeliveryTotalForm users={users} />

        </main>
      </>
    )
}


export default Users