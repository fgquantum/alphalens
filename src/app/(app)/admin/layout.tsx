import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session || session.user?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="flex h-full -m-4 md:-m-6">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {children}
      </div>
    </div>
  )
}
