'use client';

import { useState } from 'react';
import { Search, Menu, X } from 'lucide-react';
import { NotificationsBell } from './NotificationsBell';
import { MobileNav } from './MobileNav';

export function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 glass-strong border-b border-[rgba(255,255,255,0.1)]">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileNavOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>

          {/* Brand - visible on mobile */}
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FFFF] to-[#A259FF] flex items-center justify-center">
              <span className="text-[#0B0C10] font-bold text-sm">EM</span>
            </div>
          </div>

          {/* Search bar - hidden on small mobile, visible on sm+ */}
          <div className="hidden sm:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search transactions..."
                className="w-full h-10 pl-10 pr-4 glass border border-[rgba(255,255,255,0.15)] rounded-xl bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#00FFFF]/50"
                aria-label="Search transactions"
              />
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            <NotificationsBell />
            
            {/* User avatar */}
            <button
              className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00FFFF] to-[#A259FF] flex items-center justify-center hover:scale-105 transition-transform"
              aria-label="User menu"
            >
              <span className="text-[#0B0C10] font-semibold text-sm">U</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  );
}
