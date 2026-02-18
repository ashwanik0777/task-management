-- CreateTable
CREATE TABLE "SessionCycle" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionCycle_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "WorkSession" ADD COLUMN "cycleId" TEXT;

-- CreateIndex
CREATE INDEX "SessionCycle_status_startedAt_idx" ON "SessionCycle"("status", "startedAt");

-- CreateIndex
CREATE INDEX "WorkSession_cycleId_idx" ON "WorkSession"("cycleId");

-- AddForeignKey
ALTER TABLE "WorkSession" ADD CONSTRAINT "WorkSession_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "SessionCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
