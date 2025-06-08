import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { UnauthorizedError } from "@/lib/auth/errors";

export async function GET() {
  try {
    const user = await getCurrentUser();

    return NextResponse.json({
      success: true,
      data: {
        userId: user.userId,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
