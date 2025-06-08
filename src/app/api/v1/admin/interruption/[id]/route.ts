import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/utils";
import { updateInterruptionSchema } from "@/lib/zod/interruption.zod";
import { ValidationError } from "@/lib/auth/errors";

const prisma = new PrismaClient();

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await requireAdmin();
    const { id } = await params;

    const interruption = await prisma.interruption.findUnique({
      where: { id },
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

    if (!interruption) {
      return NextResponse.json(
        { error: "Interruption not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: interruption });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};

export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const validationResult = updateInterruptionSchema.safeParse(body);

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
      customArea,
    } = validationResult.data;

    // Prepare update data
    const updateData: any = {};
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime !== undefined)
      updateData.endTime = endTime ? new Date(endTime) : null;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (customArea !== undefined) updateData.customArea = customArea;

    // Process polygon data for storage
    if (polygon !== undefined) {
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
        } else if (
          polygon &&
          typeof polygon === "object" &&
          "type" in polygon
        ) {
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
      updateData.polygon = polygonToStore as any; // Type assertion for Prisma Json field
    }

    // If feederIds are provided, update the relationships
    if (feederIds) {
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

      // Delete existing relationships and create new ones
      await prisma.interruptedFeeders.deleteMany({
        where: { interruptionId: id },
      });

      updateData.interruptedFeeders = {
        create: feederIds.map((feederId) => ({ feederId })),
      };
    }

    const interruption = await prisma.interruption.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({
      message: "Interruption updated successfully",
      data: interruption,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};

export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await requireAdmin();
    const { id } = await params;

    await prisma.interruption.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Interruption deleted successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};
