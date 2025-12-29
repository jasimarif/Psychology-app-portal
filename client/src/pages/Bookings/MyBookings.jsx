import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { psychologistService } from "@/services/psychologistService";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateOnly, formatTime24to12 } from "@/lib/timezone";
import {
  CalendarIcon,
  TimeIcon,
  LocationIcon,
  ProfileIcon,
  CheckIcon,
  CloseIcon,
  BriefcaseIcon,
  StatsIcon,
  ArrowRightIcon,
  UsersIcon
} from "@/components/icons/DuoTuneIcons";
import { Skeleton } from "@/components/ui/skeleton";

const MyBookings = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [psychologistId, setPsychologistId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");

  // Load psychologist profile to get ID
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser?.uid) return;

      try {
        const profile = await psychologistService.getProfile(currentUser.uid);
        const profileData = profile?.data || profile;
        setPsychologistId(profileData._id);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      }
    };

    loadProfile();
  }, [currentUser]);

  // Load bookings
  useEffect(() => {
    const loadBookings = async () => {
      if (!psychologistId) return;

      try {
        setLoading(true);
        const token = await currentUser.getIdToken();
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/bookings/psychologist/${psychologistId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch bookings');
        }

        setBookings(result.data);
      } catch (err) {
        console.error('Error loading bookings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [psychologistId, currentUser]);

  const getFilteredBookings = () => {
    switch (filter) {
      case "confirmed":
        return bookings.filter(b => b.status === 'confirmed');
      case "completed":
        return bookings.filter(b => b.status === 'completed');
      case "cancelled":
        return bookings.filter(b => b.status === 'cancelled');
      default:
        return bookings;
    }
  };

  const openCancelDialog = (bookingId) => {
    setSelectedBookingId(bookingId);
    setCancellationReason("");
    setCancelDialogOpen(true);
  };

  const handleCancelBooking = async () => {
    if (!cancellationReason.trim()) {
      return;
    }

    try {
      setActionLoading(selectedBookingId);
      const token = await currentUser.getIdToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/bookings/${selectedBookingId}/cancel`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            reason: cancellationReason,
            cancelledBy: 'psychologist'
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to cancel booking');
      }

      // Update local state
      setBookings(prev => prev.map(b =>
        b._id === selectedBookingId ? { 
          ...b, 
          status: 'cancelled', 
          cancellationReason: cancellationReason,
          cancelledBy: 'psychologist'
        } : b
      ));
      
      // Close dialog and reset state
      setCancelDialogOpen(false);
      setSelectedBookingId(null);
      setCancellationReason("");
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      confirmed: { 
        className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100", 
        label: "Confirmed",
        icon: <CheckIcon className="w-3 h-3" />
      },
      completed: { 
        className: "bg-blue-100 text-blue-700 hover:bg-blue-100", 
        label: "Completed",
        icon: <CheckIcon className="w-3 h-3" />
      },
      cancelled: { 
        className: "bg-red-100 text-red-700 hover:bg-red-100", 
        label: "Cancelled",
        icon: <CloseIcon className="w-3 h-3" />
      }
    };

    const variant = variants[status] || variants.confirmed;
    return (
      <Badge className={`${variant.className} border font-medium gap-1.5 px-3 py-1`}>
        {variant.icon}
        {variant.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    try {
      return formatDateOnly(dateString, 'long');
    } catch {
      return dateString;
    }
  };

  const getBookingStats = () => {
    return {
      total: bookings.length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      completed: bookings.filter(b => b.status === 'completed').length,
    };
  };

  const stats = getBookingStats();

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>My Bookings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 lg:p-8 bg-white min-h-[calc(100vh-4rem)]">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className="w-8 h-8 rounded" />
                <Skeleton className="h-10 w-64" />
              </div>
              <Skeleton className="h-6 w-96 mt-2" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="rounded-2xl border-0 shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <div className="flex-1">
                        <Skeleton className="h-6 w-12 mb-1" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="rounded-2xl border-0 shadow-none">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <Skeleton className="w-20 h-20 rounded-full" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Skeleton className="h-5 w-full" />
                          <Skeleton className="h-5 w-full" />
                        </div>
                      </div>
                      <div className="flex lg:flex-col gap-2">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white animate-in fade-in duration-300">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>My Bookings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-8 bg-white min-h-[calc(100vh-4rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <CalendarIcon className="w-8 h-8 text-customGreenHover" />
                  <h1 className="text-3xl md:text-4xl font-bold text-customGreenHover">
                    Session Bookings
                  </h1>
                </div>
                <p className="text-gray-500 text-lg">
                  Manage your therapy sessions and appointments
                </p>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card className="rounded-2xl border-0 shadow-none bg-lightGreen/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-lightGreen/95 flex items-center justify-center">
                      <StatsIcon className="w-5 h-5 text-customGreen" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-700">{stats.total}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 shadow-none bg-emerald-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-200/50 flex items-center justify-center">
                      <CheckIcon className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-emerald-900">{stats.confirmed}</p>
                      <p className="text-xs text-emerald-700">Confirmed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 shadow-none bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-200/50 flex items-center justify-center">
                      <CheckIcon className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-blue-900">{stats.completed}</p>
                      <p className="text-xs text-blue-700">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 shadow-none bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-200/50 flex items-center justify-center">
                      <CloseIcon className="w-5 h-5 text-red-700" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-red-900">{stats.cancelled}</p>
                      <p className="text-xs text-red-700">Cancelled</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Filter Dropdown */}
          <div className="mb-6 flex items-center gap-3">
            <label htmlFor="booking-filter" className="text-sm font-medium text-gray-500">
              Filter by:
            </label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[200px] rounded-xl border-gray-300 bg-white h-11">
                <SelectValue placeholder="Select filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Card className="rounded-3xl shadow-none bg-red-100 mb-6">
              <CardContent className="pt-8 pb-8">
                <div className="text-center">
                  <p className="text-red-600 mb-2">{error}</p>
                  <Button 
                    onClick={() => loadBookings()}
                    className="bg-customGreen hover:bg-customGreenHover text-white rounded-xl px-6 h-11"
                  >
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {getFilteredBookings().length === 0 ? (
            <Card className="rounded-3xl border-0 shadow-none bg-white">
              <CardContent className="pt-12 pb-12">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CalendarIcon className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-3">
                    {filter === "all" ? "No bookings yet" : `No ${filter} bookings`}
                  </h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    {filter === "all"
                      ? "You don't have any bookings yet."
                      : `You don't have any ${filter} bookings at the moment`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {getFilteredBookings().map((booking) => (
                <Card 
                  key={booking._id} 
                  className="rounded-3xl border-0 shadow-none bg-customGreen/5 transition-all duration-300 overflow-hidden group py-0"
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row">
                      {/* Left Section - Client Info */}
                      <div className="flex-1 p-6 lg:p-8">
                        <div className="flex items-start gap-4 mb-6">
                          <Avatar className="w-16 h-16 ring-4 ring-customGreen/10 group-hover:ring-customGreen/20 transition-all">
                            <AvatarFallback className="bg-customGreen/10 text-customGreen text-lg font-bold">
                              <UsersIcon className="w-8 h-8" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-xl font-bold text-gray-700 mb-1 group-hover:text-customGreen transition-colors">
                                  {booking.userName || booking.userEmail || `Client ID: ${booking.userId}`}
                                </h3>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <BriefcaseIcon className="w-3.5 h-3.5" />
                                  Booking ID: {booking._id.slice(-8)}
                                </p>
                              </div>
                              {getStatusBadge(booking.status)}
                            </div>
                          </div>
                        </div>

                        {/* Appointment Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div className="flex items-center gap-3 p-3 bg-customGreen/5 rounded-xl">
                            <div className="w-10 h-10 bg-customGreen/10 rounded-lg flex items-center justify-center">
                              <CalendarIcon className="w-5 h-5 text-customGreen" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Date</p>
                              <p className="text-sm font-semibold text-gray-700">
                                {formatDate(booking.appointmentDate)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-customGreen/5 rounded-xl">
                            <div className="w-10 h-10 bg-customGreen/10 rounded-lg flex items-center justify-center">
                              <TimeIcon className="w-5 h-5 text-customGreen" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Time</p>
                              <p className="text-sm font-semibold text-gray-700">
                                {formatTime24to12(booking.startTime)} - {formatTime24to12(booking.endTime)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-customGreen/5 rounded-xl">
                            <div className="w-10 h-10 bg-customGreen/10 rounded-lg flex items-center justify-center">
                              <span className="text-lg font-bold text-customGreen">$</span>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Session Fee</p>
                              <p className="text-lg font-bold text-gray-700">
                                ${booking.price}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Zoom Link - Only show for confirmed status */}
                        {booking.zoomJoinUrl && booking.status === 'confirmed' && (
                          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 mb-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-0">
                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M15.75 2.25H8.25C7.00736 2.25 6 3.25736 6 4.5V19.5C6 20.7426 7.00736 21.75 8.25 21.75H15.75C16.9926 21.75 18 20.7426 18 19.5V4.5C18 3.25736 16.9926 2.25 15.75 2.25Z" />
                                  <path d="M9 6.75H15M9 9.75H15M9 12.75H15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-wide">Video Session</p>
                                <p className="text-sm text-gray-700 mb-3">
                                  Join your session via Zoom when it's time
                                </p>
                                {booking.zoomPassword && (
                                  <p className="text-xs text-gray-500 mb-2">
                                    <span className="font-semibold">Meeting ID:</span> {booking.zoomMeetingId}
                                    <span className="mx-2">|</span>
                                    <span className="font-semibold">Password:</span> {booking.zoomPassword}
                                  </p>
                                )}
                                <a
                                  href={booking.zoomJoinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  Join Zoom Meeting
                                </a>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {booking.notes && (
                          <div className="p-4 bg-blue-50 rounded-xl mb-4">
                            <p className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-wide">Client Notes</p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {booking.notes}
                            </p>
                          </div>
                        )}

                        {/* Cancellation Reason */}
                        {booking.status === 'cancelled' && booking.cancellationReason && (
                          <div className="p-4 bg-red-50 rounded-xl">
                            <p className="text-xs text-red-600 font-semibold mb-1 uppercase tracking-wide">Cancellation Reason</p>
                            <p className="text-sm text-red-700 leading-relaxed">
                              {booking.cancellationReason}
                            </p>
                            <p className="text-xs text-red-500 mt-1">
                              Cancelled by: {booking.cancelledBy === 'psychologist' ? 'Psychologist' : booking.cancelledBy === 'client' ? 'Client' : 'N/A'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right Section - Actions */}
                      <div className="lg:w-64 bg-customGreen/10 border-l border-gray-100">
                        <div className="flex flex-col py-6 lg:py-8 px-6 lg:px-8 h-full">
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Actions</p>

                          <div className="space-y-3">
                            {(booking.status === 'confirmed') && (
                              <Button
                                variant="outline"
                                className="w-full justify-start rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all cursor-pointer"
                                onClick={() => openCancelDialog(booking._id)}
                                disabled={actionLoading === booking._id}
                              >
                                <CloseIcon className="w-4 h-4 mr-2" />
                                Cancel Booking
                              </Button>
                            )}

                            {booking.status === 'completed' && (
                              <div className="flex items-center gap-2 text-emerald-600 text-sm">
                                <CheckIcon className="w-4 h-4" />
                                <span className="font-medium">Session completed</span>
                              </div>
                            )}
                            
                            {booking.status === 'cancelled' && (
                              <div className="flex items-center gap-2 text-red-600 text-sm">
                                <CloseIcon className="w-4 h-4" />
                                <span className="font-medium">Booking cancelled</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SidebarInset>

      {/* Cancel Booking Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-gray-700">
              Cancel Booking
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Please provide a reason for cancelling this booking. The client will be notified of the cancellation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Textarea
              placeholder="Enter your reason for cancellation..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="min-h-[120px] rounded-xl resize-none"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setCancelDialogOpen(false);
                setSelectedBookingId(null);
                setCancellationReason("");
              }}
              className="rounded-xl"
            >
              Keep Booking
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              disabled={!cancellationReason.trim() || actionLoading === selectedBookingId}
              className="bg-red-600 hover:bg-red-700 rounded-xl"
            >
              {actionLoading === selectedBookingId ? "Cancelling..." : "Cancel Booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default MyBookings;
