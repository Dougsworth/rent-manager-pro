import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Announcement {
  id: string;
  title: string;
  message: string;
  cta_text: string | null;
  cta_link: string | null;
}

/** One line above the page with a title, the message and a way to dismiss it. */
export function AnnouncementBanner() {
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!data || data.length === 0) return;

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
        setTimeout(() => setVisible(true), 600);
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
    setTimeout(() => setAnnouncement(null), 150);
  };

  if (!announcement) return null;

  const hasCta = !!(announcement.cta_text && announcement.cta_link);

  return (
    <div
      role="region"
      aria-label="Announcement"
      className={`border-b border-rule transition-opacity duration-150 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="mx-auto flex max-w-[1180px] items-baseline gap-4 px-4 py-2.5 text-sm sm:px-8 lg:px-11">
        <p className={`min-w-0 flex-1 ${expanded ? '' : 'truncate'}`}>
          <span className="mr-2 font-semibold text-ink">{announcement.title}</span>{' '}
          <span className="text-quiet">{announcement.message}</span>
          {expanded && hasCta && (
            <a href={announcement.cta_link!} onClick={handleDismiss} className="ml-2 font-semibold text-shell underline">
              {announcement.cta_text}
            </a>
          )}
        </p>
        <div className="flex shrink-0 items-baseline gap-4">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            className="min-h-8 cursor-pointer font-medium text-shell underline"
          >
            {expanded ? 'Less' : 'More'}
          </button>
          <button type="button" onClick={handleDismiss} className="min-h-8 cursor-pointer text-quiet underline hover:text-ink">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
