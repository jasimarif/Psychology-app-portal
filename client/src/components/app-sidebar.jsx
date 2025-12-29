"use client"

import {
  DashboardIcon,
  BookingsIcon,
  ProfileIcon,
  TimeIcon,
  PsychologistsIcon,
} from "@/components/icons/DuoTuneIcons"
import { useAuth } from "@/context/AuthContext"
import { logout } from "@/lib/firebase"
import { useNavigate, useLocation } from "react-router-dom"

import { NavMain } from "@/components/sidebar/nav-main"
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
const getData = (currentUser, pathname) => ({
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
      isActive: pathname === "/dashboard",
    },
    {
      title: "Bookings",
      url: "/bookings",
      icon: BookingsIcon,
      isActive: pathname === "/bookings",
    },
    {
      title: "Edit Profile",
      url: "/profile/edit",
      icon: ProfileIcon,
      isActive: pathname === "/profile/edit",
    },
    {
      title: "Available Hours",
      url: "/availability",
      icon: TimeIcon,
      isActive: pathname === "/availability",
    },
  ],
})

export function AppSidebar({
  ...props
}) {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const data = getData(currentUser, location.pathname)

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
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} onLogout={handleLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
