type SupabaseErrorBody = {
  message?: string;
  error?: string;
  hint?: string;
  details?: string;
};

function getConfig(): { url: string; serviceRoleKey: string } {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("SUPABASE_URL belum diset.");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diset.");
  }

  return { url, serviceRoleKey };
}

function toErrorMessage(body: SupabaseErrorBody | null, fallback: string): string {
  if (!body) return fallback;

  const messageParts = [body.message, body.error, body.details, body.hint]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .filter((value, index, source) => source.indexOf(value) === index);

  if (messageParts.length > 0) {
    return messageParts.join(" | ");
  }

  return fallback;
}

export async function callSupabaseRpc<T>(
  functionName: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const { url, serviceRoleKey } = getConfig();

  const response = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    let body: SupabaseErrorBody | null = null;

    try {
      body = (await response.json()) as SupabaseErrorBody;
    } catch {
      body = null;
    }

    throw new Error(toErrorMessage(body, `Supabase RPC gagal (${response.status}).`));
  }

  return (await response.json()) as T;
}
