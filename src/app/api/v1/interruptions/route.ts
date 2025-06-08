import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const interruptions = await prisma.interruption.findMany({
      where: {
        endTime: null,
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
  }
}
