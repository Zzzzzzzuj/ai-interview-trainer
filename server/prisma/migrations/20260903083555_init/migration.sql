-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeRecord" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isCorrect" BOOLEAN,
    "selectedOption" TEXT,
    "userAnswer" TEXT,
    "reviewResult" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteQuestion" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Question_category_type_difficulty_idx" ON "Question"("category", "type", "difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "Question_question_category_key" ON "Question"("question", "category");

-- CreateIndex
CREATE INDEX "PracticeRecord_questionId_createdAt_idx" ON "PracticeRecord"("questionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteQuestion_questionId_key" ON "FavoriteQuestion"("questionId");
