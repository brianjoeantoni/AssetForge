"use client";

import Link from "next/link";
import { isAxiosError } from "axios";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAsset, type ApiUser } from "@/lib/server-api";

function AssetDetailContent({ user }: { user: ApiUser }) {
  const params = useParams<{ id: string }>();

  const assetQuery = useQuery({
    queryKey: ["assets", params.id],
    queryFn: () => getAsset(params.id),
    retry: false,
  });

  if (assetQuery.isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading asset...</div>
    );
  }

  if (assetQuery.isError) {
    const message = isAxiosError<{ error?: string }>(assetQuery.error)
      ? assetQuery.error.response?.data.error
      : null;

    return (
      <div className="space-y-4">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-primary"
          href="/dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <div className="rounded-lg border bg-white p-5 text-sm text-red-700">
          {message ?? "Failed to load asset"}
        </div>
      </div>
    );
  }

  const asset = assetQuery.data;

  if (!asset) {
    return (
      <div className="rounded-lg border bg-white p-5 text-sm text-red-700">
        Asset not found
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-primary"
        href="/dashboard"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <section className="space-y-4">
          <img
            className="aspect-video w-full rounded-lg border bg-white object-cover"
            src={asset.image_url}
            alt={asset.name}
          />
          <Card>
            <CardHeader>
              <CardTitle>Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6">{asset.prompt}</p>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{asset.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>{asset.status.toLowerCase()}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Model</dt>
                  <dd>{asset.model}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{new Date(asset.created_at).toLocaleString()}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Owner</dt>
                  <dd className="max-w-40 truncate font-mono text-xs">
                    {user.id}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generation Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs">
                {JSON.stringify(
                  {
                    mode: "immediate",
                    storage: "postgresql",
                    imageUrl: asset.image_url,
                  },
                  null,
                  2,
                )}
              </pre>
            </CardContent>
          </Card>

          <Link className="inline-flex" href="/dashboard">
            <Button variant="outline">Back to dashboard</Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}

export default function AssetDetailPage() {
  return (
    <AuthGate>
      {(user) => (
        <AppShell user={user}>
          <AssetDetailContent user={user} />
        </AppShell>
      )}
    </AuthGate>
  );
}
