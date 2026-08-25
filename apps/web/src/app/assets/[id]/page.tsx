"use client";

import Link from "next/link";
import { isAxiosError } from "axios";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  deleteAsset,
  getAsset,
  updateAsset,
  type ApiAssetStatus,
  type ApiUser,
} from "@/lib/server-api";

function statusForBadge(status: string): ApiAssetStatus {
  const normalized = status.toUpperCase();

  if (
    normalized === "QUEUED" ||
    normalized === "PROCESSING" ||
    normalized === "COMPLETED" ||
    normalized === "FAILED"
  ) {
    return normalized;
  }

  return "COMPLETED";
}

function statusIsPending(status: string) {
  const normalized = status.toUpperCase();
  return normalized === "QUEUED" || normalized === "PROCESSING";
}

function AssetDetailContent({ user }: { user: ApiUser }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [actionError, setActionError] = useState("");

  const assetQuery = useQuery({
    queryKey: ["assets", params.id],
    queryFn: () => getAsset(params.id),
    retry: false,
    refetchInterval: (query) => {
      const asset = query.state.data;
      return asset && statusIsPending(asset.status) ? 1000 : false;
    },
  });

  useEffect(() => {
    if (assetQuery.data) {
      setName(assetQuery.data.name);
    }
  }, [assetQuery.data]);

  function errorMessage(error: unknown, fallback: string) {
    if (isAxiosError<{ error?: string }>(error)) {
      return error.response?.data.error ?? fallback;
    }

    return fallback;
  }

  const updateAssetMutation = useMutation({
    mutationFn: updateAsset,
    onSuccess: () => {
      setActionError("");
      queryClient.invalidateQueries({ queryKey: ["assets", params.id] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset renamed");
    },
    onError: (updateError) => {
      const message = errorMessage(updateError, "Failed to update asset");
      setActionError(message);
      toast.error(message);
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      setActionError("");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset deleted");
      router.push("/assets");
    },
    onError: (deleteError) => {
      const message = errorMessage(deleteError, "Failed to delete asset");
      setActionError(message);
      toast.error(message);
    },
  });

  function renameAsset(event: FormEvent) {
    event.preventDefault();
    setActionError("");

    updateAssetMutation.mutate({
      id: params.id,
      name,
    });
  }

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
          href="/assets"
        >
          <ArrowLeft className="h-4 w-4" />
          Assets
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
        href="/assets"
      >
        <ArrowLeft className="h-4 w-4" />
        Assets
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
              <CardTitle className="flex items-center justify-between gap-3">
                <span className="truncate">{asset.name}</span>
                <StatusBadge status={statusForBadge(asset.status)} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
                onSubmit={renameAsset}
              >
                <label className="block space-y-1 text-sm font-medium">
                  <span>Name</span>
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </label>
                <Button type="submit" disabled={updateAssetMutation.isPending}>
                  {updateAssetMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {updateAssetMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </form>

              {actionError ? (
                <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {actionError}
                </p>
              ) : null}

              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="flex items-center gap-2">
                    {statusIsPending(asset.status) ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    ) : null}
                    {asset.status.toLowerCase()}
                  </dd>
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

          <div className="grid gap-3 sm:grid-cols-2">
            <Link className="block" href="/assets">
              <Button className="w-full" variant="outline">
                Back to assets
              </Button>
            </Link>

            <Button
              className="w-full"
              variant="destructive"
              onClick={() => deleteAssetMutation.mutate(asset.id)}
              disabled={deleteAssetMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              {deleteAssetMutation.isPending ? "Deleting..." : "Delete Asset"}
            </Button>
          </div>
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
