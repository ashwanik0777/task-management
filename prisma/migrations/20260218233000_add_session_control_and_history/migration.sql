-- CreateTable
CREATE TABLE "SessionControl" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "currentSessionNumber" INTEGER NOT NULL,
    "currentSessionStartedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionHistory" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "activeClosed" INTEGER NOT NULL DEFAULT 0,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionHistory_year_sessionNumber_idx" ON "SessionHistory"("year", "sessionNumber");

-- CreateIndex
CREATE INDEX "SessionHistory_endedAt_idx" ON "SessionHistory"("endedAt");
