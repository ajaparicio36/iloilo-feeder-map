import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { UnauthorizedError } from "@/lib/auth/errors";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Verification status check - getting current user");
    const user = await getCurrentUser();
    console.log("✅ Current user:", user);

    return NextResponse.json({
      verified: user.isAdmin,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    console.error("❌ Verification status error:", error);

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
