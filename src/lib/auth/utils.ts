import { headers } from "next/headers";
import { UnauthorizedError } from "./errors";

export interface CurrentUser {
  userId: string;
  email: string;
  isAdmin: boolean;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  const email = headersList.get("x-user-email");
  const isAdmin = headersList.get("x-user-admin") === "true";

  if (!userId || !email) {
    throw new UnauthorizedError();
  }

  return {
    userId,
    email,
    isAdmin,
  };
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user.isAdmin) {
    throw new UnauthorizedError();
  }

  return user;
}
