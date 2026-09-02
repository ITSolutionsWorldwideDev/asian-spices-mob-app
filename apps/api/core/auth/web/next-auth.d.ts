// core/auth/web/next-auth.d.ts

import "next-auth";
import { StoreRole } from "../core/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      isPlatformAdmin?: boolean | undefined;
      storeRoles?: StoreRole[] | undefined;
    };
  }
}
