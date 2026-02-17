'use client'
import { approveIntern, rejectIntern } from "@/app/actions"
import { CheckCircle, XCircle, Clock, ExternalLink, Search } from "lucide-react"
import { useMemo, useState } from "react"
import Link from "next/link"

export default function AdminInternList({ interns }: { interns: any[] }) {
  const [processing, setProcessing] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'REJECTED' | 'PENDING'>('ALL')

  const filteredInterns = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return interns.filter((intern) => {
      const matchesSearch =
        !query ||
        intern.name?.toLowerCase().includes(query) ||
        intern.email?.toLowerCase().includes(query) ||
        intern.rollNumber?.toLowerCase().includes(query)

      const matchesStatus = statusFilter === 'ALL' || intern.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [interns, searchTerm, statusFilter])

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
    <div className="space-y-5">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email or roll number"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                statusFilter === 'APPROVED'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                statusFilter === 'REJECTED'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              Rejected
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                statusFilter === 'PENDING'
                  ? 'bg-yellow-600 text-white border-yellow-600'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              Pending
            </button>
          </div>
        </div>

        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredInterns.length} of {interns.length} interns
        </p>
      </div>

      {filteredInterns.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center text-gray-600 dark:text-gray-400">
          No interns found for the current search/filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInterns.map(intern => (
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
      )}
    </div>
  )
}
