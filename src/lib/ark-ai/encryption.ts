import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALG = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || "siamdive-dev-key-change-me";
  return scryptSync(secret, "siamdive-salt", 32);
}

export function encrypt(text: string): string {
  if (!text) return "";
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALG, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), encrypted.toString("hex"), tag.toString("hex")].join(":");
}

export function decrypt(data: string): string {
  if (!data || !data.includes(":")) return data;
  try {
    const [ivHex, encHex, tagHex] = data.split(":");
    const key = getKey();
    const decipher = createDecipheriv(ALG, key, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    return decipher.update(Buffer.from(encHex, "hex"), undefined, "utf8") + decipher.final("utf8");
  } catch (err) {
    // Most likely cause: ENCRYPTION_KEY differs between environments (e.g. preview vs production).
    // Return empty so callers can fall back to env var or surface a clean "not configured" error
    // instead of crashing with 500.
    console.warn("[ark-ai] decrypt() failed — likely ENCRYPTION_KEY mismatch:", err instanceof Error ? err.message : String(err));
    return "";
  }
}
