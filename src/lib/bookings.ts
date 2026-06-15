// Shared finance derivation for the bookings ledger.
// Payment status is always DERIVED from installments — never stored.

export type InstallmentLike = {
  amount: number;
  status: string; // "PAID" | "PENDING"
  dueDate: string | Date | null;
};

export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID_FULL";
export type BoardColumn = "UNPAID" | "PARTIAL" | "PAID_FULL" | "OVERDUE";

export type BookerFinance = {
  paidAmount: number;
  total: number;
  remaining: number;
  overdueCount: number;
  nextDueDate: string | null;
  paymentStatus: PaymentStatus;
  board: BoardColumn;
};

export function computeBookerFinance(
  totalAmount: number,
  installments: InstallmentLike[],
  now: Date = new Date()
): BookerFinance {
  const paidAmount = installments
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + (i.amount || 0), 0);

  // totalAmount is the source of truth; fall back to sum of installments if unset
  const total =
    totalAmount > 0
      ? totalAmount
      : installments.reduce((s, i) => s + (i.amount || 0), 0);

  const remaining = Math.max(0, total - paidAmount);

  const overdueCount = installments.filter(
    (i) => i.status !== "PAID" && i.dueDate && new Date(i.dueDate) < now
  ).length;

  const nextDue = installments
    .filter((i) => i.status !== "PAID" && i.dueDate)
    .map((i) => new Date(i.dueDate as string | Date))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  let paymentStatus: PaymentStatus;
  if (total > 0 && paidAmount >= total) paymentStatus = "PAID_FULL";
  else if (paidAmount > 0) paymentStatus = "PARTIAL";
  else paymentStatus = "UNPAID";

  const board: BoardColumn =
    paymentStatus === "PAID_FULL"
      ? "PAID_FULL"
      : overdueCount > 0
        ? "OVERDUE"
        : paymentStatus;

  return {
    paidAmount,
    total,
    remaining,
    overdueCount,
    nextDueDate: nextDue ? nextDue.toISOString() : null,
    paymentStatus,
    board,
  };
}
