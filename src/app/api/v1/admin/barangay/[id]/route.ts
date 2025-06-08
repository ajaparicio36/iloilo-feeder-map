import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/utils";
import { updateBarangaySchema } from "@/lib/zod/barangay.zod";
import { ValidationError } from "@/lib/auth/errors";

const prisma = new PrismaClient();

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await requireAdmin();
    const { id } = await params;

    const barangay = await prisma.barangay.findUnique({
      where: { id },
      include: {
        FeederCoverage: {
          include: {
            feeder: true,
          },
        },
        _count: {
          select: { FeederCoverage: true },
        },
      },
    });

    if (!barangay) {
      return NextResponse.json(
        { error: "Barangay not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: barangay });
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
    const validationResult = updateBarangaySchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError("Invalid input data");
    }

    const updateData = validationResult.data;

    // Check if PSGC ID already exists (if being updated)
    if (updateData.psgcId) {
      const existingBarangay = await prisma.barangay.findFirst({
        where: {
          psgcId: updateData.psgcId,
          NOT: { id },
        },
      });

      if (existingBarangay) {
        return NextResponse.json(
          { error: "Barangay with this PSGC ID already exists" },
          { status: 409 }
        );
      }
    }

    const barangay = await prisma.barangay.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { FeederCoverage: true },
        },
      },
    });

    return NextResponse.json({
      message: "Barangay updated successfully",
      data: barangay,
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

    await prisma.barangay.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Barangay deleted successfully",
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Barangay not found" },
        { status: 404 }
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
