/**
 * Skeleton loading placeholder for the Stories carousel.
 * Renders 5 shimmer cards matching the story card dimensions.
 */
export default function StorySkeleton() {
  return (
    <div className="flex gap-5 overflow-hidden pb-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="shrink-0 w-32 animate-card-in"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="w-32 h-48 rounded-2xl bg-gray-200 dark:bg-[#22263a] animate-shimmer" />
          <div className="mt-3 mx-auto w-16 h-3 rounded bg-gray-200 dark:bg-[#22263a] animate-shimmer" />
        </div>
      ))}
    </div>
  );
}
