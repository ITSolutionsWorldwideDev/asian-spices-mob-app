// /packages/auth/core/authorize.ts
import { runQuery } from "@/core/db";
import * as bcrypt from "bcryptjs";

export interface AuthUser {
  id: string;
  email: string;
  isPlatformAdmin: boolean;
  storeRoles: {
    store_id: string;
    role: string;
    slug: string;
  }[];
}

export async function authorizeUser(email: string, password: string): Promise<AuthUser>{
  const userRes = await runQuery(
    `SELECT id, email, password_hash, is_platform_admin
     FROM users WHERE email = $1 AND status = 'active'`,
    [email]
  );

  const user = userRes.rows[0];

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  const rolesRes = await runQuery<{ store_id: string; role: string; slug: string }>(
    `SELECT su.store_id, r.key AS role, s.slug
     FROM store_users su
     JOIN stores s ON s.id = su.store_id
     JOIN roles r ON r.id = su.role_id
     WHERE su.user_id = $1`,
    [user.id]
  );

  return {
    id: user.id,
    email: user.email,
    isPlatformAdmin: !!user.is_platform_admin,
    storeRoles: rolesRes.rows
  };
}
