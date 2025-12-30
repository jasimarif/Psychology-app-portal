import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { formatDateOnly, formatTime24to12 } from "@/lib/timezone";
import {
  CalendarIcon,
  TimeIcon,
  ProfileIcon,
  CheckIcon,
  CloseIcon,
  BriefcaseIcon,
  StatsIcon,
  UsersIcon,
  PsychologistsIcon,
  LocationIcon,
} from "@/components/icons/DuoTuneIcons";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, ShieldCheck, Phone, Mail, GraduationCap, Languages, Loader2, LogOut } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import AdminLogin from "./AdminLogin";

const AdminPanel = () => {
  const { currentUser } = useAuth();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("psychologists");
  const [stats, setStats] = useState(null);
  const [psychologists, setPsychologists] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  
  // Filters
  const [bookingFilter, setBookingFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state for each tab
  const [psychologistsPage, setPsychologistsPage] = useState(1);
  const [psychologistsLimit, setPsychologistsLimit] = useState(10);
  const [usersPage, setUsersPage] = useState(1);
  const [usersLimit, setUsersLimit] = useState(10);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsLimit, setBookingsLimit] = useState(10);

  // User bookings dialog
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [userBookingsLoading, setUserBookingsLoading] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);

  // Psychologist expanded state
  const [expandedPsychologist, setExpandedPsychologist] = useState(null);
  const [statusLoading, setStatusLoading] = useState(null);

  // Check admin authentication on mount
  useEffect(() => {
    const checkAdminAuth = () => {
      const adminAuth = sessionStorage.getItem('adminAuth');
      if (adminAuth) {
        try {
          const authData = JSON.parse(adminAuth);
          // 1 hour session
          const isValid = authData.authenticated && 
            (Date.now() - authData.timestamp) < 1 * 60 * 60 * 1000;
          setIsAdminAuthenticated(isValid);
          if (!isValid) {
            sessionStorage.removeItem('adminAuth');
          }
        } catch {
          setIsAdminAuthenticated(false);
          sessionStorage.removeItem('adminAuth');
        }
      }
      setCheckingAuth(false);
    };
    checkAdminAuth();
  }, []);

  useEffect(() => {
    if (!isAdminAuthenticated || checkingAuth) return;
    
    const loadStats = async () => {
      if (!currentUser?.uid) return;
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/admin/stats`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        const result = await response.json();
        if (response.ok) {
          setStats(result.data);
        }
      } catch (err) {
        console.error('Error loading stats:', err);
      }
    };
    loadStats();
  }, [currentUser, isAdminAuthenticated, checkingAuth]);

  useEffect(() => {
    if (!isAdminAuthenticated || checkingAuth) return;

    const loadData = async () => {
      if (!currentUser?.uid) return;
      setLoading(true);
      setError("");

      try {
        const token = await currentUser.getIdToken();
        let endpoint = '';

        switch (activeTab) {
          case 'psychologists':
            endpoint = '/api/admin/psychologists';
            break;
          case 'users':
            endpoint = '/api/admin/users';
            break;
          case 'bookings':
            endpoint = '/api/admin/bookings';
            break;
          default:
            setLoading(false);
            return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}${endpoint}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch data');
        }

        switch (activeTab) {
          case 'psychologists':
            setPsychologists(result.data);
            break;
          case 'users':
            setUsers(result.data);
            break;
          case 'bookings':
            setBookings(result.data);
            break;
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, currentUser, isAdminAuthenticated, checkingAuth]);

  // Reset to page 1 when search term or filters change
  useEffect(() => {
    setPsychologistsPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setUsersPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setBookingsPage(1);
  }, [searchTerm, bookingFilter]);

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('adminAuth');
    setIsAdminAuthenticated(false);
  };

  // Load user bookings
  const loadUserBookings = async (userId, userName, userEmail) => {
    setSelectedUser({ userId, userName, userEmail });
    setUserBookingsLoading(true);
    setUserDialogOpen(true);
    
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/bookings`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const result = await response.json();
      
      if (response.ok) {
        setUserBookings(result.data);
      }
    } catch (err) {
      console.error('Error loading user bookings:', err);
    } finally {
      setUserBookingsLoading(false);
    }
  };

  // Toggle psychologist details expansion
  const togglePsychologistDetails = (psychologistId) => {
    setExpandedPsychologist(prev => prev === psychologistId ? null : psychologistId);
  };

  // Toggle psychologist active status
  const togglePsychologistStatus = async (psychologistId, currentStatus) => {
    setStatusLoading(psychologistId);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/psychologists/${psychologistId}/status`,
        {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ isActive: !currentStatus })
        }
      );
      const result = await response.json();
      
      if (response.ok) {
        setPsychologists(prev => prev.map(p => 
          p._id === psychologistId ? { ...p, isActive: !currentStatus } : p
        ));
        if (selectedPsychologist?._id === psychologistId) {
          setSelectedPsychologist(prev => ({ ...prev, isActive: !currentStatus }));
        }
        setStats(prev => ({
          ...prev,
          psychologists: {
            ...prev.psychologists,
            active: !currentStatus 
              ? prev.psychologists.active + 1 
              : prev.psychologists.active - 1
          }
        }));
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    } finally {
      setStatusLoading(null);
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
      },
      pending: { 
        className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100", 
        label: "Pending",
        icon: <TimeIcon className="w-3 h-3" />
      }
    };

    const variant = variants[status] || variants.pending;
    return (
      <Badge className={`${variant.className} border font-medium gap-1.5 px-3 py-1 select-none`}>
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

  const getFilteredBookings = () => {
    let filtered = bookings;

    if (bookingFilter !== "all") {
      filtered = filtered.filter(b => b.status === bookingFilter);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.userName?.toLowerCase().includes(search) ||
        b.userEmail?.toLowerCase().includes(search) ||
        b.psychologistId?.name?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const getFilteredPsychologists = () => {
    if (!searchTerm) return psychologists;
    const search = searchTerm.toLowerCase();
    return psychologists.filter(p =>
      p.name?.toLowerCase().includes(search) ||
      p.email?.toLowerCase().includes(search) ||
      p.title?.toLowerCase().includes(search)
    );
  };

  const getFilteredUsers = () => {
    if (!searchTerm) return users;
    const search = searchTerm.toLowerCase();
    return users.filter(u =>
      u.userName?.toLowerCase().includes(search) ||
      u.userEmail?.toLowerCase().includes(search)
    );
  };

  // Pagination helper functions
  const getPaginatedData = (data, page, limit) => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalItems, limit) => {
    return Math.ceil(totalItems / limit);
  };

  const handlePageChange = (tab, newPage) => {
    switch (tab) {
      case 'psychologists':
        setPsychologistsPage(newPage);
        break;
      case 'users':
        setUsersPage(newPage);
        break;
      case 'bookings':
        setBookingsPage(newPage);
        break;
    }
  };

  const handleLimitChange = (tab, newLimit) => {
    switch (tab) {
      case 'psychologists':
        setPsychologistsLimit(Number(newLimit));
        setPsychologistsPage(1);
        break;
      case 'users':
        setUsersLimit(Number(newLimit));
        setUsersPage(1);
        break;
      case 'bookings':
        setBookingsLimit(Number(newLimit));
        setBookingsPage(1);
        break;
    }
  };

  // Get paginated data for each tab
  const getPaginatedPsychologists = () => {
    const filtered = getFilteredPsychologists();
    return {
      data: getPaginatedData(filtered, psychologistsPage, psychologistsLimit),
      total: filtered.length,
      totalPages: getTotalPages(filtered.length, psychologistsLimit)
    };
  };

  const getPaginatedUsers = () => {
    const filtered = getFilteredUsers();
    return {
      data: getPaginatedData(filtered, usersPage, usersLimit),
      total: filtered.length,
      totalPages: getTotalPages(filtered.length, usersLimit)
    };
  };

  const getPaginatedBookings = () => {
    const filtered = getFilteredBookings();
    return {
      data: getPaginatedData(filtered, bookingsPage, bookingsLimit),
      total: filtered.length,
      totalPages: getTotalPages(filtered.length, bookingsLimit)
    };
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="rounded-2xl border-0 shadow-none">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Pagination component
  const PaginationControls = ({ currentPage, totalPages, onPageChange, currentLimit, onLimitChange, totalItems }) => {
    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;

      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) pages.push(i);
          pages.push('ellipsis');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('ellipsis');
          for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
        } else {
          pages.push(1);
          pages.push('ellipsis');
          pages.push(currentPage - 1);
          pages.push(currentPage);
          pages.push(currentPage + 1);
          pages.push('ellipsis');
          pages.push(totalPages);
        }
      }

      return pages;
    };

    if (totalPages === 0) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <Select value={String(currentLimit)} onValueChange={onLimitChange}>
            <SelectTrigger className="w-20 h-9 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>of {totalItems} items</span>
        </div>

        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {getPageNumbers().map((page, idx) => (
              page === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => onPageChange(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        </div>
      </div>
    );
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-customGreen" />
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAdminAuthenticated) {
    return <AdminLogin onLogin={handleAdminLogin} />;
  }

  return (
    <SidebarProvider>
      <SidebarInset className="ml-0! font-nunito">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 bg-white animate-in fade-in duration-300 select-none">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-customGreen" />
              <span className="font-semibold text-gray-700">Admin Panel</span>
            </div>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Admin Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdminLogout}
            className="rounded-lg shadow-none border-none bg-red-200 text-red-500 cursor-pointer select-none hover:bg-red-200 hover:text-red-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-8 bg-gray-50 min-h-[calc(100vh-4rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-6 select-none">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="w-8 h-8 text-customGreenHover" />
                  <h1 className="text-3xl md:text-4xl font-bold text-customGreenHover">
                    Admin Panel
                  </h1>
                </div>
                <p className="text-gray-500 text-lg">
                  Manage psychologists, users, and bookings
                </p>
              </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                <Card className="rounded-2xl border-0 shadow-none bg-customGreen/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 select-none">
                      <div className="w-10 h-10 rounded-xl bg-customGreen/20 flex items-center justify-center">
                        <PsychologistsIcon className="w-5 h-5 text-customGreen" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-gray-700">{stats.psychologists?.total || 0}</p>
                        <p className="text-xs text-gray-500">Psychologists</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-0 shadow-none bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 select-none">
                      <div className="w-10 h-10 rounded-xl bg-blue-200/50 flex items-center justify-center">
                        <UsersIcon className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-blue-900">{stats.users?.total || 0}</p>
                        <p className="text-xs text-blue-700">Users</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-0 shadow-none bg-purple-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 select-none">
                      <div className="w-10 h-10 rounded-xl bg-purple-200/50 flex items-center justify-center">
                        <StatsIcon className="w-5 h-5 text-purple-700" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-purple-900">{stats.bookings?.total || 0}</p>
                        <p className="text-xs text-purple-700">Total Bookings</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-0 shadow-none bg-emerald-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 select-none">
                      <div className="w-10 h-10 rounded-xl bg-emerald-200/50 flex items-center justify-center">
                        <CheckIcon className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-emerald-900">{stats.bookings?.confirmed || 0}</p>
                        <p className="text-xs text-emerald-700">Confirmed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-0 shadow-none bg-sky-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 select-none">
                      <div className="w-10 h-10 rounded-xl bg-sky-200/50 flex items-center justify-center">
                        <CheckIcon className="w-5 h-5 text-sky-700" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-sky-900">{stats.bookings?.completed || 0}</p>
                        <p className="text-xs text-sky-700">Completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-0 shadow-none bg-amber-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 select-none">
                      <div className="w-10 h-10 rounded-xl bg-amber-200/50 flex items-center justify-center">
                        <span className="text-lg font-bold text-amber-700">$</span>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-amber-900">${stats.revenue?.total || 0}</p>
                        <p className="text-xs text-amber-700">Revenue</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <TabsList className="h-12 p-1 bg-white rounded-xl shadow-none">
                <TabsTrigger 
                  value="psychologists" 
                  className="rounded-lg px-4 py-2 data-[state=active]:bg-customGreen data-[state=active]:text-white select-none cursor-pointer transition-all duration-300 data-[state=active]:scale-105 hover:bg-gray-50 data-[state=active]:hover:bg-customGreen"
                >
                  Psychologists
                </TabsTrigger>
                <TabsTrigger 
                  value="users" 
                  className="rounded-lg px-4 py-2 data-[state=active]:bg-customGreen data-[state=active]:text-white select-none cursor-pointer transition-all duration-300 data-[state=active]:scale-105 hover:bg-gray-50 data-[state=active]:hover:bg-customGreen"
                >
                  Users
                </TabsTrigger>
                <TabsTrigger 
                  value="bookings" 
                  className="rounded-lg px-4 py-2 data-[state=active]:bg-customGreen data-[state=active]:text-white select-none cursor-pointer transition-all duration-300 data-[state=active]:scale-105 hover:bg-gray-50 data-[state=active]:hover:bg-customGreen"
                >
                  Bookings
                </TabsTrigger>
              </TabsList>

              {/* Search and Filter */}
              <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-10 rounded-xl w-64"
                    />
                  </div>
                  {activeTab === 'bookings' && (
                    <Select value={bookingFilter} onValueChange={setBookingFilter}>
                      <SelectTrigger className="w-[150px] rounded-xl h-10">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
            </div>

            {/* Psychologists Tab */}
            <TabsContent value="psychologists" className="mt-0" key={`psychologists-${activeTab}`}>
              {loading ? (
                <LoadingSkeleton />
              ) : getFilteredPsychologists().length === 0 ? (
                <Card className="rounded-3xl border-0 shadow-none bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardContent className="pt-12 pb-12">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <PsychologistsIcon className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-700 mb-3">
                        No psychologists found
                      </h3>
                      <p className="text-gray-500">
                        {searchTerm ? "Try adjusting your search term" : "No psychologists registered yet"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {getPaginatedPsychologists().data.map((psychologist, index) => (
                    <Card 
                      key={psychologist._id} 
                      className="rounded-3xl border-0 shadow-none bg-white transition-all duration-300 overflow-hidden group animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                          <div className="flex-0">
                            <Avatar className="w-20 h-20 ring-4 ring-customGreen/10">
                              <AvatarImage src={psychologist.profileImage} alt={psychologist.name} />
                              <AvatarFallback className="bg-customGreen/10 text-customGreen text-xl font-bold">
                                {psychologist.name?.charAt(0)?.toUpperCase() || 'P'}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-xl font-bold text-gray-700 mb-1">
                                  {psychologist.name}
                                </h3>
                                <p className="text-sm text-gray-500">{psychologist.title}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-medium ${psychologist.isActive ? 'text-customGreen' : 'text-gray-500'}`}>
                                    {psychologist.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                  <Switch
                                    checked={psychologist.isActive}
                                    onCheckedChange={() => togglePsychologistStatus(psychologist._id, psychologist.isActive)}
                                    disabled={statusLoading === psychologist._id}
                                    className="data-[state=checked]:bg-customGreen/90"
                                  />
                                  {statusLoading === psychologist._id && (
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="w-4 h-4 text-customGreen" />
                                {psychologist.email}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <BriefcaseIcon className="w-4 h-4 text-customGreen" />
                                {psychologist.experience}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <LocationIcon className="w-4 h-4 text-customGreen" />
                                {psychologist.location}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="text-customGreen font-bold">$</span>
                                {psychologist.price} {psychologist.currency || 'USD'} / session
                              </div>
                            </div>

                            {psychologist.specialties?.length > 0 && (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {psychologist.specialties.slice(0, 4).map((specialty, idx) => (
                                  <Badge key={idx} variant="outline" className="bg-gray-50 text-gray-600 text-xs">
                                    {specialty}
                                  </Badge>
                                ))}
                                {psychologist.specialties.length > 4 && (
                                  <Badge variant="outline" className="bg-gray-50 text-gray-500 text-xs">
                                    +{psychologist.specialties.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            )}
                            
                            <div className="mt-4 flex justify-between items-center">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl bg-gray-100 border-none cursor-pointer select-none hover:bg-gray-200 transition-all"
                                onClick={() => togglePsychologistDetails(psychologist._id)}
                              >
                                {expandedPsychologist === psychologist._id ? (
                                  <>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                    Hide Details
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    View Details
                                  </>
                                )}
                              </Button>
                            </div>

                            {/* Collapsible Details Section */}
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                              expandedPsychologist === psychologist._id 
                                ? 'max-h-[5000px] opacity-100 mt-6' 
                                : 'max-h-0 opacity-0'
                            }`}>
                              <div className="space-y-6 pt-6 border-t border-gray-100">
                                {/* Contact Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {psychologist.phone && (
                                    <div className="flex items-center gap-3 p-4 bg-customGreen/5 rounded-xl">
                                      <Phone className="w-5 h-5 text-customGreen" />
                                      <div>
                                        <p className="text-xs text-gray-500">Phone</p>
                                        <p className="text-sm font-medium text-gray-700">{psychologist.phone}</p>
                                      </div>
                                    </div>
                                  )}
                                  {psychologist.licenseNumber && (
                                    <div className="flex items-center gap-3 p-4 bg-customGreen/5 rounded-xl">
                                      <div className="w-5 h-5 flex items-center justify-center text-customGreen font-bold text-lg">#</div>
                                      <div>
                                        <p className="text-xs text-gray-500">License Number</p>
                                        <p className="text-sm font-medium text-gray-700">{psychologist.licenseNumber}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Bio */}
                                {psychologist.bio && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">About</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl">
                                      {psychologist.bio}
                                    </p>
                                  </div>
                                )}

                                {/* Languages */}
                                {psychologist.languages?.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                      <Languages className="w-4 h-4" />
                                      Languages
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {psychologist.languages.map((lang, idx) => (
                                        <Badge key={idx} className="bg-blue-50 text-blue-700 border-blue-200">
                                          {lang}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Education */}
                                {psychologist.education?.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                      <GraduationCap className="w-4 h-4" />
                                      Education
                                    </h4>
                                    <div className="space-y-3">
                                      {psychologist.education.map((edu, idx) => (
                                        <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                                          <p className="font-medium text-gray-700">{edu.degree}</p>
                                          <p className="text-sm text-gray-500">{edu.institution}</p>
                                          <p className="text-xs text-gray-400 mt-1">{edu.year}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Work Experience */}
                                {psychologist.workExperience?.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                      <BriefcaseIcon className="w-4 h-4" />
                                      Work Experience
                                    </h4>
                                    <div className="space-y-3">
                                      {psychologist.workExperience.map((work, idx) => (
                                        <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                                          <p className="font-medium text-gray-700">{work.position}</p>
                                          <p className="text-sm text-gray-500">{work.organization}</p>
                                          <p className="text-xs text-gray-400 mt-1">{work.duration}</p>
                                          {work.description && (
                                            <p className="text-sm text-gray-600 mt-2">{work.description}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Availability */}
                                {psychologist.availability?.schedule?.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                      <CalendarIcon className="w-4 h-4" />
                                      Availability Schedule
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {psychologist.availability.schedule.map((day, idx) => {
                                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                        return (
                                          <div key={idx} className="p-3 bg-gray-50 rounded-xl">
                                            <p className="font-medium text-gray-700 mb-2">{dayNames[day.dayOfWeek]}</p>
                                            <div className="space-y-1">
                                              {day.slots?.filter(s => s.isActive).map((slot, sIdx) => (
                                                <p key={sIdx} className="text-sm text-gray-500">
                                                  {formatTime24to12(slot.startTime)} - {formatTime24to12(slot.endTime)}
                                                </p>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    {psychologist.availability.timezone && (
                                      <p className="text-xs text-gray-400 mt-2">
                                        Timezone: {psychologist.availability.timezone}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Meta Info */}
                                <div className="pt-4 border-t border-gray-100">
                                  <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                                    <span>ID: {psychologist._id}</span>
                                    <span>User ID: {psychologist.userId}</span>
                                    {psychologist.createdAt && (
                                      <span>Joined: {new Date(psychologist.createdAt).toLocaleDateString()}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  </div>
                  <PaginationControls
                    currentPage={psychologistsPage}
                    totalPages={getPaginatedPsychologists().totalPages}
                    onPageChange={(page) => handlePageChange('psychologists', page)}
                    currentLimit={psychologistsLimit}
                    onLimitChange={(limit) => handleLimitChange('psychologists', limit)}
                    totalItems={getPaginatedPsychologists().total}
                  />
                </>
              )}
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="mt-0" key={`users-${activeTab}`}>
              {loading ? (
                <LoadingSkeleton />
              ) : getFilteredUsers().length === 0 ? (
                <Card className="rounded-3xl border-0 shadow-none bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardContent className="pt-12 pb-12">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <UsersIcon className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-700 mb-3">
                        No users found
                      </h3>
                      <p className="text-gray-500">
                        {searchTerm ? "Try adjusting your search term" : "No users with bookings yet"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {getPaginatedUsers().data.map((user, index) => (
                    <Card 
                      key={user.userId} 
                      className="rounded-3xl border-0 shadow-none bg-white transition-all duration-300 overflow-hidden group animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                          <Avatar className="w-16 h-16 ring-4 ring-customGreen/20">
                            <AvatarFallback className="bg-customGreen/30 text-customGreen text-lg font-bold">
                              {user.userName?.charAt(0) || user.userEmail?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-xl font-bold text-gray-700 mb-1">
                                  {user.userName || 'Unknown User'}
                                </h3>
                                <p className="text-sm text-gray-500">{user.userEmail}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                              <div className="bg-gray-50 rounded-xl p-3 text-center">
                                <p className="text-lg font-bold text-gray-700">{user.totalBookings}</p>
                                <p className="text-xs text-gray-500">Total</p>
                              </div>
                              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                <p className="text-lg font-bold text-emerald-700">{user.confirmedBookings}</p>
                                <p className="text-xs text-emerald-600">Confirmed</p>
                              </div>
                              <div className="bg-blue-50 rounded-xl p-3 text-center">
                                <p className="text-lg font-bold text-blue-700">{user.completedBookings}</p>
                                <p className="text-xs text-blue-600">Completed</p>
                              </div>
                              <div className="bg-red-50 rounded-xl p-3 text-center">
                                <p className="text-lg font-bold text-red-700">{user.cancelledBookings}</p>
                                <p className="text-xs text-red-600">Cancelled</p>
                              </div>
                              <div className="bg-amber-50 rounded-xl p-3 text-center">
                                <p className="text-lg font-bold text-amber-700">${user.totalSpent}</p>
                                <p className="text-xs text-amber-600">Spent</p>
                              </div>
                            </div>

                            <div className="mt-4">
                              <Button
                                variant="outline"
                                className="rounded-xl border-none bg-gray-100 cursor-pointer select-none hover:bg-gray-200 transition-all"
                                onClick={() => loadUserBookings(user.userId, user.userName, user.userEmail)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Bookings
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  </div>
                  <PaginationControls
                    currentPage={usersPage}
                    totalPages={getPaginatedUsers().totalPages}
                    onPageChange={(page) => handlePageChange('users', page)}
                    currentLimit={usersLimit}
                    onLimitChange={(limit) => handleLimitChange('users', limit)}
                    totalItems={getPaginatedUsers().total}
                  />
                </>
              )}
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="mt-0" key={`bookings-${activeTab}`}>
              {loading ? (
                <LoadingSkeleton />
              ) : getFilteredBookings().length === 0 ? (
                <Card className="rounded-3xl border-0 shadow-none bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardContent className="pt-12 pb-12">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CalendarIcon className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-700 mb-3">
                        No bookings found
                      </h3>
                      <p className="text-gray-500">
                        {searchTerm || bookingFilter !== 'all'
                          ? "Try adjusting your filters"
                          : "No bookings have been made yet"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {getPaginatedBookings().data.map((booking, index) => (
                    <Card 
                      key={booking._id} 
                      className="rounded-3xl border-0 shadow-none bg-white transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <Avatar className="w-12 h-12 ring-2 ring-gray-100">
                                  <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                                    {booking.userName?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="text-lg font-bold text-gray-700">
                                    {booking.userName || booking.userEmail || 'Unknown User'}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    Client • ID: {booking._id.slice(-8)}
                                  </p>
                                </div>
                              </div>
                              {getStatusBadge(booking.status)}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <CalendarIcon className="w-5 h-5 text-customGreen" />
                                <div>
                                  <p className="text-xs text-gray-500">Date</p>
                                  <p className="text-sm font-semibold text-gray-700">
                                    {formatDate(booking.appointmentDate)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <TimeIcon className="w-5 h-5 text-customGreen" />
                                <div>
                                  <p className="text-xs text-gray-500">Time</p>
                                  <p className="text-sm font-semibold text-gray-700">
                                    {formatTime24to12(booking.startTime)} - {formatTime24to12(booking.endTime)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <PsychologistsIcon className="w-5 h-5 text-customGreen" />
                                <div>
                                  <p className="text-xs text-gray-500">Psychologist</p>
                                  <p className="text-sm font-semibold text-gray-700">
                                    {booking.psychologistId?.name || 'N/A'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <span className="text-lg font-bold text-customGreen">$</span>
                                <div>
                                  <p className="text-xs text-gray-500">Amount</p>
                                  <p className="text-sm font-semibold text-gray-700">
                                    ${booking.price}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {booking.cancellationReason && (
                              <div className="mt-4 p-3 bg-red-50 rounded-xl">
                                <p className="text-xs text-red-600 font-semibold mb-1">Cancellation Reason</p>
                                <p className="text-sm text-red-700">{booking.cancellationReason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  </div>
                  <PaginationControls
                    currentPage={bookingsPage}
                    totalPages={getPaginatedBookings().totalPages}
                    onPageChange={(page) => handlePageChange('bookings', page)}
                    currentLimit={bookingsLimit}
                    onLimitChange={(limit) => handleLimitChange('bookings', limit)}
                    totalItems={getPaginatedBookings().total}
                  />
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* User Bookings Dialog */}
        <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto rounded-3xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-700">
                {selectedUser?.userName || 'User'}'s Bookings
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                {selectedUser?.userEmail}
              </DialogDescription>
            </DialogHeader>

            {userBookingsLoading ? (
              <div className="space-y-4 py-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : userBookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No bookings found for this user</p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {userBookings.map((booking) => (
                  <div key={booking._id} className="p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-700">
                          {booking.psychologistId?.name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(booking.appointmentDate)} • {formatTime24to12(booking.startTime)}
                        </p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-semibold">${booking.price}</span>
                      <span>•</span>
                      <span>ID: {booking._id.slice(-8)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminPanel;
