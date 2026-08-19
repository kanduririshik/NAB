import React, { useState, useEffect } from 'react';

export default function Logo({ className = '', height = 52, showText = true }) {
  const [logoSrc, setLogoSrc] = useState('/logo.png');

  useEffect(() => {
    const img = new Image();
    img.src = '/logo.png';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        
        // Key out the white/off-white background pixels
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // If the pixel is white or very near white, make it transparent
          if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0; // Set alpha to 0
          }
        }
        
        ctx.putImageData(imgData, 0, 0);
        setLogoSrc(canvas.toDataURL());
      } catch (e) {
        console.warn('Canvas keying failed (CORS or path error), using fallback raw logo:', e);
      }
    };
  }, []);

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`} style={{ height }}>
      <img
        src={logoSrc}
        alt="New Age Biologics Logo"
        style={{ height: '100%' }}
        className="w-auto object-contain max-w-full"
      />
    </div>
  );
}
