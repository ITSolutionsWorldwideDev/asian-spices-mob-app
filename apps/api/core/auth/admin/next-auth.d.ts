// core/auth/admin/next-auth.d.ts

import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      isPlatformAdmin?: boolean;
      storeRoles?: {
        store_id: string;
        role: string;
        slug: string;
      }[];
    };
  }

  // the JWT token interface
  interface JWT {
    id: string;
    isPlatformAdmin?: boolean;
    storeRoles?: {
      store_id: string;
      role: string;
      slug: string; // Add this line
    }[];
  }
}
