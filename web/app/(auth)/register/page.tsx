import { RegisterForm } from "@/components/auth/RegisterForm";
import { safeNext } from "@/lib/nextParam";

export interface RegisterPageProps {
  searchParams?: Promise<{ next?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const sp = searchParams ? await searchParams : {};
  return (
    <div className="px-4 py-12">
      <RegisterForm next={safeNext(sp.next)} />
    </div>
  );
}
