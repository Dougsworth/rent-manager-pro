import { useState, useRef, useEffect, Fragment } from "react";
import { Search, Loader2, X, CornerDownLeft, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { processMessage } from "@/services/aiChat";
import type { AiChatUsage } from "@/types/app.types";

const STORAGE_KEY = 'easycollect_ai_usage';

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
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, date: today, count }));
}

const SUGGESTIONS = [
  { label: "Who's overdue?", icon: "!" },
  { label: "How much collected?", icon: "$" },
  { label: "Monthly summary", icon: "#" },
  { label: "Draft a reminder", icon: "~" },
];

// Render basic markdown: **bold**, newlines, - list items
function renderMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const lines = text.split('\n');
  lines.forEach((line, li) => {
    if (li > 0) parts.push(<br key={`br-${li}`} />);
    const listMatch = line.match(/^[-*]\s+(.*)/);
    const content = listMatch ? listMatch[1] : line;
    if (listMatch) parts.push(<span key={`dot-${li}`} className="text-blue-400 mr-1">{'\u2022'}</span>);
    content.split(/(\*\*[^*]+\*\*)/g).forEach((seg, si) => {
      const bold = seg.match(/^\*\*(.+)\*\*$/);
      if (bold) parts.push(<strong key={`${li}-${si}`} className="font-semibold text-slate-900">{bold[1]}</strong>);
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

export function AiChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [aiCount, setAiCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setAiCount(getStoredAiCount(user.id));
    }
  }, [user]);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
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
    resultsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [results]);

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
          ? "You've reached your daily limit. Try again tomorrow!"
          : (err.message || "Something went wrong."),
        source: 'local',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Trigger bar */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
      >
        <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
        <span className="text-xs text-slate-400 group-hover:text-slate-600 transition-colors hidden sm:inline">Search & Ask</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-400 border border-slate-200/60">
          <span className="text-[11px]">&#8984;</span>K
        </kbd>
      </button>

      {/* Command palette overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] sm:pt-[16vh] px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-[3px]"
            onClick={() => setOpen(false)}
          />

          {/* Palette */}
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col max-h-[70vh]">

            {/* Input area */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
              {loading ? (
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />
              ) : (
                <Search className="h-4 w-4 text-slate-300 shrink-0" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your tenants, payments..."
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400 text-slate-900"
                disabled={loading}
              />
              {input.trim() && !loading && (
                <button
                  type="button"
                  onClick={() => handleSend()}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-blue-500 transition-colors"
                >
                  <CornerDownLeft className="h-3 w-3" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-md text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Results / suggestions */}
            <div className="flex-1 overflow-y-auto overscroll-contain">

              {/* Empty state — suggestions */}
              {results.length === 0 && !loading && (
                <div className="p-3">
                  <p className="text-[10px] uppercase tracking-widest text-slate-300 font-medium px-2 mb-2">Suggestions</p>
                  <div className="space-y-0.5">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => handleSend(s.label)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-slate-50 transition-colors group/item"
                      >
                        <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-400 text-xs font-mono flex items-center justify-center group-hover/item:bg-blue-50 group-hover/item:text-blue-500 transition-colors">
                          {s.icon}
                        </span>
                        <span className="text-sm text-slate-600 group-hover/item:text-slate-900 transition-colors flex-1">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Result entries */}
              {results.length > 0 && (
                <div className="p-3 space-y-3">
                  {results.map((r) => (
                    <div key={r.id} className="group">
                      {/* Query */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                        <span className="text-xs text-slate-400 truncate flex-1">{r.query}</span>
                      </div>
                      {/* Answer card */}
                      <div className="ml-3 px-3 py-2.5 rounded-xl text-[13px] leading-relaxed border bg-slate-50 border-slate-100 text-slate-700">
                        {renderMarkdown(r.answer)}
                      </div>
                    </div>
                  ))}
                  <div ref={resultsEndRef} />
                </div>
              )}

              {/* Loading state */}
              {loading && results.length > 0 && (
                <div className="px-6 pb-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                {results.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setResults([])}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    clear
                  </button>
                )}
                <span className="text-[10px] text-slate-400">
                  <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-medium mr-1">esc</kbd>
                  close
                </span>
                <span className="text-[10px] text-slate-400">
                  <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-medium mr-1">&#9166;</kbd>
                  send
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                Assistant
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
