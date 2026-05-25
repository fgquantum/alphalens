import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") return null
  return session
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const { name, email, role, plan } = body

  // Validate
  if (role && !["USER", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }
  if (plan && !["free", "pro", "elite"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
  }

  // Prevent admin from demoting themselves
  if (id === session.user.id && role === "USER") {
    return NextResponse.json({ error: "Cannot remove your own admin role" }, { status: 400 })
  }

  try {
    const updated = await db.user.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(plan !== undefined ? { plan } : {}),
      },
      select: { id: true, name: true, email: true, role: true, plan: true },
    })
    return NextResponse.json(updated)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Update failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  // Prevent self-deletion
  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
  }

  try {
    await db.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Delete failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true, plan: true,
      createdAt: true, updatedAt: true,
      _count: { select: { watchlist: true } },
    },
  })

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(user)
}
