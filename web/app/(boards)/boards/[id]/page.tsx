import { redirect } from "next/navigation";
import { BoardAccessMessage } from "@/components/boards/BoardAccessMessage";
import { BoardView } from "@/components/boards/BoardView";
import { ErrorPanel } from "@/components/shared/ErrorPanel";
import { apiRequest } from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import { getServerToken } from "@/lib/serverAuth";
import type { BoardDetail } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getServerToken();

  try {
    const board = await apiRequest<BoardDetail>(`/api/boards/${id}`, { token });
    return <BoardView board={board} />;
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.statusCode === 401) {
        redirect("/login?expired=1");
      }
      if (err.statusCode === 403 || err.statusCode === 404) {
        return <BoardAccessMessage statusCode={err.statusCode} />;
      }
      return (
        <div className="max-w-3xl mx-auto px-4 py-8">
          <ErrorPanel message={err.message} />
        </div>
      );
    }
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <ErrorPanel message="Could not load board." />
      </div>
    );
  }
}
