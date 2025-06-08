import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/utils";
import { createFeederSchema, feederQuerySchema } from "@/lib/zod/feeder.zod";
import { ValidationError } from "@/lib/auth/errors";

const prisma = new PrismaClient();

export const GET = async (request: NextRequest) => {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const queryResult = feederQuerySchema.safeParse({
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
          name: { contains: search, mode: "insensitive" as const },
        }
      : {};

    const [feeders, total] = await Promise.all([
      prisma.feeder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: {
              feederCoverage: true,
            },
          },
        },
      }),
      prisma.feeder.count({ where }),
    ]);

    const now = new Date();
    const feedersWithActiveCounts = await Promise.all(
      feeders.map(async (feeder) => {
        const activeInterruptionsCount = await prisma.interruptedFeeders.count({
          where: {
            feederId: feeder.id,
            interruption: {
              OR: [{ endTime: null }, { endTime: { gt: now } }],
            },
          },
        });

        return {
          ...feeder,
          _count: {
            ...feeder._count,
            activeInterruptions: activeInterruptionsCount,
          },
        };
      })
    );

    return NextResponse.json({
      data: feedersWithActiveCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};

export const POST = async (request: NextRequest) => {
  try {
    await requireAdmin();

    const body = await request.json();
    const validationResult = createFeederSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError("Invalid input data");
    }

    const { name } = validationResult.data;

    const feeder = await prisma.feeder.create({
      data: { name },
      include: {
        _count: {
          select: {
            feederCoverage: true,
            interruptedFeeders: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Feeder created successfully", data: feeder },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};
