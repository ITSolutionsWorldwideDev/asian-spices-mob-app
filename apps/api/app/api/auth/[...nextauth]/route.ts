// app/api/auth/[...nextauth]/route.ts

// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import { webAuthOptions } from "@/core/auth";

const handler = NextAuth(webAuthOptions);

export { handler as GET, handler as POST };
