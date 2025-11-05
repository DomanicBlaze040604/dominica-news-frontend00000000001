import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDominicanDateTime, formatArticleDate, getRelativeTime } from '../utils/dateUtils';

describe('Dominican Date Utilities', () => {
  beforeEach(() => {
    // Mock the current time for consistent testing
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatDominicanDateTime', () => {
    it('should format date and time for Dominican timezone (AST)', () => {
      const testDate = '2025-11-05T18:30:00Z'; // 6:30 PM UTC
      const result = formatDominicanDateTime(testDate);

      expect(result.date).toBe('November 5, 2025');
      expect(result.time).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
      expect(result.fullDateTime).toMatch(/November 5, 2025 \| \d{1,2}:\d{2} (AM|PM)/);
      expect(result.publishedFormat).toMatch(/Published on: November 5, 2025 \| \d{1,2}:\d{2} (AM|PM)/);
    });

    it('should handle different times correctly in AST (UTC-4)', () => {
      // Test morning time
      const morningDate = '2025-11-05T12:00:00Z'; // 12:00 PM UTC = 8:00 AM AST
      const morningResult = formatDominicanDateTime(morningDate);
      expect(morningResult.time).toMatch(/8:00 AM/);

      // Test evening time
      const eveningDate = '2025-11-05T22:00:00Z'; // 10:00 PM UTC = 6:00 PM AST
      const eveningResult = formatDominicanDateTime(eveningDate);
      expect(eveningResult.time).toMatch(/6:00 PM/);
    });

    it('should handle date changes across timezone boundaries', () => {
      // Test a date that changes when converted to AST
      const lateNightUTC = '2025-11-06T02:00:00Z'; // 2:00 AM UTC next day = 10:00 PM AST previous day
      const result = formatDominicanDateTime(lateNightUTC);
      
      expect(result.date).toBe('November 5, 2025'); // Should be previous day in AST
      expect(result.time).toMatch(/10:00 PM/);
    });

    it('should format different months correctly', () => {
      const dates = [
        { input: '2025-01-15T15:00:00Z', expected: 'January 15, 2025' },
        { input: '2025-06-20T15:00:00Z', expected: 'June 20, 2025' },
        { input: '2025-12-25T15:00:00Z', expected: 'December 25, 2025' },
      ];

      dates.forEach(({ input, expected }) => {
        const result = formatDominicanDateTime(input);
        expect(result.date).toBe(expected);
      });
    });
  });

  describe('formatArticleDate', () => {
    it('should format date in shorter format for article cards', () => {
      const testDate = '2025-11-05T18:30:00Z';
      const result = formatArticleDate(testDate);

      expect(result.date).toMatch(/Nov \d{1,2}, 2025/);
      expect(result.time).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
      expect(result.shortFormat).toMatch(/Nov \d{1,2}, 2025 • \d{1,2}:\d{2} (AM|PM)/);
    });

    it('should use abbreviated month names', () => {
      const dates = [
        { input: '2025-01-15T15:00:00Z', expectedMonth: 'Jan' },
        { input: '2025-02-15T15:00:00Z', expectedMonth: 'Feb' },
        { input: '2025-03-15T15:00:00Z', expectedMonth: 'Mar' },
        { input: '2025-04-15T15:00:00Z', expectedMonth: 'Apr' },
        { input: '2025-05-15T15:00:00Z', expectedMonth: 'May' },
        { input: '2025-06-15T15:00:00Z', expectedMonth: 'Jun' },
        { input: '2025-07-15T15:00:00Z', expectedMonth: 'Jul' },
        { input: '2025-08-15T15:00:00Z', expectedMonth: 'Aug' },
        { input: '2025-09-15T15:00:00Z', expectedMonth: 'Sep' },
        { input: '2025-10-15T15:00:00Z', expectedMonth: 'Oct' },
        { input: '2025-11-15T15:00:00Z', expectedMonth: 'Nov' },
        { input: '2025-12-15T15:00:00Z', expectedMonth: 'Dec' },
      ];

      dates.forEach(({ input, expectedMonth }) => {
        const result = formatArticleDate(input);
        expect(result.date).toContain(expectedMonth);
      });
    });
  });

  describe('getRelativeTime', () => {
    it('should return "Just now" for very recent times', () => {
      const now = new Date('2025-11-05T18:30:00Z');
      vi.setSystemTime(now);

      const recentDate = '2025-11-05T18:29:30Z'; // 30 seconds ago
      const result = getRelativeTime(recentDate);
      expect(result).toBe('Just now');
    });

    it('should return minutes for recent times', () => {
      const now = new Date('2025-11-05T18:30:00Z');
      vi.setSystemTime(now);

      const fiveMinutesAgo = '2025-11-05T18:25:00Z';
      const result = getRelativeTime(fiveMinutesAgo);
      expect(result).toMatch(/\d+ minutes? ago/);
    });

    it('should return hours for times within the same day', () => {
      const now = new Date('2025-11-05T18:30:00Z');
      vi.setSystemTime(now);

      const twoHoursAgo = '2025-11-05T16:30:00Z';
      const result = getRelativeTime(twoHoursAgo);
      expect(result).toMatch(/\d+ hours? ago/);
    });

    it('should return days for times within the same week', () => {
      const now = new Date('2025-11-05T18:30:00Z');
      vi.setSystemTime(now);

      const twoDaysAgo = '2025-11-03T18:30:00Z';
      const result = getRelativeTime(twoDaysAgo);
      expect(result).toMatch(/\d+ days? ago/);
    });

    it('should return formatted date for older times', () => {
      const now = new Date('2025-11-05T18:30:00Z');
      vi.setSystemTime(now);

      const twoWeeksAgo = '2025-10-22T18:30:00Z';
      const result = getRelativeTime(twoWeeksAgo);
      expect(result).toMatch(/Oct \d{1,2}, 2025 • \d{1,2}:\d{2} (AM|PM)/);
    });

    it('should handle singular vs plural correctly', () => {
      const now = new Date('2025-11-05T18:30:00Z');
      vi.setSystemTime(now);

      // Test singular
      const oneMinuteAgo = '2025-11-05T18:29:00Z';
      const oneMinuteResult = getRelativeTime(oneMinuteAgo);
      expect(oneMinuteResult).toBe('1 minute ago');

      const oneHourAgo = '2025-11-05T17:30:00Z';
      const oneHourResult = getRelativeTime(oneHourAgo);
      expect(oneHourResult).toBe('1 hour ago');

      const oneDayAgo = '2025-11-04T18:30:00Z';
      const oneDayResult = getRelativeTime(oneDayAgo);
      expect(oneDayResult).toBe('1 day ago');

      // Test plural
      const twoMinutesAgo = '2025-11-05T18:28:00Z';
      const twoMinutesResult = getRelativeTime(twoMinutesAgo);
      expect(twoMinutesResult).toBe('2 minutes ago');
    });

    it('should account for Dominican timezone when calculating relative time', () => {
      // Set current time to midnight UTC (8 PM AST previous day)
      const now = new Date('2025-11-06T00:00:00Z');
      vi.setSystemTime(now);

      // Test a time that's 2 hours ago in UTC but same day in AST
      const twoHoursAgoUTC = '2025-11-05T22:00:00Z'; // 6 PM AST same day
      const result = getRelativeTime(twoHoursAgoUTC);
      expect(result).toMatch(/\d+ hours? ago/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid date strings gracefully', () => {
      const invalidDate = 'invalid-date-string';
      
      expect(() => formatDominicanDateTime(invalidDate)).not.toThrow();
      expect(() => formatArticleDate(invalidDate)).not.toThrow();
      expect(() => getRelativeTime(invalidDate)).not.toThrow();
    });

    it('should handle leap year dates correctly', () => {
      const leapYearDate = '2024-02-29T15:00:00Z';
      const result = formatDominicanDateTime(leapYearDate);
      expect(result.date).toBe('February 29, 2024');
    });

    it('should handle year boundaries correctly', () => {
      // New Year's Eve UTC becomes New Year's Day AST
      const newYearUTC = '2025-01-01T03:00:00Z'; // 11 PM AST Dec 31, 2024
      const result = formatDominicanDateTime(newYearUTC);
      expect(result.date).toBe('December 31, 2024');
    });

    it('should handle daylight saving time transitions (though Dominica doesn\'t observe DST)', () => {
      // Test dates around typical DST transition times
      const springDate = '2025-03-15T15:00:00Z';
      const fallDate = '2025-11-15T15:00:00Z';
      
      const springResult = formatDominicanDateTime(springDate);
      const fallResult = formatDominicanDateTime(fallDate);
      
      // Both should be in AST (UTC-4) since Dominica doesn't observe DST
      expect(springResult.time).toMatch(/11:00 AM/);
      expect(fallResult.time).toMatch(/11:00 AM/);
    });
  });
});