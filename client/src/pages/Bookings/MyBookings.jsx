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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateOnlyEST, formatTime24to12 } from "@/lib/timezone";
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
  UsersIcon,
  AlertIcon
} from "@/components/icons/DuoTuneIcons";
import { Loader2 } from "lucide-react";

const MyBookings = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [psychologistId, setPsychologistId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);

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
      case "pending":
        return bookings.filter(b => b.status === 'pending');
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

  const handleConfirmBooking = async (bookingId) => {
    try {
      setActionLoading(bookingId);
      const token = await currentUser.getIdToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}/confirm`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to confirm booking');
      }

      // Update local state
      setBookings(prev => prev.map(b =>
        b._id === bookingId ? { ...b, status: 'confirmed' } : b
      ));
    } catch (err) {
      console.error('Error confirming booking:', err);
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const reason = prompt("Please provide a reason for cancellation:");
    if (!reason) return;

    try {
      setActionLoading(bookingId);
      const token = await currentUser.getIdToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}/cancel`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to cancel booking');
      }

      // Update local state
      setBookings(prev => prev.map(b =>
        b._id === bookingId ? { ...b, status: 'cancelled', cancellationReason: reason } : b
      ));
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { 
        className: "bg-amber-100 text-amber-700 hover:bg-amber-100", 
        label: "Pending",
        icon: <AlertIcon className="w-3 h-3" />
      },
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

    const variant = variants[status] || variants.pending;
    return (
      <Badge className={`${variant.className} border font-medium gap-1.5 px-3 py-1`}>
        {variant.icon}
        {variant.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    try {
      return formatDateOnlyEST(dateString, 'long');
    } catch {
      return dateString;
    }
  };

  const getBookingStats = () => {
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
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
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-customGreen/20 border-t-customGreen rounded-full animate-spin mx-auto mb-6"></div>
                <CalendarIcon className="w-8 h-8 text-customGreen absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-gray-600 font-medium">Loading bookings...</p>
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
                <p className="text-gray-600 text-lg">
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
                      <StatsIcon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                      <p className="text-xs text-gray-600">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 shadow-none bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-200/50 flex items-center justify-center">
                      <AlertIcon className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-amber-900">{stats.pending}</p>
                      <p className="text-xs text-amber-700">Pending</p>
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
            <label htmlFor="booking-filter" className="text-sm font-medium text-gray-700">
              Filter by:
            </label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[200px] rounded-xl border-gray-300 bg-white h-11">
                <SelectValue placeholder="Select filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
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
                    onClick={() => window.location.reload()} 
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
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {filter === "all" ? "No bookings yet" : `No ${filter} bookings`}
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
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
                                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-customGreen transition-colors">
                                  Client ID: {booking.userId}
                                </h3>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
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
                              <p className="text-sm font-semibold text-gray-900">
                                {formatDate(booking.appointmentDate)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-customGreen/5 rounded-xl">
                            <div className="w-10 h-10 bg-customGreen/10 rounded-lg flex items-center justify-center">
                              <TimeIcon className="w-5 h-5 text-customGreen" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Time (EST)</p>
                              <p className="text-sm font-semibold text-gray-900">
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
                              <p className="text-lg font-bold text-customGreen">
                                ${booking.price}
                              </p>
                            </div>
                          </div>
                        </div>

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
                              Cancelled by: {booking.cancelledBy || 'N/A'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right Section - Actions */}
                      <div className="lg:w-64 bg-customGreen/10 border-l border-gray-100">
                        <div className="flex flex-col py-6 lg:py-8 px-6 lg:px-8 h-full">
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Actions</p>

                          <div className="space-y-3">
                            {booking.status === 'pending' && (
                              <>
                                <Button
                                  className="w-full justify-start rounded-xl bg-customGreen hover:bg-customGreenHover text-white transition-all cursor-pointer"
                                  onClick={() => handleConfirmBooking(booking._id)}
                                  disabled={actionLoading === booking._id}
                                >
                                  {actionLoading === booking._id ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <CheckIcon className="w-4 h-4 mr-2" />
                                      Confirm Booking
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all cursor-pointer"
                                  onClick={() => handleCancelBooking(booking._id)}
                                  disabled={actionLoading === booking._id}
                                >
                                  <CloseIcon className="w-4 h-4 mr-2" />
                                  Cancel Booking
                                </Button>
                              </>
                            )}

                            {booking.status === 'confirmed' && (
                              <Button
                                variant="outline"
                                className="w-full justify-start rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all cursor-pointer"
                                onClick={() => handleCancelBooking(booking._id)}
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
    </SidebarProvider>
  );
};

export default MyBookings;
