'use client';

const STATUS_STYLES: Record<string, { color: string; pulse: boolean; label: string }> = {
  active: { color: 'bg-green-500', pulse: true, label: 'Active' },
  idle: { color: 'bg-yellow-400', pulse: false, label: 'Idle' },
  offline: { color: 'bg-gray-300', pulse: false, label: 'Offline' },
};

export default function StatusDot({
  status,
  showLabel = false,
}: {
  status: string;
  showLabel?: boolean;
}) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.offline;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-2.5 w-2.5">
        {style.pulse && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${style.color} opacity-75`} />
        )}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${style.color}`} />
      </span>
      {showLabel && <span className="text-xs text-gray-500">{style.label}</span>}
    </span>
  );
}
