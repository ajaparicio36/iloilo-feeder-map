import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const barangays = await prisma.barangay.findMany({
      include: {
        FeederCoverage: {
          include: {
            feeder: {
              include: {
                interruptedFeeders: {
                  where: {
                    interruption: {
                      endTime: null,
                    },
                  },
                  include: {
                    interruption: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log(`📊 API: Returning ${barangays.length} barangays`);
    console.log(`📊 Sample barangay:`, {
      name: barangays[0]?.name,
      psgcId: barangays[0]?.psgcId,
      psgcType: typeof barangays[0]?.psgcId,
      feeders: barangays[0]?.FeederCoverage?.length || 0,
    });

    return NextResponse.json(barangays);
  } catch (error) {
    console.error("Error fetching barangays:", error);
    return NextResponse.json(
      { error: "Failed to fetch barangays" },
      { status: 500 }
    );
  }
}
