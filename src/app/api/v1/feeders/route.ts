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
              endTime: null,
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
