export function VenueSkeletons({ count = 6 }) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      role="status"
      aria-label="Loading venues"
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-slate-200"
        >
          <div className="aspect-[4/3] animate-pulse bg-slate-100" />
          <div className="space-y-3 p-4">
            <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="h-6 w-16 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
export default function DetailSkeleton() {
  return (
    <div
      className="grid animate-pulse gap-8 md:grid-cols-[1fr_360px]"
      role="status"
      aria-label="Loading booking details"
    >
      <div className="space-y-5">
        <div className="h-8 w-2/3 rounded bg-slate-100" />
        <div className="aspect-[16/9] rounded-2xl bg-slate-100" />
        <div className="h-24 rounded-xl bg-slate-100" />
      </div>
      <div className="h-96 rounded-2xl bg-slate-100" />
    </div>
  );
}
