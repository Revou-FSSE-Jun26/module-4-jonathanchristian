import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "./authCookie";

/** Read the access token cookie inside a Next.js Server Component. */
export async function getServerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE)?.value ?? null;
}
