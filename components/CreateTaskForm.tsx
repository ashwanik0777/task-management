'use client'
import { createTask } from "@/app/actions"
import { useState } from "react"
import { Calendar, User, Flag, Type, FileText, Send } from "lucide-react"

export default function CreateTaskForm({ interns }: { interns: any[] }) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    try {
      // Fix timezone issue: Convert local datetime input to UTC ISO string
      const deadlineInput = formData.get('deadline') as string
      if (deadlineInput) {
        const localDate = new Date(deadlineInput)
        formData.set('deadline', localDate.toISOString())
      }

      await createTask(formData)
      // We could add a toast here, but for now alert is fine, or we could just reset the form
      // Ideally we should use useFormStatus but we are in a client component wrapper
      const form = document.querySelector('form') as HTMLFormElement
      form?.reset()
      alert("Task assigned successfully!")
    } catch (e) {
      alert("Error assigning task")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Type size={16} /> Title
        </label>
        <input 
          name="title" 
          required 
          placeholder="Enter task title..."
          className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <FileText size={16} /> Description
        </label>
        <textarea 
          name="description" 
          required 
          rows={3}
          placeholder="Detailed task description..."
          className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none" 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Flag size={16} /> Priority
          </label>
          <div className="relative">
            <select name="priority" className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Calendar size={16} /> Deadline
          </label>
          <input 
            type="datetime-local" 
            name="deadline" 
            required 
            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <User size={16} /> Assign To
        </label>
        <div className="relative">
          <select name="assignedToId" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
            <option value="">Select an intern...</option>
            <option value="ALL" className="font-bold text-blue-600">All Interns (Assign to everyone)</option>
            {interns.map(intern => (
              <option key={intern.id} value={intern.id}>{intern.name} ({intern.email})</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          name="sendEmail" 
          id="sendEmail"
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <label htmlFor="sendEmail" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Send email notification to intern
        </label>
      </div>

      <button 
        disabled={loading} 
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Assigning...
          </>
        ) : (
          <>
            <Send size={18} /> Assign Task
          </>
        )}
      </button>
    </form>
  )
}
