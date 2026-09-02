// core/auth/admin/guards.ts

import type { Session } from "next-auth";
import type { StoreRole } from "../core/types";
import { AUTH_ROLES } from "../core/constants";

/**
 * Platform-level guard
 */
export function requireSuperAdmin(session: Session | null): boolean {
  return session?.user?.isPlatformAdmin === true;
}

/**
 * Store-level role guard
 */
export function requireStoreRole(
  session: Session | null,
  storeId: string,
  roles: readonly string[] = []
): boolean {
  if (!session?.user?.storeRoles) return false;

  return session.user.storeRoles.some(
    (r: StoreRole) =>
      r.store_id === storeId && roles.includes(r.role)
  );
}

