import { Skeleton } from "@/app/_components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b px-4 py-4 sm:px-8">
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex-1 space-y-6 overflow-auto p-4 md:p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}
