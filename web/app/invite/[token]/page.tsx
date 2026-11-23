import { redirect } from "next/navigation";
import { InviteJoinCard } from "@/components/boards/InviteJoinCard";
import { apiRequest } from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import { getServerToken } from "@/lib/serverAuth";
import type { InviteInfo } from "@/lib/types";

const TOKEN_RE = /^[A-Za-z0-9_-]{1,128}$/;

export interface InvitePageProps {
  params: Promise<{ token: string }>;
}

/** Server page for /invite/[token]: validates token format and loads invite metadata. */
export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  if (!TOKEN_RE.test(token)) {
    return <InviteJoinCard token={token} info={null} notFound={true} />;
  }

  const serverToken = await getServerToken();
  try {
    const info = await apiRequest<InviteInfo>(`/api/invites/${token}`, {
      token: serverToken,
    });
    return <InviteJoinCard token={token} info={info} />;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      redirect("/login?expired=1");
    }
    return <InviteJoinCard token={token} info={null} notFound={true} />;
  }
}
