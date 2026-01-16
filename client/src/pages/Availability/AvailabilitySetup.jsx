import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { psychologistService } from "@/services/psychologistService";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Plus } from "lucide-react";
import { CalendarIcon, TimeIcon, CloseIcon } from "@/components/icons/DuoTuneIcons";
import { formatTime24to12 } from "@/lib/timezone";

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

const SESSION_DURATIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '60 minutes' },
  { value: 90, label: '90 minutes' },
  { value: 120, label: '120 minutes' }
];

const AvailabilitySetup = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [availability, setAvailability] = useState({
    sessionDuration: 60,
    schedule: []
  });

  // Load existing profile and availability
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser?.uid) return;

      try {
        const profile = await psychologistService.getProfile(currentUser.uid);
        console.log('Loaded profile:', profile);
        console.log('Profile availability:', profile?.availability);
        console.log('Profile data availability:', profile?.data?.availability);

        const availabilityData = profile?.data?.availability || profile?.availability;

        if (availabilityData) {
          console.log('Setting availability to:', availabilityData);
          setAvailability(availabilityData);
        } else {
          console.log('No availability found in profile');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  const addDaySchedule = () => {
    // Find first day not already in schedule
    const usedDays = availability.schedule.map(s => s.dayOfWeek);
    const availableDay = DAYS_OF_WEEK.find(d => !usedDays.includes(d.value));

    if (!availableDay) {
      setError('All days are already scheduled');
      return;
    }

    setAvailability(prev => ({
      ...prev,
      schedule: [...prev.schedule, {
        dayOfWeek: availableDay.value,
        slots: [{ startTime: '09:00', endTime: '17:00', isActive: true }]
      }]
    }));
  };

  const removeDaySchedule = (index) => {
    setAvailability(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }));
  };

  const updateDayOfWeek = (index, dayValue) => {
    setAvailability(prev => ({
      ...prev,
      schedule: prev.schedule.map((day, i) =>
        i === index ? { ...day, dayOfWeek: parseInt(dayValue) } : day
      )
    }));
  };

  const addTimeSlot = (dayIndex) => {
    setAvailability(prev => ({
      ...prev,
      schedule: prev.schedule.map((day, i) =>
        i === dayIndex
          ? {
            ...day,
            slots: [...day.slots, { startTime: '09:00', endTime: '17:00', isActive: true }]
          }
          : day
      )
    }));
  };

  const removeTimeSlot = (dayIndex, slotIndex) => {
    setAvailability(prev => ({
      ...prev,
      schedule: prev.schedule.map((day, i) =>
        i === dayIndex
          ? {
            ...day,
            slots: day.slots.filter((_, j) => j !== slotIndex)
          }
          : day
      )
    }));
  };

  const updateTimeSlot = (dayIndex, slotIndex, field, value) => {
    setAvailability(prev => ({
      ...prev,
      schedule: prev.schedule.map((day, i) =>
        i === dayIndex
          ? {
            ...day,
            slots: day.slots.map((slot, j) =>
              j === slotIndex ? { ...slot, [field]: value } : slot
            )
          }
          : day
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {


      if (availability.schedule.length === 0) {
        setError('Please add at least one day to your schedule');
        toast.error('Please add at least one day to your schedule');
        setLoading(false);
        return;
      }

      for (const day of availability.schedule) {
        for (const slot of day.slots) {
          if (slot.startTime >= slot.endTime) {
            setError('End time must be after start time for all slots');
            toast.error('End time must be after start time for all slots');
            setLoading(false);
            return;
          }
        }
      }

      await psychologistService.updateProfile({ availability }, currentUser.uid);
      setSuccess('Availability updated successfully!');
      toast.success('Availability updated successfully!');
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to update availability');
      toast.error(err.message || 'Failed to update availability');
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 bg-gray-50 px-4 select-none">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Availability Settings</BreadcrumbPage>
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
            <Card className="rounded-2xl border-none shadow-none">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4  rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-10 w-10 rounded" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex gap-4">
                          <Skeleton className="h-10 flex-1" />
                          <Skeleton className="h-10 flex-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-4">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 bg-gray-50 px-4 animate-in fade-in duration-300 select-none">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Availability Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-8 bg-white min-h-[calc(100vh-4rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-4">
            <header className="select-none">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-customGreen mb-4">
                Schedule Settings
              </p>
              <h1 className="text-5xl md:text-6xl font-light text-gray-700 tracking-tight mb-4">
                Set Your Availability
              </h1>
              <p className="text-lg text-gray-500 font-light max-w-xl">
                Configure your weekly schedule and session preferences
              </p>
            </header>
          </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        {/* Current Availability Summary */}
        {availability.schedule.length > 0 && (
          <Card className="mb-6 bg-customGreen/5 border-customGreen/20 shadow-none border-none">
            <CardHeader>
              <CardTitle className="text-lg text-customGreen flex items-center gap-2 select-none">
                <TimeIcon className="w-5 h-5" />
                Current Availability
              </CardTitle>
              <CardDescription className="text-gray-500 select-none">
                Your configured schedule that clients can see
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="mb-4">
                <div className="bg-white p-3 rounded-md border border-customGreen/10">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Session Duration</p>
                  <p className="text-lg font-bold text-gray-700">{availability.sessionDuration} minutes</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-md border border-customGreen/10">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Weekly Schedule</p>
                <div className="space-y-2">
                  {availability.schedule
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map((day, index) => {
                      const dayName = DAYS_OF_WEEK.find(d => d.value === day.dayOfWeek)?.label;
                      const activeSlots = day.slots.filter(s => s.isActive);

                      return (
                        <div key={index} className="flex items-start gap-3 pb-2 border-b last:border-b-0">
                          <div className="w-24 font-semibold text-gray-700 text-sm pt-1">
                            {dayName}
                          </div>
                          <div className="flex-1 space-y-1">
                            {activeSlots.length > 0 ? (
                              activeSlots.map((slot, slotIdx) => (
                                <div key={slotIdx} className="flex items-center gap-2 text-sm text-gray-500">
                                  <TimeIcon className="w-3 h-3 text-customGreen" />
                                  <span>{formatTime24to12(slot.startTime)} - {formatTime24to12(slot.endTime)}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500 italic">No active slots</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Settings */}
          <Card className="border-customGreen/10 shadow-none">
            <CardHeader>
              <CardTitle className='select-none'>General Settings</CardTitle>
              <CardDescription className='select-none'>Set your session duration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sessionDuration">Session Duration *</Label>
                <Select
                  value={availability.sessionDuration.toString()}
                  onValueChange={(value) => setAvailability(prev => ({ ...prev, sessionDuration: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_DURATIONS.map((duration) => (
                      <SelectItem key={duration.value} value={duration.value.toString()}>
                        {duration.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Schedule */}
          <Card className="border-customGreen/10 shadow-none">
            <CardHeader>
              <CardTitle className='select-none'>Weekly Schedule</CardTitle>
              <CardDescription className='select-none'>Configure your available time slots for each day</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {availability.schedule.map((day, dayIndex) => (
                <div key={dayIndex} className="p-4  rounded-lg space-y-4 bg-customGreen/5">
                  <div className="flex justify-between items-center">
                    <div className="flex-1 max-w-xs">
                      <Label>Day of Week</Label>
                      <Select
                        value={day.dayOfWeek.toString()}
                        onValueChange={(value) => updateDayOfWeek(dayIndex, value)}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((d) => (
                            <SelectItem key={d.value} value={d.value.toString()}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDaySchedule(dayIndex)}
                      className="hover:bg-red-50"
                    >
                      <CloseIcon className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>

                  {/* Time Slots */}
                  <div className="space-y-3 pl-0 sm:pl-4 sm:border-l-2 border-customGreen/20">
                    <Label className="text-sm font-medium">Time Slots</Label>
                    {day.slots.map((slot, slotIndex) => (
                      <div key={slotIndex} className="flex flex-col gap-3 p-3 bg-white rounded-md border border-customGreen/10">
                        <div className="flex items-start gap-2">
                          <TimeIcon className="w-4 h-4 text-customGreen shrink-0 mt-2.5" />
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1">
                              <div className="w-full sm:flex-1">
                                <Label className="text-xs text-gray-500 sm:hidden mb-1 block">Start Time</Label>
                                <Input
                                  type="time"
                                  value={slot.startTime}
                                  onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'startTime', e.target.value)}
                                  className="w-full bg-white"
                                />
                              </div>
                              <span className="text-gray-500 shrink-0 hidden sm:inline">to</span>
                              <div className="w-full sm:flex-1">
                                <Label className="text-xs text-gray-500 sm:hidden mb-1 block">End Time</Label>
                                <Input
                                  type="time"
                                  value={slot.endTime}
                                  onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'endTime', e.target.value)}
                                  className="w-full bg-white"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 pl-6 sm:pl-0">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={slot.isActive}
                              onCheckedChange={(checked) => updateTimeSlot(dayIndex, slotIndex, 'isActive', checked)}
                              className="data-[state=checked]:bg-customGreen"
                            />
                            <span className="text-sm text-gray-500">Active</span>
                          </div>
                          {day.slots.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                              className="hover:bg-red-50 shrink-0"
                            >
                              <CloseIcon className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addTimeSlot(dayIndex)}
                      className="bg-white hover:bg-gray-50 select-none w-full sm:w-auto cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Time Slot
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addDaySchedule}
                className="w-full border-dashed border-2 hover:border-customGreen hover:text-customGreen select-none cursor-pointer"
                disabled={availability.schedule.length >= 7}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Day
              </Button>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
        
            <Button
              type="submit"
              className="bg-customGreen hover:bg-customGreenHover cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                  <>
                    Saving
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  </>
                ) : (
                  "Save Availability"
                )}
            </Button>
          </div>
        </form>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AvailabilitySetup;
