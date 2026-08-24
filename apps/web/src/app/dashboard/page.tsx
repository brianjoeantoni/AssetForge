"use client";

import Link from "next/link";
import { isAxiosError } from "axios";
import { FormEvent, useEffect, useState } from "react";
import { Check, Pencil, Trash2, WandSparkles, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createUser,
  deleteUser,
  getApiHealth,
  getUsers,
  updateUser,
  type ApiUser,
} from "@/lib/server-api";

type EditingUser = {
  id: string;
  name: string;
  email: string;
};

function DashboardContent({ user }: { user: User }) {
  const [prompt, setPrompt] = useState("");
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState("");

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userFormError, setUserFormError] = useState("");
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [userActionError, setUserActionError] = useState("");

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

  function submitUser(event: FormEvent) {
    event.preventDefault();
    setUserFormError("");

    createUserMutation.mutate({
      name: userName,
      email: userEmail,
    });
  }

  function startEditingUser(apiUser: ApiUser) {
    setUserActionError("");
    setEditingUser({
      id: apiUser.id,
      name: apiUser.name,
      email: apiUser.email,
    });
  }

  function submitUserEdit(event: FormEvent) {
    event.preventDefault();

    if (!editingUser) {
      return;
    }

    setUserActionError("");
    updateUserMutation.mutate(editingUser);
  }

  function userErrorMessage(error: unknown, fallback: string) {
    if (isAxiosError<{ error?: string }>(error)) {
      return error.response?.data.error ?? fallback;
    }

    return fallback;
  }

  const apiHealthQuery = useQuery({
    queryKey: ["api-health"],
    queryFn: getApiHealth,
  });

  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      setUserName("");
      setUserEmail("");
      setUserFormError("");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (createError) => {
      setUserFormError(userErrorMessage(createError, "Failed to create user"));
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      setEditingUser(null);
      setUserActionError("");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (updateError) => {
      setUserActionError(userErrorMessage(updateError, "Failed to update user"));
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      setEditingUser(null);
      setUserActionError("");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (deleteError) => {
      setUserActionError(userErrorMessage(deleteError, "Failed to delete user"));
    },
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
          <CardTitle>Database Users</CardTitle>
          <p className="text-sm text-muted-foreground">
            These users come from the PostgreSQL users table through Express.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
            onSubmit={submitUser}
          >
            <Input
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              placeholder="Name"
              required
            />
            <Input
              value={userEmail}
              onChange={(event) => setUserEmail(event.target.value)}
              placeholder="Email"
              type="email"
              required
            />
            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? "Creating..." : "Create user"}
            </Button>
          </form>

          {userFormError ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {userFormError}
            </p>
          ) : null}

          {userActionError ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {userActionError}
            </p>
          ) : null}

          {usersQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading users...</p>
          ) : usersQuery.isError ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Failed to load users.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Created</th>
                    <th className="px-3 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersQuery.data?.map((apiUser) => {
                    const isEditing = editingUser?.id === apiUser.id;

                    return (
                      <tr key={apiUser.id} className="border-t bg-white">
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <Input
                              value={editingUser.name}
                              onChange={(event) =>
                                setEditingUser({
                                  ...editingUser,
                                  name: event.target.value,
                                })
                              }
                              aria-label="User name"
                            />
                          ) : (
                            apiUser.name
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <Input
                              value={editingUser.email}
                              onChange={(event) =>
                                setEditingUser({
                                  ...editingUser,
                                  email: event.target.value,
                                })
                              }
                              aria-label="User email"
                              type="email"
                            />
                          ) : (
                            apiUser.email
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {new Date(apiUser.created_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  aria-label="Save user"
                                  disabled={updateUserMutation.isPending}
                                  onClick={submitUserEdit}
                                  size="icon"
                                  type="button"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  aria-label="Cancel edit"
                                  onClick={() => setEditingUser(null)}
                                  size="icon"
                                  type="button"
                                  variant="outline"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  aria-label="Edit user"
                                  onClick={() => startEditingUser(apiUser)}
                                  size="icon"
                                  type="button"
                                  variant="outline"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  aria-label="Delete user"
                                  disabled={deleteUserMutation.isPending}
                                  onClick={() =>
                                    deleteUserMutation.mutate(apiUser.id)
                                  }
                                  size="icon"
                                  type="button"
                                  variant="destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {usersQuery.data?.length === 0 ? (
                    <tr className="border-t bg-white">
                      <td
                        className="px-3 py-4 text-sm text-muted-foreground"
                        colSpan={4}
                      >
                        No database users yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
