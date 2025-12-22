"use client"

import * as React from "react"
import {
  Calendar,
  Users,
  FileText,
  Settings2,
  LayoutDashboard,
  MessageSquare,
  Clock,
  Brain,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { logout } from "@/lib/firebase"
import { useNavigate } from "react-router-dom"

import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Psychologist portal data
const getData = (currentUser) => ({
  user: {
    name: currentUser?.displayName || "Psychologist",
    email: currentUser?.email || "psychologist@example.com",
    avatar: currentUser?.photoURL || "/avatars/default.jpg",
  },
  teams: [
    {
      name: "Psychology Portal",
      logo: Brain,
      plan: "Professional",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Appointments",
      url: "#",
      icon: Calendar,
      items: [
        {
          title: "Schedule",
          url: "#",
        },
        {
          title: "Upcoming",
          url: "#",
        },
        {
          title: "History",
          url: "#",
        },
      ],
    },
    {
      title: "Patients",
      url: "#",
      icon: Users,
      items: [
        {
          title: "All Patients",
          url: "#",
        },
        {
          title: "Active Cases",
          url: "#",
        },
        {
          title: "Completed",
          url: "#",
        },
      ],
    },
    {
      title: "Messages",
      url: "#",
      icon: MessageSquare,
      items: [
        {
          title: "Inbox",
          url: "#",
        },
        {
          title: "Sent",
          url: "#",
        },
      ],
    },
    {
      title: "Reports",
      url: "#",
      icon: FileText,
      items: [
        {
          title: "Session Notes",
          url: "#",
        },
        {
          title: "Progress Reports",
          url: "#",
        },
        {
          title: "Analytics",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Profile",
          url: "#",
        },
        {
          title: "Availability",
          url: "#",
        },
        {
          title: "Preferences",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Available Hours",
      url: "#",
      icon: Clock,
    },
  ],
})

export function AppSidebar({
  ...props
}) {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const data = getData(currentUser)

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} onLogout={handleLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
