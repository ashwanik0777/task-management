import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getAllInterns } from "@/app/actions"
import AdminInternList from "@/components/AdminInternList"
import { Users, ArrowLeft, UserCheck, XCircle, FileCheck } from "lucide-react"
import Link from "next/link"

export default async function AdminInternsPage() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ADMIN') redirect("/")

  const interns = await getAllInterns()

  const totalVolunteers = interns.length
  const approvedOrActive = interns.filter(intern => intern.status === 'APPROVED').length
  const rejected = interns.filter(intern => intern.status === 'REJECTED').length
  const formFilled = interns.filter(intern => {
    const hasBio = Boolean(intern.bio?.trim())
    const hasSkills = Boolean(intern.skills?.trim())
    const hasAvatar = Boolean(intern.avatarUrl?.trim())
    return hasBio && hasSkills && hasAvatar
  }).length

  const stats = [
    {
      label: "Total Volunteers",
      value: totalVolunteers,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      border: "border-blue-200 dark:border-blue-800"
    },
    {
      label: "Approved / Active",
      value: approvedOrActive,
      icon: UserCheck,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30",
      border: "border-green-200 dark:border-green-800"
    },
    {
      label: "Rejected",
      value: rejected,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-100 dark:bg-red-900/30",
      border: "border-red-200 dark:border-red-800"
    },
    {
      label: "Form Filled",
      value: formFilled,
      icon: FileCheck,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/30",
      border: "border-purple-200 dark:border-purple-800"
    }
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-600 rounded-xl shadow-lg shadow-purple-500/30">
            <Users className="text-white" size={24} />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
            Intern Management
          </h1>
        </div>
        <Link href="/admin" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className={`p-5 rounded-xl border ${stat.border} ${stat.bg}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                <h3 className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</h3>
              </div>
              <stat.icon className={stat.color} size={24} />
            </div>
          </div>
        ))}
      </div>

      <AdminInternList interns={interns} />
    </div>
  )
}
