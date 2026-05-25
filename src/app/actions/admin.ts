"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { setSystemSetting, logSystemEvent } from "@/lib/settings"
import { revalidatePath } from "next/cache"

async function verifyAdmin() {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized. Admin access required.")
  }
  return session
}

export async function updateSystemSettingsAction(settings: Record<string, string>) {
  try {
    const session = await verifyAdmin()
    
    for (const [key, value] of Object.entries(settings)) {
      await setSystemSetting(key, value, session.user.id)
    }
    
    revalidatePath("/admin/settings")
    revalidatePath("/dashboard")
    revalidatePath("/")
    
    return { success: true, message: "Settings updated successfully." }
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to update settings" }
  }
}

export async function executeSqlQueryAction(query: string) {
  try {
    const session = await verifyAdmin()
    
    const sanitizedQuery = query.trim()
    if (!sanitizedQuery) {
      return { success: false, error: "Query cannot be empty" }
    }
    
    // Log the SQL execution
    await logSystemEvent(
      "warn",
      `Admin executed raw SQL query: "${sanitizedQuery.substring(0, 100)}${sanitizedQuery.length > 100 ? "..." : ""}"`,
      "sql_query",
      session.user.id
    )

    const isSelect = sanitizedQuery.toLowerCase().startsWith("select") || 
                     sanitizedQuery.toLowerCase().startsWith("pragma") || 
                     sanitizedQuery.toLowerCase().startsWith("explain")
                     
    if (isSelect) {
      const data = await db.$queryRawUnsafe(sanitizedQuery)
      return { success: true, type: "select" as const, data: data as any[] }
    } else {
      const affected = await db.$executeRawUnsafe(sanitizedQuery)
      return { success: true, type: "execute" as const, affected }
    }
  } catch (e: any) {
    return { success: false, error: (e.message || "SQL execution failed") as string }
  }
}

export async function clearSystemLogsAction() {
  try {
    const session = await verifyAdmin()
    await db.systemLog.deleteMany()
    await logSystemEvent("info", "System logs cleared", "clear_logs", session.user.id)
    revalidatePath("/admin/logs")
    return { success: true, message: "Logs cleared successfully" }
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to clear logs" }
  }
}
