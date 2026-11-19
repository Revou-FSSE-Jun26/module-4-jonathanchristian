import { redirect } from "next/navigation";
import { BoardList } from "@/components/boards/BoardList";
import { apiRequest } from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import { getServerToken } from "@/lib/serverAuth";
import type { BoardSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const token = await getServerToken();
  let boards: BoardSummary[] = [];
  let initialError: string | null = null;

  try {
    boards = await apiRequest<BoardSummary[]>("/api/boards", { token });
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      redirect("/login?expired=1");
    }
    initialError =
      err instanceof ApiError ? err.message : "Could not load your boards.";
  }

  return <BoardList initialBoards={boards} initialError={initialError} />;
}
