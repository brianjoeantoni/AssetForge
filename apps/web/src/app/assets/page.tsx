"use client";

import { AppShell } from "@/components/AppShell";
import { AssetLibrary } from "@/components/AssetLibrary";
import { AuthGate } from "@/components/AuthGate";

export default function AssetsPage() {
  return (
    <AuthGate>
      {(user) => (
        <AppShell user={user}>
          <AssetLibrary />
        </AppShell>
      )}
    </AuthGate>
  );
}
