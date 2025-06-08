import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { UnauthorizedError } from "@/lib/auth/errors";

export async function GET() {
  try {
    const user = await getCurrentUser();

    return NextResponse.json({
      verified: user.isAdmin,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
