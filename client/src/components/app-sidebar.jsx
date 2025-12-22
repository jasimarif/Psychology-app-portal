"use client"

import * as React from "react"
import {
  DashboardIcon,
  BookingsIcon,
  CalendarIcon,
  UsersIcon,
  MailIcon,
  FileIcon,
  ProfileIcon,
  TimeIcon,
  PsychologistsIcon,
} from "@/components/icons/DuoTuneIcons"
import { useAuth } from "@/context/AuthContext"
import { logout } from "@/lib/firebase"
import { useNavigate } from "react-router-dom"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavProjects } from "@/components/sidebar/nav-projects"
import { NavUser } from "@/components/sidebar/nav-user"
import { TeamSwitcher } from "@/components/sidebar/team-switcher"
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
      logo: PsychologistsIcon,
      plan: "Professional",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: DashboardIcon,
      isActive: true,
    },
    {
      title: "Bookings",
      url: "/bookings",
      icon: BookingsIcon,
      isActive: false,
    },
    {
      title: "Appointments",
      url: "#",
      icon: CalendarIcon,
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
      icon: UsersIcon,
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
      icon: MailIcon,
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
      icon: FileIcon,
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
      icon: ProfileIcon,
      items: [
        {
          title: "Edit Profile",
          url: "/profile/edit",
        },
        {
          title: "Availability",
          url: "/availability",
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
      url: "/availability",
      icon: TimeIcon,
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
