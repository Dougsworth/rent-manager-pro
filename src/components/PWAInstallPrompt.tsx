import { useState, useEffect } from 'react';
import { X, Download, Share, Plus, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const MAX_SHOWS = 3;

function getShowCount(): number {
  return parseInt(localStorage.getItem('pwa-prompt-count') ?? '0', 10);
}

function incrementShowCount() {
  localStorage.setItem('pwa-prompt-count', String(getShowCount() + 1));
}

function isPermaDissmissed(): boolean {
  return localStorage.getItem('pwa-install-dismissed') === 'true';
}

function permaDismiss() {
  localStorage.setItem('pwa-install-dismissed', 'true');
}

export function PWAInstallPrompt() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // Don't show if installed, permanently dismissed, or shown enough times
    if (isInstalled || isPermaDissmissed()) return;
    if (!canInstall && !isIOS) return;
    if (getShowCount() >= MAX_SHOWS) return;

    // Delay so it doesn't flash on page load
    const timer = setTimeout(() => {
      incrementShowCount();
      setVisible(true);
      setTimeout(() => setAnimating(true), 50);
    }, 2000);

    return () => clearTimeout(timer);
  }, [canInstall, isIOS, isInstalled]);

  // Soft dismiss — just hides for this session, will show again next time (up to MAX_SHOWS)
  const handleSoftDismiss = () => {
    setAnimating(false);
    setTimeout(() => setVisible(false), 300);
  };

  // Hard dismiss — X button, never show again
  const handleHardDismiss = () => {
    permaDismiss();
    setAnimating(false);
    setTimeout(() => setVisible(false), 300);
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowGuide(true);
    } else {
      const accepted = await promptInstall();
      if (accepted) {
        setVisible(false);
      } else {
        handleSoftDismiss();
      }
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          animating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleSoftDismiss}
      />

      {/* Popup */}
      <div
        className={`fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none`}
      >
        <div
          className={`pointer-events-auto bg-white rounded-3xl shadow-2xl shadow-blue-500/10 max-w-sm w-full overflow-hidden transition-all duration-300 ${
            animating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
          }`}
        >
          {/* Top accent */}
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />

          {/* Close X — permanent dismiss */}
          <button
            onClick={handleHardDismiss}
            className="absolute top-5 right-4 p-1.5 rounded-full hover:bg-slate-100 transition-colors z-10"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>

          <div className="px-6 pt-8 pb-6 text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
              <Smartphone className="h-8 w-8 text-blue-600" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Install EasyCollect
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Add EasyCollect to your home screen for instant access. Works like a native app — fast, reliable, and available offline.
            </p>

            <div className="flex flex-col gap-2">
              <Button onClick={handleInstall} className="w-full h-11">
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
              <button
                onClick={handleSoftDismiss}
                className="text-sm text-slate-400 hover:text-slate-600 transition-colors py-2"
              >
                Maybe later
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 px-6 py-3 bg-slate-50/50">
            <p className="text-[11px] text-slate-400 text-center">
              No download required — installs directly from your browser
            </p>
          </div>
        </div>
      </div>

      {/* iOS Install Guide */}
      {showGuide && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => { setShowGuide(false); handleSoftDismiss(); }} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm mx-auto p-6 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900">Install on iPhone</h3>
              <button
                onClick={() => { setShowGuide(false); handleSoftDismiss(); }}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-600">1</div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Tap the Share button</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    In Safari, tap <Share className="inline h-3.5 w-3.5 text-blue-500 -mt-0.5" /> at the bottom
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-600">2</div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Tap "Add to Home Screen"</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Scroll down and look for <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-slate-700"><Plus className="h-3 w-3" /> Add to Home Screen</span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-600">3</div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Tap "Add" to confirm</p>
                  <p className="text-xs text-slate-500 mt-0.5">EasyCollect will appear on your home screen</p>
                </div>
              </div>
            </div>

            <Button onClick={() => { permaDismiss(); setShowGuide(false); setVisible(false); }} className="w-full mt-6">
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
