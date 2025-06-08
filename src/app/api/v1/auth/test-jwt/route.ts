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

    // Sign token
    const token = await signToken(testPayload);

    // Verify token
    const decoded = await verifyToken(token);

    return NextResponse.json({
      success: true,
      original: testPayload,
      token: token,
      decoded: decoded,
      match: JSON.stringify(testPayload) === JSON.stringify(decoded),
    });
  } catch (error) {
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
