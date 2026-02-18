'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { sendTaskAssignmentEmail } from "@/lib/mail"
import { processPendingAdminMessageReminders, purgeOldDirectMessages } from "@/lib/direct-chat"

export async function createTask(formData: FormData) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ADMIN') {
    throw new Error("Unauthorized")
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const priority = formData.get('priority') as string
  const deadline = formData.get('deadline') as string
  const assignedToId = formData.get('assignedToId') as string
  const sendEmail = formData.get('sendEmail') === 'on'

  if (assignedToId === 'ALL') {
    const interns = await prisma.user.findMany({
      where: {
        role: 'INTERN',
        status: 'APPROVED'
      }
    })

    // Create task for each intern
    for (const intern of interns) {
      const task = await prisma.task.create({
        data: {
          title,
          description,
          priority,
          deadline: new Date(deadline),
          assignedToId: intern.id,
          createdById: (session.user as any).id,
          sendEmail
        }
      })

      if (sendEmail && intern.email) {
        await sendTaskAssignmentEmail(
          intern.email,
          task.title,
          task.description,
          task.deadline,
          task.priority
        )
      }
    }
  } else {
    // Single assignment
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        deadline: new Date(deadline),
        assignedToId,
        createdById: (session.user as any).id,
        sendEmail
      },
      include: {
        assignedTo: true
      }
    })

    if (sendEmail && task.assignedTo.email) {
      await sendTaskAssignmentEmail(
        task.assignedTo.email,
        task.title,
        task.description,
        task.deadline,
        task.priority
      )
    }
  }

  revalidatePath('/admin')
}

export async function deleteTask(taskId: string) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ADMIN') {
    throw new Error("Unauthorized")
  }


  await prisma.timeLog.deleteMany({ where: { taskId } })
  await prisma.submission.deleteMany({ where: { taskId } })
  await prisma.task.delete({ where: { id: taskId } })

  revalidatePath('/admin')
}

export async function respondToTask(taskId: string, response: 'ACCEPTED' | 'DECLINED', reason?: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) throw new Error("Task not found")

  // Check 30m window
  const now = new Date()
  const deadline = new Date(task.createdAt.getTime() + 30 * 60000)
  
  if (now > deadline) {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'NO_RESPONSE' }
    })
    throw new Error("Response window expired")
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: response,
      declineReason: reason
    }
  })

  revalidatePath('/intern')
}

export async function startTask(taskId: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  await prisma.timeLog.updateMany({
    where: { 
      taskId, 
      endTime: null 
    },
    data: { endTime: new Date() }
  })

  await prisma.task.update({
    where: { id: taskId },
    data: { status: 'IN_PROGRESS' }
  })

  await prisma.timeLog.create({
    data: {
      taskId,
      type: 'WORK',
      startTime: new Date()
    }
  })

  revalidatePath('/intern')
}

export async function pauseTask(taskId: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  // Find last open WORK log
  const lastLog = await prisma.timeLog.findFirst({
    where: { taskId, type: 'WORK', endTime: null },
    orderBy: { startTime: 'desc' }
  })

  if (lastLog) {
    await prisma.timeLog.update({
      where: { id: lastLog.id },
      data: { endTime: new Date() }
    })
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { status: 'PAUSED' }
  })

  await prisma.timeLog.create({
    data: {
      taskId,
      type: 'PAUSE',
      startTime: new Date()
    }
  })

  revalidatePath('/intern')
}

export async function resumeTask(taskId: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  // Find last open PAUSE log
  const lastLog = await prisma.timeLog.findFirst({
    where: { taskId, type: 'PAUSE', endTime: null },
    orderBy: { startTime: 'desc' }
  })

  if (lastLog) {
    await prisma.timeLog.update({
      where: { id: lastLog.id },
      data: { endTime: new Date() }
    })
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { status: 'IN_PROGRESS' }
  })

  await prisma.timeLog.create({
    data: {
      taskId,
      type: 'WORK',
      startTime: new Date()
    }
  })

  revalidatePath('/intern')
}

export async function completeTask(taskId: string, submissions: { type: string, url: string }[]) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  // Close any open logs
  const lastLog = await prisma.timeLog.findFirst({
    where: { taskId, endTime: null },
    orderBy: { startTime: 'desc' }
  })

  if (lastLog) {
    await prisma.timeLog.update({
      where: { id: lastLog.id },
      data: { endTime: new Date() }
    })
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { 
      status: 'UNDER_REVIEW',
      submissions: {
        create: submissions
      }
    }
  })

  revalidatePath('/intern')
  revalidatePath('/admin')
}

export async function reviewTask(taskId: string, decision: 'APPROVED' | 'REJECTED', feedback?: string) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error("Unauthorized")

  const status = decision === 'APPROVED' ? 'COMPLETED' : 'REJECTED'

  await prisma.task.update({
    where: { id: taskId },
    data: { 
      status,
      feedback: feedback || null
    }
  })

  revalidatePath('/admin')
  revalidatePath('/intern')
}

export async function reassignTask(taskId: string) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error("Unauthorized")

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) throw new Error("Task not found")

  await prisma.task.update({
    where: { id: taskId },
    data: { 
      createdAt: new Date(), 
      status: 'PENDING',    
      title: task.title.includes("(Reassigned)") ? task.title : `(Reassigned) ${task.title}`
    }
  })

  revalidatePath('/admin')
  revalidatePath('/intern')
}

export async function getInterns() {
    const session = await auth()
    if (!session || (session.user as any).role !== 'ADMIN') return []
    return prisma.user.findMany({ where: { role: 'INTERN', status: 'APPROVED' } })
}

export async function getAllInterns() {
    const session = await auth()
    if (!session || (session.user as any).role !== 'ADMIN') return []
    return prisma.user.findMany({ 
      where: { role: 'INTERN' },
      orderBy: { createdAt: 'desc' }
    })
}

export async function registerIntern(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const rollNumber = formData.get('rollNumber') as string

  if (!name || !email || !password || !rollNumber) throw new Error("Missing fields")

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) throw new Error("User already exists")

  const existingRoll = await prisma.user.findUnique({ where: { rollNumber } })
  if (existingRoll) throw new Error("Roll Number already registered")

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'INTERN',
      status: 'PENDING',
      rollNumber
    }
  })
}

export async function approveIntern(internId: string) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error("Unauthorized")
  
  await prisma.user.update({
    where: { id: internId },
    data: { status: 'APPROVED' }
  })
  revalidatePath('/admin/interns')
  revalidatePath('/admin')
}

export async function rejectIntern(internId: string) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error("Unauthorized")
  
  await prisma.user.update({
    where: { id: internId },
    data: { status: 'REJECTED' }
  })
  revalidatePath('/admin/interns')
}

import { cookies } from "next/headers"

export async function incrementViewCount() {
  const cookieStore = await cookies()
  const hasViewed = cookieStore.get('has_viewed_site')

  try {
    // Get the stats record (create if not exists)
    let stats = await prisma.siteStats.findFirst()
    if (!stats) {
      stats = await prisma.siteStats.create({ data: { views: 0 } })
    }

    if (!hasViewed) {
      // Increment view count
      stats = await prisma.siteStats.update({
        where: { id: stats.id },
        data: { views: { increment: 1 } }
      })

      // Set cookie for 24 hours
      cookieStore.set('has_viewed_site', 'true', { maxAge: 60 * 60 * 24 })
    }

    return stats.views
  } catch (error) {
    console.error("incrementViewCount failed:", error)
    return 0
  }
}

type SessionListItem = {
  id: string
  internId: string
  status: string
  startedAt: Date
  completedAt: Date | null
  summary: string | null
  reviews: {
    id: string
    note: string
    createdAt: Date
    reviewer: {
      id: string
      name: string
      role: string
    }
  }[]
}

async function canAccessInternSessions(targetInternId: string) {
  const session = await auth()
  if (!session || !session.user) throw new Error("Unauthorized")

  const role = (session.user as any).role as string
  const userId = (session.user as any).id as string

  if (role !== 'ADMIN' && userId !== targetInternId) {
    throw new Error("Unauthorized")
  }

  return { session, role, userId }
}

export async function getInternWorkSessions(internId: string): Promise<SessionListItem[]> {
  await canAccessInternSessions(internId)

  return prisma.workSession.findMany({
    where: { internId },
    include: {
      reviews: {
        include: {
          reviewer: {
            select: { id: true, name: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { startedAt: 'desc' }
  })
}

export async function startWorkSession(internId: string) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error("Unauthorized")

  const existingActive = await prisma.workSession.findFirst({
    where: { internId, status: 'ACTIVE' },
    select: { id: true }
  })

  if (existingActive) {
    throw new Error("An active session already exists")
  }

  const newSession = await prisma.workSession.create({
    data: {
      internId,
      status: 'ACTIVE'
    }
  })

  revalidatePath('/intern')
  revalidatePath(`/admin/interns/${internId}`)

  return newSession
}

export async function completeWorkSession(sessionId: string, summary: string) {
  const session = await auth()
  if (!session || !session.user || (session.user as any).role !== 'ADMIN') throw new Error("Unauthorized")

  const workSession = await prisma.workSession.findUnique({
    where: { id: sessionId },
    select: { id: true, internId: true, status: true }
  })

  if (!workSession) throw new Error("Session not found")

  if (workSession.status !== 'ACTIVE') {
    throw new Error("Only active sessions can be completed")
  }

  await prisma.workSession.update({
    where: { id: sessionId },
    data: {
      status: 'COMPLETED',
      summary: summary.trim() || null,
      completedAt: new Date()
    }
  })

  revalidatePath('/intern')
  revalidatePath(`/admin/interns/${workSession.internId}`)
}

export async function addSessionReview(sessionId: string, note: string) {
  const session = await auth()
  if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
    throw new Error("Unauthorized")
  }

  const trimmedNote = note.trim()
  if (!trimmedNote) throw new Error("Review note is required")

  const workSession = await prisma.workSession.findUnique({
    where: { id: sessionId },
    select: { internId: true }
  })

  if (!workSession) throw new Error("Session not found")

  await prisma.sessionReview.create({
    data: {
      sessionId,
      reviewerId: (session.user as any).id,
      note: trimmedNote
    }
  })

  revalidatePath('/intern')
  revalidatePath(`/admin/interns/${workSession.internId}`)
}

type AdminSessionListItem = {
  id: string
  status: string
  startedAt: Date
  completedAt: Date | null
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
    createdAt: Date
    reviewer: {
      id: string
      name: string
      role: string
    }
  }[]
  messages: {
    id: string
    message: string
    createdAt: Date
    sender: {
      id: string
      name: string
      role: string
    }
  }[]
}

export async function getAllWorkSessionsForAdmin(): Promise<AdminSessionListItem[]> {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error("Unauthorized")

  return prisma.workSession.findMany({
    include: {
      intern: {
        select: {
          id: true,
          name: true,
          email: true,
          rollNumber: true
        }
      },
      reviews: {
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      messages: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { startedAt: 'desc' }
  })
}

export async function endAllActiveWorkSessions() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error("Unauthorized")

  const now = new Date()

  const result = await prisma.workSession.updateMany({
    where: { status: 'ACTIVE' },
    data: {
      status: 'COMPLETED',
      completedAt: now,
      summary: 'Bulk ended by admin'
    }
  })

  revalidatePath('/admin')
  revalidatePath('/admin/sessions')
  revalidatePath('/intern')
  revalidatePath('/admin/interns')

  return result.count
}

type AdminDirectChatVolunteer = {
  id: string
  name: string
  email: string
  rollNumber: string | null
  status: string
  conversationId: string | null
  lastMessage: string | null
  lastMessageAt: Date | null
}

function getDirectChatDelegates() {
  const prismaAny = prisma as any
  return {
    directConversation: prismaAny.directConversation,
    directMessage: prismaAny.directMessage,
  }
}

export async function getAdminDirectChatOverview(): Promise<AdminDirectChatVolunteer[]> {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error("Unauthorized")

  await processPendingAdminMessageReminders().catch((error) => {
    console.error('Reminder processing failed:', error)
  })

  await purgeOldDirectMessages().catch((error) => {
    console.error('Message retention cleanup failed:', error)
  })

  const adminId = (session.user as any).id as string
  const { directConversation } = getDirectChatDelegates()

  const interns = await prisma.user.findMany({
    where: {
      role: 'INTERN'
    },
    orderBy: { createdAt: 'desc' }
  })

  if (!directConversation) {
    return interns.map((intern) => ({
      id: intern.id,
      name: intern.name,
      email: intern.email,
      rollNumber: intern.rollNumber,
      status: intern.status,
      conversationId: null,
      lastMessage: null,
      lastMessageAt: null,
    }))
  }

  const conversations: Array<{
    id: string
    internId: string
    adminClearedAt: Date | null
    messages: Array<{
      message: string
      createdAt: Date
    }>
  }> = await directConversation.findMany({
    where: { adminId },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 20
      }
    }
  })

  const conversationByIntern = new Map<string, (typeof conversations)[number]>(
    conversations.map((conversation) => [conversation.internId, conversation])
  )

  return interns.map((intern) => {
    const conversation = conversationByIntern.get(intern.id)
    const latestMessage = conversation
      ? conversation.messages.find((message) => {
          if (!conversation.adminClearedAt) return true
          return new Date(message.createdAt).getTime() > new Date(conversation.adminClearedAt).getTime()
        })
      : undefined

    return {
      id: intern.id,
      name: intern.name,
      email: intern.email,
      rollNumber: intern.rollNumber,
      status: intern.status,
      conversationId: conversation?.id ?? null,
      lastMessage: latestMessage?.message ?? null,
      lastMessageAt: latestMessage?.createdAt ?? null
    }
  })
}

export async function createOrGetDirectConversation(internId: string) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error("Unauthorized")

  const { directConversation } = getDirectChatDelegates()
  if (!directConversation) {
    throw new Error("Direct chat is not ready. Run prisma generate and restart server.")
  }

  const adminId = (session.user as any).id as string

  const intern = await prisma.user.findUnique({
    where: { id: internId },
    select: { id: true, role: true }
  })

  if (!intern || intern.role !== 'INTERN') throw new Error("Invalid volunteer")

  const conversation = await directConversation.upsert({
    where: {
      internId_adminId: {
        internId,
        adminId
      }
    },
    update: {},
    create: {
      internId,
      adminId
    },
    select: { id: true }
  })

  revalidatePath('/admin/chat')
  revalidatePath('/intern/chat')

  return conversation.id
}

export async function getInternDirectChatOverview() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'INTERN') throw new Error("Unauthorized")

  await processPendingAdminMessageReminders().catch((error) => {
    console.error('Reminder processing failed:', error)
  })

  await purgeOldDirectMessages().catch((error) => {
    console.error('Message retention cleanup failed:', error)
  })

  const { directConversation } = getDirectChatDelegates()
  if (!directConversation) {
    throw new Error("Direct chat is not ready. Run prisma generate and restart server.")
  }

  const internId = (session.user as any).id as string

  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, email: true }
  })

  if (!admin) {
    throw new Error("No admin user found")
  }

  const conversation = await directConversation.upsert({
    where: {
      internId_adminId: {
        internId,
        adminId: admin.id
      }
    },
    update: {},
    create: {
      internId,
      adminId: admin.id
    },
    select: { id: true }
  })

  return {
    admin,
    conversationId: conversation.id
  }
}

export async function clearDirectConversationMessages(conversationId: string) {
  const session = await auth()
  if (!session || !session.user) throw new Error("Unauthorized")

  const userId = (session.user as any).id as string
  const role = (session.user as any).role as string

  const { directConversation } = getDirectChatDelegates()
  if (!directConversation) {
    throw new Error("Direct chat is not ready. Run prisma generate and restart server.")
  }

  const conversation = await directConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, adminId: true, internId: true }
  })

  if (!conversation) throw new Error("Conversation not found")

  const canAccess =
    (role === 'ADMIN' && conversation.adminId === userId) ||
    (role === 'INTERN' && conversation.internId === userId)

  if (!canAccess) throw new Error("Unauthorized")

  const clearAt = new Date()

  if (role === 'ADMIN') {
    await prisma.$executeRaw`
      UPDATE "DirectConversation"
      SET "adminClearedAt" = ${clearAt}
      WHERE "id" = ${conversationId}
    `
  } else {
    await prisma.$executeRaw`
      UPDATE "DirectConversation"
      SET "internClearedAt" = ${clearAt}
      WHERE "id" = ${conversationId}
    `
  }

  revalidatePath('/admin/chat')
  revalidatePath('/intern/chat')
}
