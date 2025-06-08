import { PrismaClient } from "@prisma/client";
import * as fs from "fs/promises";
import * as path from "path";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST() {
  try {
    console.log("Starting database seeding...");

    // 1. Load Barangay data from JSON and create Barangays
    const barangayDatasetPath = path.join(
      process.cwd(),
      "public/barangay-dataset.json"
    );
    const barangayJsonContent = await fs.readFile(barangayDatasetPath, "utf-8");
    const barangayDataset = JSON.parse(barangayJsonContent);

    const barangaysToCreate = barangayDataset.barangay.map(
      (b: { name: string; psgcId: number | string }) => ({
        name: b.name,
        psgcId: String(b.psgcId),
      })
    );

    console.log(`Found ${barangaysToCreate.length} barangays in JSON dataset.`);

    if (barangaysToCreate.length > 0) {
      await prisma.barangay.createMany({
        data: barangaysToCreate,
        skipDuplicates: true,
      });
      console.log("Barangays created or duplicates skipped.");
    }

    const allDbBarangays = await prisma.barangay.findMany();
    const barangayMapByName = new Map(
      allDbBarangays.map((b) => [b.name, b.id])
    );

    // 2. Parse Feeder data from Markdown
    const feederDataPath = path.join(process.cwd(), "public/feeder-data.md");
    const feederMdContent = await fs.readFile(feederDataPath, "utf-8");
    const lines = feederMdContent.split("\n");

    const feederBarangayRelations: {
      barangayName: string;
      feederNames: string[];
    }[] = [];
    let currentBarangayName: string | null = null;
    const allFeederNames = new Set<string>();

    for (const line of lines) {
      const trimmedLine = line.trim();
      const barangayMatch = trimmedLine.match(/^\*\*(.+)\*\*$/);
      if (barangayMatch) {
        currentBarangayName = barangayMatch[1].trim();
        if (!barangayMapByName.has(currentBarangayName)) {
          currentBarangayName = null;
        } else {
          feederBarangayRelations.push({
            barangayName: currentBarangayName,
            feederNames: [],
          });
        }
        continue;
      }

      if (currentBarangayName && feederBarangayRelations.length > 0) {
        const feederMatch = trimmedLine.match(/^- (.+)$/);
        if (feederMatch) {
          const feederName = feederMatch[1].trim();
          const currentRelation =
            feederBarangayRelations[feederBarangayRelations.length - 1];
          if (
            currentRelation &&
            currentRelation.barangayName === currentBarangayName
          ) {
            currentRelation.feederNames.push(feederName);
            allFeederNames.add(feederName);
          }
        }
      }
    }

    // 3. Create Feeders
    const feedersToCreate = Array.from(allFeederNames).map((name) => ({
      name,
    }));

    if (feedersToCreate.length > 0) {
      await prisma.feeder.createMany({
        data: feedersToCreate,
        skipDuplicates: true,
      });
    }

    const allDbFeeders = await prisma.feeder.findMany();
    const feederMapByName = new Map(allDbFeeders.map((f) => [f.name, f.id]));

    // 4. Create FeederCoverage
    const feederCoverageToCreate: { barangayId: string; feederId: string }[] =
      [];
    for (const relation of feederBarangayRelations) {
      const barangayId = barangayMapByName.get(relation.barangayName);
      if (!barangayId) continue;

      for (const feederName of relation.feederNames) {
        const feederId = feederMapByName.get(feederName);
        if (!feederId) continue;
        feederCoverageToCreate.push({ barangayId, feederId });
      }
    }

    if (feederCoverageToCreate.length > 0) {
      await prisma.feederCoverage.createMany({
        data: feederCoverageToCreate,
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      stats: {
        barangays: barangaysToCreate.length,
        feeders: feedersToCreate.length,
        coverages: feederCoverageToCreate.length,
      },
    });
  } catch (error) {
    console.error("Error during seeding:", error);
    return NextResponse.json(
      { success: false, error: "Failed to seed database" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
