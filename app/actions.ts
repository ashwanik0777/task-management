'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

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

  await prisma.task.create({
    data: {
      title,
      description,
      priority,
      deadline: new Date(deadline),
      assignedToId,
      createdById: (session.user as any).id,
    }
  })

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
    return prisma.user.findMany({ where: { role: 'INTERN' } })
}
