import { Plus_Jakarta_Sans } from 'next/font/google';
import Header from '@/components/Header';
import './globals.css';
import { ToastProvider } from '@/components/Toast';

const body = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'PlaySpot · Book turfs and courts near you',
  description:
    'Book football turfs, badminton courts, tennis courts and more by the hour.',
  applicationName: 'PlaySpot',
  keywords: [
    'sports booking',
    'badminton',
    'football',
    'tennis',
    'sports venues',
  ],
  openGraph: {
    title: 'PlaySpot · Play more, plan less',
    description: 'Find and book sports venues near you.',
    type: 'website',
    siteName: 'PlaySpot',
  },
  twitter: {
    card: 'summary',
    title: 'PlaySpot',
    description: 'Find and book sports venues near you.',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN" className={body.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <a
          href="#main-content"
          className="bg-brand-600 sr-only z-[80] p-3 text-white focus:not-sr-only focus:fixed"
        >
          Skip to content
        </a>
        <ToastProvider>
          <Header />
          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8"
          >
            {children}
          </main>
        </ToastProvider>
        <footer className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:justify-between sm:px-6">
            <span>© {new Date().getFullYear()} PlaySpot</span>
            <span>Bengaluru · Mumbai · New Delhi · Hyderabad</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
