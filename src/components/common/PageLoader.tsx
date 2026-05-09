/**
 * Full-page loading indicator used as Suspense fallback
 * for lazy-loaded route components.
 */
export default function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[62vh]">
      <div className="flex items-center gap-2">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="block w-2.5 h-2.5 rounded-full bg-[#1a6cf5] dark:bg-[#4d8ef8] animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
