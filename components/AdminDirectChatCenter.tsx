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
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search volunteer"
          className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 mb-4"
        />

        <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
          {filtered.map((volunteer) => (
            <button
              key={volunteer.id}
              onClick={() => setSelectedVolunteerId(volunteer.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedVolunteerId === volunteer.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <p className="font-medium text-gray-900 dark:text-gray-100">{volunteer.name}</p>
              <p className="text-xs text-gray-500">{volunteer.email}</p>
              <p className={`text-[11px] mt-0.5 font-medium ${
                volunteer.status === 'APPROVED'
                  ? 'text-green-600'
                  : volunteer.status === 'REJECTED'
                    ? 'text-red-600'
                    : 'text-yellow-600'
              }`}>
                Status: {volunteer.status}
              </p>
              {volunteer.rollNumber && <p className="text-xs text-blue-600 mt-0.5">{volunteer.rollNumber}</p>}
              {volunteer.lastMessage && <p className="text-xs text-gray-500 mt-1 line-clamp-1">Last: {volunteer.lastMessage}</p>}
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-3">
        {selectedVolunteer && (
          <div className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedVolunteer.name}</p>
              <p className="text-sm text-gray-500">{selectedVolunteer.email}</p>
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
          subtitle="Admin can message any volunteer directly. Chat stays continuous even when work sessions change."
        />
      </div>
    </div>
  )
}
