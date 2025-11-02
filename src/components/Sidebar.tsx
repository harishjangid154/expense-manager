'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Upload,
  TrendingUp,
  Users,
  Settings,
  Download,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/import', label: 'Import', icon: Upload },
  { href: '/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/teams', label: 'Teams', icon: Users },
  { href: '/settings/notifications', label: 'Settings', icon: Settings },
  { href: '/export', label: 'Export', icon: Download },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-[260px] glass-strong border-r border-[rgba(255,255,255,0.1)] h-screen sticky top-0">
      {/* Brand */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-[rgba(255,255,255,0.1)]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00FFFF] to-[#A259FF] flex items-center justify-center">
          <span className="text-[#0B0C10] font-bold text-lg">EM</span>
        </div>
        <div>
          <h1 className="text-foreground font-bold text-lg">Expense</h1>
          <p className="text-muted-foreground text-xs">Manager</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-[#00FFFF]/10 text-[#00FFFF] border border-[#00FFFF]/30'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.1)]">
        <p className="text-xs text-muted-foreground">© 2024 Expense Manager</p>
      </div>
    </aside>
  );
}
