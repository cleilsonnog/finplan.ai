import { Skeleton } from "@/app/_components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Navbar placeholder */}
      <div className="border-b px-4 py-4 sm:px-8">
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex-1 space-y-6 overflow-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr,1fr]">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
        {/* Bottom */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
