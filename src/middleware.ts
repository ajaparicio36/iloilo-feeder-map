import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { TokenExpiredError, InvalidTokenError } from "@/lib/auth/errors";

// Define protected routes
const protectedRoutes = [
  "/management/dashboard",
  "/management/interruptions",
  "/management/barangays",
  "/management/feeder-coverage",
  "/api/v1/admin", // Add admin API routes
];
const publicManagementRoutes = [
  "/management",
  "/management/verification-pending",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;

  // Check if this is an API route
  const isApiRoute = pathname.startsWith("/api");

  // Check if this is an admin API route
  const isAdminApiRoute = pathname.startsWith("/api/v1/admin");

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

  // If accessing protected route or admin API route without token
  if ((isProtectedRoute || isAdminRoute || isAdminApiRoute) && !token) {
    if (isAdminApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/management", request.nextUrl));
  }

  // If token exists, verify it
  if (token) {
    try {
      const payload = await verifyToken(token);

      // If accessing /management login page while authenticated
      if (isManagementLoginPage) {
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

      // If accessing admin routes or admin API routes without admin privileges
      if ((isAdminRoute || isAdminApiRoute) && !payload.isAdmin) {
        if (isAdminApiRoute) {
          return NextResponse.json(
            { error: "Admin access required" },
            { status: 403 }
          );
        }
        return NextResponse.redirect(
          new URL("/management/verification-pending", request.nextUrl)
        );
      }

      // If accessing verification pending page but already verified (isAdmin)
      if (isVerificationPendingPage && payload.isAdmin) {
        return NextResponse.redirect(
          new URL("/management/dashboard", request.nextUrl)
        );
      }

      // Add user info to request headers for API routes and authenticated requests
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
      // If token is expired or invalid
      if (
        error instanceof TokenExpiredError ||
        error instanceof InvalidTokenError
      ) {
        if (isAdminApiRoute) {
          return NextResponse.json(
            { error: "Token expired or invalid" },
            { status: 401 }
          );
        }
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
