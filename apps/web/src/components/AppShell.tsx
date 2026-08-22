"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, UserCircle } from "lucide-react";
import { apiFetch, type User } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const router = useRouter();

  async function logout() {
    await apiFetch<void>("/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/dashboard" className="text-xl font-semibold tracking-normal">
            AssetForge
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
              <UserCircle className="h-4 w-4" />
              <span>{user.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </main>
  );
}
