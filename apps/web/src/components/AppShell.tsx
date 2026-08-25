"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { logout, type ApiUser } from "@/lib/server-api";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/assets": "Assets",
  "/profile": "Profile",
};

export function AppShell({
  user,
  children,
}: {
  user: ApiUser;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const pageTitle = pageTitles[pathname] ?? "Asset Detail";

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      toast.success("Logged out");
    },
    onError: () => {
      toast.error("Failed to log out");
    },
    onSettled: () => {
      queryClient.removeQueries({ queryKey: ["auth", "me"] });
      router.push("/login");
    },
  });

  return (
    <SidebarProvider>
      <AppSidebar
        user={user}
        onLogout={() => logoutMutation.mutate()}
        logoutPending={logoutMutation.isPending}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col p-4 py-8 sm:p-6 sm:py-8 lg:p-8 lg:py-10">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
