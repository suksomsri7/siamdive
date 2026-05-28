-- CreateTable
CREATE TABLE "TelegramSession" (
    "id"        TEXT NOT NULL,
    "chatId"    TEXT NOT NULL,
    "userId"    TEXT,
    "step"      TEXT NOT NULL DEFAULT 'INIT',
    "context"   JSONB NOT NULL DEFAULT '{}',
    "eventTag"  TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TelegramSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramSession_chatId_key" ON "TelegramSession"("chatId");
CREATE INDEX "TelegramSession_expiresAt_idx" ON "TelegramSession"("expiresAt");
