// core/auth/core/providers.ts
import CredentialsProvider from "next-auth/providers/credentials";
import { authorizeUser } from "./authorize";
import { AUTH_ROLES } from "./constants";

type AppType = "admin" | "web";

interface StoreRole {
  role: string;
  store_id: string;
  slug: string;
}

// interface StoreRole {
//   role: (typeof AUTH_ROLES)[keyof typeof AUTH_ROLES] | string;
//   storeId?: string;
// }

export function credentialsProvider(app: AppType) {
  return CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },

    async authorize(credentials) {
      if (!credentials?.email || !credentials.password) {
        return null;
      }

      const user = await authorizeUser(credentials.email, credentials.password);

      // 🔒 ADMIN APP ACCESS RULES

      if (app === "admin") {
        const isAdmin =
          user.isPlatformAdmin === true ||
          (user.storeRoles as StoreRole[])?.some((r) =>
            (
              [
                AUTH_ROLES.ADMIN,
                AUTH_ROLES.MANAGER,
                AUTH_ROLES.EDITOR,
              ] as string[]
            ).includes(r.role),
          );

        if (!isAdmin) {
          throw new Error("Not authorized for admin access");
        }
      }
      // if (app === "admin") {
      //   const isAdmin =
      //     user.isPlatformAdmin === true ||
      //     user.storeRoles?.some((r) =>
      //       [AUTH_ROLES.ADMIN, AUTH_ROLES.MANAGER, AUTH_ROLES.EDITOR].includes(
      //         r.role,
      //       ),
      //     );

      //   if (!isAdmin) {
      //     throw new Error("Not authorized for admin access");
      //   }
      // }

      // 🛍️ WEB APP ACCESS RULES
      if (app === "web") {
        return user;
        /* const isCustomer =
          user.storeRoles?.some(
            r => r.role === AUTH_ROLES.CUSTOMER
          );

        if (!isCustomer) {
          throw new Error("Customer access only");
        } */
      }

      return user as any;
    },
  });
}
