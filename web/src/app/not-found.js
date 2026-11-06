import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-play-600 text-6xl font-extrabold">404</p>
      <h1 className="mt-3 text-3xl font-extrabold">
        This court is out of bounds
      </h1>
      <p className="mt-3 text-sm text-slate-500">
        The page may have moved, or the venue is no longer available.
      </p>
      <Link
        href="/"
        className="bg-brand-600 mt-6 inline-flex rounded-lg px-5 py-2.5 text-sm font-bold text-white hover:bg-black"
      >
        Explore venues
      </Link>
    </div>
  );
}
