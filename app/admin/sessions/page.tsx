import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ArrowLeft, PanelTop } from "lucide-react"
import Link from "next/link"
import { getSessionCenterOverview } from "@/app/actions"
import AdminSessionsCenter from "@/components/AdminSessionsCenter"

export default async function AdminSessionsPage() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ADMIN') redirect("/")

  const overview = await getSessionCenterOverview()

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
            <PanelTop className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
              Session Center
            </h1>
            <p className="text-gray-500 dark:text-gray-400">Manage current and previous sessions for all volunteers in one place.</p>
          </div>
        </div>
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
      </div>

      <AdminSessionsCenter
        sessions={overview.sessions}
        current={overview.current}
        history={overview.history}
      />
    </div>
  )
}
