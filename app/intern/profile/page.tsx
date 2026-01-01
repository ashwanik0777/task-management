'use client'
import { updateProfile, getProfile } from "@/app/profile-actions"
import { useState, useEffect } from "react"
import { User, Save, Loader2, Camera } from "lucide-react"

export default function ProfilePage() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    getProfile().then(u => {
      setUser(u)
      setFetching(false)
    })
  }, [])

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    try {
      await updateProfile(formData)
      alert("Profile updated successfully!")
    } catch (e) {
      alert("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <User className="text-blue-600" /> My Profile
      </h1>

      <form action={handleSubmit} className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
        
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="relative w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-blue-100 dark:border-blue-900">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-gray-400" />
            )}
            <div className="absolute bottom-0 w-full bg-black/50 text-white text-[10px] text-center py-1">
              Change
            </div>
          </div>
          <div className="w-full max-w-xs">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Avatar URL</label>
            <input 
              name="avatarUrl" 
              defaultValue={user?.avatarUrl || ''}
              placeholder="https://example.com/photo.jpg"
              className="w-full p-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
            <p className="text-xs text-gray-500 mt-1">Paste a direct link to your photo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input 
              disabled
              value={user?.name || ''}
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input 
              disabled
              value={user?.email || ''}
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Roll Number</label>
            <input 
              disabled
              value={user?.rollNumber || ''}
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
          <textarea 
            name="bio"
            rows={3}
            defaultValue={user?.bio || ''}
            placeholder="Tell us about yourself..."
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills</label>
          <input 
            name="skills"
            defaultValue={user?.skills || ''}
            placeholder="React, Node.js, Python (comma separated)"
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Save Changes</>}
        </button>

      </form>
    </div>
  )
}
