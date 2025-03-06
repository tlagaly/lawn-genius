'use client';

import { useState, useEffect } from 'react';
import { type Frequency, type EndType, type RecurrencePatternInput, validateRecurrencePattern } from '@/lib/utils/recurrence';

interface RecurrencePatternFormProps {
  value?: RecurrencePatternInput;
  onChange: (pattern: RecurrencePatternInput) => void;
  onValidationError?: (errors: string[]) => void;
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FREQUENCIES: Frequency[] = ['daily', 'weekly', 'monthly'];
const END_TYPES: EndType[] = ['never', 'after_occurrences', 'on_date'];

export function RecurrencePatternForm({
  value,
  onChange,
  onValidationError,
}: RecurrencePatternFormProps) {
  const [pattern, setPattern] = useState<RecurrencePatternInput>(
    value || {
      frequency: 'weekly',
      interval: 1,
      weekdays: [1], // Monday by default
      monthDay: undefined,
      endType: 'never',
      occurrences: undefined,
      endDate: undefined,
    }
  );

  useEffect(() => {
    const errors = validateRecurrencePattern(pattern);
    if (onValidationError) {
      onValidationError(errors);
    }
    if (errors.length === 0) {
      onChange(pattern);
    }
  }, [pattern, onChange, onValidationError]);

  const handleFrequencyChange = (frequency: Frequency) => {
    setPattern((prev): RecurrencePatternInput => ({
      ...prev,
      frequency,
      // Reset frequency-specific fields
      weekdays: frequency === 'weekly' ? [1] : undefined,
      monthDay: frequency === 'monthly' ? 1 : undefined,
    }));
  };

  const handleWeekdayToggle = (day: number) => {
    setPattern((prev) => {
      const weekdays = prev.weekdays || [];
      const newWeekdays = weekdays.includes(day)
        ? weekdays.filter((d) => d !== day)
        : [...weekdays, day];
      return {
        ...prev,
        weekdays: newWeekdays.length > 0 ? newWeekdays.sort() : [day], // Ensure at least one day is selected
      };
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Frequency
        </label>
        <select
          value={pattern.frequency}
          onChange={(e) => handleFrequencyChange(e.target.value as Frequency)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          {FREQUENCIES.map((freq) => (
            <option key={freq} value={freq}>
              {freq.charAt(0).toUpperCase() + freq.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Interval
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            value={pattern.interval}
            onChange={(e) =>
              setPattern((prev) => ({
                ...prev,
                interval: Math.max(1, parseInt(e.target.value) || 1),
              }))
            }
            className="block w-20 rounded-md border border-gray-300 px-3 py-2"
          />
          <span className="text-gray-600">
            {pattern.frequency === 'daily'
              ? 'day(s)'
              : pattern.frequency === 'weekly'
              ? 'week(s)'
              : 'month(s)'}
          </span>
        </div>
      </div>

      {pattern.frequency === 'weekly' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Repeat On
          </label>
          <div className="flex gap-2 flex-wrap">
            {WEEKDAY_NAMES.map((name, index) => (
              <button
                key={name}
                type="button"
                onClick={() => handleWeekdayToggle(index)}
                className={`px-3 py-1 rounded-full text-sm ${
                  pattern.weekdays?.includes(index)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {pattern.frequency === 'monthly' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Day of Month
          </label>
          <input
            type="number"
            min="1"
            max="31"
            value={pattern.monthDay || 1}
            onChange={(e) =>
              setPattern((prev) => ({
                ...prev,
                monthDay: Math.min(31, Math.max(1, parseInt(e.target.value) || 1)),
              }))
            }
            className="block w-20 rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ends
        </label>
        <select
          value={pattern.endType}
          onChange={(e) => {
            const newEndType = e.target.value as EndType;
            setPattern((prev): RecurrencePatternInput => ({
              ...prev,
              endType: newEndType,
              // Reset end-specific fields
              occurrences: newEndType === 'after_occurrences' ? 1 : undefined,
              endDate: newEndType === 'on_date' ? new Date() : undefined,
            }));
          }}
          className="block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          {END_TYPES.map((type) => (
            <option key={type} value={type}>
              {type === 'never'
                ? 'Never'
                : type === 'after_occurrences'
                ? 'After number of occurrences'
                : 'On date'}
            </option>
          ))}
        </select>

        {pattern.endType === 'after_occurrences' && (
          <div className="mt-2">
            <input
              type="number"
              min="1"
              value={pattern.occurrences ?? 1}
              onChange={(e) =>
                setPattern((prev): RecurrencePatternInput => ({
                  ...prev,
                  occurrences: Math.max(1, parseInt(e.target.value) || 1),
                }))
              }
              className="block w-20 rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        )}

        {pattern.endType === 'on_date' && (
          <div className="mt-2">
            <input
              type="date"
              value={
                pattern.endDate
                  ? new Date(pattern.endDate).toISOString().split('T')[0]
                  : new Date().toISOString().split('T')[0]
              }
              onChange={(e) =>
                setPattern((prev) => ({
                  ...prev,
                  endDate: new Date(e.target.value),
                }))
              }
              className="block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        )}
      </div>
    </div>
  );
}