import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

async function validateSessionAccess(sessionId: string) {
  const session = await auth()
  if (!session || !session.user) return { error: "Unauthorized", status: 401 as const }

  const role = (session.user as any).role as string
  const userId = (session.user as any).id as string

  const workSession = await prisma.workSession.findUnique({
    where: { id: sessionId },
    select: { id: true, internId: true }
  })

  if (!workSession) return { error: "Session not found", status: 404 as const }

  if (role !== 'ADMIN' && workSession.internId !== userId) {
    return { error: "Unauthorized", status: 401 as const }
  }

  return { workSession, userId }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  const access = await validateSessionAccess(sessionId)

  if ('error' in access) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const messages = await prisma.sessionChatMessage.findMany({
    where: { sessionId },
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
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  const access = await validateSessionAccess(sessionId)

  if ('error' in access) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const body = await request.json().catch(() => null)
  const message = (body?.message as string | undefined)?.trim()

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }

  const created = await prisma.sessionChatMessage.create({
    data: {
      sessionId,
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

  return NextResponse.json({ message: created }, { status: 201 })
}
