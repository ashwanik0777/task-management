'use client'
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"

export default function Navbar() {
  const { data: session } = useSession()
  
  if (!session) return null

  return (
    <nav className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 z-50 shadow-sm transition-colors duration-300">
      <Link href="/" className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">TaskMaster</Link>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hidden sm:inline bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
          {session.user?.name} <span className="text-xs opacity-70">({(session.user as any)?.role})</span>
        </span>
        <button onClick={() => signOut()} className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400" title="Sign Out">
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  )
}
