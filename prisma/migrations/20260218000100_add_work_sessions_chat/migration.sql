-- CreateTable
CREATE TABLE "WorkSession" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionReview" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkSession_internId_status_idx" ON "WorkSession"("internId", "status");

-- CreateIndex
CREATE INDEX "WorkSession_startedAt_idx" ON "WorkSession"("startedAt");

-- CreateIndex
CREATE INDEX "SessionReview_sessionId_createdAt_idx" ON "SessionReview"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "SessionChatMessage_sessionId_createdAt_idx" ON "SessionChatMessage"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "WorkSession" ADD CONSTRAINT "WorkSession_internId_fkey" FOREIGN KEY ("internId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionReview" ADD CONSTRAINT "SessionReview_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionReview" ADD CONSTRAINT "SessionReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionChatMessage" ADD CONSTRAINT "SessionChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionChatMessage" ADD CONSTRAINT "SessionChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
