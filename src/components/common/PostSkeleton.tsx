/**
 * Skeleton loading placeholder for the post feed.
 * Renders 3 shimmer cards matching the post card layout.
 */
export default function PostSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#1a1d28] rounded-xl p-4 sm:p-5 border border-[#e4e6eb] dark:border-[#2b2f45] animate-card-in"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          {/* Header: avatar + name + timestamp */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#22263a] animate-shimmer" />
            <div className="flex-1 space-y-2">
              <div className="w-32 h-3.5 rounded bg-gray-200 dark:bg-[#22263a] animate-shimmer" />
              <div className="w-20 h-2.5 rounded bg-gray-100 dark:bg-[#1e2133] animate-shimmer" />
            </div>
          </div>

          {/* Content: text lines */}
          <div className="space-y-2 mb-4">
            <div className="w-full h-3 rounded bg-gray-200 dark:bg-[#22263a] animate-shimmer" />
            <div className="w-4/5 h-3 rounded bg-gray-200 dark:bg-[#22263a] animate-shimmer" />
            <div className="w-2/3 h-3 rounded bg-gray-100 dark:bg-[#1e2133] animate-shimmer" />
          </div>

          {/* Image placeholder */}
          {i < 2 && (
            <div className="w-full h-56 rounded-xl bg-gray-200 dark:bg-[#22263a] animate-shimmer mb-4" />
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#22263a]">
            <div className="w-16 h-3 rounded bg-gray-100 dark:bg-[#1e2133] animate-shimmer" />
            <div className="w-16 h-3 rounded bg-gray-100 dark:bg-[#1e2133] animate-shimmer" />
            <div className="w-16 h-3 rounded bg-gray-100 dark:bg-[#1e2133] animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
