'use client'

import { endAllActiveWorkSessions } from "@/app/actions"
import { CheckCircle2, Clock3, MessageSquare, ShieldAlert, User, History } from "lucide-react"
import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

type SessionItem = {
  id: string
  status: string
  startedAt: string | Date
  completedAt: string | Date | null
  summary: string | null
  intern: {
    id: string
    name: string
    email: string
    rollNumber: string | null
  }
  reviews: {
    id: string
    note: string
    createdAt: string | Date
    reviewer: {
      id: string
      name: string
      role: string
    }
  }[]
  messages: {
    id: string
    message: string
    createdAt: string | Date
    sender: {
      id: string
      name: string
      role: string
    }
  }[]
}

type SessionHistoryItem = {
  id: string
  year: number
  sessionNumber: number
  startedAt: string | Date
  endedAt: string | Date
  activeClosed: number
  snapshot: any
}

function formatDateTime(value: string | Date | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.toISOString().slice(0, 19).replace('T', ' ')} UTC`
}

export default function AdminSessionsCenter({
  sessions,
  current,
  history,
}: {
  sessions: SessionItem[]
  current: { year: number; sessionNumber: number; startedAt: string | Date }
  history: SessionHistoryItem[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL')

  const activeCount = useMemo(() => sessions.filter((s) => s.status === 'ACTIVE').length, [sessions])
  const completedCount = useMemo(() => sessions.filter((s) => s.status === 'COMPLETED').length, [sessions])
  const volunteersWithActive = useMemo(() => {
    const ids = new Set(sessions.filter((s) => s.status === 'ACTIVE').map((s) => s.intern.id))
    return ids.size
  }, [sessions])

  const filteredSessions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return sessions.filter((session) => {
      const matchesStatus = statusFilter === 'ALL' || session.status === statusFilter
      const matchesQuery =
        !query ||
        session.intern.name.toLowerCase().includes(query) ||
        session.intern.email.toLowerCase().includes(query) ||
        session.intern.rollNumber?.toLowerCase().includes(query)

      return matchesStatus && matchesQuery
    })
  }, [sessions, searchTerm, statusFilter])

  const handleEndAll = () => {
    if (activeCount === 0) return

    const confirmEnd = window.confirm('End all active sessions and immediately start a new session cycle for same volunteers?')
    if (!confirmEnd) return

    startTransition(async () => {
      try {
        const result = await endAllActiveWorkSessions()
        alert(`Session ${result.archivedYear}-${result.archivedSessionNumber} archived. ${result.endedCount} active sessions completed and ${result.startedCount} new sessions started.`)
        router.refresh()
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to end sessions')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-100 dark:bg-blue-900/30">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
          <h3 className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">{sessions.length}</h3>
        </div>
        <div className="p-5 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-100 dark:bg-yellow-900/30">
          <p className="text-sm text-gray-600 dark:text-gray-400">Current Active</p>
          <h3 className="text-3xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">{activeCount}</h3>
        </div>
        <div className="p-5 rounded-xl border border-green-200 dark:border-green-800 bg-green-100 dark:bg-green-900/30">
          <p className="text-sm text-gray-600 dark:text-gray-400">Completed Sessions</p>
          <h3 className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">{completedCount}</h3>
        </div>
        <div className="p-5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-100 dark:bg-purple-900/30">
          <p className="text-sm text-gray-600 dark:text-gray-400">Volunteers Active</p>
          <h3 className="text-3xl font-bold text-purple-700 dark:text-purple-300 mt-1">{volunteersWithActive}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">Current Year Cycle</p>
          <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{current.year}</h3>
        </div>
        <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">Current Session Number</p>
          <h3 className="text-2xl font-bold text-sky-700 dark:text-sky-300">#{current.sessionNumber}</h3>
        </div>
        <div className="p-4 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">Current Session Started</p>
          <h3 className="text-sm font-semibold text-teal-700 dark:text-teal-300 mt-1">{formatDateTime(current.startedAt)}</h3>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, roll number"
            className="flex-1 p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
          />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-2 text-sm rounded-lg border ${statusFilter === 'ALL' ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900' : 'border-gray-200 dark:border-gray-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-2 text-sm rounded-lg border ${statusFilter === 'ACTIVE' ? 'bg-yellow-600 text-white border-yellow-600' : 'border-gray-200 dark:border-gray-700'}`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-2 text-sm rounded-lg border ${statusFilter === 'COMPLETED' ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 dark:border-gray-700'}`}
            >
              Completed
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">Showing {filteredSessions.length} of {sessions.length} sessions</p>
          <button
            onClick={handleEndAll}
            disabled={isPending || activeCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            <ShieldAlert size={18} /> End Session
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center text-gray-500">
            No sessions found.
          </div>
        ) : (
          filteredSessions.map((session) => (
            <details key={session.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 group">
              <summary className="list-none cursor-pointer">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <User size={16} /> {session.intern.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{session.intern.email} {session.intern.rollNumber ? `• ${session.intern.rollNumber}` : ''}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      session.status === 'ACTIVE'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {session.status === 'ACTIVE' ? <Clock3 size={12} /> : <CheckCircle2 size={12} />}
                      {session.status}
                    </span>
                    <span className="text-xs text-gray-500">Started: {formatDateTime(session.startedAt)}</span>
                    <span className="text-xs text-gray-500">Completed: {formatDateTime(session.completedAt)}</span>
                  </div>
                </div>
              </summary>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Work Summary</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{session.summary || 'No summary available.'}</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-1"><History size={14} /> Reviews</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {session.reviews.length === 0 ? (
                        <p className="text-sm text-gray-500">No reviews yet.</p>
                      ) : (
                        session.reviews.map((review) => (
                          <div key={review.id} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
                            <p className="text-sm text-gray-700 dark:text-gray-300">{review.note}</p>
                            <p className="text-xs text-gray-500 mt-1">{review.reviewer.name} • {formatDateTime(review.createdAt)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1"><MessageSquare size={14} /> Chat Timeline</p>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {session.messages.length === 0 ? (
                      <p className="text-sm text-gray-500">No chat messages in this session.</p>
                    ) : (
                      session.messages.map((msg) => (
                        <div key={msg.id} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{msg.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{msg.sender.name} ({msg.sender.role}) • {formatDateTime(msg.createdAt)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </details>
          ))
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Archived Session History</h3>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500">No archived sessions yet.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {history.map((item) => {
              const winners = Array.isArray(item.snapshot?.winners) ? item.snapshot.winners : []
              return (
                <div key={item.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Session {item.year}-{item.sessionNumber}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDateTime(item.startedAt)} → {formatDateTime(item.endedAt)} • Active closed: {item.activeClosed}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Winners: {winners.length ? winners.map((w: any) => w.name).join(', ') : 'No winners recorded'}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
