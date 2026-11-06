import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const MAX_SHOWS = 3;

function getShowCount(): number {
  try { return parseInt(localStorage.getItem('pwa-prompt-count') ?? '0', 10); } catch { return MAX_SHOWS; }
}
function incrementShowCount() {
  try { localStorage.setItem('pwa-prompt-count', String(getShowCount() + 1)); } catch { /* storage blocked */ }
}
function isPermaDismissed(): boolean {
  try { return localStorage.getItem('pwa-install-dismissed') === 'true'; } catch { return true; }
}
function permaDismiss() {
  try { localStorage.setItem('pwa-install-dismissed', 'true'); } catch { /* storage blocked */ }
}

/** A one line offer under the header to add EasyCollect to the home screen. */
export function PWAInstallPrompt() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [visible, setVisible] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (isInstalled || isPermaDismissed()) return;
    if (!canInstall && !isIOS) return;
    if (getShowCount() >= MAX_SHOWS) return;

    const timer = setTimeout(() => {
      incrementShowCount();
      setVisible(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [canInstall, isIOS, isInstalled]);

  const handleSoftDismiss = () => setVisible(false);

  const handleHardDismiss = () => {
    permaDismiss();
    setVisible(false);
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
      {!showGuide && (
        <div
          role="region"
          aria-label="Install the app"
          className="fixed inset-x-0 top-14 z-40 border-b border-rule bg-popover shadow-lg lg:left-[216px] lg:top-0"
        >
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-8 lg:px-11">
            <p className="min-w-0 flex-1 text-sm">
              <b className="font-semibold">Add EasyCollect to your home screen</b>
              <span className="text-quiet"> so it opens in one tap.</span>
            </p>
            <div className="flex items-center gap-4">
              <Button size="sm" onClick={handleInstall}>Install</Button>
              <button type="button" onClick={handleSoftDismiss} className="min-h-9 cursor-pointer text-sm text-quiet underline hover:text-ink">Not now</button>
              <button type="button" onClick={handleHardDismiss} className="min-h-9 cursor-pointer text-sm text-quiet underline hover:text-ink">Do not ask again</button>
            </div>
          </div>
        </div>
      )}

      {/* iOS steps */}
      <Dialog open={showGuide} onOpenChange={(o) => { if (!o) { setShowGuide(false); handleSoftDismiss(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add EasyCollect on iPhone</DialogTitle>
            <DialogDescription>This only works in Safari. Chrome and other browsers on iPhone cannot do it.</DialogDescription>
          </DialogHeader>
          <ol className="text-[15px]">
            <li className="grid grid-cols-[24px_1fr] border-t border-rule py-3">
              <span className="num font-semibold">1</span>
              <span>Open <b className="font-semibold">easycollectja.com</b> in Safari.</span>
            </li>
            <li className="grid grid-cols-[24px_1fr] border-t border-rule py-3">
              <span className="num font-semibold">2</span>
              <span>Tap the Share button at the bottom of the screen, or the menu next to the address bar.</span>
            </li>
            <li className="grid grid-cols-[24px_1fr] border-t border-rule py-3">
              <span className="num font-semibold">3</span>
              <span>Tap <b className="font-semibold">Add to Home Screen</b>. Scroll down if you do not see it.</span>
            </li>
            <li className="grid grid-cols-[24px_1fr] border-y border-rule py-3">
              <span className="num font-semibold">4</span>
              <span>Leave <b className="font-semibold">Open as Web App</b> on and tap <b className="font-semibold">Add</b>. EasyCollect then opens from your home screen like any other app.</span>
            </li>
          </ol>
          <Button size="lg" className="mt-5 w-full" onClick={() => { permaDismiss(); setShowGuide(false); setVisible(false); }}>
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
