import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/utils";

const prisma = new PrismaClient();

export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; coverageId: string }> }
) => {
  try {
    await requireAdmin();
    const { id, coverageId } = await params;

    // Verify the coverage belongs to the feeder
    const coverage = await prisma.feederCoverage.findUnique({
      where: { id: coverageId },
      include: { barangay: true },
    });

    if (!coverage) {
      return NextResponse.json(
        { error: "Coverage not found" },
        { status: 404 }
      );
    }

    if (coverage.feederId !== id) {
      return NextResponse.json(
        { error: "Coverage does not belong to this feeder" },
        { status: 400 }
      );
    }

    await prisma.feederCoverage.delete({
      where: { id: coverageId },
    });

    return NextResponse.json({
      message: `Coverage for ${coverage.barangay.name} removed successfully`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};
