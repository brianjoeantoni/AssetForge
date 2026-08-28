"use client";

import { isAxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Fingerprint, Mail, UserCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getUser, type ApiUser } from "@/lib/server-api";

function ProfileContent({ user }: { user: ApiUser }) {
  const userQuery = useQuery({
    queryKey: ["users", user.id],
    queryFn: () => getUser(user.id),
  });

  if (userQuery.isLoading) {
    return (
      <div className="w-full max-w-none space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userQuery.isError) {
    const message = isAxiosError<{ error?: string }>(userQuery.error)
      ? userQuery.error.response?.data.error
      : null;

    return (
      <div className="w-full max-w-none rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {message ?? "Failed to load profile."}
      </div>
    );
  }

  const profile = userQuery.data;

  if (!profile) {
    return (
      <div className="w-full max-w-none rounded-lg border bg-card p-5 text-sm text-muted-foreground">
        Profile not found.
      </div>
    );
  }

  return (
    <div className="w-full max-w-none space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Profile</h1>
        <p className="text-sm text-muted-foreground">Account Details</p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            {profile.name}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            This data is loaded from the protected users API.
          </p>
        </CardHeader>
        <CardContent>
          <dl className="divide-y text-sm">
            <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <UserCircle className="h-4 w-4" />
                Name
              </dt>
              <dd className="font-medium">{profile.name}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email
              </dt>
              <dd className="truncate font-medium">{profile.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Created
              </dt>
              <dd className="font-medium">
                {new Date(profile.created_at).toLocaleString()}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4 last:pb-0">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Fingerprint className="h-4 w-4" />
                User ID
              </dt>
              <dd className="max-w-80 truncate font-mono text-xs">
                {profile.id}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGate>
      {(user) => (
        <AppShell user={user}>
          <ProfileContent user={user} />
        </AppShell>
      )}
    </AuthGate>
  );
}
