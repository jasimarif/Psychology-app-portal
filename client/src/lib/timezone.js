
export const formatDate = (date, options = {}) => {
  if (!date) return 'Invalid Date';

  const dateObj = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(date + 'T12:00:00')
    : new Date(date);

  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  const defaultOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };

  return dateObj.toLocaleString('en-US', { ...defaultOptions, ...options });
};


export const formatDateOnly = (date, format = 'long') => {
  if (!date) return 'Invalid Date';

  let dateObj;

  // Handle different date formats
  if (typeof date === 'string') {
    // Extract just the date part if it's an ISO string (e.g., "2025-12-30T00:00:00.000Z" -> "2025-12-30")
    const dateOnlyMatch = date.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateOnlyMatch) {
      // Use the extracted date with noon time to avoid timezone shifts
      dateObj = new Date(dateOnlyMatch[1] + 'T12:00:00');
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = new Date(date);
  }

  // Check if date is valid
  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  const formats = {
    long: {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    },
    medium: {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    short: {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    }
  };

  return dateObj.toLocaleDateString('en-US', formats[format] || formats.long);
};


export const formatTimeOnly = (date) => {
  return new Date(date).toLocaleString('en-US', {
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


export const formatTimeRange = (startTime, endTime) => {
  const start = formatTime24to12(startTime);
  const end = formatTime24to12(endTime);
  return `${start} - ${end}`;
};


export const formatBookingDateTime = (appointmentDate, startTime, endTime) => {
  return {
    date: formatDateOnly(appointmentDate, 'medium'),
    time: formatTimeRange(startTime, endTime),
    fullDateTime: `${formatDateOnly(appointmentDate, 'long')} at ${formatTime24to12(startTime)}`
  };
};

export default {
  formatDate,
  formatDateOnly,
  formatTimeOnly,
  formatTime24to12,
  formatTimeRange,
  formatBookingDateTime
};
