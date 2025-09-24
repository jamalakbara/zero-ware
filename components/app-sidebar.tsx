"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "@/lib/auth-client"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const staticData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Studies",
      url: "/studies",
      icon: IconListDetails,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: IconChartBar,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: IconReport,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
  ],
  navClouds: [
    {
      title: "S1 Data",
      icon: IconDatabase,
      isActive: true,
      url: "/data/s1",
      items: [
        {
          title: "Loss Categories",
          url: "/data/s1/categories",
        },
        {
          title: "Downtime Analysis",
          url: "/data/s1/analysis",
        },
      ],
    },
    {
      title: "CT Data",
      icon: IconChartBar,
      url: "/data/ct",
      items: [
        {
          title: "Cycle Time",
          url: "/data/ct/cycles",
        },
        {
          title: "Efficiency",
          url: "/data/ct/efficiency",
        },
      ],
    },
    {
      title: "Piece Counters",
      icon: IconCamera,
      url: "/data/pieces",
      items: [
        {
          title: "Production Count",
          url: "/data/pieces/production",
        },
        {
          title: "Quality Metrics",
          url: "/data/pieces/quality",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Help & Support",
      url: "/help",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "/search",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Zero Loss Guide",
      url: "/docs/zero-loss",
      icon: IconFileDescription,
    },
    {
      name: "Pareto Analysis",
      url: "/docs/pareto",
      icon: IconFileAi,
    },
    {
      name: "OEE Metrics",
      url: "/docs/oee",
      icon: IconFileWord,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  
  const userData = session?.user ? {
    name: session.user.name || "User",
    email: session.user.email,
    avatar: session.user.image || "/codeguide-logo.png",
  } : {
    name: "Guest",
    email: "guest@example.com", 
    avatar: "/codeguide-logo.png",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <Image src="/codeguide-logo.png" alt="ZeroWare" width={32} height={32} className="rounded-lg" />
                <span className="text-base font-semibold font-parkinsans">ZeroWare</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={staticData.navMain} />
        <NavDocuments items={staticData.documents} />
        <NavSecondary items={staticData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
