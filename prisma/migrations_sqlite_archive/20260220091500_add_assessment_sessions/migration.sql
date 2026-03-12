-- CreateTable
CREATE TABLE "AssessmentSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "questionIds" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" DATETIME,
    CONSTRAINT "AssessmentSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AssessmentSession_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "SkillAssessment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AssessmentSession_userId_idx" ON "AssessmentSession"("userId");

-- CreateIndex
CREATE INDEX "AssessmentSession_assessmentId_idx" ON "AssessmentSession"("assessmentId");

-- CreateIndex
CREATE INDEX "AssessmentSession_expiresAt_idx" ON "AssessmentSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AssessmentSession_userId_assessmentId_used_idx" ON "AssessmentSession"("userId", "assessmentId", "used");
