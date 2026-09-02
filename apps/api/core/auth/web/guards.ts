// core/auth/web/guards.ts

import type { Session } from "next-auth";

/**
 * User must be logged in
 */
export function requireAuth(session: Session | null) {
  return Boolean(session?.user?.id);
}

/**
 * User must be a customer of a store
 */
export function requireCustomer(session: Session | null, storeId: string) {
  return session?.user?.storeRoles?.some(
    r => r.store_id === storeId && r.role === "customer"
  );
}
