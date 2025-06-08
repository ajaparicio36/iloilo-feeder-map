/*
  Warnings:

  - Added the required column `type` to the `interruptions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InterruptionType" AS ENUM ('SCHEDULED', 'UNSCHEDULED', 'EMERGENCY');

-- AlterTable
ALTER TABLE "interruptions" ADD COLUMN     "customArea" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "polygon" JSONB,
ADD COLUMN     "type" "InterruptionType" NOT NULL;
