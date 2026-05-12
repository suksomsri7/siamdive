// Buffer Classic API client.
// Auth: OAuth2 (https://buffer.com/developers/api/oauth)
// Update creation: https://buffer.com/developers/api/updates#updatescreate

const BUFFER_API = "https://api.bufferapp.com/1";
const BUFFER_AUTH = "https://buffer.com/oauth2/authorize";
const BUFFER_TOKEN = "https://api.bufferapp.com/1/oauth2/token.json";

export type BufferProfile = {
  id: string;
  service: string; // "facebook" | "instagram" | "twitter" | ...
  service_username: string;
  service_id: string;
  formatted_username: string;
  avatar: string;
  default: boolean;
};

export type BufferUpdate = {
  id: string;
  profile_id: string;
  text: string;
  due_at: number | null;
  sent_at: number | null;
  status: string; // "buffer" | "sent" | "failed"
  service_link?: string;
  statistics?: {
    likes?: number;
    comments?: number;
    shares?: number;
    reach?: number;
  };
};

export function authorizeUrl(clientId: string, redirectUri: string, state: string): string {
  const u = new URL(BUFFER_AUTH);
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("state", state);
  return u.toString();
}

export async function exchangeCode(opts: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<{ access_token: string; expires_in?: number; refresh_token?: string }> {
  const body = new URLSearchParams({
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    redirect_uri: opts.redirectUri,
    code: opts.code,
    grant_type: "authorization_code",
  });
  const res = await fetch(BUFFER_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Buffer token exchange failed (${res.status}): ${t}`);
  }
  return res.json();
}

async function bufferFetch<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const url = `${BUFFER_API}${path}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, init);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Buffer API ${path} failed (${res.status}): ${t}`);
  }
  return res.json() as Promise<T>;
}

export async function listProfiles(token: string): Promise<BufferProfile[]> {
  return bufferFetch<BufferProfile[]>(token, "/profiles.json");
}

export type CreateUpdateInput = {
  profileIds: string[];
  text: string;
  scheduledAt?: Date | null; // omit for queue/now
  now?: boolean;
  mediaLink?: string; // for link previews
  mediaPhoto?: string; // direct image URL
  mediaThumbnail?: string;
  mediaTitle?: string;
  mediaDescription?: string;
};

export async function createUpdate(token: string, input: CreateUpdateInput): Promise<{
  buffer_count: number;
  buffer_percentage: number;
  success: boolean;
  message?: string;
  updates: BufferUpdate[];
}> {
  const body = new URLSearchParams();
  for (const pid of input.profileIds) body.append("profile_ids[]", pid);
  body.set("text", input.text);
  if (input.scheduledAt) body.set("scheduled_at", String(Math.floor(input.scheduledAt.getTime() / 1000)));
  if (input.now) body.set("now", "true");
  if (input.mediaLink) body.set("media[link]", input.mediaLink);
  if (input.mediaPhoto) body.set("media[photo]", input.mediaPhoto);
  if (input.mediaThumbnail) body.set("media[thumbnail]", input.mediaThumbnail);
  if (input.mediaTitle) body.set("media[title]", input.mediaTitle);
  if (input.mediaDescription) body.set("media[description]", input.mediaDescription);

  const url = `${BUFFER_API}/updates/create.json?access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Buffer create update failed (${res.status}): ${t}`);
  }
  return res.json();
}

export async function getUpdate(token: string, updateId: string): Promise<BufferUpdate> {
  return bufferFetch<BufferUpdate>(token, `/updates/${updateId}.json`);
}

export async function getUpdateInteractions(token: string, updateId: string): Promise<{
  statistics?: { likes?: number; comments?: number; shares?: number; reach?: number };
  interactions?: unknown[];
}> {
  return bufferFetch(token, `/updates/${updateId}/interactions.json`);
}

export async function destroyUpdate(token: string, updateId: string): Promise<{ success: boolean }> {
  const url = `${BUFFER_API}/updates/${updateId}/destroy.json?access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Buffer destroy update failed (${res.status}): ${t}`);
  }
  return res.json();
}
