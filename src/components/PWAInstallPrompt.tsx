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
function isPermaDismissed(): boolean {
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
    if (isInstalled || isPermaDismissed()) return;
    if (!canInstall && !isIOS) return;
    if (getShowCount() >= MAX_SHOWS) return;

    const timer = setTimeout(() => {
      incrementShowCount();
      setVisible(true);
      setTimeout(() => setAnimating(true), 50);
    }, 2500);

    return () => clearTimeout(timer);
  }, [canInstall, isIOS, isInstalled]);

  const handleSoftDismiss = () => {
    setAnimating(false);
    setTimeout(() => setVisible(false), 300);
  };

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
        className={`fixed inset-0 bg-black/30 z-[60] transition-opacity duration-300 ${
          animating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleSoftDismiss}
      />

      {/* Popup */}
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`pointer-events-auto bg-white rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-[320px] sm:max-w-sm overflow-hidden transition-all duration-300 ${
            animating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
          }`}
        >
          {/* Close */}
          <button
            onClick={handleHardDismiss}
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>

          <div className="px-5 sm:px-6 pt-7 sm:pt-8 pb-5 sm:pb-6 text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Smartphone className="h-6 w-6 sm:h-7 sm:w-7 text-slate-700" />
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5">
              Install EasyCollect
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">
              Add to your home screen for quick access — works like a native app.
            </p>

            <div className="flex flex-col gap-2">
              <Button onClick={handleInstall} className="w-full h-10 sm:h-11 text-sm">
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
              <button
                onClick={handleSoftDismiss}
                className="text-sm text-slate-400 hover:text-slate-600 transition-colors py-1.5"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Guide */}
      {showGuide && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => { setShowGuide(false); handleSoftDismiss(); }} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 sm:p-6 pb-8 safe-bottom">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">Install on iPhone</h3>
              <button
                onClick={() => { setShowGuide(false); handleSoftDismiss(); }}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-600">1</div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Tap the Share button</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    In Safari, tap <Share className="inline h-3.5 w-3.5 text-blue-500 -mt-0.5" /> at the bottom
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-600">2</div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Tap "Add to Home Screen"</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Look for <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-xs text-slate-700"><Plus className="h-3 w-3" /> Add to Home Screen</span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-600">3</div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Tap "Add" to confirm</p>
                  <p className="text-xs text-slate-500 mt-0.5">EasyCollect will appear on your home screen</p>
                </div>
              </div>
            </div>

            <Button onClick={() => { permaDismiss(); setShowGuide(false); setVisible(false); }} className="w-full mt-5 h-10 sm:h-11 text-sm">
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
