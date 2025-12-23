

// Server-side timezone utilities
// All dates are stored in UTC. These utilities are for formatting only.

export const formatDate = (date, options = {}) => {
  const defaultOptions = {
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


export const formatDateOnly = (date) => {
  let dateObj;

  if (typeof date === 'string' && date.includes('-')) {
    const [year, month, day] = date.split('T')[0].split('-');
    dateObj = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0));
  } else if (date instanceof Date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    dateObj = new Date(Date.UTC(year, month, day, 12, 0, 0));
  } else {
    dateObj = new Date(date);
  }

  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};


export const formatTimeOnly = (date) => {
  return new Date(date).toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};


export const formatShortDate = (date) => {
  let dateObj;

  if (typeof date === 'string' && date.includes('-')) {
    const [year, month, day] = date.split('T')[0].split('-');
    dateObj = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0));
  } else if (date instanceof Date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    dateObj = new Date(Date.UTC(year, month, day, 12, 0, 0));
  } else {
    dateObj = new Date(date);
  }

  return dateObj.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
};


export const formatTime24to12 = (time24) => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};


export const createDateTime = (dateStr, timeStr) => {
  const date = new Date(dateStr);
  const [hours, minutes] = timeStr.split(':').map(Number);

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const dateTimeString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${timeStr}:00`;

  return new Date(dateTimeString);
};


export const getISOString = (date, timeStr) => {
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}T${timeStr}:00`;
};

export default {
  formatDate,
  formatDateOnly,
  formatTimeOnly,
  formatShortDate,
  formatTime24to12,
  createDateTime,
  getISOString
};
