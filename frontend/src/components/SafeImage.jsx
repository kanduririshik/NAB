import React, { useState, useEffect } from 'react';

export default function SafeImage({ src, alt, className = '', fallback = 'https://images.unsplash.com/photo-1584036561566-baf241830990?auto=format&fit=crop&q=80&w=400' }) {
  const [imgSrc, setImgSrc] = useState(src || fallback);

  useEffect(() => {
    setImgSrc(src || fallback);
  }, [src, fallback]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (imgSrc !== fallback) {
          setImgSrc(fallback);
        }
      }}
    />
  );
}
