'use client';

import { format } from 'date-fns';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onStartChange: (date: Date) => void;
  onEndChange: (date: Date) => void;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={format(startDate, 'yyyy-MM-dd')}
        onChange={(e) => onStartChange(new Date(e.target.value + 'T00:00:00'))}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <span className="text-sm text-gray-400">to</span>
      <input
        type="date"
        value={format(endDate, 'yyyy-MM-dd')}
        onChange={(e) => onEndChange(new Date(e.target.value + 'T00:00:00'))}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}
