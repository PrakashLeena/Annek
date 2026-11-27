import { auth } from "../firebase";

export const API = import.meta.env.VITE_API_URL || "/api";

/**
 * fetch() for the admin panel: sends the signed-in admin's Firebase ID token
 * (the server checks it against the admin allow-list), skips HTTP caches and
 * throws an Error with the server's message when the request fails.
 */
export async function adminFetch(path, { headers, body, ...opts } = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");
  const token = await user.getIdToken();
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(`${API}${path}`, {
    cache: "no-store",
    ...opts,
    body: body && !isForm && typeof body !== "string" ? JSON.stringify(body) : body,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body && !isForm ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data;
}
