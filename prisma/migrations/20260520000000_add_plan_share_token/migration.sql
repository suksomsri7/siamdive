-- CreateTable
CREATE TABLE "PlanShareToken" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "PlanRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanShareToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanShareToken_token_key" ON "PlanShareToken"("token");

-- CreateIndex
CREATE INDEX "PlanShareToken_planId_idx" ON "PlanShareToken"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanShareToken_planId_role_key" ON "PlanShareToken"("planId", "role");

-- AddForeignKey
ALTER TABLE "PlanShareToken" ADD CONSTRAINT "PlanShareToken_planId_fkey" FOREIGN KEY ("planId") REFERENCES "UserPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
