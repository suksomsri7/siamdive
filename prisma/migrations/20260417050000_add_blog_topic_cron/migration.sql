-- BlogCategory enum
CREATE TYPE "BlogCategory" AS ENUM ('INSPIRATION', 'LIFESTYLE', 'GEAR', 'GUIDE', 'SAFETY', 'EDUCATION');

-- BlogTopic table
CREATE TABLE "BlogTopic" (
    "id" TEXT NOT NULL,
    "category" "BlogCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "note" TEXT NOT NULL DEFAULT '',
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "blogId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlogTopic_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BlogTopic_category_used_order_idx" ON "BlogTopic"("category", "used", "order");

-- CronState singleton
CREATE TABLE "CronState" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "autoPublishEnabled" BOOLEAN NOT NULL DEFAULT false,
    "generatorEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastGeneratedAt" TIMESTAMP(3),
    "lastPublishedAt" TIMESTAMP(3),
    "categoryRotationIdx" INTEGER NOT NULL DEFAULT 0,
    "publishedToday" INTEGER NOT NULL DEFAULT 0,
    "publishedDate" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CronState_pkey" PRIMARY KEY ("id")
);
INSERT INTO "CronState" ("id", "updatedAt") VALUES ('default', NOW()) ON CONFLICT DO NOTHING;

-- CronAuditLog
CREATE TABLE "CronAuditLog" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "blogId" TEXT,
    "topicId" TEXT,
    "category" TEXT,
    "detail" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CronAuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CronAuditLog_event_createdAt_idx" ON "CronAuditLog"("event", "createdAt");
CREATE INDEX "CronAuditLog_blogId_idx" ON "CronAuditLog"("blogId");
