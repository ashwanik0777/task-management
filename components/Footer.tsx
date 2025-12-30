'use client'
import { useEffect, useState } from "react"
import { incrementViewCount } from "@/app/actions"
import { Eye, Heart } from "lucide-react"

export default function Footer() {
  const [views, setViews] = useState<number | null>(null)

  useEffect(() => {
    incrementViewCount().then(setViews)
  }, [])

  return (
    <footer className="w-full py-6 mt-auto border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <span>&copy; {new Date().getFullYear()} TaskMaster. All rights reserved.</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span>Designed & Developed with</span>
          <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" />
          <span>by <span className="font-bold text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">Ashwani Kushwaha</span></span>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
          <Eye size={14} className="text-blue-500" />
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 min-w-[20px] text-center">
            {views !== null ? views.toLocaleString() : '...'}
          </span>
          {/* <span className="text-xs uppercase tracking-wider font-semibold">Views</span> */}
        </div>
      </div>
    </footer>
  )
}
