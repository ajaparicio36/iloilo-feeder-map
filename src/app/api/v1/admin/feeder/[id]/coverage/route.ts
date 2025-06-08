import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { requireAdmin } from "@/lib/auth/utils";
import { ValidationError } from "@/lib/auth/errors";

const prisma = new PrismaClient();

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await requireAdmin();
    const { id } = await params;

    // Get current coverage
    const coverage = await prisma.feederCoverage.findMany({
      where: { feederId: id },
      include: {
        barangay: true,
      },
    });

    // Get all available barangays not in this feeder's coverage
    const availableBarangays = await prisma.barangay.findMany({
      where: {
        NOT: {
          FeederCoverage: {
            some: {
              feederId: id,
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      coverage,
      availableBarangays,
    });
  } catch (error: any) {
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

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const { barangayId } = body;

    if (!barangayId) {
      throw new ValidationError("Barangay ID is required");
    }

    // Check if feeder exists
    const feeder = await prisma.feeder.findUnique({
      where: { id },
    });

    if (!feeder) {
      return NextResponse.json({ error: "Feeder not found" }, { status: 404 });
    }

    // Check if barangay exists
    const barangay = await prisma.barangay.findUnique({
      where: { id: barangayId },
    });

    if (!barangay) {
      return NextResponse.json(
        { error: "Barangay not found" },
        { status: 404 }
      );
    }

    // Create coverage
    const coverage = await prisma.feederCoverage.create({
      data: {
        feederId: id,
        barangayId,
      },
      include: {
        barangay: true,
        feeder: true,
      },
    });

    return NextResponse.json({
      message: "Coverage added successfully",
      data: coverage,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "This barangay is already covered by this feeder" },
        { status: 409 }
      );
    }
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
