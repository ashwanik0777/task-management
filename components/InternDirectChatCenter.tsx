'use client'

import DirectChatPanel from "@/components/DirectChatPanel"

export default function InternDirectChatCenter({
  conversationId,
  adminName,
  currentUserId
}: {
  conversationId: string
  adminName: string
  currentUserId: string
}) {
  return (
    <DirectChatPanel
      conversationId={conversationId}
      currentUserId={currentUserId}
      title={`Chat`}
    />
  )
}
