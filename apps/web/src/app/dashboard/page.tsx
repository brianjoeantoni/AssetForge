"use client";

import { isAxiosError } from "axios";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Database, FileImage, Loader2, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  createAsset,
  getApiHealth,
  getAssets,
  type ApiAsset,
  type ApiUser,
} from "@/lib/server-api";

function assetIsPending(asset: ApiAsset) {
  const status = asset.status.toUpperCase();
  return status === "QUEUED" || status === "PROCESSING";
}

function DashboardContent({ user }: { user: ApiUser }) {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");

  function errorMessage(error: unknown, fallback: string) {
    if (isAxiosError<{ error?: string }>(error)) {
      return error.response?.data.error ?? fallback;
    }

    return fallback;
  }

  const apiHealthQuery = useQuery({
    queryKey: ["api-health"],
    queryFn: getApiHealth,
  });

  const assetsQuery = useQuery({
    queryKey: ["assets"],
    queryFn: getAssets,
    refetchInterval: (query) => {
      const assets = query.state.data;
      return assets?.some(assetIsPending) ? 1000 : false;
    },
  });

  const createAssetMutation = useMutation({
    mutationFn: createAsset,
    onSuccess: (asset) => {
      setPrompt("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success(
        asset.status.toUpperCase() === "COMPLETED"
          ? "Asset generated"
          : "Asset queued",
      );
    },
    onError: (assetError) => {
      const message = errorMessage(assetError, "Failed to create asset");
      setError(message);
      toast.error(message);
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    createAssetMutation.mutate({
      prompt,
    });
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Generate Assets</p>
        </div>
        <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm">
          <Database className="h-4 w-4 text-muted-foreground" />
          {apiHealthQuery.isLoading ? (
            <Skeleton className="h-4 w-28" />
          ) : apiHealthQuery.isError ? (
            <span className="text-destructive">API offline</span>
          ) : (
            <span className="text-emerald-700">
              API online ({apiHealthQuery.data?.service ?? "unknown"})
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Assets</p>
              {assetsQuery.isLoading ? (
                <Skeleton className="mt-2 h-7 w-12" />
              ) : (
                <p className="mt-1 text-2xl font-semibold">
                  {assetsQuery.data?.length ?? 0}
                </p>
              )}
            </div>
            <FileImage className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Storage</p>
              <p className="mt-1 text-2xl font-semibold">Postgres</p>
            </div>
            <Database className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Mode</p>
              <p className="mt-1 text-2xl font-semibold">Mock</p>
            </div>
            <WandSparkles className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Asset</CardTitle>
          <p className="text-sm text-muted-foreground">
            Describe the image asset you want AssetForge to create.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <Textarea
              className="min-h-48 resize-y"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="A futuristic sports car driving through Tokyo at night"
              required
              minLength={5}
            />
            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={createAssetMutation.isPending}>
              {createAssetMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <WandSparkles className="h-4 w-4" />
              )}
              {createAssetMutation.isPending ? "Generating..." : "Generate"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGate>
      {(user) => (
        <AppShell user={user}>
          <DashboardContent user={user} />
        </AppShell>
      )}
    </AuthGate>
  );
}
