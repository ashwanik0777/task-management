import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import CreateTaskForm from "@/components/CreateTaskForm"
import AdminTaskList from "@/components/AdminTaskList"
import { getInterns } from "@/app/actions"
import { CheckCircle, Clock, AlertCircle, ListTodo, Users, LayoutDashboard, Trophy, Award } from "lucide-react"

export default async function AdminPage() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ADMIN') redirect("/")

  const latestTasks = await prisma.task.findMany({
    distinct: ['assignedToId'],
    orderBy: [
      { assignedToId: 'asc' },
      { createdAt: 'desc' }
    ],
    include: { assignedTo: true, submissions: true, timeLogs: true },
  })

  // Sort by most recently created/updated
  latestTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const interns = await getInterns()
  
  // Parallel efficient counting
  const [total, completed, inProgress, noResponse] = await Promise.all([
    prisma.task.count(),
    prisma.task.count({ where: { status: 'COMPLETED' } }),
    prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.task.count({ where: { status: 'NO_RESPONSE' } })
  ]);

  const stats = [
    { 
      label: "Total Tasks", 
      value: total, 
      icon: ListTodo, 
      color: "text-blue-600", 
      bg: "bg-blue-100 dark:bg-blue-900/30",
      border: "border-blue-200 dark:border-blue-800"
    },
    { 
      label: "Completed", 
      value: completed, 
      icon: CheckCircle, 
      color: "text-green-600", 
      bg: "bg-green-100 dark:bg-green-900/30",
      border: "border-green-200 dark:border-green-800"
    },
    { 
      label: "In Progress", 
      value: inProgress, 
      icon: Clock, 
      color: "text-yellow-600", 
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      border: "border-yellow-200 dark:border-yellow-800"
    },
    { 
      label: "No Response", 
      value: noResponse, 
      icon: AlertCircle, 
      color: "text-red-600", 
      bg: "bg-red-100 dark:bg-red-900/30",
      border: "border-red-200 dark:border-red-800"
    },
  ]


  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
            Admin Dashboard
          </h1>
        </div>
        <a href="/admin/interns" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
          <Users size={20} className="text-purple-600" />
          <span className="font-medium">Manage Interns</span>
        </a>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white p-6 rounded-2xl shadow-xl shadow-orange-500/20 relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Trophy size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Award size={24} />
                </div>
                <h2 className="text-xl font-bold">Top Performers</h2>
              </div>
              
              <p className="text-orange-50 mb-6 text-sm">
                View the leaderboard ranked by efficiency, task completion, and punctuality.
              </p>
              
              <a href="/admin/performers" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-orange-600 font-bold rounded-xl shadow-lg hover:bg-gray-50 transition-colors">
                View Leaderboard <Trophy size={16} />
              </a>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 sticky top-24">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <ListTodo className="text-purple-600 dark:text-purple-400" size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Assign New Task</h2>
            </div>
            <CreateTaskForm interns={interns} />
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                 <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ListTodo className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Latest Task Overview</h2>
              </div>
              <a href="/admin/interns" className="text-sm text-blue-600 hover:underline">View All in Profiles</a>
            </div>
            <AdminTaskList tasks={latestTasks} />
          </div>
        </div>
      </div>
    </div>
  )
}
