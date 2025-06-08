import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { TokenExpiredError, InvalidTokenError } from "@/lib/auth/errors";

// Define protected routes
const protectedRoutes = [
  "/management/dashboard",
  "/management/interruptions",
  "/management/barangays",
  "/management/feeder-coverage",
];
const publicManagementRoutes = [
  "/management",
  "/management/verification-pending",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;

  console.log("🔍 Middleware executing for:", pathname);
  console.log("🍪 Token exists:", !!token);

  // Check if this is an API route
  const isApiRoute = pathname.startsWith("/api");

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path requires admin access (any /management/** except public routes)
  const isAdminRoute =
    pathname.startsWith("/management") &&
    !publicManagementRoutes.includes(pathname);

  // Check if the current path is the management login page
  const isManagementLoginPage = pathname === "/management";

  // Check if the current path is the verification pending page
  const isVerificationPendingPage =
    pathname === "/management/verification-pending";

  // If accessing protected route without token
  if ((isProtectedRoute || isAdminRoute) && !token) {
    return NextResponse.redirect(new URL("/management", request.nextUrl));
  }

  // If token exists, verify it
  if (token) {
    try {
      const payload = await verifyToken(token);
      console.log("✅ Token payload:", payload);

      // If accessing /management login page while authenticated
      if (isManagementLoginPage) {
        console.log(
          "🔄 Redirecting from login page - isAdmin:",
          payload.isAdmin
        );
        if (payload.isAdmin) {
          // Verified admin - redirect to dashboard
          return NextResponse.redirect(
            new URL("/management/dashboard", request.nextUrl)
          );
        } else {
          // Unverified user - redirect to verification pending
          return NextResponse.redirect(
            new URL("/management/verification-pending", request.nextUrl)
          );
        }
      }

      // If accessing admin routes without admin privileges (not verified)
      if (isAdminRoute && !payload.isAdmin) {
        console.log("🚫 Blocking admin route access - not verified");
        return NextResponse.redirect(
          new URL("/management/verification-pending", request.nextUrl)
        );
      }

      // If accessing verification pending page but already verified (isAdmin)
      if (isVerificationPendingPage && payload.isAdmin) {
        console.log("🔄 Redirecting from verification page - already verified");
        return NextResponse.redirect(
          new URL("/management/dashboard", request.nextUrl)
        );
      }

      // Add user info to request headers for API routes and authenticated requests
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", payload.userId);
      requestHeaders.set("x-user-email", payload.email);
      requestHeaders.set("x-user-admin", payload.isAdmin.toString());

      console.log("🔧 Setting headers:", {
        userId: payload.userId,
        email: payload.email,
        isAdmin: payload.isAdmin.toString(),
        isApiRoute,
        pathname,
      });

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.error("❌ Token verification failed:", error);
      // If token is expired or invalid, clear cookie and redirect to management login
      if (
        error instanceof TokenExpiredError ||
        error instanceof InvalidTokenError
      ) {
        const response = NextResponse.redirect(
          new URL("/management", request.nextUrl)
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

  console.log("➡️ Allowing request to continue");
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
