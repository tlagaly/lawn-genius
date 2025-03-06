export type Frequency = 'daily' | 'weekly' | 'monthly';
export type EndType = 'never' | 'after_occurrences' | 'on_date';

export interface RecurrencePatternInput {
  frequency: Frequency;
  interval: number;
  weekdays?: number[];
  monthDay?: number;
  endType: EndType;
  occurrences?: number;
  endDate?: Date;
}

export interface RecurrencePattern extends RecurrencePatternInput {
  id: string;
  scheduleId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface GenerateOccurrencesOptions {
  startDate: Date;
  endDate?: Date;
  maxOccurrences?: number;
}

export function generateOccurrences(
  pattern: RecurrencePattern | RecurrencePatternInput,
  options: GenerateOccurrencesOptions
): Date[] {
  const { startDate, endDate, maxOccurrences } = options;
  const dates: Date[] = [];
  let currentDate = new Date(startDate);

  // Determine end condition
  let shouldContinue = () => {
    if (pattern.endType === 'after_occurrences' && pattern.occurrences) {
      return dates.length < pattern.occurrences;
    }
    if (pattern.endType === 'on_date' && pattern.endDate) {
      return currentDate <= pattern.endDate;
    }
    if (endDate) {
      return currentDate <= endDate;
    }
    if (maxOccurrences) {
      return dates.length < maxOccurrences;
    }
    return dates.length < 100; // Safety limit
  };

  while (shouldContinue()) {
    switch (pattern.frequency) {
      case 'daily':
        if (isValidOccurrence(currentDate, pattern)) {
          dates.push(new Date(currentDate));
        }
        currentDate = addDays(currentDate, pattern.interval);
        break;

      case 'weekly':
        if (isValidWeeklyOccurrence(currentDate, pattern)) {
          dates.push(new Date(currentDate));
        }
        // Move to next day, will check weekdays in isValidWeeklyOccurrence
        currentDate = addDays(currentDate, 1);
        break;

      case 'monthly':
        if (isValidMonthlyOccurrence(currentDate, pattern)) {
          dates.push(new Date(currentDate));
          currentDate = addMonths(currentDate, pattern.interval);
        } else {
          currentDate = addMonths(currentDate, 1);
        }
        break;
    }
  }

  return dates;
}

function isValidOccurrence(date: Date, pattern: RecurrencePatternInput): boolean {
  return true; // Daily occurrences are always valid
}

function isValidWeeklyOccurrence(date: Date, pattern: RecurrencePatternInput): boolean {
  if (!pattern.weekdays) return false;
  const weekdays = pattern.weekdays;
  const dayOfWeek = date.getDay();
  return weekdays.includes(dayOfWeek);
}

function isValidMonthlyOccurrence(date: Date, pattern: RecurrencePatternInput): boolean {
  if (!pattern.monthDay) return false;
  return date.getDate() === pattern.monthDay;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export interface RecurrenceException {
  originalDate: Date;
  newDate?: Date | null;
  isCancelled: boolean;
}

export function applyExceptions(
  dates: Date[],
  exceptions: RecurrenceException[]
): Date[] {
  return dates.map(date => {
    const exception = exceptions.find(e => 
      e.originalDate.getTime() === date.getTime()
    );

    if (!exception) return date;
    if (exception.isCancelled) return null;
    return exception.newDate || date;
  }).filter((date): date is Date => date !== null);
}

export function getNextOccurrence(
  pattern: RecurrencePattern | RecurrencePatternInput,
  after: Date = new Date()
): Date | null {
  const dates = generateOccurrences(pattern, {
    startDate: after,
    maxOccurrences: 1
  });

  return dates[0] || null;
}

export function validateRecurrencePattern(pattern: Partial<RecurrencePatternInput>): string[] {
  const errors: string[] = [];

  if (!pattern.frequency) {
    errors.push('Frequency is required');
  }

  if (!pattern.interval || pattern.interval < 1) {
    errors.push('Interval must be at least 1');
  }

  if (pattern.frequency === 'weekly' && (!pattern.weekdays || !pattern.weekdays.length)) {
    errors.push('Weekly recurrence requires at least one weekday');
  }

  if (pattern.frequency === 'monthly' && !pattern.monthDay) {
    errors.push('Monthly recurrence requires a day of month');
  }

  if (pattern.endType === 'after_occurrences' && (!pattern.occurrences || pattern.occurrences < 1)) {
    errors.push('Number of occurrences must be at least 1');
  }

  if (pattern.endType === 'on_date' && !pattern.endDate) {
    errors.push('End date is required for on_date end type');
  }

  return errors;
}