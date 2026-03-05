'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Radio,
  Clock,
  BarChart3,
  Globe,
  Settings,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard/live', label: 'Live View', icon: Radio },
  { href: '/dashboard/timeline', label: 'Timeline', icon: Clock },
  { href: '/dashboard/time-allocation', label: 'Time Allocation', icon: BarChart3 },
  { href: '/dashboard/domain-report', label: 'Domain Report', icon: Globe },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-56 flex-col bg-[#1c2b3d]">
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
          <span className="text-sm font-bold text-white">B</span>
        </div>
        <span className="text-sm font-semibold text-white">Breasy WorkOS</span>
      </div>

      <nav className="mt-2 flex flex-1 flex-col gap-0.5 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-[#2d4766] text-white font-medium'
                  : 'text-gray-300 hover:bg-[#253a52] hover:text-white'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <p className="text-xs text-gray-400">WorkOS v1.0</p>
      </div>
    </aside>
  );
}
