import { NextRequest, NextResponse } from "next/server";
import * as argon2 from "argon2";
import { cookies } from "next/headers";
import { PrismaClient } from "@/generated/prisma";
import { registerSchema } from "@/lib/zod/register.zod";
import { signToken } from "@/lib/auth/jwt";
import { EmailAlreadyExistsError, ValidationError } from "@/lib/auth/errors";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new EmailAlreadyExistsError();
    }

    // Hash password with argon2
    const hashedPassword = await argon2.hash(password);

    // Create user with isAdmin: false (unverified)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        isAdmin: false, // User needs to be verified by an admin
      },
    });

    // Generate JWT token for immediate login
    const token = await signToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    // Set cookie using next/headers
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

    return NextResponse.json(
      {
        message: "Account created successfully. Please wait for verification.",
        user: {
          id: user.id,
          email: user.email,
          isAdmin: user.isAdmin,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof EmailAlreadyExistsError) {
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
