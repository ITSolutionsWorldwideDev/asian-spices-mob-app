// core/auth/admin/auth-options.ts
import type { NextAuthOptions } from "next-auth";
import { credentialsProvider } from "../core/providers";
import { createCallbacks } from "../core/callbacks";
import { SESSION_IDLE_TIME } from "../core/constants";

export const adminAuthOptions: NextAuthOptions = {
  providers: [
    credentialsProvider("admin")
  ],

  callbacks: createCallbacks(
    SESSION_IDLE_TIME.ADMIN
  ),

  session: {
    strategy: "jwt",
    maxAge: 30 * 60 // seconds (NextAuth requirement)
  },

  pages: {
    signIn: "/login"
  }
};