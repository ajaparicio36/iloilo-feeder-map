import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/utils";
import { updateFeederSchema } from "@/lib/zod/feeder.zod";
import { ValidationError } from "@/lib/auth/errors";

const prisma = new PrismaClient();

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await requireAdmin();
    const { id } = await params;

    const feeder = await prisma.feeder.findUnique({
      where: { id },
      include: {
        feederCoverage: {
          include: {
            barangay: true,
          },
        },
        interruptedFeeders: {
          include: {
            interruption: true,
          },
        },
        _count: {
          select: {
            feederCoverage: true,
            interruptedFeeders: true,
          },
        },
      },
    });

    if (!feeder) {
      return NextResponse.json({ error: "Feeder not found" }, { status: 404 });
    }

    return NextResponse.json({ data: feeder });
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
    const validationResult = updateFeederSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError("Invalid input data");
    }

    const updateData = validationResult.data;

    const feeder = await prisma.feeder.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            feederCoverage: true,
            interruptedFeeders: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Feeder updated successfully",
      data: feeder,
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

    await prisma.feeder.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Feeder deleted successfully",
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Feeder not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
};
