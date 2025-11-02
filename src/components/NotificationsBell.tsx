'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';

export function NotificationsBell() {
  const [unreadCount] = useState(0); // TODO: Fetch from API or context

  return (
    <Link
      href="/settings/notifications"
      className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="w-5 h-5 text-foreground" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6B9D] rounded-full ring-2 ring-[#0B0C10]" />
      )}
    </Link>
  );
}
