'use client'
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"

export default function Navbar() {
  const { data: session } = useSession()
  
  return (
    <nav className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 z-50 shadow-sm transition-colors duration-300">
      <Link href="/" className="font-bold text-xl md:text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity truncate max-w-[200px] md:max-w-none">TaskMaster</Link>
      <div className="flex items-center gap-2 md:gap-4">
        <ThemeToggle />
        
        {session ? (
          <>
            {(session.user as any)?.role === 'INTERN' ? (
              <Link href="/intern/profile" className="hidden md:flex items-center bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {session.user?.name} <span className="text-xs opacity-70">({(session.user as any)?.role})</span>
                </span>
              </Link>
            ) : (
              <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {session.user?.name} <span className="text-xs opacity-70">({(session.user as any)?.role})</span>
                </span>
              </div>
            )}
            
            {/* Mobile User Indicator */}
            {(session.user as any)?.role === 'INTERN' ? (
              <Link href="/intern/profile" className="md:hidden w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                {session.user?.name?.charAt(0).toUpperCase()}
              </Link>
            ) : (
              <div className="md:hidden w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                {session.user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <button onClick={() => signOut()} className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400" title="Sign Out">
              <LogOut size={20} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              Login
            </Link>
            <Link href="/register" className="hidden sm:block px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
