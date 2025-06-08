import { NextRequest, NextResponse } from "next/server";
import * as argon2 from "argon2";
import { cookies } from "next/headers";
import { PrismaClient } from "@/generated/prisma";
import { signToken } from "@/lib/auth/jwt";
import { loginSchema } from "@/lib/zod/login.zod";
import { InvalidCredentialsError } from "@/lib/auth/errors";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new InvalidCredentialsError();
    }

    // Verify password with argon2
    const isValidPassword = await argon2.verify(user.password, password);
    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    // Generate JWT token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    // Set cookie using next/headers - clear first, then set new token
    const cookieStore = await cookies();

    // Clear any existing token first
    cookieStore.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    // Set new token
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
