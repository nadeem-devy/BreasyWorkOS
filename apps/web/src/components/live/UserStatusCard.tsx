'use client';

import StatusDot from '@/components/shared/StatusDot';
import AppBadge from '@/components/shared/AppBadge';
import { formatDistanceToNow } from 'date-fns';
import type { ActiveUser } from '@/lib/hooks/useActiveUsers';
import { AlertTriangle } from 'lucide-react';

function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

interface Props {
  user: ActiveUser;
  flagCount?: number;
}

export default function UserStatusCard({ user, flagCount = 0 }: Props) {
  const sessionDuration = user.sessionStarted
    ? Math.floor((Date.now() - new Date(user.sessionStarted).getTime()) / 1000)
    : 0;

  const lastActivity = user.lastActivityAt
    ? formatDistanceToNow(new Date(user.lastActivityAt), { addSuffix: true })
    : 'No activity';

  return (
    <div className={`rounded-lg border bg-white p-4 transition-shadow hover:shadow-sm ${
      flagCount > 0 ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
                {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5">
              <StatusDot status={user.status} />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-900 truncate">{user.fullName}</span>
              {flagCount > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700" title="Suspicious activity detected">
                  <AlertTriangle size={10} />
                  {flagCount}
                </span>
              )}
            </div>
          </div>
        </div>
        {user.currentApp && <AppBadge app={user.currentApp} />}
      </div>

      {user.currentUrl && (
        <p className="mt-2 truncate text-xs text-gray-500" title={user.currentUrl}>
          {user.currentUrl}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <span>Last: {lastActivity}</span>
        {sessionDuration > 0 && <span>Session: {formatSeconds(sessionDuration)}</span>}
      </div>

      {(user.timeBubble > 0 || user.timeGmail > 0 || user.timeDialpad > 0 || user.timeMelio > 0) && (
        <div className="mt-2 flex gap-2 text-xs text-gray-400">
          {user.timeBubble > 0 && <span>B: {formatSeconds(user.timeBubble)}</span>}
          {user.timeGmail > 0 && <span>G: {formatSeconds(user.timeGmail)}</span>}
          {user.timeDialpad > 0 && <span>D: {formatSeconds(user.timeDialpad)}</span>}
          {user.timeMelio > 0 && <span>M: {formatSeconds(user.timeMelio)}</span>}
        </div>
      )}
    </div>
  );
}
