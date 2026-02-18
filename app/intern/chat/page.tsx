import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MessageSquare } from "lucide-react"
import { getInternDirectChatOverview } from "@/app/actions"
import InternDirectChatCenter from "@/components/InternDirectChatCenter"

export default async function InternChatPage() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'INTERN') redirect('/')
  if ((session.user as any).status !== 'APPROVED') redirect('/intern')

  const data = await getInternDirectChatOverview()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
            <MessageSquare className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
              Admin Support Chat
            </h1>
            <p className="text-gray-500 dark:text-gray-400">Any issue? Message admin directly from here.</p>
          </div>
        </div>
        <Link href="/intern" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
      </div>

      <InternDirectChatCenter
        conversationId={data.conversationId}
        adminName={data.admin.name}
        currentUserId={(session.user as any).id}
      />
    </div>
  )
}
