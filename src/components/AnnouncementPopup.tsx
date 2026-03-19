import { useState, useEffect } from 'react';
import { X, Sparkles, PartyPopper, Megaphone, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Announcement {
  id: string;
  title: string;
  message: string;
  icon: string;
  cta_text: string | null;
  cta_link: string | null;
}

const iconMap: Record<string, React.ElementType> = {
  sparkles: Sparkles,
  party: PartyPopper,
  megaphone: Megaphone,
  info: Info,
};

export function AnnouncementBanner() {
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Fetch active, non-expired announcements the user hasn't dismissed
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!data || data.length === 0) return;

      // Check which ones this user already dismissed
      const ids = data.map((a: any) => a.id);
      const { data: dismissals } = await supabase
        .from('announcement_dismissals')
        .select('announcement_id')
        .eq('user_id', user.id)
        .in('announcement_id', ids);

      const dismissedIds = new Set((dismissals ?? []).map((d: any) => d.announcement_id));
      const unseen = data.find((a: any) => !dismissedIds.has(a.id));

      if (unseen) {
        setAnnouncement(unseen as Announcement);
        setTimeout(() => setVisible(true), 800);
      }
    };

    load();
  }, [user]);

  const handleDismiss = async () => {
    setVisible(false);

    if (announcement && user) {
      await supabase.from('announcement_dismissals').insert({
        announcement_id: announcement.id,
        user_id: user.id,
      });
    }

    setTimeout(() => setAnnouncement(null), 300);
  };

  if (!announcement) return null;

  const Icon = iconMap[announcement.icon] ?? Sparkles;

  return (
    <div
      className={`transition-all duration-500 overflow-hidden ${
        visible ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Icon className="h-4 w-4 flex-shrink-0 opacity-80" />
          <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{announcement.title}</span>
            <span className="text-sm opacity-90 hidden sm:inline">— {announcement.message}</span>
            {announcement.cta_text && announcement.cta_link && (
              <a
                href={announcement.cta_link}
                className="text-sm font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                {announcement.cta_text}
              </a>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
