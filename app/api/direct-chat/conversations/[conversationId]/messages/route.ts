import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { processPendingAdminMessageReminders, purgeOldDirectMessages } from "@/lib/direct-chat"

function getDirectChatDelegates() {
  const prismaAny = prisma as any
  return {
    directConversation: prismaAny.directConversation,
    directMessage: prismaAny.directMessage,
  }
}

async function validateConversationAccess(conversationId: string) {
  const session = await auth()
  if (!session || !session.user) {
    return { error: "Unauthorized", status: 401 as const }
  }

  const userId = (session.user as any).id as string
  const role = (session.user as any).role as string

  const { directConversation } = getDirectChatDelegates()
  if (!directConversation) {
    return { error: "Direct chat is not ready", status: 503 as const }
  }

  const conversation = await directConversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      internId: true,
      adminId: true,
    }
  })

  if (!conversation) {
    return { error: "Conversation not found", status: 404 as const }
  }

  const canAccess =
    (role === 'ADMIN' && conversation.adminId === userId) ||
    (role === 'INTERN' && conversation.internId === userId)

  if (!canAccess) {
    return { error: "Unauthorized", status: 401 as const }
  }

  let adminClearedAt: Date | null = null
  let internClearedAt: Date | null = null

  try {
    const markerRows = await prisma.$queryRaw<Array<{ adminClearedAt: Date | null; internClearedAt: Date | null }>>`
      SELECT "adminClearedAt", "internClearedAt"
      FROM "DirectConversation"
      WHERE "id" = ${conversationId}
      LIMIT 1
    `

    const marker = markerRows[0]
    adminClearedAt = marker?.adminClearedAt ?? null
    internClearedAt = marker?.internClearedAt ?? null
  } catch (error) {
    console.warn('DirectConversation clear markers unavailable:', error)
  }

  return { conversation, userId, role, adminClearedAt, internClearedAt }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params

  await purgeOldDirectMessages().catch((error) => {
    console.error('Message retention cleanup failed:', error)
  })

  await processPendingAdminMessageReminders().catch((error) => {
    console.error('Reminder processing failed:', error)
  })

  const access = await validateConversationAccess(conversationId)
  if ('error' in access) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const { directMessage } = getDirectChatDelegates()
  if (!directMessage) {
    return NextResponse.json({ error: "Direct chat is not ready" }, { status: 503 })
  }

  const visibleAfter = access.role === 'ADMIN'
    ? access.adminClearedAt
    : access.internClearedAt

  const messages = await directMessage.findMany({
    where: {
      conversationId,
      ...(visibleAfter ? { createdAt: { gt: visibleAfter } } : {}),
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  return NextResponse.json({ messages })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params

  await purgeOldDirectMessages().catch((error) => {
    console.error('Message retention cleanup failed:', error)
  })

  const access = await validateConversationAccess(conversationId)
  if ('error' in access) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const body = await request.json().catch(() => null)
  const message = (body?.message as string | undefined)?.trim()

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const { directConversation, directMessage } = getDirectChatDelegates()
  if (!directConversation || !directMessage) {
    return NextResponse.json({ error: "Direct chat is not ready" }, { status: 503 })
  }

  const created = await directMessage.create({
    data: {
      conversationId,
      senderId: access.userId,
      message
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          role: true
        }
      }
    }
  })

  await directConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() }
  })

  await processPendingAdminMessageReminders().catch((error) => {
    console.error('Reminder processing failed:', error)
  })

  return NextResponse.json({ message: created }, { status: 201 })
}
