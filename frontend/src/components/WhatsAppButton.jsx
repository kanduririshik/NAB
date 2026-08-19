import React, { useState, useEffect } from 'react';

export default function WhatsAppButton({ phoneNumber = '+918897982828', defaultMessage = 'Hello New Age Biologics, I would like to inquire about your products.' }) {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Show tooltip after 3 seconds, hide after 8 seconds
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 3000);

    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleClick = () => {
    const encodedMsg = encodeURIComponent(defaultMessage);
    const url = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodedMsg}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex items-center group select-none">
      {/* Tooltip speech bubble */}
      <div 
        className={`mr-3 py-2 px-4 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-xl transition-all duration-500 ease-out transform origin-right whitespace-nowrap relative ${
          showTooltip 
            ? 'opacity-100 translate-x-0 scale-100' 
            : 'opacity-0 translate-x-4 scale-75 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
          Need wholesale pricing? Chat now!
        </span>
        {/* Triangle arrow */}
        <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-emerald-600"></div>
      </div>

      <div className="relative flex items-center justify-center">
        {/* Pulsating background ring animations */}
        <div className="absolute w-16 h-16 bg-emerald-500/30 rounded-full animate-ping pointer-events-none" />
        <div className="absolute w-16 h-16 bg-emerald-500/20 rounded-full animate-pulse pointer-events-none" />

        {/* Main green circle button */}
        <button
          onClick={handleClick}
          className="w-16 h-16 bg-gradient-to-tr from-[#128C7E] to-[#25D366] text-white flex items-center justify-center rounded-full shadow-[0_6px_20px_rgba(37,211,102,0.45)] hover:shadow-[0_0_35px_12px_rgba(37,211,102,0.8),0_0_60px_22px_rgba(37,211,102,0.45),inset_0_0_15px_rgba(255,255,255,0.6)] hover:scale-110 active:scale-95 transition-all duration-300 relative border-2 border-white/40 hover:border-white cursor-pointer"
          aria-label="Contact us on WhatsApp"
        >
          <svg
            className="w-8 h-8 fill-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-6"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border border-white flex items-center justify-center text-[10px] font-bold shadow-md">1</span>
        </button>
      </div>
    </div>
  );
}
