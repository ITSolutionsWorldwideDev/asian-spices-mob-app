// core/auth/constants.ts

export const AUTH_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  EDITOR: "editor",
  CUSTOMER: "customer",
} as const;


export const ROLE_SCOPES = {
  PLATFORM: "platform",
  STORE: "store",
} as const;

/**
 * Session idle times (ms)
 */
export const SESSION_IDLE_TIME = {
  ADMIN: 30 * 60 * 1000,       // 30 minutes
  WEB: 7 * 24 * 60 * 60 * 1000 // 7 days
} as const;