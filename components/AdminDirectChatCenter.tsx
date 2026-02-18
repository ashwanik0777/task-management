'use client'

import { createOrGetDirectConversation } from "@/app/actions"
import DirectChatPanel from "@/components/DirectChatPanel"
import { MessageCircle } from "lucide-react"
import { useMemo, useState, useTransition } from "react"

type VolunteerItem = {
  id: string
  name: string
  email: string
  rollNumber: string | null
  status: string
  conversationId: string | null
  lastMessage: string | null
  lastMessageAt: string | Date | null
}

function formatLastSeen(value: string | Date | null) {
  if (!value) return 'No messages yet'
  const date = new Date(value)
  return `Last activity: ${date.toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`
}

export default function AdminDirectChatCenter({
  volunteers,
  currentUserId
}: {
  volunteers: VolunteerItem[]
  currentUserId: string
}) {
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string | null>(volunteers[0]?.id ?? null)
  const [conversationByVolunteer, setConversationByVolunteer] = useState<Record<string, string | null>>(
    Object.fromEntries(volunteers.map((v) => [v.id, v.conversationId]))
  )

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return volunteers

    return volunteers.filter((volunteer) =>
      volunteer.name.toLowerCase().includes(query) ||
      volunteer.email.toLowerCase().includes(query) ||
      volunteer.rollNumber?.toLowerCase().includes(query)
    )
  }, [volunteers, searchTerm])

  const selectedVolunteer = volunteers.find((v) => v.id === selectedVolunteerId) || null
  const selectedConversationId = selectedVolunteer ? conversationByVolunteer[selectedVolunteer.id] : null

  const startChat = () => {
    if (!selectedVolunteer) return

    startTransition(async () => {
      try {
        const conversationId = await createOrGetDirectConversation(selectedVolunteer.id)
        setConversationByVolunteer((prev) => ({ ...prev, [selectedVolunteer.id]: conversationId }))
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Unable to start chat')
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Volunteer Inbox</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Pick any volunteer to open direct support chat.</p>
        </div>

        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, roll no"
          className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 mb-4"
        />

        <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
          {filtered.map((volunteer) => (
            <button
              key={volunteer.id}
              onClick={() => setSelectedVolunteerId(volunteer.id)}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${selectedVolunteerId === volunteer.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{volunteer.name}</p>
                  <p className="text-xs text-gray-500">{volunteer.email}</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
                  volunteer.status === 'APPROVED'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : volunteer.status === 'REJECTED'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                }`}>
                  {volunteer.status}
                </span>
              </div>
              {volunteer.rollNumber && <p className="text-xs text-blue-600 mt-1">{volunteer.rollNumber}</p>}
              {volunteer.lastMessage ? (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">{volunteer.lastMessage}</p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">No messages yet</p>
              )}
              <p className="text-[11px] text-gray-400 mt-1">{formatLastSeen(volunteer.lastMessageAt)}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-3">
        {selectedVolunteer && (
          <div className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 shadow-sm">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedVolunteer.name}</p>
              <p className="text-sm text-gray-500">{selectedVolunteer.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatLastSeen(selectedVolunteer.lastMessageAt)}</p>
            </div>
            {!selectedConversationId && (
              <button
                onClick={startChat}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <MessageCircle size={16} /> Start Chat
              </button>
            )}
          </div>
        )}

        <DirectChatPanel
          conversationId={selectedConversationId ?? null}
          currentUserId={currentUserId}
          title={selectedVolunteer ? `Chat with ${selectedVolunteer.name}` : 'Volunteer Chat'}
          subtitle="Live sync support chat — messages stay stable and auto-update."
        />
      </div>
    </div>
  )
}
