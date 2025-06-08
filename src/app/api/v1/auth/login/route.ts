import { NextRequest, NextResponse } from "next/server";
import { verify } from "argon2";
import { PrismaClient } from "@/generated/prisma";
import { loginSchema } from "@/lib/zod/login.zod";
import {
  InvalidCredentialsError,
  ValidationError,
  AuthError,
} from "@/lib/auth/errors";
import { signToken } from "@/lib/auth/jwt";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors
        .map((err) => err.message)
        .join(", ");
      throw new ValidationError(errors);
    }

    const { email, password } = validationResult.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new InvalidCredentialsError();
    }

    // Verify password
    const isValidPassword = await verify(user.password, password);
    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: error.statusCode }
      );
    }

    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
