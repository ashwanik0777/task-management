import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MessageSquare } from "lucide-react"
import { getAdminDirectChatOverview } from "@/app/actions"
import AdminDirectChatCenter from "@/components/AdminDirectChatCenter"

export default async function AdminChatPage() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ADMIN') redirect('/')

  const volunteers = await getAdminDirectChatOverview()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
            <MessageSquare className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
              Volunteer Chat Center
            </h1>
            <p className="text-gray-500 dark:text-gray-400">Chat with any volunteer and monitor replies.</p>
          </div>
        </div>
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
      </div>

      <AdminDirectChatCenter volunteers={volunteers} currentUserId={(session.user as any).id} />
    </div>
  )
}
