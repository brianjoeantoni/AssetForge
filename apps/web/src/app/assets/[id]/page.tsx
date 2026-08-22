"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { assetImageUrl, deleteLocalAsset, getLocalAsset, renameLocalAsset, type Asset, type User } from "@/lib/api";

function AssetDetailContent({ user }: { user: User }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const localAsset = getLocalAsset(user.id, params.id);

    if (!localAsset) {
      setError("Asset not found");
      return;
    }

    setAsset(localAsset);
    setName(localAsset.name);
  }, [params.id, user.id]);

  function rename(event: FormEvent) {
    event.preventDefault();
    if (!asset) return;
    setError("");

    try {
      const updated = renameLocalAsset(user.id, asset.id, name);
      if (!updated) {
        setError("Asset not found");
        return;
      }

      setAsset(updated);
    } catch (renameError) {
      setError((renameError as Error).message);
    }
  }

  function deleteAsset() {
    if (!asset) return;
    setError("");

    try {
      deleteLocalAsset(user.id, asset.id);
      router.push("/dashboard");
    } catch (deleteError) {
      setError((deleteError as Error).message);
    }
  }

  if (!asset && !error) {
    return <div className="text-sm text-muted-foreground">Loading asset...</div>;
  }

  if (!asset) {
    return <div className="rounded-lg border bg-white p-5 text-sm text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-5">
      <Link className="inline-flex items-center gap-2 text-sm font-medium text-primary" href="/dashboard">
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <section className="space-y-4">
          <img className="aspect-video w-full rounded-lg border bg-white object-cover" src={assetImageUrl(asset.imageUrl)} alt={asset.name} />
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
              <CardTitle>Asset</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={rename}>
                <label className="block space-y-1 text-sm font-medium">
                  <span>Name</span>
                  <Input value={name} onChange={(event) => setName(event.target.value)} required />
                </label>
                <Button type="submit">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </form>
              {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generation Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <StatusBadge status={asset.status} />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Model</dt>
                  <dd>{asset.model}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{new Date(asset.createdAt).toLocaleString()}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Generation ID</dt>
                  <dd className="max-w-40 truncate font-mono text-xs">{asset.generationId}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs">
                {JSON.stringify({ note: "Frontend-only branch: no backend metadata yet." }, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Button variant="destructive" onClick={deleteAsset}>
            <Trash2 className="h-4 w-4" />
            Delete Asset
          </Button>
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
