import { headers } from "next/headers";
import { UnauthorizedError } from "./errors";

export interface CurrentUser {
  userId: string;
  email: string;
  isAdmin: boolean;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const email = headersList.get("x-user-email");
    const isAdminHeader = headersList.get("x-user-admin");
    const isAdmin = isAdminHeader === "true";

    console.log("🔍 getCurrentUser headers:", {
      userId,
      email,
      isAdminHeader,
      isAdmin,
    });

    if (!userId || !email) {
      console.log("❌ Missing user headers - throwing UnauthorizedError");
      throw new UnauthorizedError();
    }

    return {
      userId,
      email,
      isAdmin,
    };
  } catch (error) {
    console.error("❌ getCurrentUser error:", error);
    throw new UnauthorizedError();
  }
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user.isAdmin) {
    throw new UnauthorizedError();
  }

  return user;
}
