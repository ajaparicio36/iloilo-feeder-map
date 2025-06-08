import { NextResponse } from "next/server";
import { signToken, verifyToken } from "@/lib/auth/jwt";

export async function GET() {
  try {
    // Test JWT signing and verification
    const testPayload = {
      userId: "test-user-id",
      email: "test@example.com",
      isAdmin: true,
    };

    console.log("🧪 Testing JWT with payload:", testPayload);

    // Sign token
    const token = await signToken(testPayload);
    console.log("🧪 Generated token:", token);

    // Verify token
    const decoded = await verifyToken(token);
    console.log("🧪 Decoded token:", decoded);

    return NextResponse.json({
      success: true,
      original: testPayload,
      token: token,
      decoded: decoded,
      match: JSON.stringify(testPayload) === JSON.stringify(decoded),
    });
  } catch (error) {
    console.error("🧪 JWT test failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
