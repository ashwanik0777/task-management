import { prisma } from "@/lib/prisma"
import { sendChatReminderEmail } from "@/lib/mail"

const DIRECT_CHAT_RETENTION_DAYS = 7

export async function purgeOldDirectMessages() {
  const directMessage = (prisma as any).directMessage
  if (!directMessage) return

  const retentionThreshold = new Date(Date.now() - DIRECT_CHAT_RETENTION_DAYS * 24 * 60 * 60 * 1000)

  await directMessage.deleteMany({
    where: {
      createdAt: { lt: retentionThreshold }
    }
  })
}

export async function processPendingAdminMessageReminders() {
  const directMessage = (prisma as any).directMessage
  if (!directMessage) {
    console.warn("Direct chat model delegate unavailable. Run prisma generate and restart server.")
    return
  }

  await purgeOldDirectMessages()

  const threshold = new Date(Date.now() - 30 * 60 * 1000)

  const pendingAdminMessages = await directMessage.findMany({
    where: {
      reminderSentAt: null,
      createdAt: { lte: threshold },
      sender: { role: 'ADMIN' }
    },
    include: {
      conversation: {
        include: {
          intern: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          admin: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  for (const adminMessage of pendingAdminMessages) {
    const replied = await directMessage.findFirst({
      where: {
        conversationId: adminMessage.conversationId,
        senderId: adminMessage.conversation.intern.id,
        createdAt: { gt: adminMessage.createdAt }
      },
      select: { id: true }
    })

    if (replied) {
      await directMessage.update({
        where: { id: adminMessage.id },
        data: { reminderSentAt: new Date() }
      })
      continue
    }

    try {
      await sendChatReminderEmail(
        adminMessage.conversation.intern.email,
        adminMessage.conversation.admin.name,
        adminMessage.message
      )

      await directMessage.update({
        where: { id: adminMessage.id },
        data: { reminderSentAt: new Date() }
      })
    } catch (error) {
      console.error('Failed to send chat reminder:', error)
    }
  }
}
