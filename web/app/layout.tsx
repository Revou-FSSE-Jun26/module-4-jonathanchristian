import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/authCookie";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Kano",
  description: "Simple Kanban task management",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialAccessToken = cookieStore.get(ACCESS_COOKIE)?.value ?? null;
  const initialRefreshToken = cookieStore.get(REFRESH_COOKIE)?.value ?? null;

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-canvas text-ink">
        <AuthProvider
          initialAccessToken={initialAccessToken}
          initialRefreshToken={initialRefreshToken}
        >
          <Header />
          <main className="flex-1 min-w-0">{children}</main>
          <Footer />
          <Toaster position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
