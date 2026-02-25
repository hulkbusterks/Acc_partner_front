import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  BookOpen,
  LayoutDashboard,
  Trophy,
  Clock,
  User,
  LogOut,
  GraduationCap,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/books', label: 'My Books', icon: BookOpen },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const displayName = useAuthStore((s) => s.displayName);
  const email = useAuthStore((s) => s.email);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-bold text-brand-600"
          aria-label="StudyAcc home"
        >
          <GraduationCap className="h-7 w-7" aria-hidden="true" />
          <span className="hidden sm:inline">StudyAcc</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 md:flex" role="list">
          {navItems.map((item) => {
            const isActive =
              item.to === '/'
                ? pathname === '/'
                : pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* User section */}
        <div className="hidden items-center gap-3 md:flex">
          <span className="text-sm text-gray-500" aria-label="Logged in user">
            {displayName || email}
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </nav>

      {/* Mobile nav panel */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          className="border-t border-gray-200 bg-white px-4 pb-4 md:hidden"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <ul className="mt-2 space-y-1" role="list">
            {navItems.map((item) => {
              const isActive =
                item.to === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:bg-gray-100',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setMobileOpen(false)}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <button
              onClick={() => {
                logout();
                setMobileOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
              aria-label="Log out"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
              Log out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
