const store = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string, limit: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const hourMs = 3600_000;
  let entry = store.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + hourMs };
    store.set(ip, entry);
  }
  entry.count++;
  if (entry.count > limit) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: limit - entry.count };
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of store) {
    if (now > entry.resetAt) store.delete(ip);
  }
}, 300_000);
