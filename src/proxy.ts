import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedRoutes = ["/dashboard", "/admin"]

// next-auth's auth() returns a handler compatible with the proxy convention
const authHandler = auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isProtectedRoute = protectedRoutes.some(route =>
    nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  // Admin route protection
  if (nextUrl.pathname.startsWith("/admin") && req.auth?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  return NextResponse.next()
})

export function proxy(request: NextRequest) {
  return (authHandler as (req: NextRequest) => Response | Promise<Response>)(request)
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
