'use server'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const bio = formData.get('bio') as string
  const skills = formData.get('skills') as string
  const avatarUrl = formData.get('avatarUrl') as string // In a real app, this would be a file upload URL

  await prisma.user.update({
    where: { id: (session.user as any).id },
    data: {
      bio,
      skills,
      avatarUrl
    }
  })

  revalidatePath('/intern/profile')
}

export async function getProfile() {
  const session = await auth()
  if (!session) return null
  
  return prisma.user.findUnique({
    where: { id: (session.user as any).id }
  })
}
