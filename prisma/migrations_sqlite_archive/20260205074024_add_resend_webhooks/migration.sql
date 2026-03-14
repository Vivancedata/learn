-- CreateTable
CREATE TABLE "ResendWebhookEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "svixId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ResendWebhookEvent_svixId_key" ON "ResendWebhookEvent"("svixId");
