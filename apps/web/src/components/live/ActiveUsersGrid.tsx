'use client';

import UserStatusCard from './UserStatusCard';
import type { ActiveUser } from '@/lib/hooks/useActiveUsers';

interface Props {
  users: ActiveUser[];
}

export default function ActiveUsersGrid({ users }: Props) {
  // Sort: active first, then idle, then offline
  const sorted = [...users].sort((a, b) => {
    const order = { active: 0, idle: 1, offline: 2 };
    const aOrder = order[a.status as keyof typeof order] ?? 2;
    const bOrder = order[b.status as keyof typeof order] ?? 2;
    return aOrder - bOrder;
  });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sorted.map((user) => (
        <UserStatusCard
          key={user.userId}
          user={user}
        />
      ))}
    </div>
  );
}
