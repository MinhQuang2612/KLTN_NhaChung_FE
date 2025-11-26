export default function LoadingFindShare() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-7 w-64 bg-gray-200 animate-pulse rounded" />
          <div className="h-8 w-40 bg-gray-200 animate-pulse rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="h-40 w-full bg-gray-200 animate-pulse rounded-lg mb-3" />
              <div className="h-5 w-3/4 bg-gray-200 animate-pulse rounded mb-2" />
              <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded mb-4" />
              <div className="flex items-center gap-2">
                <div className="h-6 w-20 bg-gray-200 animate-pulse rounded" />
                <div className="h-6 w-16 bg-gray-200 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


