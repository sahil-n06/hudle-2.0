'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Icon } from './icons';
import { cx } from './ui';

const LINKS = [
  { href: '/', label: 'Play' },
  { href: '/bookings', label: 'My bookings' },
  { href: '/admin', label: 'Admin' },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href) =>
    href === '/'
      ? pathname === '/' || pathname.startsWith('/venues')
      : pathname.startsWith(href);
  // "Play" gets the green tint, like a sports tab. Other tabs use a neutral tint.
  const pill = (href) =>
    href === '/' ? 'bg-play-50 text-play-600' : 'bg-slate-100 text-slate-900';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight text-slate-900 lowercase"
            onClick={() => setOpen(false)}
          >
            playspot
          </Link>
          <span className="hidden h-8 w-px bg-slate-200 sm:block" />
          <div className="hidden items-center gap-1.5 sm:flex">
            <Icon name="pin" className="text-accent-500 h-5 w-5" />
            <div className="leading-tight">
              <p className="text-sm font-semibold">India</p>
              <p className="text-xs text-slate-500">4 cities</p>
            </div>
          </div>
        </div>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cx(
                'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                isActive(l.href)
                  ? pill(l.href)
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="rounded-full p-2 text-slate-700 hover:bg-slate-100 sm:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            {open ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav
          className="border-t border-slate-200 px-4 py-2 sm:hidden"
          aria-label="Mobile"
        >
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={cx(
                'block rounded-lg px-3 py-3 text-sm font-semibold',
                isActive(l.href) ? pill(l.href) : 'text-slate-700',
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
