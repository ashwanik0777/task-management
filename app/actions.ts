'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { sendTaskAssignmentEmail } from "@/lib/mail"

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

  revalidatePath('/admin')
}

export async function deleteTask(taskId: string) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ADMIN') {
    throw new Error("Unauthorized")
  }

  // Delete related records first if cascade isn't set up (Prisma usually handles this if configured, but let's be safe or rely on cascade)
  // Assuming cascade delete is configured in schema or we just delete the task.
  // Let's check schema.prisma first? No, let's just try deleting.
  // Actually, timeLogs and submissions are related.
  
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

  // Stop any currently running task for this user? 
  // For simplicity, let's assume one active task at a time or just log it.
  // But to be "accurate", we should probably stop others. 
  // Let's just start this one.

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
}
