import { useState } from 'react';
import { X, Download, Share, Plus, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function PWAInstallPrompt() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem('pwa-install-dismissed'));
  const [showGuide, setShowGuide] = useState(false);

  // Don't show if already installed or user dismissed
  if (isInstalled || dismissed) return null;

  // Don't show if can't install and not iOS
  if (!canInstall && !isIOS) return null;

  const handleInstall = async () => {
    if (isIOS) {
      setShowGuide(true);
    } else {
      const accepted = await promptInstall();
      if (!accepted) { localStorage.setItem('pwa-install-dismissed', 'true'); setDismissed(true); };
    }
  };

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-fade-in-up">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-black/10 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Smartphone className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">Install EasyCollect</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Add to your home screen for quick access — works offline too
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleInstall} className="text-xs h-8 px-3">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Install
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { localStorage.setItem('pwa-install-dismissed', 'true'); setDismissed(true); }}
                  className="text-xs h-8 px-3"
                >
                  Not now
                </Button>
              </div>
            </div>
            <button
              onClick={() => { localStorage.setItem('pwa-install-dismissed', 'true'); setDismissed(true); }}
              className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Install Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowGuide(false)} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm mx-auto p-6 pb-8 sm:mb-0">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900">Install EasyCollect</h3>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-600">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Tap the Share button
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    In Safari, tap{' '}
                    <Share className="inline h-3.5 w-3.5 text-blue-500 -mt-0.5" />{' '}
                    at the bottom of the screen
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-600">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Scroll down and tap "Add to Home Screen"
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Look for{' '}
                    <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      <Plus className="h-3 w-3" /> Add to Home Screen
                    </span>
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-600">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Tap "Add" to confirm
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    EasyCollect will appear on your home screen like a native app
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={() => setShowGuide(false)} className="w-full mt-6">
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
