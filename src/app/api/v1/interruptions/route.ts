import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const now = new Date();

    const interruptions = await prisma.interruption.findMany({
      where: {
        OR: [
          { endTime: null }, // No end time set
          { endTime: { gt: now } }, // End time is in the future
        ],
      },
      include: {
        interruptedFeeders: {
          include: {
            feeder: {
              include: {
                feederCoverage: {
                  include: {
                    barangay: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return NextResponse.json(interruptions);
  } catch (error) {
    console.error("Error fetching interruptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch interruptions" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, description, polygon, customArea = false } = body;

    // Process polygon data for storage (same logic as admin endpoint)
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
        // Handle objects with type property
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
        startTime: new Date(),
        description,
        polygon: polygonToStore as any, // Type assertion for Prisma Json field
        customArea,
        type,
      },
      include: {
        interruptedFeeders: {
          include: {
            feeder: {
              include: {
                feederCoverage: {
                  include: {
                    barangay: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(interruption);
  } catch (error) {
    console.error("Error creating interruption:", error);
    return NextResponse.json(
      { error: "Failed to create interruption" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
