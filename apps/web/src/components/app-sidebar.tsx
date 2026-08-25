"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { GalleryVerticalEndIcon, ImagesIcon, LayoutDashboardIcon, UserCircleIcon } from "lucide-react"
import type { ApiUser } from "@/lib/server-api"

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Assets",
    url: "/assets",
    icon: ImagesIcon,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: UserCircleIcon,
  },
]

function isNavItemActive(pathname: string, itemUrl: string) {
  if (itemUrl === "/assets") {
    return pathname === itemUrl || pathname.startsWith(`${itemUrl}/`)
  }

  return pathname === itemUrl
}

export function AppSidebar({
  user,
  onLogout,
  logoutPending,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: ApiUser
  onLogout: () => void
  logoutPending: boolean
}) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="AssetForge"
              render={<Link href="/dashboard" />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <GalleryVerticalEndIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">AssetForge</span>
                <span className="truncate text-xs">AI Asset Generator</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isNavItemActive(pathname, item.url)}
                    render={<Link href={item.url} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={user}
          onLogout={onLogout}
          logoutPending={logoutPending}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
