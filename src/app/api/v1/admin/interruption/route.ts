import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/utils";
import {
  createInterruptionSchema,
  interruptionQuerySchema,
} from "@/lib/zod/interruption.zod";

const prisma = new PrismaClient();

export const GET = async (request: NextRequest) => {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const queryResult = interruptionQuerySchema.safeParse({
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
      status: searchParams.get("status") || "all",
    });

    if (!queryResult.success) {
      console.log("Invalid query parameters:", queryResult.error);
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

    const now = new Date();
    if (status === "active") {
      where.OR = [
        { endTime: null }, // No end time set
        { endTime: { gt: now } }, // End time is in the future
      ];
    } else if (status === "completed") {
      where.endTime = { lte: now }; // End time has passed
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
    console.log(error);
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
      console.log("Validation errors:", validationResult.error);
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
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

    // Process polygon data for storage
    let polygonToStore: any = null;
    if (polygon) {
      if (Array.isArray(polygon) && polygon.length > 0) {
        // Convert array of geometries to FeatureCollection for consistent storage
        polygonToStore = {
          type: "FeatureCollection",
          features: polygon.map((geom: any, index: number) => ({
            type: "Feature",
            geometry: geom,
            properties: { index },
          })),
        };
      } else if (polygon && typeof polygon === "object" && "type" in polygon) {
        // Handle objects with type property (single geometry or FeatureCollection)
        if (
          polygon.type === "FeatureCollection" ||
          polygon.type === "Polygon" ||
          polygon.type === "MultiPolygon"
        ) {
          polygonToStore = polygon;
        }
      }
    }

    const interruption = await prisma.interruption.create({
      data: {
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        description,
        type,
        polygon: polygonToStore as any, // Type assertion for Prisma Json field
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
    console.log(error);
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
