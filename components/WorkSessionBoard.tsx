'use client'

import { addSessionReview, completeWorkSession, startWorkSession } from "@/app/actions"
import { MessageSquare, PlayCircle, CheckCircle2, Clock3, Send, History, ClipboardCheck } from "lucide-react"
import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

type SessionReview = {
  id: string
  note: string
  createdAt: string | Date
  reviewer: {
    id: string
    name: string
    role: string
  }
}

type WorkSession = {
  id: string
  internId: string
  status: string
  startedAt: string | Date
  completedAt: string | Date | null
  summary: string | null
  reviews: SessionReview[]
}

type ChatMessage = {
  id: string
  message: string
  createdAt: string
  sender: {
    id: string
    name: string
    role: string
  }
}

function formatDateTime(input: string | Date | null) {
  if (!input) return '—'
  const d = new Date(input)
  return d.toLocaleString()
}

function mergeById(existing: ChatMessage[], incoming: ChatMessage[]) {
  const map = new Map<string, ChatMessage>()

  existing.forEach((message) => {
    map.set(message.id, message)
  })

  incoming.forEach((message) => {
    map.set(message.id, message)
  })

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
}

export default function WorkSessionBoard({
  internId,
  currentUserRole,
  currentUserId,
  initialSessions
}: {
  internId: string
  currentUserRole: string
  currentUserId: string
  initialSessions: WorkSession[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [summary, setSummary] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [messageText, setMessageText] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(initialSessions[0]?.id ?? null)
  const isAdmin = currentUserRole === 'ADMIN'

  const activeSession = useMemo(
    () => initialSessions.find((session) => session.status === 'ACTIVE') ?? null,
    [initialSessions]
  )

  const selectedSession = useMemo(
    () => initialSessions.find((session) => session.id === selectedSessionId) ?? null,
    [initialSessions, selectedSessionId]
  )

  useEffect(() => {
    if (!selectedSessionId && initialSessions[0]) {
      setSelectedSessionId(initialSessions[0].id)
    }
  }, [initialSessions, selectedSessionId])

  useEffect(() => {
    if (!selectedSessionId) {
      setMessages([])
      setLoadingMessages(false)
      return
    }

    let mounted = true
    let isFirstLoad = true

    const loadMessages = async () => {
      try {
        if (isFirstLoad && mounted) {
          setLoadingMessages(true)
        }

        const response = await fetch(`/api/work-sessions/${selectedSessionId}/chat`, { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json()
        if (mounted) {
          setMessages((prev) => mergeById(prev, data.messages ?? []))
        }
      } finally {
        if (mounted && isFirstLoad) {
          setLoadingMessages(false)
        }
        isFirstLoad = false
      }
    }

    loadMessages()
    const timer = setInterval(loadMessages, 3000)

    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [selectedSessionId])

  const handleStartSession = () => {
    startTransition(async () => {
      try {
        await startWorkSession(internId)
        router.refresh()
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Unable to start session')
      }
    })
  }

  const handleCompleteSession = () => {
    if (!activeSession) return

    startTransition(async () => {
      try {
        await completeWorkSession(activeSession.id, summary)
        setSummary('')
        router.refresh()
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Unable to complete session')
      }
    })
  }

  const handleAddReview = () => {
    if (!selectedSession || !reviewText.trim()) return

    startTransition(async () => {
      try {
        await addSessionReview(selectedSession.id, reviewText)
        setReviewText('')
        router.refresh()
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Unable to add review')
      }
    })
  }

  const handleSendMessage = async () => {
    if (!selectedSessionId || !messageText.trim()) return

    try {
      const response = await fetch(`/api/work-sessions/${selectedSessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Unable to send message')
      }

      const data = await response.json()
      setMessages((prev) => mergeById(prev, [data.message]))
      setMessageText('')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to send message')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="text-blue-600" size={20} />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Work Session Control</h3>
        </div>

        {isAdmin ? (
          activeSession ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                <Clock3 size={16} />
                Active session started: {formatDateTime(activeSession.startedAt)}
              </div>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                placeholder="Session complete hone par yaha work summary likhein..."
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              />
              <button
                onClick={handleCompleteSession}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle2 size={18} /> Mark as Done
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartSession}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <PlayCircle size={18} /> Start New Session
            </button>
          )
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
            Session start/complete controls are managed by admin only.
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <History className="text-purple-600" size={20} />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Session History</h3>
        </div>

        {initialSessions.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">No sessions yet.</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {initialSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className={`px-3 py-1.5 rounded-full text-xs border ${
                    selectedSessionId === session.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {session.status === 'ACTIVE' ? 'Active' : 'Done'} • {new Date(session.startedAt).toLocaleDateString()}
                </button>
              ))}
            </div>

            {selectedSession && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-gray-900 dark:text-gray-200">Started:</span> {formatDateTime(selectedSession.startedAt)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-gray-900 dark:text-gray-200">Completed:</span> {formatDateTime(selectedSession.completedAt)}
                  </p>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-1">Work Summary</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {selectedSession.summary || 'No summary added.'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">Review Timeline</p>
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {selectedSession.reviews.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No reviews yet.</p>
                      ) : (
                        selectedSession.reviews.map((review) => (
                          <div key={review.id} className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-700 dark:text-gray-300">{review.note}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {review.reviewer.name} ({review.reviewer.role}) • {formatDateTime(review.createdAt)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {currentUserRole === 'ADMIN' && (
                    <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        rows={2}
                        placeholder="Add quick review update..."
                        className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm"
                      />
                      <button
                        onClick={handleAddReview}
                        disabled={isPending || !reviewText.trim()}
                        className="px-3 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700 disabled:opacity-50"
                      >
                        Add Review Note
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare size={18} className="text-blue-600" />
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Session Chat (Realtime)</h4>
                  </div>

                  <div className="flex-1 min-h-[220px] max-h-[320px] overflow-y-auto space-y-2 pr-1">
                    {loadingMessages ? (
                      <p className="text-sm text-gray-500">Loading messages...</p>
                    ) : messages.length === 0 ? (
                      <p className="text-sm text-gray-500">No messages yet.</p>
                    ) : (
                      messages.map((msg) => {
                        const isSelf = msg.sender.id === currentUserId
                        return (
                          <div
                            key={msg.id}
                            className={`max-w-[88%] p-2.5 rounded-lg text-sm ${
                              isSelf
                                ? 'ml-auto bg-blue-600 text-white'
                                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {!isSelf && (
                              <p className="text-xs opacity-80 mb-1">{msg.sender.name} ({msg.sender.role})</p>
                            )}
                            <p>{msg.message}</p>
                            <p className="text-[11px] opacity-80 mt-1">{formatDateTime(msg.createdAt)}</p>
                          </div>
                        )
                      })
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type message..."
                      className="flex-1 p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Send size={15} /> Send
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
