export const AnnouncementSkeleton = () => (
  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-sm animate-pulse">
    <div className="flex items-start gap-4">
      <div className="h-16 w-16 rounded-xl bg-blue-100" />
      <div className="flex-1 space-y-3">
        <div className="h-4 w-2/3 rounded-full bg-blue-100" />
        <div className="h-3 w-full rounded-full bg-blue-100" />
        <div className="h-3 w-1/2 rounded-full bg-blue-100" />
      </div>
    </div>
    <div className="mt-6 h-3 w-24 rounded-full bg-blue-100" />
  </div>
);

export const TimetableSkeleton = () => (
  <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm animate-pulse">
    <div className="flex gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-8 w-14 rounded-full bg-blue-50" />
      ))}
    </div>
    <div className="mt-6 space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-20 rounded-xl bg-blue-50" />
      ))}
    </div>
  </div>
);
