import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export const GET = async (request: NextRequest) => {
  try {
    const barangays = await prisma.barangay.findMany({
      orderBy: { name: "asc" },
      include: {
        FeederCoverage: {
          include: {
            feeder: {
              include: {
                interruptedFeeders: {
                  where: {
                    interruption: {
                      OR: [
                        { endTime: null }, // No end time set
                        { endTime: { gt: new Date() } }, // End time is in the future
                      ],
                    },
                  },
                  include: {
                    interruption: {
                      select: {
                        id: true,
                        description: true,
                        startTime: true,
                        endTime: true,
                        type: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Debug logging to check data structure
    console.log("Barangays API Response:", {
      total: barangays.length,
      withCoverage: barangays.filter(
        (b) => b.FeederCoverage && b.FeederCoverage.length > 0
      ).length,
      sampleWithCoverage: barangays.find(
        (b) => b.FeederCoverage && b.FeederCoverage.length > 0
      ),
      // Sample some PSGCs for debugging
      samplePsgcs: barangays.slice(0, 5).map((b) => ({
        name: b.name,
        psgc: b.psgcId,
      })),
      // Check for interrupted feeders
      withInterruptions: barangays.filter((b) =>
        b.FeederCoverage.some((fc) =>
          fc.feeder.interruptedFeeders.some((inf) => inf.interruption)
        )
      ).length,
    });

    return NextResponse.json(barangays);
  } catch (error: any) {
    console.error("Error fetching barangays:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
};
