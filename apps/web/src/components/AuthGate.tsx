"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getCurrentUser, type ApiUser } from "@/lib/server-api";

export function AuthGate({
  children,
}: {
  children: (user: ApiUser) => React.ReactNode;
}) {
  const router = useRouter();
  const currentUserQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
    retry: false,
  });

  useEffect(() => {
    if (currentUserQuery.isError) {
      router.push("/login");
    }
  }, [currentUserQuery.isError, router]);

  if (currentUserQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (currentUserQuery.isError || !currentUserQuery.data) {
    return null;
  }

  return <>{children(currentUserQuery.data)}</>;
}
