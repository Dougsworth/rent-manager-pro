import { useState, useEffect } from 'react';
import { X, Megaphone, Sparkles, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { createNotification } from '@/services/notifications';

// ──────────────────────────────────────────────
// EDIT THIS to send a new announcement to all users.
// Change the `id` each time you create a new one.
// Once a user dismisses it, they won't see it again.
// ──────────────────────────────────────────────
const CURRENT_ANNOUNCEMENT = {
  id: 'welcome-mar-2026',
  icon: 'sparkles' as 'sparkles' | 'party' | 'megaphone',
  title: 'Welcome to EasyCollect!',
  message:
    'We\'re excited to have you on board. EasyCollect makes rent collection simple — send invoices, track payments, and automate reminders all from one dashboard.',
  cta: 'Get Started',
  ctaLink: '/tenants', // where the CTA button navigates (optional)
  // Set to null to disable the announcement
  enabled: true,
};
// ──────────────────────────────────────────────

const icons = {
  sparkles: Sparkles,
  party: PartyPopper,
  megaphone: Megaphone,
};

export function AnnouncementPopup() {
  const { user, profile } = useAuth();
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!user || !CURRENT_ANNOUNCEMENT.enabled) return;

    const key = `announcement-dismissed-${CURRENT_ANNOUNCEMENT.id}`;
    const alreadySeen = localStorage.getItem(key);

    if (!alreadySeen) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => {
        setVisible(true);
        setAnimating(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleDismiss = () => {
    setAnimating(false);
    setTimeout(() => setVisible(false), 300);

    const key = `announcement-dismissed-${CURRENT_ANNOUNCEMENT.id}`;
    localStorage.setItem(key, new Date().toISOString());

    // Save to notifications so they can find it later
    if (user) {
      createNotification(
        user.id,
        'system',
        CURRENT_ANNOUNCEMENT.title,
        CURRENT_ANNOUNCEMENT.message,
      );
    }
  };

  const handleCTA = () => {
    handleDismiss();
    if (CURRENT_ANNOUNCEMENT.ctaLink) {
      window.location.href = CURRENT_ANNOUNCEMENT.ctaLink;
    }
  };

  if (!visible) return null;

  const Icon = icons[CURRENT_ANNOUNCEMENT.icon] ?? Sparkles;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          animating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleDismiss}
      />

      {/* Popup */}
      <div
        className={`relative bg-white rounded-3xl shadow-2xl shadow-blue-500/10 max-w-md w-full overflow-hidden transition-all duration-300 ${
          animating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        {/* Top gradient accent */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 transition-colors z-10"
        >
          <X className="h-4 w-4 text-slate-400" />
        </button>

        <div className="px-6 pt-8 pb-6 text-center">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
            <Icon className="h-7 w-7 text-blue-600" />
          </div>

          {/* Greeting */}
          {profile?.first_name && (
            <p className="text-sm text-slate-400 mb-1">
              Hey {profile.first_name} 👋
            </p>
          )}

          {/* Title */}
          <h2 className="text-xl font-bold text-slate-900 mb-3">
            {CURRENT_ANNOUNCEMENT.title}
          </h2>

          {/* Message */}
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            {CURRENT_ANNOUNCEMENT.message}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {CURRENT_ANNOUNCEMENT.cta && (
              <Button onClick={handleCTA} className="w-full h-11">
                {CURRENT_ANNOUNCEMENT.cta}
              </Button>
            )}
            <button
              onClick={handleDismiss}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors py-2"
            >
              Maybe later
            </button>
          </div>
        </div>

        {/* Subtle bottom text */}
        <div className="border-t border-slate-100 px-6 py-3 bg-slate-50/50">
          <p className="text-[11px] text-slate-400 text-center">
            This message will be saved to your notifications
          </p>
        </div>
      </div>
    </div>
  );
}
