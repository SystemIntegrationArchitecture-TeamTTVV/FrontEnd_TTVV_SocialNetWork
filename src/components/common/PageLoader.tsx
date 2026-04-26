/**
 * Full-page loading indicator used as Suspense fallback
 * for lazy-loaded route components.
 */
export default function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-[#2b2f45]" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
        </div>
        <div className="w-32 h-1.5 rounded-full bg-gray-100 dark:bg-[#22263a] overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-blue-500/60 animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
