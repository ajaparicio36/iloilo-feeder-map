import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { TokenExpiredError, InvalidTokenError } from "@/lib/auth/errors";

// Define protected routes
const protectedRoutes = ["/dashboard"];
const adminRoutes = ["/management"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path requires admin access (any /management/** except /management itself)
  const isAdminRoute =
    pathname.startsWith("/management") && pathname !== "/management";

  // Check if the current path is the management login page
  const isManagementLoginPage = pathname === "/management";

  // If accessing protected route without token
  if ((isProtectedRoute || isAdminRoute) && !token) {
    return NextResponse.redirect(new URL("/management", request.url));
  }

  // If token exists, verify it
  if (token) {
    try {
      const payload = verifyToken(token);

      // If accessing /management login page while authenticated as admin, redirect to dashboard
      if (isManagementLoginPage && payload.isAdmin) {
        return NextResponse.redirect(
          new URL("/management/dashboard", request.url)
        );
      }

      // If accessing admin routes without admin privileges
      if (isAdminRoute && !payload.isAdmin) {
        return NextResponse.redirect(new URL("/management", request.url));
      }

      // Add user info to request headers for API routes
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", payload.userId);
      requestHeaders.set("x-user-email", payload.email);
      requestHeaders.set("x-user-admin", payload.isAdmin.toString());

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      // If token is expired or invalid, clear cookie and redirect to management login
      if (
        error instanceof TokenExpiredError ||
        error instanceof InvalidTokenError
      ) {
        const response = NextResponse.redirect(
          new URL("/management", request.url)
        );
        response.cookies.set("auth-token", "", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 0,
          path: "/",
        });
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
