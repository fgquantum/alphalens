import { db } from "./db"

export async function getSystemSetting(key: string, defaultValue: string = ""): Promise<string> {
  try {
    const setting = await db.systemSetting.findUnique({
      where: { key }
    })
    return setting?.value ?? defaultValue
  } catch (e) {
    console.error(`Error fetching system setting ${key}:`, e)
    return defaultValue
  }
}

export async function setSystemSetting(key: string, value: string, userId?: string): Promise<boolean> {
  try {
    await db.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value }
    })
    
    // Log the change
    await logSystemEvent(
      "info",
      `System setting '${key}' updated to '${value}'`,
      "setting_change",
      userId
    )
    return true
  } catch (e) {
    console.error(`Error saving system setting ${key}:`, e)
    return false
  }
}

export async function logSystemEvent(
  level: "info" | "warn" | "error",
  message: string,
  action?: string,
  userId?: string
): Promise<void> {
  try {
    await db.systemLog.create({
      data: {
        level,
        message,
        action,
        userId
      }
    })
  } catch (e) {
    console.error("Error creating system log:", e)
  }
}
