-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "options" TEXT,
    "keywords" TEXT NOT NULL,
    "commonMissingPoints" TEXT NOT NULL,
    "codeExample" TEXT,
    "followUps" TEXT,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "quality" TEXT,
    "priority" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PracticeRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isCorrect" BOOLEAN,
    "selectedOption" TEXT,
    "userAnswer" TEXT,
    "reviewResult" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FavoriteQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Question_category_type_difficulty_idx" ON "Question"("category", "type", "difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "Question_question_category_key" ON "Question"("question", "category");

-- CreateIndex
CREATE INDEX "PracticeRecord_questionId_createdAt_idx" ON "PracticeRecord"("questionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteQuestion_questionId_key" ON "FavoriteQuestion"("questionId");
