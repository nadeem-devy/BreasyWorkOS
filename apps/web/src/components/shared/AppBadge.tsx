'use client';

const APP_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  bubble: { label: 'Bubble', bg: 'bg-blue-50', text: 'text-blue-700' },
  gmail: { label: 'Gmail', bg: 'bg-red-50', text: 'text-red-700' },
  dialpad: { label: 'Dialpad', bg: 'bg-purple-50', text: 'text-purple-700' },
  melio: { label: 'Melio', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  other: { label: 'Other', bg: 'bg-gray-50', text: 'text-gray-600' },
};

export default function AppBadge({ app }: { app: string }) {
  const style = APP_STYLES[app] ?? APP_STYLES.other;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}
