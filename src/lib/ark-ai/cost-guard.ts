// Daily budget gate + usage logging for Ark AI.
// Use checkDailyBudget() before spending tokens, logUsage() after a successful call.

import { prisma } from "@/lib/prisma";
import { calcCostUsd } from "./cost";

export type BudgetStatus = {
  allowed: boolean;
  usedUsd: number;
  budgetUsd: number;
  pctUsed: number; // 0..1+
};

function startOfTodayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function checkDailyBudget(budgetUsd: number): Promise<BudgetStatus> {
  const today = startOfTodayUtc();
  const agg = await prisma.aiUsageLog.aggregate({
    _sum: { costUsd: true },
    where: { createdAt: { gte: today } },
  });
  const usedUsd = agg._sum.costUsd ?? 0;
  const pctUsed = budgetUsd > 0 ? usedUsd / budgetUsd : 0;
  return {
    allowed: usedUsd < budgetUsd,
    usedUsd,
    budgetUsd,
    pctUsed,
  };
}

export async function logUsage(opts: {
  sessionId?: string | null;
  inputTokens: number;
  outputTokens: number;
  model: string;
}): Promise<void> {
  const costUsd = calcCostUsd({
    inputTokens: opts.inputTokens,
    outputTokens: opts.outputTokens,
    model: opts.model,
  });
  await prisma.aiUsageLog.create({
    data: {
      sessionId: opts.sessionId ?? null,
      inputTokens: opts.inputTokens,
      outputTokens: opts.outputTokens,
      costUsd,
      model: opts.model,
    },
  });
}
