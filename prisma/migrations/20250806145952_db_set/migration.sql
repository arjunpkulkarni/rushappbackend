/*
  Warnings:

  - You are about to drop the column `sponsorId` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `submittedAt` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `profilePicUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Sponsor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Standing` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `campusId` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Challenge" DROP CONSTRAINT "Challenge_sponsorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Standing" DROP CONSTRAINT "Standing_campusId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Standing" DROP CONSTRAINT "Standing_userId_fkey";

-- DropIndex
DROP INDEX "public"."Challenge_campusId_idx";

-- DropIndex
DROP INDEX "public"."Challenge_sponsorId_idx";

-- DropIndex
DROP INDEX "public"."Submission_challengeId_submittedAt_idx";

-- DropIndex
DROP INDEX "public"."Submission_userId_idx";

-- DropIndex
DROP INDEX "public"."User_campusId_idx";

-- AlterTable
ALTER TABLE "public"."Challenge" DROP COLUMN "sponsorId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "mediaUrl" TEXT;

-- AlterTable
ALTER TABLE "public"."Submission" DROP COLUMN "submittedAt",
ADD COLUMN     "campusId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "rank" INTEGER,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "profilePicUrl",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "username" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."Sponsor";

-- DropTable
DROP TABLE "public"."Standing";

-- CreateTable
CREATE TABLE "public"."Leaderboard" (
    "id" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "entries" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Challenge_campusId_scheduledAt_idx" ON "public"."Challenge"("campusId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Submission_challengeId_createdAt_idx" ON "public"."Submission"("challengeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "public"."Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Leaderboard" ADD CONSTRAINT "Leaderboard_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "public"."Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
