"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  const name = (formData.get("name") as string)?.trim()
  if (!name || name.length < 2) return { error: "Name must be at least 2 characters" }
  if (name.length > 60) return { error: "Name too long" }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: { name },
    })
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Failed to update profile" }
  }
}
