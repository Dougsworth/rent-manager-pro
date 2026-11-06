import { useState, useRef, useEffect, Fragment } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { processMessage } from "@/services/aiChat";
import type { AiChatUsage } from "@/types/app.types";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = 'easycollect_ai_usage';
const DAILY_LIMIT = 5;

function getStoredAiCount(userId: string): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    const today = new Date().toISOString().split('T')[0];
    if (data.userId === userId && data.date === today) {
      return data.count ?? 0;
    }
    localStorage.removeItem(STORAGE_KEY);
    return 0;
  } catch {
    return 0;
  }
}

function storeAiCount(userId: string, count: number) {
  try {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, date: today, count }));
  } catch { /* storage blocked */ }
}

const SUGGESTIONS = [
  "Who's overdue?",
  "How much collected this month?",
  "Monthly summary",
  "Draft a reminder",
];

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

function renderMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const lines = text.split('\n');
  lines.forEach((line, li) => {
    if (li > 0) parts.push(<br key={`br-${li}`} />);
    const listMatch = line.match(/^[-*]\s+(.*)/);
    const content = listMatch ? listMatch[1] : line;
    if (listMatch) parts.push(<span key={`dot-${li}`} className="mr-1.5">{'•'}</span>);
    content.split(/(\*\*[^*]+\*\*)/g).forEach((seg, si) => {
      const bold = seg.match(/^\*\*(.+)\*\*$/);
      if (bold) parts.push(<strong key={`${li}-${si}`} className="font-semibold text-ink">{bold[1]}</strong>);
      else if (seg) parts.push(<Fragment key={`${li}-${si}`}>{seg}</Fragment>);
    });
  });
  return parts;
}

interface ResultEntry {
  id: string;
  query: string;
  answer: string;
  source: 'local' | 'ai';
  timestamp: Date;
}

/**
 * Ask questions about your own data. The trigger is a small square cornered
 * button that sits above the phone tab bar, and the panel is a flat popover.
 */
export function AiChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [aiCount, setAiCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const resultsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setAiCount(getStoredAiCount(user.id));
    }
  }, [user]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    resultsEndRef.current?.scrollIntoView({ block: "end" });
  }, [results, loading]);

  if (!user) return null;

  const incrementAiCount = () => {
    const newCount = aiCount + 1;
    setAiCount(newCount);
    storeAiCount(user.id, newCount);
  };

  const syncFromServer = (usage: AiChatUsage) => {
    setAiCount(usage.request_count);
    storeAiCount(user.id, usage.request_count);
  };

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setLoading(true);

    try {
      const result = await processMessage(msg, user.id);
      setResults(prev => [...prev, {
        id: crypto.randomUUID(),
        query: msg,
        answer: result.reply,
        source: result.source,
        timestamp: new Date(),
      }]);
      if (result.source === 'ai') {
        if (result.usage) {
          syncFromServer(result.usage);
        } else {
          incrementAiCount();
        }
      }
    } catch (err: any) {
      if (err.usage) syncFromServer(err.usage);
      setResults(prev => [...prev, {
        id: crypto.randomUUID(),
        query: msg,
        answer: err.usage
          ? "You have used all of today's AI answers. You can ask again tomorrow."
          : (err.message || "Something went wrong. Try asking again."),
        source: 'local',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const left = Math.max(0, DAILY_LIMIT - aiCount);

  return (
    <>
      {/* Trigger: above the phone tab bar, bottom right on desktop */}
      {!open && (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] right-4 z-30 flex h-10 cursor-pointer items-center gap-2 rounded-[3px] border border-input bg-popover px-3 text-sm font-semibold text-shell transition-colors duration-100 hover:bg-secondary sm:right-8 lg:bottom-6 lg:right-11"
        >
          Ask AI
          <kbd className="hidden font-sans text-[13px] font-normal text-quiet lg:inline">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
        </button>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-label="Ask AI"
            className="fixed inset-x-2 bottom-[calc(64px+env(safe-area-inset-bottom))] z-50 flex max-h-[calc(100dvh-140px)] flex-col border border-rule bg-popover text-ink shadow-lg sm:left-auto sm:right-8 sm:w-[420px] lg:bottom-6 lg:right-11 lg:max-h-[min(640px,80vh)]"
          >
            <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-3">
              <div>
                <h2 className="text-[15px] font-semibold">Ask about your tenants and payments</h2>
                <p className="text-[13.5px] text-quiet">Answers use only your own records.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="-mr-2 -mt-1 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center text-quiet hover:bg-secondary hover:text-ink"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-rule">
              {results.length === 0 && !loading && (
                <div className="px-4 py-3">
                  <p className="pb-1 text-[13.5px] text-quiet">Try one of these</p>
                  <ul>
                    {SUGGESTIONS.map(s => (
                      <li key={s} className="border-t border-rule first:border-t-0">
                        <button
                          type="button"
                          onClick={() => handleSend(s)}
                          className="block min-h-11 w-full cursor-pointer py-2 text-left text-[15px] text-shell underline-offset-4 hover:underline"
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(results.length > 0 || loading) && (
                <div className="space-y-4 px-4 py-4">
                  {results.map((r) => (
                    <div key={r.id} className="space-y-2">
                      <p className="ml-auto w-fit max-w-[85%] rounded-[3px] bg-secondary px-3 py-2 text-[15px] text-ink">{r.query}</p>
                      <div className="text-[15px] leading-relaxed text-ink">{renderMarkdown(r.answer)}</div>
                    </div>
                  ))}
                  {loading && <p role="status" className="text-[15px] text-quiet">Working it out</p>}
                  <div ref={resultsEndRef} />
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2 border-t border-rule px-4 py-3"
            >
              <label htmlFor="ai-question" className="sr-only">Your question</label>
              <input
                id="ai-question"
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask a question"
                autoComplete="off"
                className="h-10 min-w-0 flex-1 rounded-[3px] border border-input bg-transparent px-3 text-[15px] text-ink placeholder:text-quiet hover:border-quiet focus:border-paid focus:outline-2 focus:outline-offset-0 focus:outline-paid"
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !input.trim()}>Ask</Button>
            </form>

            <div className="flex items-center justify-between gap-3 px-4 pb-3 text-[13px] text-quiet">
              <span className={left === 0 ? 'font-medium text-late' : undefined}>
                {left === 0 ? 'No AI answers left today' : `${left} of ${DAILY_LIMIT} AI answers left today`}
              </span>
              {results.length > 0 && (
                <button type="button" onClick={() => setResults([])} className="min-h-8 cursor-pointer underline hover:text-ink">
                  Clear
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
