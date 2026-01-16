import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TrendingUp, ArrowRight } from "lucide-react"
import {
  UsersIcon,
  CalendarIcon,
  CheckIcon,
  StatsIcon,
  ProfileIcon,
  BookingsIcon,
  ArrowRightIcon,
  DashboardFileIcon,
} from "@/components/icons/DuoTuneIcons"
import { auth } from "@/lib/firebase"

function Dashboard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    totalEarnings: 0,
    upcomingToday: 0
  })
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [psychologistProfile, setPsychologistProfile] = useState(null)

  // Fetch psychologist profile first, then bookings using the profile's _id
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return

      try {
        setLoading(true)
        const token = await auth.currentUser?.getIdToken()

        // First fetch psychologist profile to get the MongoDB _id
        const profileResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/psychologists/${currentUser.uid}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )

        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          const profile = profileData.data || profileData
          setPsychologistProfile(profile)

          // Now fetch bookings using the psychologist's MongoDB _id
          if (profile?._id) {
            const bookingsResponse = await fetch(
              `${import.meta.env.VITE_API_URL}/api/bookings/psychologist/${profile._id}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            )

            if (bookingsResponse.ok) {
              const bookingsData = await bookingsResponse.json()
              const bookings = bookingsData.data || []

              // Calculate stats
              const confirmed = bookings.filter(b => b.status === 'confirmed').length
              const completed = bookings.filter(b => b.status === 'completed').length
              const cancelled = bookings.filter(b => b.status === 'cancelled').length
              const totalEarnings = bookings
                .filter(b => b.status === 'completed')
                .reduce((sum, b) => sum + (b.price || 0), 0)

              // Count today's upcoming sessions
              const today = new Date().toDateString()
              const upcomingToday = bookings.filter(b => {
                const bookingDate = new Date(b.appointmentDate).toDateString()
                return bookingDate === today && b.status === 'confirmed'
              }).length

              setStats({
                total: bookings.length,
                confirmed,
                completed,
                cancelled,
                totalEarnings,
                upcomingToday
              })

              // Get recent bookings (last 5)
              const sortedBookings = [...bookings]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5)
              setRecentBookings(sortedBookings)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentUser])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime24to12 = (time24) => {
    if (!time24) return ''
    const [hours, minutes] = time24.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Confirmed' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Completed' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
      pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' }
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <Badge className={`${config.bg} ${config.text} border-0 text-xs font-medium`}>
        {config.label}
      </Badge>
    )
  }

  const statsCards = [
    {
      value: stats.total,
      label: "Total Bookings",
      icon: StatsIcon,
      color: "text-customGray",
      bg: "bg-customGray/10",
      bgColor: "bg-lightGray"
    },
    {
      value: stats.confirmed,
      label: "Upcoming Sessions",
      icon: CalendarIcon,
      color: "text-amber-600",
      bg: "bg-amber-100",
      bgColor: "bg-amber-50"
    },
    {
      value: stats.completed,
      label: "Completed",
      icon: CheckIcon,
      color: "text-customGreen",
      bg: "bg-lightGreen/95",
      bgColor: "bg-lightGreen/50"
    },
    {
      value: `$${stats.totalEarnings.toLocaleString()}`,
      label: "Total Earnings",
      icon: DashboardFileIcon,
      color: "text-blue-600",
      bg: "bg-blue-100",
      bgColor: "bg-blue-50"
    },
  ]

  const quickActions = [
    {
      icon: BookingsIcon,
      title: "View All Bookings",
      description: "Manage your therapy sessions and appointments",
      action: () => navigate("/bookings"),
      buttonText: "Go to Bookings",
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      icon: ProfileIcon,
      title: "Edit Profile",
      description: "Update your professional information and availability",
      action: () => navigate("/profile/edit"),
      buttonText: "Edit Profile",
      iconBg: "bg-teal-50 text-teal-600",
    },
    {
      icon: CalendarIcon,
      title: "Set Availability",
      description: "Configure your available time slots for bookings",
      action: () => navigate("/availability"),
      buttonText: "Manage Schedule",
      iconBg: "bg-amber-50 text-amber-600",
    },
    {
      icon: UsersIcon,
      title: "Client Sessions",
      description: "View upcoming and past client appointments",
      action: () => navigate("/bookings"),
      buttonText: "View Sessions",
      iconBg: "bg-purple-50 text-purple-600",
    },
  ]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b animate-in fade-in duration-300 select-none">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="mb-4">
            <header className="select-none">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-customGreen mb-4">
                Welcome Back
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-700 tracking-tight mb-4">
                Dashboard
              </h1>
              <p className="text-lg text-customGray font-light max-w-xl">
                {psychologistProfile
                  ? `Hello, ${psychologistProfile.name}! Manage your practice and connect with clients.`
                  : 'Manage your practice and connect with clients.'}
              </p>
            </header>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 select-none">
            {statsCards.map((stat, index) => (
              <Card key={index} className={`border-none shadow-none ${stat.bgColor} transition-colors rounded-2xl`}>
                <CardContent className="p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
                  <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-700">
                      {loading ? '...' : stat.value}
                    </p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Practice Insights - Left Column */}
            <Card className="lg:col-span-2 rounded-2xl sm:rounded-3xl border bg-white/80 backdrop-blur shadow-none">
              <CardHeader className="pb-4 px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-customGray">Practice Insights</CardTitle>
                    <CardDescription className="text-sm text-gray-500">Track your growth and performance</CardDescription>
                  </div>
                  {stats.upcomingToday > 0 && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 rounded-lg text-sm">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {stats.upcomingToday} session{stats.upcomingToday > 1 ? 's' : ''} today
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-6">
                {/* Performance Ring & Next Session */}
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  {/* Completion Rate Ring */}
                  <div className="flex-shrink-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-customGreen/5 to-customGreen/10 rounded-2xl">
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeLinecap="round"
                          className="text-customGreen"
                          strokeDasharray={`${stats.total > 0 ? ((stats.completed / stats.total) * 251.2).toFixed(0) : 0} 251.2`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-customGray">
                          {loading ? '...' : stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                        </span>
                        <span className="text-xs text-gray-500">Success Rate</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-3 text-center">
                      {stats.completed} of {stats.total} sessions completed
                    </p>
                  </div>

                  {/* Next Upcoming Session & Quick Stats */}
                  <div className="flex-1 space-y-4">
                    {/* Next Session Preview */}
                    {recentBookings.find(b => b.status === 'confirmed') ? (
                      <div className="p-5 bg-lightGray rounded-2xl">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full bg-customGray/10 animate-pulse"></div>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Next Session</span>
                        </div>
                        {(() => {
                          const nextSession = recentBookings.find(b => b.status === 'confirmed')
                          return (
                            <div className="flex items-center gap-4">
                              <Avatar className="w-12 h-12 ring-2 ring-customGray/10">
                                <AvatarFallback className="bg-customGray/10 text-customGray font-bold">
                                  {(nextSession.userName || nextSession.userEmail || 'C')[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-700">
                                  {nextSession.userName || nextSession.userEmail || 'Client'}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {formatDate(nextSession.appointmentDate)} • {formatTime24to12(nextSession.startTime)}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-customGray/10 text-customGray hover:bg-customGray/10"
                                onClick={() => navigate('/bookings')}
                              >
                                View
                              </Button>
                            </div>
                          )
                        })()}
                      </div>
                    ) : (
                      <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                        <CalendarIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No upcoming sessions</p>
                        <p className="text-xs text-gray-400">Your next booking will appear here</p>
                      </div>
                    )}

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-lightGray rounded-xl text-center">
                        <p className="text-2xl font-bold text-gray-700">
                          ${stats.completed > 0 ? Math.round(stats.totalEarnings / stats.completed) : 0}
                        </p>
                        <p className="text-sm text-gray-500">Avg. per Session</p>
                      </div>
                      <div className="p-4 bg-lightGray rounded-xl text-center">
                        <p className="text-2xl font-bold text-gray-700">
                          {stats.total > 0 ? Math.round(((stats.total - stats.cancelled) / stats.total) * 100) : 100}%
                        </p>
                        <p className="text-sm text-gray-500">Retention Rate</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Earnings Card */}
                <div className="p-6 bg-lightGray rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
                      <p className="text-4xl font-bold text-gray-700">
                        ${loading ? '...' : stats.totalEarnings.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        ~${stats.completed > 0 ? Math.round(stats.totalEarnings / stats.completed) : 0} per session
                      </p>
                    </div>
                    <div className="w-20 h-20 bg-customGray/10 rounded-2xl flex items-center justify-center">
                      <DashboardFileIcon className="w-10 h-10 text-customGray" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Bookings - Right Column */}
            <Card className="rounded-2xl sm:rounded-3xl border shadow-none bg-white/80 backdrop-blur">
              <CardHeader className="pb-4 px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-customGray">Recent Bookings</CardTitle>
                    <CardDescription className="text-sm text-gray-500">Latest client appointments</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-customGray hover:text-customGreen"
                    onClick={() => navigate('/bookings')}
                  >
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-6">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 animate-pulse">
                        <div className="w-10 h-10 bg-gray-200 rounded-xl shrink-0"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentBookings.length > 0 ? (
                  <div className="space-y-3">
                    {recentBookings.map((booking, idx) => (
                      <div
                        key={booking._id || idx}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer"
                        onClick={() => navigate('/bookings')}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="w-10 h-10 ring-2 ring-customGray/10">
                            <AvatarFallback className="bg-customGray/10 text-customGray text-sm font-bold">
                              <UsersIcon className="w-5 h-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-sm text-gray-700 truncate">
                              {booking.userName || booking.userEmail || 'Client'}
                            </h4>
                            <p className="text-xs text-gray-500 truncate">
                              {formatDate(booking.appointmentDate)} at {formatTime24to12(booking.startTime)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No bookings yet</p>
                    <p className="text-xs text-gray-400 mt-1">Bookings will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Section */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-customGray mb-4 select-none">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {quickActions.map((action, index) => (
                <Card
                  key={index}
                  className="group border shadow-none hover:border-customGray/30 transition-all duration-300 cursor-pointer rounded-2xl"
                  onClick={action.action}
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className={`w-12 h-12 ${action.iconBg} rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300`}>
                      <action.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-base text-gray-700 mb-2 group-hover:text-customGray transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {action.description}
                    </p>
                    <div className="flex items-center text-sm font-semibold text-customGray opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                      {action.buttonText}
                      <ArrowRightIcon className="w-4 h-4 ml-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Profile Status Card */}
          {!psychologistProfile && !loading && (
            <Card className="rounded-2xl border-amber-200 bg-amber-50 shadow-none">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <ProfileIcon className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-700">Complete Your Profile</h3>
                    <p className="text-sm text-gray-500">Set up your professional profile to start receiving bookings</p>
                  </div>
                </div>
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
                  onClick={() => navigate('/profile')}
                >
                  Complete Profile
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Dashboard
