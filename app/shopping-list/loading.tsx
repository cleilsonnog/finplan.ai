import { Skeleton } from "@/app/_components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b px-4 py-4 sm:px-8">
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex-1 space-y-6 overflow-auto p-4 sm:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </div>
  );
}
