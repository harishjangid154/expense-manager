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
  X,
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

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 left-0 w-[280px] glass-strong border-r border-[rgba(255,255,255,0.1)] z-50 md:hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[rgba(255,255,255,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00FFFF] to-[#A259FF] flex items-center justify-center">
              <span className="text-[#0B0C10] font-bold text-lg">EM</span>
            </div>
            <div>
              <h1 className="text-foreground font-bold text-lg">Expense</h1>
              <p className="text-muted-foreground text-xs">Manager</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
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
                onClick={onClose}
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
        <div className="px-4 py-4 border-t border-[rgba(255,255,255,0.1)]">
          <p className="text-xs text-muted-foreground">© 2024 Expense Manager</p>
        </div>
      </div>
    </>
  );
}
