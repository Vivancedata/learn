-- CreateIndex
CREATE INDEX "Certificate_userId_idx" ON "Certificate"("userId");

-- CreateIndex
CREATE INDEX "Certificate_courseId_idx" ON "Certificate"("courseId");

-- CreateIndex
CREATE INDEX "Course_pathId_idx" ON "Course"("pathId");

-- CreateIndex
CREATE INDEX "CourseProgress_userId_courseId_idx" ON "CourseProgress"("userId", "courseId");

-- CreateIndex
CREATE INDEX "CourseSection_courseId_idx" ON "CourseSection"("courseId");

-- CreateIndex
CREATE INDEX "Discussion_userId_idx" ON "Discussion"("userId");

-- CreateIndex
CREATE INDEX "Discussion_courseId_idx" ON "Discussion"("courseId");

-- CreateIndex
CREATE INDEX "Discussion_lessonId_idx" ON "Discussion"("lessonId");

-- CreateIndex
CREATE INDEX "DiscussionReply_userId_idx" ON "DiscussionReply"("userId");

-- CreateIndex
CREATE INDEX "DiscussionReply_discussionId_idx" ON "DiscussionReply"("discussionId");

-- CreateIndex
CREATE INDEX "Lesson_sectionId_idx" ON "Lesson"("sectionId");

-- CreateIndex
CREATE INDEX "PathProgress_userId_pathId_idx" ON "PathProgress"("userId", "pathId");

-- CreateIndex
CREATE INDEX "ProjectSubmission_userId_idx" ON "ProjectSubmission"("userId");

-- CreateIndex
CREATE INDEX "ProjectSubmission_lessonId_idx" ON "ProjectSubmission"("lessonId");

-- CreateIndex
CREATE INDEX "ProjectSubmission_status_idx" ON "ProjectSubmission"("status");

-- CreateIndex
CREATE INDEX "QuizQuestion_lessonId_idx" ON "QuizQuestion"("lessonId");

-- CreateIndex
CREATE INDEX "QuizScore_courseProgressId_idx" ON "QuizScore"("courseProgressId");

-- CreateIndex
CREATE INDEX "QuizScore_lessonId_idx" ON "QuizScore"("lessonId");
