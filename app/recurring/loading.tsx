import { Skeleton } from "@/app/_components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b px-4 py-4 sm:px-8">
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex-1 space-y-6 overflow-auto p-4 md:p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
