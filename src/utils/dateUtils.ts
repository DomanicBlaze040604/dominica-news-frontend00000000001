/**
 * Date utility functions for Dominican timezone formatting
 */

/**
 * Format date and time for Dominican timezone (Atlantic Standard Time - AST)
 * Dominica is UTC-4 year-round (no daylight saving time)
 */
export const formatDominicanDateTime = (dateString: string) => {
  const date = new Date(dateString);
  
  // Handle invalid dates
  if (isNaN(date.getTime())) {
    const fallback = new Date();
    return {
      date: 'Invalid Date',
      time: 'Invalid Time',
      fullDateTime: 'Invalid Date | Invalid Time',
      publishedFormat: 'Published on: Invalid Date | Invalid Time'
    };
  }
  
  // Format date in Dominican timezone
  const dominicanDate = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Dominica', // AST (UTC-4)
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);

  // Format time in Dominican timezone
  const dominicanTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Dominica', // AST (UTC-4)
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);

  return {
    date: dominicanDate,
    time: dominicanTime,
    fullDateTime: `${dominicanDate} | ${dominicanTime}`,
    publishedFormat: `Published on: ${dominicanDate} | ${dominicanTime}`
  };
};

/**
 * Format date for article cards (shorter format)
 */
export const formatArticleDate = (dateString: string) => {
  const date = new Date(dateString);
  
  // Handle invalid dates
  if (isNaN(date.getTime())) {
    return {
      date: 'Invalid Date',
      time: 'Invalid Time',
      shortFormat: 'Invalid Date • Invalid Time'
    };
  }
  
  const dominicanDate = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Dominica',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);

  const dominicanTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Dominica',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);

  return {
    date: dominicanDate,
    time: dominicanTime,
    shortFormat: `${dominicanDate} • ${dominicanTime}`
  };
};

/**
 * Get relative time (e.g., "2 hours ago") in Dominican timezone
 */
export const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  
  // Handle invalid dates
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  // Convert to Dominican timezone for accurate relative time
  const dominicanNow = new Date(now.toLocaleString("en-US", {timeZone: "America/Dominica"}));
  const dominicanDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Dominica"}));
  
  const diffInSeconds = Math.floor((dominicanNow.getTime() - dominicanDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    // For older articles, show the formatted date
    return formatArticleDate(dateString).shortFormat;
  }
};