export function PageSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded-md w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded-md w-1/3"></div>
      </div>
      
      {/* Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 space-y-4">
          <div className="h-64 bg-gray-100 rounded-xl border border-gray-200"></div>
          <div className="h-32 bg-gray-100 rounded-xl border border-gray-200"></div>
        </div>
        <div className="col-span-1 space-y-4">
          <div className="h-48 bg-gray-100 rounded-xl border border-gray-200"></div>
          <div className="h-48 bg-gray-100 rounded-xl border border-gray-200"></div>
        </div>
      </div>
    </div>
  );
}
