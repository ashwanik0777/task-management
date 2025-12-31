'use client'
import { registerIntern } from "@/app/actions"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    try {
      await registerIntern(formData)
      alert("Registration successful! Please wait for admin approval.")
      router.push("/login")
    } catch (e: any) {
      alert(e.message || "Error registering")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <form action={handleSubmit} className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-md space-y-6 border border-gray-100 dark:border-gray-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Join TaskMaster</h1>
          <p className="text-gray-500 mt-2">Register as an Intern</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input 
              name="name"
              type="text" 
              required
              placeholder="Ashwani" 
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input 
              name="email"
              type="email" 
              required
              placeholder="ashwani@gmail.com" 
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input 
              name="password"
              type="password" 
              required
              placeholder="••••••••" 
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/30 disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
        
        <div className="text-center text-sm text-gray-500">
          Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </div>
      </form>
    </div>
  )
}
