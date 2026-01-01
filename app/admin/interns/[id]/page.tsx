import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { User, Mail, Calendar, CheckCircle, Clock, XCircle, BookOpen } from "lucide-react"

export default async function InternDetailPage({ params }: { params: { id: string } }) {
  const intern = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      assignedTasks: {
        include: {
          timeLogs: true,
          submissions: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!intern) return notFound()

  const completedTasks = intern.assignedTasks.filter(t => t.status === 'COMPLETED').length
  const pendingTasks = intern.assignedTasks.filter(t => ['PENDING', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(t.status)).length
  
  // Calculate total hours worked
  const totalMilliseconds = intern.assignedTasks.reduce((acc, task) => {
    const taskTime = task.timeLogs
      .filter(log => log.type === 'WORK' && log.endTime)
      .reduce((tAcc, log) => tAcc + (log.endTime!.getTime() - log.startTime.getTime()), 0)
    return acc + taskTime
  }, 0)
  const totalHours = (totalMilliseconds / (1000 * 60 * 60)).toFixed(1)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header Profile Card */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden border-4 border-blue-50 dark:border-blue-900 flex-shrink-0">
          {intern.avatarUrl ? (
            <img src={intern.avatarUrl} alt={intern.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <User size={48} />
            </div>
          )}
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{intern.name}</h1>
            <p className="text-blue-600 font-medium">{intern.rollNumber || 'No Roll Number'}</p>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Mail size={16} /> {intern.email}
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} /> Joined {intern.createdAt.toLocaleDateString()}
            </div>
          </div>

          {intern.bio && (
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl italic">"{intern.bio}"</p>
          )}

          {intern.skills && (
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {intern.skills.split(',').map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                  {skill.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completedTasks}</div>
            <div className="text-xs text-green-700 dark:text-green-300">Completed</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{pendingTasks}</div>
            <div className="text-xs text-orange-700 dark:text-orange-300">Pending</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-center col-span-2">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalHours}h</div>
            <div className="text-xs text-purple-700 dark:text-purple-300">Total Work Time</div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="text-blue-600" /> Task History
        </h2>
        
        <div className="grid gap-4">
          {intern.assignedTasks.map(task => (
            <div key={task.id} className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{task.title}</h3>
                  <p className="text-sm text-gray-500">Assigned: {task.createdAt.toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium 
                  ${task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                    task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 
                    'bg-gray-100 text-gray-700'}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{task.description}</p>
              
              {task.submissions.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
                  <p className="font-medium mb-2">Submissions:</p>
                  <ul className="space-y-1">
                    {task.submissions.map((sub, i) => (
                      <li key={i} className="flex items-center gap-2 text-blue-600">
                        <a href={sub.url} target="_blank" rel="noreferrer" className="hover:underline truncate max-w-xs">
                          {sub.url}
                        </a>
                        <span className="text-gray-400 text-xs">({sub.type})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          
          {intern.assignedTasks.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              No tasks assigned yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
