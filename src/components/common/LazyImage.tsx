import { useState, useCallback } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Optional placeholder shown while loading. Defaults to shimmer. */
  fallbackClassName?: string;
}

/**
 * Image component with native lazy loading, async decoding,
 * and a blur-up reveal effect for perceived performance.
 */
export default function LazyImage({
  className = '',
  fallbackClassName,
  alt = '',
  ...props
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => setLoaded(true), []);
  const handleError = useCallback(() => setError(true), []);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-[#22263a] text-gray-400 dark:text-[#5a6278] text-xs ${className}`}
      >
        <svg className="w-6 h-6 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      {...props}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
      className={`transition-all duration-300 ${loaded ? 'blur-0 scale-100' : 'blur-sm scale-[1.02]'} ${className}`}
    />
  );
}
