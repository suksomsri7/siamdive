// Buffer GraphQL API client (BYOK token model).
// Endpoint: https://api.buffer.com (GraphQL, not legacy REST).
// Auth: Bearer {token} from publish.buffer.com/settings/api

const BUFFER_GQL = "https://api.buffer.com";

export type BufferProfile = {
  id: string;
  service: string;
  displayName: string;
  avatar: string;
};

export type BufferUpdate = {
  id: string;
  status: string;
  text: string;
  service_link?: string;
  due_at?: number;
  sent_at?: number;
  profile_id?: string;
};

interface GqlResult<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function gql<T>(token: string, query: string, variables?: Record<string, unknown>): Promise<T> {
  const r = await fetch(BUFFER_GQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const body: GqlResult<T> = await r.json().catch(() => ({ errors: [{ message: `HTTP ${r.status}` }] }));
  if (!r.ok || body.errors?.length) {
    const msg = body.errors?.map(e => e.message).join("; ") || `HTTP ${r.status}`;
    throw new Error(`Buffer ${r.status}: ${msg}`);
  }
  if (!body.data) throw new Error(`Buffer ${r.status}: empty response`);
  return body.data;
}

async function getOrganizationId(token: string): Promise<string> {
  const data = await gql<{ account: { organizations: Array<{ id: string }> } }>(
    token,
    `query { account { organizations { id } } }`,
  );
  const orgs = data.account?.organizations || [];
  if (!orgs.length) throw new Error("ไม่พบ Organization ใน Buffer account");
  return orgs[0].id;
}

export async function listProfiles(token: string): Promise<BufferProfile[]> {
  const orgId = await getOrganizationId(token);
  const data = await gql<{
    channels: Array<{ id: string; name?: string; displayName?: string; service: string; avatar?: string }>;
  }>(
    token,
    `query GetChannels($orgId: OrganizationId!) {
       channels(input: { organizationId: $orgId }) {
         id name displayName service avatar
       }
     }`,
    { orgId },
  );
  return (data.channels || []).map(c => ({
    id: c.id,
    service: c.service,
    displayName: c.displayName || c.name || c.service,
    avatar: c.avatar || "",
  }));
}

export async function getAccountInfo(token: string): Promise<{ id: string; email?: string }> {
  const data = await gql<{ account: { id: string; email?: string } }>(
    token,
    `query { account { id email } }`,
  );
  return data.account;
}

export type CreateUpdateInput = {
  profileIds: string[];
  text: string;
  scheduledAt?: Date | null;
  now?: boolean;
  mediaUrl?: string;
  extraMediaUrls?: string[];
};

export async function createUpdate(token: string, input: CreateUpdateInput): Promise<{
  buffer_count: number;
  success: boolean;
  message?: string;
  updates: BufferUpdate[];
}> {
  const assets: Array<Record<string, unknown>> = [];
  if (input.mediaUrl) assets.push({ image: { url: input.mediaUrl } });
  if (input.extraMediaUrls?.length) {
    for (const u of input.extraMediaUrls) assets.push({ image: { url: u } });
  }

  let mode: "addToQueue" | "shareNow" | "shareNext" | "customScheduled";
  let dueAt: string | undefined;
  if (input.scheduledAt) {
    mode = "customScheduled";
    dueAt = input.scheduledAt.toISOString();
  } else if (input.now) {
    mode = "shareNow";
  } else {
    mode = "addToQueue";
  }

  const updates: BufferUpdate[] = [];
  const errors: string[] = [];

  for (const channelId of input.profileIds) {
    const postInput: Record<string, unknown> = {
      text: input.text,
      channelId,
      schedulingType: "automatic",
      mode,
    };
    if (dueAt) postInput.dueAt = dueAt;
    if (assets.length) postInput.assets = assets;

    try {
      const data = await gql<{
        createPost: {
          __typename: string;
          post?: { id: string; status?: string; dueAt?: string; serviceUrl?: string };
          message?: string;
        };
      }>(
        token,
        `mutation CreatePost($input: CreatePostInput!) {
           createPost(input: $input) {
             __typename
             ... on PostActionSuccess {
               post { id status dueAt serviceUrl }
             }
             ... on MutationError { message }
           }
         }`,
        { input: postInput },
      );
      const res = data.createPost;
      if (res.__typename === "PostActionSuccess" && res.post) {
        updates.push({
          id: res.post.id,
          status: res.post.status || "pending",
          text: input.text,
          service_link: res.post.serviceUrl,
          due_at: res.post.dueAt ? Math.floor(new Date(res.post.dueAt).getTime() / 1000) : undefined,
          profile_id: channelId,
        });
      } else {
        errors.push(`${channelId}: ${res.message || "unknown error"}`);
      }
    } catch (e) {
      errors.push(`${channelId}: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  if (!updates.length && errors.length) {
    throw new Error(`Buffer create failed: ${errors.join(" | ")}`);
  }

  return {
    buffer_count: updates.length,
    updates,
    success: errors.length === 0,
    message: errors.length ? errors.join(" | ") : undefined,
  };
}

export async function getUpdate(token: string, updateId: string): Promise<BufferUpdate | null> {
  try {
    const data = await gql<{
      post: { id: string; text?: string; status?: string; dueAt?: string; sentAt?: string; serviceUrl?: string; channelId?: string } | null;
    }>(
      token,
      `query GetPost($id: PostId!) {
         post(id: $id) { id text status dueAt sentAt serviceUrl channelId }
       }`,
      { id: updateId },
    );
    const p = data.post;
    if (!p) return null;
    return {
      id: p.id,
      status: p.status || "unknown",
      text: p.text || "",
      service_link: p.serviceUrl,
      sent_at: p.sentAt ? Math.floor(new Date(p.sentAt).getTime() / 1000) : undefined,
      due_at: p.dueAt ? Math.floor(new Date(p.dueAt).getTime() / 1000) : undefined,
      profile_id: p.channelId,
    };
  } catch (e) {
    if (e instanceof Error && /not found|404/i.test(e.message)) return null;
    throw e;
  }
}

export async function destroyUpdate(token: string, updateId: string): Promise<boolean> {
  try {
    const data = await gql<{
      deletePost: { __typename: string; message?: string };
    }>(
      token,
      `mutation DeletePost($input: DeletePostInput!) {
         deletePost(input: $input) {
           __typename
           ... on MutationError { message }
         }
       }`,
      { input: { id: updateId } },
    );
    return data.deletePost.__typename !== "MutationError";
  } catch {
    return false;
  }
}
