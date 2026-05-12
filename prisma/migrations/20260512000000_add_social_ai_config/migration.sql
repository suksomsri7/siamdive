-- CreateTable
CREATE TABLE "SocialAiConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "provider" TEXT NOT NULL DEFAULT 'anthropic',
    "apiKeyEncrypted" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL DEFAULT 'claude-haiku-4-5-20251001',
    "maxTokens" INTEGER NOT NULL DEFAULT 800,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAiConfig_pkey" PRIMARY KEY ("id")
);

-- Seed the singleton row so admin can edit without "create" step
INSERT INTO "SocialAiConfig" (id, "updatedAt") VALUES ('default', NOW())
ON CONFLICT (id) DO NOTHING;
