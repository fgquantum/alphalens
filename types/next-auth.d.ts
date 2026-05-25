import "next-auth"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    role?: string
    plan?: string
  }

  interface Session {
    user: {
      id: string
      role?: string
      plan?: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    plan?: string
  }
}
