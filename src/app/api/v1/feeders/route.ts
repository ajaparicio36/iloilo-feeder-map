import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const feeders = await prisma.feeder.findMany({
      include: {
        feederCoverage: {
          include: {
            barangay: true,
          },
        },
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
            interruption: true,
          },
        },
      },
    });

    return NextResponse.json(feeders);
  } catch (error) {
    console.error("Error fetching feeders:", error);
    return NextResponse.json(
      { error: "Failed to fetch feeders" },
      { status: 500 }
    );
  }
}
