import { useState, useRef, useEffect, Fragment } from "react";
import { Loader2, X, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { processMessage } from "@/services/aiChat";
import type { AiChatUsage } from "@/types/app.types";

const STORAGE_KEY = 'easycollect_ai_usage';

/* ── Homemade SVGs (our own, not the generic AI sparkle) ───────────────── */

// Brand assistant mark: a speech bubble carrying the "J$" identity.
function AssistantGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M4.5 6A2.5 2.5 0 0 1 7 3.5h10A2.5 2.5 0 0 1 19.5 6v7A2.5 2.5 0 0 1 17 15.5H10l-3.8 3.1a.6.6 0 0 1-1-.46V15.5H7A2.5 2.5 0 0 1 4.5 13V6Z"
        fill="currentColor"
      />
      <text
        x="12" y="11.4" textAnchor="middle"
        fontSize="6.6" fontWeight="700" letterSpacing="-0.3"
        fill="#fff" fontFamily="ui-sans-serif, system-ui, sans-serif"
      >J$</text>
    </svg>
  );
}

// Paper-plane send icon.
function SendGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M3.3 20.4 21.2 12 3.3 3.6a.6.6 0 0 0-.84.7L4 10.6l9 1.4-9 1.4-1.54 6.3a.6.6 0 0 0 .84.7Z" />
    </svg>
  );
}

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
  "Who's overdue?",
  "Who owes on loans?",
  "Monthly summary",
  "Draft a reminder",
];

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
      if (bold) parts.push(<strong key={`${li}-${si}`} className="font-semibold">{bold[1]}</strong>);
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

function AssistantAvatar() {
  return (
    <div className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 self-end shadow-sm">
      <AssistantGlyph className="h-4 w-4" />
    </div>
  );
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
      // Recent turns so the AI can answer follow-ups ("who is that?")
      const history = results.flatMap(r => [
        { role: 'user' as const, content: r.query },
        { role: 'assistant' as const, content: r.answer },
      ]);
      const result = await processMessage(msg, user.id, history);
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

  const creditsLeft = Math.max(0, 5 - aiCount);

  return (
    <>
      {/* Launcher bubble */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open assistant"
          className="fixed bottom-5 right-5 z-40 h-10 w-10 rounded-full bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-1 ring-blue-700/10 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
        >
          <AssistantGlyph className="h-[18px] w-[18px]" />
        </button>
      )}

      {/* Chat widget */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col w-[min(384px,calc(100vw-2rem))] h-[min(560px,calc(100vh-6rem))] rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-900/10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white">
            <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <AssistantGlyph className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 leading-tight">EasyCollect Assistant</p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Rent, loans &amp; your numbers
              </p>
            </div>
            {results.length > 0 && (
              <button
                type="button"
                onClick={() => setResults([])}
                title="Clear conversation"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              title="Close"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 bg-slate-50/50">
            {/* Greeting + suggestions */}
            {results.length === 0 && !loading && (
              <div className="space-y-3">
                <div className="flex gap-2 items-end">
                  <AssistantAvatar />
                  <div className="max-w-[82%] rounded-2xl rounded-bl-sm bg-white border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 leading-relaxed">
                    Hi! I'm your EasyCollect assistant. Ask about your tenants, rent, loans, or how to use the app.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pl-9">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSend(s)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:border-blue-300 hover:text-blue-600 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation */}
            {results.map((r) => (
              <Fragment key={r.id}>
                <div className="flex justify-end">
                  <div className="max-w-[82%] rounded-2xl rounded-br-sm bg-blue-600 text-white px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {r.query}
                  </div>
                </div>
                <div className="flex gap-2 items-end">
                  <AssistantAvatar />
                  <div className="max-w-[82%] rounded-2xl rounded-bl-sm bg-white border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 leading-relaxed break-words">
                    {renderMarkdown(r.answer)}
                  </div>
                </div>
              </Fragment>
            ))}

            {/* Typing */}
            {loading && (
              <div className="flex gap-2 items-end">
                <AssistantAvatar />
                <div className="rounded-2xl rounded-bl-sm bg-white border border-slate-200 px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" />
                  </div>
                </div>
              </div>
            )}
            <div ref={resultsEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 p-3 bg-white">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 pl-3.5 pr-1.5 py-1 focus-within:border-blue-300 transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message the assistant…"
                className="flex-1 py-2 text-sm bg-transparent outline-none placeholder:text-slate-400 text-slate-800"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                aria-label="Send"
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendGlyph className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-slate-400">
              <span className={creditsLeft <= 1 ? 'text-red-400' : creditsLeft <= 2 ? 'text-amber-400' : ''}>
                {creditsLeft}/5 AI credits today
              </span>
              <span>EasyCollect AI</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
