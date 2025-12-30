'use client'
import { format } from "date-fns"
import { MoreHorizontal, Calendar, Clock, AlertCircle, Eye, Check, X, ExternalLink, FileText } from "lucide-react"
import { useState } from "react"
import { reviewTask } from "@/app/actions"

export default function AdminTaskList({ tasks }: { tasks: any[] }) {
  const [reviewingTask, setReviewingTask] = useState<any>(null)
  const [feedback, setFeedback] = useState("")
  const [processing, setProcessing] = useState(false)

  const handleReview = async (decision: 'APPROVED' | 'REJECTED') => {
    if (decision === 'REJECTED' && !feedback) return alert("Please provide feedback for rejection")
    
    setProcessing(true)
    try {
      await reviewTask(reviewingTask.id, decision, feedback)
      setReviewingTask(null)
      setFeedback("")
    } catch (e) {
      alert("Error reviewing task")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold text-xs">
            <tr>
              <th className="p-4">Task Details</th>
              <th className="p-4">Assigned To</th>
              <th className="p-4">Status</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Deadline</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {tasks.map(task => (
              <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                <td className="p-4">
                  <div className="font-bold text-gray-900 dark:text-gray-100">{task.title}</div>
                  <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">{task.description}</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                      {task.assignedTo.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{task.assignedTo.name}</div>
                      <div className="text-xs text-gray-500">{task.assignedTo.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    task.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                    task.status === 'UNDER_REVIEW' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 animate-pulse' :
                    task.status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    task.status === 'NO_RESPONSE' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4">
                  <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${
                    task.priority === 'HIGH' ? 'text-red-600' :
                    task.priority === 'MEDIUM' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      task.priority === 'HIGH' ? 'bg-red-500' :
                      task.priority === 'MEDIUM' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    {task.priority}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col text-xs">
                    <span className="flex items-center gap-1 text-gray-900 dark:text-gray-100 font-medium">
                      <Calendar size={12} />
                      {format(new Date(task.deadline), 'MMM d')}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500 mt-0.5">
                      <Clock size={12} />
                      {format(new Date(task.deadline), 'HH:mm')}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  {task.status === 'UNDER_REVIEW' ? (
                    <button 
                      onClick={() => setReviewingTask(task)}
                      className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20"
                    >
                      Review
                    </button>
                  ) : (
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reviewingTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Eye className="text-purple-600" /> Review Task
            </h3>
            
            <div className="mb-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Task</label>
                <p className="font-medium text-lg">{reviewingTask.title}</p>
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Submissions</label>
                <div className="space-y-2">
                  {reviewingTask.submissions?.length > 0 ? (
                    reviewingTask.submissions.map((sub: any, i: number) => (
                      <a 
                        key={i} 
                        href={sub.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 group"
                      >
                        <div className="p-2 bg-white dark:bg-gray-900 rounded-md shadow-sm text-blue-600">
                          {sub.type === 'LINK' ? <ExternalLink size={16} /> : <FileText size={16} />}
                        </div>
                        <span className="text-sm font-medium truncate flex-1 text-blue-600 dark:text-blue-400 group-hover:underline">
                          {sub.url}
                        </span>
                      </a>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">No submissions found.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Feedback (Required for Rejection)</label>
                <textarea 
                  className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  rows={3}
                  placeholder="Enter feedback for the intern..."
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => handleReview('APPROVED')}
                disabled={processing}
                className="flex-1 bg-green-600 text-white p-3 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
              >
                <Check size={18} /> Approve
              </button>
              <button 
                onClick={() => handleReview('REJECTED')}
                disabled={processing}
                className="flex-1 bg-red-600 text-white p-3 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
              >
                <X size={18} /> Reject
              </button>
              <button 
                onClick={() => setReviewingTask(null)}
                disabled={processing}
                className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
