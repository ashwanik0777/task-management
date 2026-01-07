'use client'
import { useState, useEffect } from "react"
import { respondToTask, startTask, pauseTask, resumeTask, completeTask } from "@/app/actions"
import { getCloudinarySignature } from "@/app/upload-actions"
import { format, differenceInSeconds } from "date-fns"
import { Play, Pause, CheckCircle, XCircle, Clock, Upload, Link as LinkIcon, Trash2, AlertTriangle, Loader2 } from "lucide-react"

export default function InternTaskCard({ task }: { task: any }) {
  const [elapsed, setElapsed] = useState(0)
  const [responseLeft, setResponseLeft] = useState(0)
  const [deadlineLeft, setDeadlineLeft] = useState(0)
  const [declineReason, setDeclineReason] = useState("")
  const [showDecline, setShowDecline] = useState(false)
  
  // Submission state
  const [showSubmit, setShowSubmit] = useState(false)
  const [submissions, setSubmissions] = useState<{type: 'LINK' | 'IMAGE', url: string}[]>([])
  const [newLink, setNewLink] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Calculate work timer and deadline countdown
  useEffect(() => {
    // Work timer
    const calculateElapsed = () => {
      let total = 0
      task.timeLogs.forEach((log: any) => {
        if (log.type === 'WORK') {
          const end = log.endTime ? new Date(log.endTime) : new Date()
          total += differenceInSeconds(end, new Date(log.startTime))
        }
      })
      setElapsed(total)
    }
    
    // Deadline Countdown (for active tasks)
    const calculateDeadline = () => {
        const deadline = new Date(task.deadline)
        const left = differenceInSeconds(deadline, new Date())
        setDeadlineLeft(left > 0 ? left : 0)
    }
    
    calculateElapsed()
    calculateDeadline()
    const interval = setInterval(() => {
        calculateElapsed()
        calculateDeadline()
    }, 1000)
    return () => clearInterval(interval)
  }, [task.timeLogs, task.status, task.deadline])

  // Calculate 30-min response window countdown
  useEffect(() => {
    if (task.status !== 'PENDING') return
    
    const updateResponseCountdown = () => {
      // 30 minutes from creation
      const responseDeadline = new Date(new Date(task.createdAt).getTime() + 30 * 60000)
      const left = differenceInSeconds(responseDeadline, new Date())
      setResponseLeft(left > 0 ? left : 0)
    }
    
    updateResponseCountdown()
    const interval = setInterval(updateResponseCountdown, 1000)
    return () => clearInterval(interval)
  }, [task.createdAt, task.status])

  // Helper boolean to check if response window has passed
  const isResponseWindowOver = responseLeft === 0 && task.status === 'PENDING'

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h}h ${m}m ${s}s`
  }

  const handleRespond = async (response: 'ACCEPTED' | 'DECLINED') => {
    if (response === 'DECLINED' && !declineReason) {
      alert("Please provide a reason")
      return
    }
    try {
      await respondToTask(task.id, response, declineReason)
    } catch (e) {
      alert("Error responding")
    }
  }

  const handleAddLink = () => {
    if (!newLink) return
    if (submissions.length >= 10) return alert("Maximum 10 attachments allowed")
    setSubmissions([...submissions, { type: 'LINK', url: newLink }])
    setNewLink("")
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (submissions.length >= 10) return alert("Maximum 10 attachments allowed")

    setUploading(true)
    try {
      // Get signature from server
      const { timestamp, signature } = await getCloudinarySignature()
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '') 
      formData.append('timestamp', timestamp.toString())
      formData.append('signature', signature)
      formData.append('folder', 'task-submissions')

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      })
      
      const data = await res.json()
      if (data.secure_url) {
        setSubmissions([...submissions, { type: 'IMAGE', url: data.secure_url }])
      } else {
        alert("Upload failed")
      }
    } catch (e) {
      console.error(e)
      alert("Error uploading image")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmitTask = async () => {
    if (submissions.length < 1) return alert("Please add at least 1 attachment (Link or Image)")
    setSubmitting(true)
    try {
      await completeTask(task.id, submissions)
      setShowSubmit(false)
    } catch (e) {
      alert("Error submitting task")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 transition-all hover:shadow-xl relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-1 h-full ${
          task.priority === 'HIGH' ? 'bg-red-500' :
          task.priority === 'MEDIUM' ? 'bg-yellow-500' :
          'bg-green-500'
      }`} />
      
      <div className="flex justify-between items-start mb-4 pl-2">
        <div>
          <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 group-hover:text-blue-600 transition-colors">{task.title}</h3>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{task.description}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
            task.priority === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          }`}>
            {task.priority}
          </span>
          {/* Show Deadline Timer when Active */}
          {(task.status === 'ACCEPTED' || task.status === 'IN_PROGRESS') && (
            <span className={`text-xs font-mono font-bold ${deadlineLeft < 3600 ? 'text-red-500' : 'text-gray-500'}`}>
               Due in: {formatTime(deadlineLeft)}
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
        <div className="text-sm text-gray-500 flex flex-col">
          <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">Deadline</span>
          <span className="font-medium">{format(new Date(task.deadline), 'MMM d, HH:mm')}</span>
        </div>
        <div className="font-mono text-xl font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Clock size={20} className="animate-pulse" />
          {task.status === 'PENDING' ? '--:--:--' : formatTime(elapsed)}
        </div>
      </div>

      {task.feedback && task.status === 'REJECTED' && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          <div className="font-bold flex items-center gap-2 mb-1"><AlertTriangle size={16}/> Admin Feedback:</div>
          {task.feedback}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        {task.status === 'PENDING' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!isResponseWindowOver ? (
              <>
                <div className="mb-3 text-sm font-bold flex items-center gap-2 text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                  <Clock size={14} />
                  Response required in: {formatTime(responseLeft)}
                </div>
                {!showDecline ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={() => handleRespond('ACCEPTED')} className="flex-1 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-lg shadow-green-500/20">Accept Task</button>
                    <button onClick={() => setShowDecline(true)} className="flex-1 bg-white border border-red-200 text-red-600 p-3 rounded-lg hover:bg-red-50 transition-colors font-medium">Decline</button>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in zoom-in-95 duration-200">
                    <textarea 
                      placeholder="Reason for declining..." 
                      className="w-full p-3 border rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-red-500 outline-none"
                      value={declineReason}
                      onChange={e => setDeclineReason(e.target.value)}
                    />
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={() => handleRespond('DECLINED')} className="flex-1 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors">Confirm</button>
                      <button onClick={() => setShowDecline(false)} className="flex-1 bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-red-600 font-bold flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900">
                <Clock size={20} /> Response Window Expired
              </div>
            )}
          </div>
        )}

        {task.status === 'ACCEPTED' && (
          <button onClick={() => startTask(task.id)} className="w-full bg-blue-600 text-white p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 transform hover:scale-[1.02]">
            <Play size={18} fill="currentColor" /> Start Task
          </button>
        )}

        {(task.status === 'IN_PROGRESS' || task.status === 'REJECTED') && !showSubmit && (
          <div className="flex flex-col sm:flex-row gap-3">
            {task.status === 'IN_PROGRESS' && (
              <button onClick={() => pauseTask(task.id)} className="flex-1 bg-yellow-500 text-white p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-500/30">
                <Pause size={18} fill="currentColor" /> Pause
              </button>
            )}
            <button onClick={() => setShowSubmit(true)} className="flex-1 bg-green-600 text-white p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-lg shadow-green-500/30">
              <CheckCircle size={18} /> {task.status === 'REJECTED' ? 'Resubmit' : 'Complete'}
            </button>
          </div>
        )}

        {showSubmit && (
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
            <h4 className="font-bold mb-3 text-sm uppercase tracking-wide text-gray-500">Submit Work</h4>
            
            <div className="space-y-3 mb-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text" 
                  placeholder="Paste link here..." 
                  className="flex-1 p-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                  value={newLink}
                  onChange={e => setNewLink(e.target.value)}
                />
                <button onClick={handleAddLink} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center">
                  <LinkIcon size={18} /> <span className="sm:hidden ml-2">Add Link</span>
                </button>
              </div>
              
              <div className="relative">
                <input 
                  type="file" 
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  onChange={handleFileUpload}
                  accept="image/*"
                />
                <div className="w-full p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                  <Upload size={16} /> 
                  {uploading ? "Uploading..." : "Upload Image (Cloudinary)"}
                </div>
              </div>
            </div>

            {submissions.length > 0 && (
              <div className="mb-4 space-y-2">
                {submissions.map((sub, i) => (
                  <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 text-sm">
                    <div className="flex items-center gap-2 truncate max-w-[200px]">
                      {sub.type === 'LINK' ? <LinkIcon size={14} className="text-blue-500"/> : <Upload size={14} className="text-green-500"/>}
                      <span className="truncate">{sub.url}</span>
                    </div>
                    <button onClick={() => setSubmissions(submissions.filter((_, idx) => idx !== i))} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleSubmitTask} 
                disabled={submitting || submissions.length === 0}
                className="flex-1 bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Submit for Review'}
              </button>
              <button onClick={() => setShowSubmit(false)} className="flex-1 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 p-2 rounded-lg hover:bg-gray-300 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {task.status === 'PAUSED' && (
          <button onClick={() => resumeTask(task.id)} className="w-full bg-blue-600 text-white p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30">
            <Play size={18} fill="currentColor" /> Resume Work
          </button>
        )}

        {task.status === 'COMPLETED' && (
          <div className="text-center text-green-600 font-bold flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <CheckCircle size={20} /> Completed
          </div>
        )}

        {task.status === 'UNDER_REVIEW' && (
          <div className="text-center text-purple-600 font-bold flex items-center justify-center gap-2 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg animate-pulse">
            <Loader2 size={20} className="animate-spin" /> Under Review
          </div>
        )}
        
        {task.status === 'NO_RESPONSE' && (
           <div className="text-center text-red-600 font-bold flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <XCircle size={20} /> No Response
          </div>
        )}
      </div>
    </div>
  )
}
