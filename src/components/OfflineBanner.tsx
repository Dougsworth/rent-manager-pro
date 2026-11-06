import { useState, useEffect } from 'react';

/** A single line across the top while the device has no connection. */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 border-b border-late bg-popover px-4 py-2 text-sm text-ink shadow-lg lg:left-[216px]">
      <span aria-hidden="true" className="hatch-late h-3 w-1.5 shrink-0 border border-late" />
      <span><b className="font-semibold text-late">You are offline.</b> Changes may not save until you are back online.</span>
    </div>
  );
}
