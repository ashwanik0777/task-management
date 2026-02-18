import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import InternTaskCard from "@/components/InternTaskCard"
import WorkSessionBoard from "@/components/WorkSessionBoard"
import { CheckCircle, Clock, AlertCircle, Layout, MessageSquare, Trophy } from "lucide-react"
import { getInternWorkSessions } from "@/app/actions"
import Link from "next/link"

export default async function InternPage() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'INTERN') redirect("/")

  if ((session.user as any).status !== 'APPROVED') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="p-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full animate-pulse">
          <Clock size={48} className="text-yellow-600 dark:text-yellow-400" />
        </div>
        <div className="max-w-md space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Account Pending Approval</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Your account is currently waiting for administrator approval. You will be able to access your dashboard once your account has been verified.
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">
          <p>Registered Email: <span className="font-mono font-bold">{session.user?.email}</span></p>
        </div>
      </div>
    )
  }

  const tasks = await prisma.task.findMany({
    where: { assignedToId: (session.user as any).id },
    orderBy: { createdAt: 'desc' },
    include: { 
      timeLogs: { orderBy: { startTime: 'desc' } }, 
      submissions: true 
    }
  })

  const workSessions = await getInternWorkSessions((session.user as any).id)

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const nextMonthStart = new Date(monthStart)
  nextMonthStart.setMonth(nextMonthStart.getMonth() + 1)

  const approvedInterns = await prisma.user.findMany({
    where: { role: 'INTERN', status: 'APPROVED' },
    select: { id: true }
  })

  const completedMonthlySessions = await prisma.workSession.findMany({
    where: {
      status: 'COMPLETED',
      completedAt: {
        gte: monthStart,
        lt: nextMonthStart,
      }
    },
    select: { internId: true }
  })

  const monthlyCountMap = new Map<string, number>()
  completedMonthlySessions.forEach((row) => {
    monthlyCountMap.set(row.internId, (monthlyCountMap.get(row.internId) || 0) + 1)
  })

  const monthlySessionRankList = approvedInterns
    .map((intern) => ({
      id: intern.id,
      wins: monthlyCountMap.get(intern.id) || 0,
    }))
    .sort((a, b) => b.wins - a.wins || a.id.localeCompare(b.id))

  const currentInternRank = monthlySessionRankList.findIndex((entry) => entry.id === (session.user as any).id) + 1
  const currentInternSessionWins = monthlyCountMap.get((session.user as any).id) || 0

  const stats = [
    { 
      label: "Pending", 
      value: tasks.filter(t => t.status === 'PENDING').length, 
      icon: AlertCircle, 
      color: "text-orange-600", 
      bg: "bg-orange-100 dark:bg-orange-900/30",
      border: "border-orange-200 dark:border-orange-800"
    },
    { 
      label: "In Progress", 
      value: tasks.filter(t => t.status === 'IN_PROGRESS').length, 
      icon: Clock, 
      color: "text-blue-600", 
      bg: "bg-blue-100 dark:bg-blue-900/30",
      border: "border-blue-200 dark:border-blue-800"
    },
    { 
      label: "Completed", 
      value: tasks.filter(t => t.status === 'COMPLETED').length, 
      icon: CheckCircle, 
      color: "text-green-600", 
      bg: "bg-green-100 dark:bg-green-900/30",
      border: "border-green-200 dark:border-green-800"
    },
  ]

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
            <Layout className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
              My Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400">Welcome back, {session.user?.name}</p>
          </div>
        </div>
        <Link href="/intern/chat" className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
          <MessageSquare size={18} className="text-indigo-600" />
          <span className="font-medium">Chat with Admin</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className={`p-6 rounded-xl border ${stat.border} ${stat.bg} backdrop-blur-sm transition-transform hover:scale-105`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                <h3 className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</h3>
              </div>
              <stat.icon className={stat.color} size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-100 dark:bg-yellow-900/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Session Rank (This Month)</p>
            <h3 className="text-3xl font-bold mt-2 text-yellow-700 dark:text-yellow-300">#{currentInternRank || '-'}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              You have won <span className="font-bold">{currentInternSessionWins}</span> sessions this month.
            </p>
          </div>
          <Trophy className="text-yellow-600 dark:text-yellow-300" size={28} />
        </div>
      </div>

      <div className="space-y-6">
        <WorkSessionBoard
          internId={(session.user as any).id}
          currentUserRole={(session.user as any).role}
          currentUserId={(session.user as any).id}
          initialSessions={workSessions}
        />

        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
          Active Tasks
        </h2>
        
        {tasks.length === 0 ? (
          <div className="text-center py-12 bg-white/50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
              <CheckCircle className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">All caught up!</h3>
            <p className="text-gray-500">You have no assigned tasks at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {tasks.map(task => (
              <InternTaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
