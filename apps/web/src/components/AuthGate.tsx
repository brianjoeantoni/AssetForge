"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, type User } from "@/lib/api";

type AuthGateState =
  | { status: "loading"; user?: undefined }
  | { status: "ready"; user: User }
  | { status: "error"; user?: undefined };

export function AuthGate({ children }: { children: (user: User) => React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthGateState>({ status: "loading" });

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      setState({ status: "error" });
      router.push("/login");
      return;
    }

    setState({ status: "ready", user });
  }, [router]);

  if (state.status === "loading") {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading...</div>;
  }

  if (state.status === "error") {
    return null;
  }

  return <>{children(state.user)}</>;
}
