export const ADMIN_SESSION_COOKIE = "moliyahub_admin_session";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function computeAdminToken(password: string): Promise<string> {
  return sha256Hex(`moliyahub-admin-session:${password}`);
}

// Проверка админ-сессии для Route Handler'ов под /api/admin/* — middleware.ts
// сознательно не трогает /api/* (см. его комментарий про /api/cbu-rates),
// поэтому каждый такой роут проверяет куку сам, тем же способом, что и
// middleware для страниц /admin/*.
export async function isAdminAuthenticated(): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;
  const validToken = await computeAdminToken(expected);
  return token === validToken;
}
