"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { WandSparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  assetImageUrl,
  createLocalGeneration,
  listLocalAssets,
  listLocalGenerations,
  type Asset,
  type Generation,
  type User,
} from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { getApiHealth } from "@/lib/server-api";

function DashboardContent({ user }: { user: User }) {
  const [prompt, setPrompt] = useState("");
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState("");

  function loadData() {
    setGenerations(listLocalGenerations(user.id));
    setAssets(listLocalAssets(user.id));
  }

  useEffect(() => {
    loadData();
  }, [user.id]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    try {
      createLocalGeneration(user.id, prompt);
      setPrompt("");
      loadData();
    } catch (generationError) {
      setError((generationError as Error).message);
    }
  }

  const apiHealthQuery = useQuery({
    queryKey: ["api-health"],
    queryFn: getApiHealth,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-4 text-sm">
        API:{" "}
        {apiHealthQuery.isLoading ? (
          <span className="text-muted-foreground">checking</span>
        ) : apiHealthQuery.isError ? (
          <span className="text-red-700">offline</span>
        ) : (
          <span className="text-emerald-700">
            online ({apiHealthQuery.data?.service ?? "unknown"})
          </span>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Asset</CardTitle>
          <p className="text-sm text-muted-foreground">
            Describe the image asset you want to mock in the browser.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <Textarea
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
            <Button type="submit">
              <WandSparkles className="h-4 w-4" />
              Generate
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-normal">
            Recent Generations
          </h2>
          <span className="text-sm text-muted-foreground">
            {generations.length} total
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {generations.map((generation) => (
            <div key={generation.id} className="rounded-lg border bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <StatusBadge status={generation.status} />
                <span className="text-xs text-muted-foreground">
                  {new Date(generation.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="line-clamp-3 min-h-16 text-sm">
                {generation.prompt}
              </p>
              {generation.assetId && generation.status === "COMPLETED" ? (
                <Link
                  className="mt-4 inline-flex text-sm font-medium text-primary"
                  href={`/assets/${generation.assetId}`}
                >
                  View asset
                </Link>
              ) : null}
            </div>
          ))}
          {generations.length === 0 ? (
            <div className="rounded-lg border bg-white p-5 text-sm text-muted-foreground md:col-span-3">
              No generations yet.
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-normal">Assets</h2>
          <span className="text-sm text-muted-foreground">
            {assets.length} completed
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <Link
              key={asset.id}
              href={`/assets/${asset.id}`}
              className="overflow-hidden rounded-lg border bg-white"
            >
              <img
                className="aspect-video w-full object-cover"
                src={assetImageUrl(asset.imageUrl)}
                alt={asset.name}
              />
              <div className="space-y-1 p-4">
                <h3 className="truncate font-medium">{asset.name}</h3>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {asset.prompt}
                </p>
              </div>
            </Link>
          ))}
          {assets.length === 0 ? (
            <div className="rounded-lg border bg-white p-5 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
              Completed assets will appear here.
            </div>
          ) : null}
        </div>
      </section>
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
