'use client'

import { clearDirectConversationMessages } from "@/app/actions"
import { Send } from "lucide-react"
import { useEffect, useState, useTransition } from "react"

type MessageItem = {
  id: string
  message: string
  createdAt: string
  sender: {
    id: string
    name: string
    role: string
  }
}

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatMessageDateLabel(value: string) {
  const current = new Date(value)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const currentDate = current.toDateString()
  if (currentDate === today.toDateString()) return 'Today'
  if (currentDate === yesterday.toDateString()) return 'Yesterday'

  return current.toLocaleDateString([], {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function mergeById(existing: MessageItem[], incoming: MessageItem[]) {
  const map = new Map<string, MessageItem>()

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

export default function DirectChatPanel({
  conversationId,
  currentUserId,
  title,
  subtitle
}: {
  conversationId: string | null
  currentUserId: string
  title: string
  subtitle?: string
}) {
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()

  const groupedItems = (() => {
    const items: Array<{ type: 'date', key: string, label: string } | { type: 'message', key: string, message: MessageItem }> = []
    let lastDateKey: string | null = null

    messages.forEach((message) => {
      const dateKey = new Date(message.createdAt).toDateString()

      if (dateKey !== lastDateKey) {
        items.push({
          type: 'date',
          key: dateKey,
          label: formatMessageDateLabel(message.createdAt),
        })
        lastDateKey = dateKey
      }

      items.push({
        type: 'message',
        key: message.id,
        message,
      })
    })

    return items
  })()

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }

    let mounted = true
    let isFirstLoad = true

    const loadMessages = async () => {
      try {
        if (isFirstLoad && mounted) {
          setLoading(true)
        }

        const response = await fetch(`/api/direct-chat/conversations/${conversationId}/messages`, { cache: 'no-store' })
        if (!response.ok) return

        const data = await response.json()
        if (mounted) {
          setMessages((prev) => mergeById(prev, data.messages ?? []))
        }
      } finally {
        if (mounted && isFirstLoad) {
          setLoading(false)
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
  }, [conversationId])

  const sendMessage = async () => {
    if (!conversationId || !text.trim()) return

    const response = await fetch(`/api/direct-chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text.trim() })
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      alert(data.error || 'Unable to send message')
      return
    }

    const data = await response.json()
    setMessages((prev) => mergeById(prev, [data.message]))
    setText('')
  }

  const clearChat = () => {
    if (!conversationId) return

    const confirmed = window.confirm('Clear chat for your view only? Messages will remain visible to the other side.')
    if (!confirmed) return

    startTransition(async () => {
      try {
        await clearDirectConversationMessages(conversationId)
        setMessages([])
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Unable to clear chat')
      }
    })
  }

  if (!conversationId) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center text-gray-500 dark:text-gray-400">
        Select a volunteer to start chat.
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col min-h-[560px]">
      <div className="mb-3 border-b border-gray-200 dark:border-gray-700 pb-3 flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
        <button
          onClick={clearChat}
          disabled={isPending || messages.length === 0}
          className="text-xs px-2.5 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Clear Chat
        </button>
      </div>
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{subtitle}</p>}
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Messages are retained for 7 days and auto-deleted after that.</p>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 bg-[#f7f7f8] dark:bg-gray-900/40 rounded-lg p-3">
        {loading ? (
          <p className="text-sm text-gray-500">Loading chat...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-500">No messages yet.</p>
        ) : (
          groupedItems.map((item) => {
            if (item.type === 'date') {
              return (
                <div key={item.key} className="flex justify-center py-1">
                  <span className="px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                    {item.label}
                  </span>
                </div>
              )
            }

            const msg = item.message
            const isSelf = msg.sender.id === currentUserId

            return (
              <div key={item.key} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                  isSelf
                    ? 'bg-[#d9fdd3] dark:bg-green-900/40 text-gray-900 dark:text-gray-100 rounded-br-md'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-md'
                }`}>
                  {!isSelf && (
                    <p className="text-[11px] text-blue-600 dark:text-blue-300 font-medium mb-0.5">
                      {msg.sender.name} ({msg.sender.role})
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  <div className="mt-1 text-[10px] text-gray-500 dark:text-gray-400 text-right">
                    {formatMessageTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim()}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Send size={15} /> Send
        </button>
      </div>
    </div>
  )
}
