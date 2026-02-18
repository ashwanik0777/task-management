import { prisma } from "@/lib/prisma"
import { sendChatReminderEmail } from "@/lib/mail"

export async function processPendingAdminMessageReminders() {
  const directMessage = (prisma as any).directMessage
  if (!directMessage) {
    console.warn("Direct chat model delegate unavailable. Run prisma generate and restart server.")
    return
  }

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
