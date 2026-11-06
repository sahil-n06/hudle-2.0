'use client';
import { Button } from '@/components/ui';
export default function Error({ error, reset }) {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-accent-600 text-sm font-bold tracking-widest uppercase">
        Something went wrong
      </p>
      <h1 className="mt-3 text-3xl font-extrabold">
        We couldn&apos;t load this page
      </h1>
      <p className="mt-3 text-sm text-slate-500">
        Please try again. If the problem continues, come back in a moment.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
      {process.env.NODE_ENV === 'development' && (
        <p className="mt-4 text-xs text-red-600">{error.message}</p>
      )}
    </div>
  );
}
