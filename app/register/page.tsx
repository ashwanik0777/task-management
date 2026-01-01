'use client'
import { registerIntern } from "@/app/actions"
import { sendVerificationOtp, verifyOtp } from "@/app/auth-actions"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Loader2 } from "lucide-react"

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otp, setOtp] = useState("")
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const router = useRouter()

  const handleSendOtp = async () => {
    if (!email) return alert("Please enter your email first")
    setLoading(true)
    try {
      const res = await sendVerificationOtp(email, 'REGISTER')
      if (res.success) {
        setOtpSent(true)
        alert("OTP sent to your email")
      } else {
        alert(res.message)
      }
    } catch (e) {
      alert("Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp) return alert("Please enter OTP")
    setVerifyingOtp(true)
    try {
      const res = await verifyOtp(email, otp)
      if (res.success) {
        setOtpVerified(true)
        alert("Email verified successfully")
      } else {
        alert(res.message)
      }
    } catch (e) {
      alert("Failed to verify OTP")
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleSubmit = async (formData: FormData) => {
    if (!otpVerified) return alert("Please verify your email first")
    
    const rollNumber = formData.get('rollNumber') as string
    const rollRegex = /^\d{3}[A-Z]{3}\d{3}$/
    if (!rollRegex.test(rollNumber)) {
      return alert("Invalid Roll Number format. Must be like 222UCS001")
    }

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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Roll Number</label>
            <input 
              name="rollNumber"
              type="text" 
              required
              pattern="[0-9]{3}[A-Z]{3}[0-9]{3}"
              title="Format: 222UCS001"
              placeholder="222UCS001" 
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:bg-gray-800 dark:border-gray-700 uppercase"
            />
            <p className="text-xs text-gray-500 mt-1">Format: 3 digits, 3 letters, 3 digits (e.g. 222UCS001)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <div className="flex gap-2">
              <input 
                name="email"
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={otpVerified}
                placeholder="ashwani@gmail.com" 
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 ${otpVerified ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200'}`}
              />
              {!otpVerified && (
                <button 
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || !email}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : (otpSent ? "Resend" : "Verify")}
                </button>
              )}
              {otpVerified && <CheckCircle className="text-green-500 self-center" />}
            </div>
          </div>

          {otpSent && !otpVerified && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enter OTP</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456" 
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700"
                />
                <button 
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || !otp}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {verifyingOtp ? <Loader2 className="animate-spin" size={18} /> : "Confirm"}
                </button>
              </div>
            </div>
          )}

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
          disabled={loading || !otpVerified}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
