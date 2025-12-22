
export const EST_TIMEZONE = 'America/New_York';


export const formatDateEST = (date, options = {}) => {
  const defaultOptions = {
    timeZone: EST_TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  
  return new Date(date).toLocaleString('en-US', { ...defaultOptions, ...options });
};


export const formatDateOnlyEST = (date, format = 'long') => {
  const formats = {
    long: {
      timeZone: EST_TIMEZONE,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    },
    medium: {
      timeZone: EST_TIMEZONE,
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    short: {
      timeZone: EST_TIMEZONE,
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    }
  };
  
  return new Date(date).toLocaleDateString('en-US', formats[format] || formats.long);
};


export const formatTimeOnlyEST = (date) => {
  return new Date(date).toLocaleString('en-US', {
    timeZone: EST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};


export const formatTime24to12 = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};


export const formatTimeRangeEST = (startTime, endTime) => {
  const start = formatTime24to12(startTime);
  const end = formatTime24to12(endTime);
  return `${start} - ${end} EST`;
};


export const formatBookingDateTime = (appointmentDate, startTime, endTime) => {
  return {
    date: formatDateOnlyEST(appointmentDate, 'medium'),
    time: formatTimeRangeEST(startTime, endTime),
    fullDateTime: `${formatDateOnlyEST(appointmentDate, 'long')} at ${formatTime24to12(startTime)} EST`
  };
};

export default {
  EST_TIMEZONE,
  formatDateEST,
  formatDateOnlyEST,
  formatTimeOnlyEST,
  formatTime24to12,
  formatTimeRangeEST,
  formatBookingDateTime
};
