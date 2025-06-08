import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { requireAdmin } from "@/lib/auth/utils";
import {
  createBarangaySchema,
  barangayQuerySchema,
} from "@/lib/zod/barangay.zod";
import { ValidationError } from "@/lib/auth/errors";

const prisma = new PrismaClient();

export const GET = async (request: NextRequest) => {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const queryResult = barangayQuerySchema.safeParse({
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { search, page, limit } = queryResult.data;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { psgcId: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [barangays, total] = await Promise.all([
      prisma.barangay.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { FeederCoverage: true },
          },
        },
      }),
      prisma.barangay.count({ where }),
    ]);

    return NextResponse.json({
      data: barangays,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    if (error.statusCode) {
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
};

export const POST = async (request: NextRequest) => {
  try {
    await requireAdmin();

    const body = await request.json();
    const validationResult = createBarangaySchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError("Invalid input data");
    }

    const { name, psgcId } = validationResult.data;

    // Check if PSGC ID already exists
    const existingBarangay = await prisma.barangay.findUnique({
      where: { psgcId },
    });

    if (existingBarangay) {
      return NextResponse.json(
        { error: "Barangay with this PSGC ID already exists" },
        { status: 409 }
      );
    }

    const barangay = await prisma.barangay.create({
      data: { name, psgcId },
      include: {
        _count: {
          select: { FeederCoverage: true },
        },
      },
    });

    return NextResponse.json(
      { message: "Barangay created successfully", data: barangay },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.statusCode) {
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
};
