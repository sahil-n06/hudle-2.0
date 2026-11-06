'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminProvider, useAdmin } from '@/components/admin/AdminContext';
import AdminLogin from '@/components/admin/AdminLogin';
import { Button, Loading, cx } from '@/components/ui';
const TABS = [
  { href: '/admin', label: 'Venues' },
  { href: '/admin/bookings', label: 'Bookings' },
];
function Shell({ children }) {
  const { ready, user, logout } = useAdmin();
  const pathname = usePathname();
  if (!ready) return <Loading />;
  if (!user) return <AdminLogin />;
  const active = (href) =>
    href === '/admin'
      ? !pathname.startsWith('/admin/bookings')
      : pathname.startsWith(href);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <nav
            className="inline-flex rounded-full bg-slate-100 p-1"
            aria-label="Admin sections"
          >
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active(t.href) ? 'page' : undefined}
                className={cx(
                  'rounded-full px-3 py-1.5 text-sm font-semibold',
                  active(t.href)
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        </div>
        <Button variant="ghost" onClick={logout}>
          Sign out
        </Button>
      </div>
      {children}
    </div>
  );
}
export default function AdminLayout({ children }) {
  return (
    <AdminProvider>
      <Shell>{children}</Shell>
    </AdminProvider>
  );
}
