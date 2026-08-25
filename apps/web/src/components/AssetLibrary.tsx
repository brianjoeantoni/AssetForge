"use client";

import Link from "next/link";
import { FileImage } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAssets, type ApiAsset, type ApiAssetStatus } from "@/lib/server-api";

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

function assetIsPending(asset: ApiAsset) {
  const status = statusForBadge(asset.status);
  return status === "QUEUED" || status === "PROCESSING";
}

export function AssetLibrary() {
  const assetsQuery = useQuery({
    queryKey: ["assets"],
    queryFn: getAssets,
    refetchInterval: (query) => {
      const assets = query.state.data;
      return assets?.some(assetIsPending) ? 1000 : false;
    },
  });

  const totalAssets = assetsQuery.data?.length ?? 0;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            Asset Library
          </h1>
          <p className="text-sm text-muted-foreground">
            Review generated assets and open details for rename/delete actions.
          </p>
        </div>
        <span className="text-sm text-muted-foreground">{totalAssets} total</span>
      </div>

      {assetsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="aspect-video w-full rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </Card>
          ))}
        </div>
      ) : assetsQuery.isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Failed to load assets.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assetsQuery.data?.map((asset: ApiAsset) => (
            <Link
              key={asset.id}
              href={`/assets/${asset.id}`}
              className="group overflow-hidden rounded-lg border bg-white transition-colors hover:border-primary/50"
            >
              <img
                className="aspect-video w-full object-cover"
                src={asset.image_url}
                alt={asset.name}
              />
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="truncate font-medium group-hover:text-primary">
                    {asset.name}
                  </h3>
                  <StatusBadge status={statusForBadge(asset.status)} />
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {asset.prompt}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(asset.created_at).toLocaleString()}
                </p>
              </div>
            </Link>
          ))}
          {assetsQuery.data?.length === 0 ? (
            <div className="rounded-lg border bg-white p-10 text-center sm:col-span-2 xl:col-span-3">
              <FileImage className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-base font-semibold">No assets yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Generated assets will appear here after you submit a prompt.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
