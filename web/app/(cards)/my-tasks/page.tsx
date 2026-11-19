import { redirect } from "next/navigation";
import { MyTasksList } from "@/components/cards/MyTasksList";
import { apiRequest } from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import { getServerToken } from "@/lib/serverAuth";
import type { CardSearchResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MyTasksPage() {
  const token = await getServerToken();
  let cards: CardSearchResult[] = [];
  let initialError: string | null = null;

  try {
    cards = await apiRequest<CardSearchResult[]>("/api/cards?assignee=me", { token });
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      redirect("/login?expired=1");
    }
    initialError =
      err instanceof ApiError ? err.message : "Could not load your tasks.";
  }

  return <MyTasksList initialCards={cards} initialError={initialError} />;
}
