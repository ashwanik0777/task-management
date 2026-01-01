'use server'

import { prisma } from "@/lib/prisma"
import { sendOtpEmail } from "@/lib/mail"
import bcrypt from "bcryptjs"
import { randomInt } from "crypto"

// Generate 6-digit OTP
function generateOtp() {
  return randomInt(100000, 999999).toString()
}

export async function sendVerificationOtp(email: string, type: 'REGISTER' | 'RESET') {
  // Check if user exists based on type
  const user = await prisma.user.findUnique({ where: { email } })
  
  if (type === 'REGISTER' && user) {
    return { success: false, message: "Email already registered" }
  }
  
  if (type === 'RESET' && !user) {
    return { success: false, message: "Email not found" }
  }

  const otp = generateOtp()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Delete existing OTPs for this email
  await prisma.otp.deleteMany({ where: { email } })

  // Create new OTP
  await prisma.otp.create({
    data: {
      email,
      code: otp,
      expiresAt
    }
  })

  // Send Email
  try {
    await sendOtpEmail(email, otp)
    return { success: true, message: "OTP sent successfully" }
  } catch (error) {
    console.error("Failed to send OTP:", error)
    return { success: false, message: "Failed to send OTP" }
  }
}

export async function verifyOtp(email: string, code: string) {
  const otpRecord = await prisma.otp.findFirst({
    where: {
      email,
      code,
      expiresAt: { gt: new Date() }
    }
  })

  if (!otpRecord) {
    return { success: false, message: "Invalid or expired OTP" }
  }

  // We don't delete the OTP immediately so it can be used in the final submission
  // Or we can delete it and return a signed token. 
  // For simplicity, we'll keep it valid for the duration of the session (10m) 
  // and delete it upon successful registration/reset.
  
  return { success: true, message: "OTP verified" }
}

export async function resetPassword(name: string, email: string, otp: string, newPassword: string) {
  // Verify User Identity
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.name !== name) {
    return { success: false, message: "User details do not match" }
  }

  // Verify OTP
  const otpRecord = await prisma.otp.findFirst({
    where: {
      email,
      code: otp,
      expiresAt: { gt: new Date() }
    }
  })

  if (!otpRecord) {
    return { success: false, message: "Invalid or expired OTP" }
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // Update User
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  })

  // Cleanup OTP
  await prisma.otp.deleteMany({ where: { email } })

  return { success: true, message: "Password reset successfully" }
}
