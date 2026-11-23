import { LoginForm } from "@/components/auth/LoginForm";
import { safeNext } from "@/lib/nextParam";

export interface LoginPageProps {
  searchParams?: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const sp = searchParams ? await searchParams : {};
  return (
    <div className="px-4 py-12">
      <LoginForm next={safeNext(sp.next)} />
    </div>
  );
}
