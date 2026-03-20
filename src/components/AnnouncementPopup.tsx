import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Announcement {
  id: string;
  title: string;
  message: string;
  cta_text: string | null;
  cta_link: string | null;
}

export function AnnouncementBanner() {
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data } = await supabase
        .from('announcements' as any)
        .select('*')
        .eq('active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!data || data.length === 0) return;

      const ids = data.map((a: any) => a.id);
      const { data: dismissals } = await supabase
        .from('announcement_dismissals' as any)
        .select('announcement_id')
        .eq('user_id', user.id)
        .in('announcement_id', ids);

      const dismissedIds = new Set((dismissals ?? []).map((d: any) => d.announcement_id));
      const unseen = data.find((a: any) => !dismissedIds.has(a.id));

      if (unseen) {
        setAnnouncement(unseen as unknown as Announcement);
        setTimeout(() => setVisible(true), 600);
      }
    };

    load();
  }, [user]);

  const handleDismiss = async () => {
    setVisible(false);
    if (announcement && user) {
      await supabase.from('announcement_dismissals' as any).insert({
        announcement_id: announcement.id,
        user_id: user.id,
      });
    }
    setTimeout(() => setAnnouncement(null), 300);
  };

  if (!announcement) return null;

  return (
    <div
      className={`transition-all duration-300 overflow-hidden ${
        visible ? 'opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="bg-slate-900 text-white">
        {/* Collapsed bar */}
        <div className="px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex-1 min-w-0 text-left flex items-center gap-2"
            >
              <span className="text-sm font-medium truncate">{announcement.title}</span>
              <span className="text-sm text-slate-400 truncate hidden sm:inline flex-1">
                — {announcement.message}
              </span>
              {!expanded && (
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              )}
              {expanded && (
                <ChevronUp className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <X className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Expanded content */}
        <div
          className={`transition-all duration-300 overflow-hidden ${
            expanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pb-4">
            <div className="max-w-7xl mx-auto">
              <p className="text-sm text-slate-300 leading-relaxed mb-3">
                {announcement.message}
              </p>
              {announcement.cta_text && announcement.cta_link && (
                <a
                  href={announcement.cta_link}
                  onClick={handleDismiss}
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {announcement.cta_text} &rarr;
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
