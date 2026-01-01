import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials.email as string
        const password = credentials.password as string
        
        if (!email || !password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user) {
          return null
        }

        const passwordsMatch = await bcrypt.compare(password, user.password)
        if (!passwordsMatch) {
          return null
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.status = (user as any).status
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string
        (session.user as any).status = token.status as string
        (session.user as any).id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  }
})
