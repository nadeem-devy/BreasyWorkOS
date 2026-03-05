'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';

interface ExportButtonProps {
  view: string;
  params?: Record<string, string>;
}

export default function ExportButton({ view, params = {} }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport(format: 'csv' | 'xlsx') {
    setLoading(true);
    const searchParams = new URLSearchParams({ view, format, ...params });
    try {
      const res = await fetch(`/api/export?${searchParams}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${view}-export.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleExport('csv')}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        <Download size={14} />
        CSV
      </button>
      <button
        onClick={() => handleExport('xlsx')}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        <Download size={14} />
        Excel
      </button>
    </div>
  );
}
