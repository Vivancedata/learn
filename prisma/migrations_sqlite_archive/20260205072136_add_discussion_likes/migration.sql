-- CreateTable
CREATE TABLE "DiscussionLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiscussionLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DiscussionLike_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiscussionReplyLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "discussionReplyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiscussionReplyLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DiscussionReplyLike_discussionReplyId_fkey" FOREIGN KEY ("discussionReplyId") REFERENCES "DiscussionReply" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DiscussionLike_discussionId_idx" ON "DiscussionLike"("discussionId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionLike_userId_discussionId_key" ON "DiscussionLike"("userId", "discussionId");

-- CreateIndex
CREATE INDEX "DiscussionReplyLike_discussionReplyId_idx" ON "DiscussionReplyLike"("discussionReplyId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionReplyLike_userId_discussionReplyId_key" ON "DiscussionReplyLike"("userId", "discussionReplyId");
