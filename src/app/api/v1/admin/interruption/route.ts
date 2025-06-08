import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { requireAdmin } from "@/lib/auth/utils";
import {
  createInterruptionSchema,
  interruptionQuerySchema,
} from "@/lib/zod/interruption.zod";
import { ValidationError } from "@/lib/auth/errors";

const prisma = new PrismaClient();

export const GET = async (request: NextRequest) => {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const queryResult = interruptionQuerySchema.safeParse({
      search: searchParams.get("search"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status"),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { search, page, limit, status } = queryResult.data;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.description = { contains: search, mode: "insensitive" as const };
    }

    if (status === "active") {
      where.endTime = null;
    } else if (status === "completed") {
      where.endTime = { not: null };
    }

    const [interruptions, total] = await Promise.all([
      prisma.interruption.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: "desc" },
        include: {
          interruptedFeeders: {
            include: {
              feeder: true,
            },
          },
          _count: {
            select: { interruptedFeeders: true },
          },
        },
      }),
      prisma.interruption.count({ where }),
    ]);

    return NextResponse.json({
      data: interruptions,
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
    const validationResult = createInterruptionSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError("Invalid input data");
    }

    const {
      startTime,
      endTime,
      description,
      feederIds,
      type,
      polygon,
      customArea = false,
    } = validationResult.data;

    // Verify all feeders exist
    const feeders = await prisma.feeder.findMany({
      where: { id: { in: feederIds } },
    });

    if (feeders.length !== feederIds.length) {
      return NextResponse.json(
        { error: "One or more feeders not found" },
        { status: 400 }
      );
    }

    const interruption = await prisma.interruption.create({
      data: {
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        description,
        type,
        polygon,
        customArea,
        interruptedFeeders: {
          create: feederIds.map((feederId) => ({ feederId })),
        },
      },
      include: {
        interruptedFeeders: {
          include: {
            feeder: true,
          },
        },
        _count: {
          select: { interruptedFeeders: true },
        },
      },
    });

    return NextResponse.json(
      { message: "Interruption created successfully", data: interruption },
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
