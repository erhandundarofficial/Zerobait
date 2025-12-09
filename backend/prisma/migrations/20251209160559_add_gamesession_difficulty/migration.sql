-- AlterTable
ALTER TABLE "GameSession" ADD COLUMN     "difficulty" TEXT NOT NULL DEFAULT 'unknown';

-- CreateIndex
CREATE INDEX "GameSession_userId_gameId_difficulty_idx" ON "GameSession"("userId", "gameId", "difficulty");
