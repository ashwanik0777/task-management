'use client'
import { approveIntern, rejectIntern } from "@/app/actions"
import { CheckCircle, XCircle, Clock, User, ExternalLink } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

export default function AdminInternList({ interns }: { interns: any[] }) {
  const [processing, setProcessing] = useState<string | null>(null)

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setProcessing(id)
    try {
      if (action === 'APPROVE') await approveIntern(id)
      else await rejectIntern(id)
    } catch (e) {
      alert("Error processing request")
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {interns.map(intern => (
        <div key={intern.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col relative group">
          <Link href={`/admin/interns/${intern.id}`} className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 transition-colors">
            <ExternalLink size={18} />
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
              {intern.avatarUrl ? (
                <img src={intern.avatarUrl} alt={intern.name} className="w-full h-full object-cover" />
              ) : (
                intern.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <Link href={`/admin/interns/${intern.id}`} className="font-bold text-gray-900 dark:text-gray-100 hover:underline decoration-blue-500 underline-offset-2">
                {intern.name}
              </Link>
              <p className="text-sm text-gray-500">{intern.email}</p>
              {intern.rollNumber && <p className="text-xs text-blue-500 font-medium mt-0.5">{intern.rollNumber}</p>}
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Status</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                intern.status === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                intern.status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {intern.status === 'APPROVED' && <CheckCircle size={12} />}
                {intern.status === 'REJECTED' && <XCircle size={12} />}
                {intern.status === 'PENDING' && <Clock size={12} />}
                {intern.status}
              </span>
            </div>

            {intern.status === 'PENDING' && (
              <div className="flex gap-3">
                <button 
                  onClick={() => handleAction(intern.id, 'APPROVE')}
                  disabled={!!processing}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {processing === intern.id ? '...' : 'Approve'}
                </button>
                <button 
                  onClick={() => handleAction(intern.id, 'REJECT')}
                  disabled={!!processing}
                  className="flex-1 bg-red-100 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  {processing === intern.id ? '...' : 'Reject'}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
