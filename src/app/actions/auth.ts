"use server"

import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { getSystemSetting } from "@/lib/settings"

export async function registerUser(formData: FormData) {
  const allowSignups = await getSystemSetting("ALLOW_SIGNUPS", "true")
  if (allowSignups === "false") {
    return { error: "User registration is currently closed by the system administrator." }
  }

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  try {
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return { error: "User already exists with this email" }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // First user created will automatically be an ADMIN for setup convenience
    const userCount = await db.user.count()
    const role = userCount === 0 ? "ADMIN" : "USER"

    await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      }
    })

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "An error occurred during registration" }
  }
}
