import React, { useState, useRef, useEffect } from 'react';

/**
 * ImageWithBlurUp - Displays placeholder blur until image loads
 * Prevents layout shift during lazy loading
 * 
 * Props:
 * - src: Image URL
 * - alt: Alt text
 * - blurDataUrl: Optional low-res base64 blur placeholder
 * - className: CSS classes
 * - containerClassName: Container wrapper classes
 */
export default function ImageWithBlurUp({
  src,
  alt,
  blurDataUrl,
  className = 'w-full h-full object-cover',
  containerClassName = 'w-full',
  onLoad,
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    // Preload image to check it exists
    const img = new Image();
    img.src = src;
    img.onload = () => {
      if (imgRef.current) {
        setIsLoaded(true);
        onLoad?.();
      }
    };
    img.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
    };
  }, [src, onLoad]);

  return (
    <div className={`relative overflow-hidden bg-secondary ${containerClassName}`}>
      {/* Blur placeholder - visible until image loads */}
      {blurDataUrl && !isLoaded && (
        <img
          src={blurDataUrl}
          alt={alt}
          className={`absolute inset-0 blur-md ${className}`}
          loading="lazy"
          decoding="async"
          aria-hidden="true"
        />
      )}

      {/* Actual image - fades in when loaded */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        decoding="async"
        onLoad={() => {
          setIsLoaded(true);
          onLoad?.();
        }}
      />

      {/* Fallback skeleton if no blur available */}
      {!blurDataUrl && !isLoaded && (
        <div className={`absolute inset-0 bg-gradient-to-br from-secondary via-secondary to-secondary/50 animate-pulse ${className}`} />
      )}
    </div>
  );
}