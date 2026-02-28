import { supabase } from '@/lib/supabase';
import { getDashboardStats, getRecentPayments, getOverdueTenants } from '@/services/dashboard';
import type { LocalIntent, AiChatUsage } from '@/types/app.types';

const DAILY_LIMIT = 5;

// Pattern matching for local queries
const intentPatterns: { intent: LocalIntent; patterns: RegExp[] }[] = [
  {
    intent: 'overdue',
    patterns: [
      /who.*(overdue|late|behind|owe)/i,
      /overdue\s*(tenant|invoice|payment)/i,
      /late\s*(payment|payer|tenant)/i,
      /which\s*tenant.*(overdue|late|behind)/i,
    ],
  },
  {
    intent: 'outstanding',
    patterns: [
      /how\s*much.*(outstanding|owed|unpaid|due)/i,
      /outstanding\s*(amount|balance|total)/i,
      /total.*(owed|outstanding|unpaid)/i,
    ],
  },
  {
    intent: 'tenant_count',
    patterns: [
      /how\s*many\s*tenant/i,
      /tenant\s*count/i,
      /number\s*of\s*tenant/i,
      /total\s*tenant/i,
    ],
  },
  {
    intent: 'collected',
    patterns: [
      /how\s*much.*(collected|received|paid)/i,
      /total.*(collected|received|paid)/i,
      /collection.*(total|amount|so far)/i,
      /rent\s*collected/i,
    ],
  },
  {
    intent: 'recent_payments',
    patterns: [
      /recent\s*(payment|transaction)/i,
      /latest\s*(payment|transaction)/i,
      /last\s*(few\s*)?(payment|transaction)/i,
      /who\s*(paid|made\s*payment)\s*(recently|lately|last)/i,
    ],
  },
  {
    intent: 'dashboard_stats',
    patterns: [
      /dashboard/i,
      /summary|overview|stats|statistics/i,
      /how.*doing/i,
      /give\s*me\s*(a\s*)?rundown/i,
      /what.*numbers/i,
    ],
  },
];

export function matchLocalIntent(message: string): LocalIntent | null {
  for (const { intent, patterns } of intentPatterns) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return intent;
      }
    }
  }
  return null;
}

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

export async function executeLocalQuery(intent: LocalIntent, landlordId: string): Promise<string> {
  switch (intent) {
    case 'overdue': {
      const overdue = await getOverdueTenants(landlordId);
      if (overdue.length === 0) {
        return 'Great news! No tenants are currently overdue.';
      }
      const lines = overdue.map(
        (t) => `- **${t.name}** (${t.unit || 'No unit'}): ${formatCurrency(t.amount)} — ${t.daysOverdue} days overdue`
      );
      return `You have **${overdue.length}** overdue tenant${overdue.length > 1 ? 's' : ''}:\n\n${lines.join('\n')}`;
    }

    case 'outstanding': {
      const stats = await getDashboardStats(landlordId);
      return `Your outstanding balance this month is **${formatCurrency(stats.outstanding)}** out of ${formatCurrency(stats.expected)} expected.`;
    }

    case 'tenant_count': {
      const stats = await getDashboardStats(landlordId);
      return `You currently have **${stats.tenantCount}** active tenant${stats.tenantCount !== 1 ? 's' : ''}.`;
    }

    case 'collected': {
      const stats = await getDashboardStats(landlordId);
      const pct = stats.expected > 0 ? Math.round((stats.collected / stats.expected) * 100) : 0;
      return `You've collected **${formatCurrency(stats.collected)}** out of ${formatCurrency(stats.expected)} expected this month (${pct}%).`;
    }

    case 'recent_payments': {
      const payments = await getRecentPayments(landlordId, 5);
      if (payments.length === 0) {
        return 'No recent payments found.';
      }
      const lines = payments.map(
        (p) => `- **${p.tenant_first_name} ${p.tenant_last_name}**: ${formatCurrency(p.amount)} on ${new Date(p.payment_date).toLocaleDateString()}`
      );
      return `Here are your last ${payments.length} payments:\n\n${lines.join('\n')}`;
    }

    case 'dashboard_stats': {
      const stats = await getDashboardStats(landlordId);
      const pct = stats.expected > 0 ? Math.round((stats.collected / stats.expected) * 100) : 0;
      return [
        `Here's your monthly summary:`,
        ``,
        `- **Tenants**: ${stats.tenantCount}`,
        `- **Expected**: ${formatCurrency(stats.expected)}`,
        `- **Collected**: ${formatCurrency(stats.collected)} (${pct}%)`,
        `- **Outstanding**: ${formatCurrency(stats.outstanding)}`,
        `- **Overdue invoices**: ${stats.overdue}`,
      ].join('\n');
    }
  }
}

export async function buildAnonymizedContext(landlordId: string): Promise<string> {
  try {
    const [stats, payments, overdue] = await Promise.all([
      getDashboardStats(landlordId),
      getRecentPayments(landlordId, 5),
      getOverdueTenants(landlordId),
    ]);

    // Anonymize tenant names
    const nameMap = new Map<string, string>();
    let letterIdx = 0;
    const getLabel = (name: string) => {
      if (!nameMap.has(name)) {
        nameMap.set(name, `Tenant ${String.fromCharCode(65 + letterIdx++)}`);
      }
      return nameMap.get(name)!;
    };

    const overdueLines = overdue.map(
      (t) => `${getLabel(t.name)}: J$${t.amount.toLocaleString()}, ${t.daysOverdue} days overdue`
    );

    const paymentLines = payments.map(
      (p) => `${getLabel(`${p.tenant_first_name} ${p.tenant_last_name}`)}: J$${p.amount.toLocaleString()} on ${p.payment_date}`
    );

    return [
      `Monthly stats: ${stats.tenantCount} tenants, J$${stats.expected.toLocaleString()} expected, J$${stats.collected.toLocaleString()} collected, J$${stats.outstanding.toLocaleString()} outstanding, ${stats.overdue} overdue invoices.`,
      overdue.length > 0 ? `Overdue: ${overdueLines.join('; ')}` : 'No overdue tenants.',
      payments.length > 0 ? `Recent payments: ${paymentLines.join('; ')}` : 'No recent payments.',
    ].join('\n');
  } catch {
    return 'Unable to fetch context data.';
  }
}

export async function sendToAI(
  message: string,
  landlordId: string
): Promise<{ reply: string; usage: AiChatUsage }> {
  const context = await buildAnonymizedContext(landlordId);

  // Force a token refresh so we always send a valid JWT to the edge function gateway
  const { data: { session } } = await supabase.auth.refreshSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const { data, error } = await supabase.functions.invoke('ai-chat', {
    body: { message, context },
    headers,
  });

  if (error) {
    // supabase-js wraps non-2xx as a FunctionsFetchError with generic message.
    // The actual JSON body may still be in `data`.
    const serverMsg = data?.error || error.message || 'Failed to reach AI service';
    if (data?.usage) {
      throw Object.assign(new Error(serverMsg), { usage: data.usage });
    }
    throw new Error(serverMsg);
  }

  if (data.error) {
    if (data.usage) {
      throw Object.assign(new Error(data.error), { usage: data.usage });
    }
    throw new Error(data.error);
  }

  return { reply: data.reply, usage: data.usage };
}

export async function processMessage(
  message: string,
  landlordId: string
): Promise<{ reply: string; source: 'local' | 'ai'; usage?: AiChatUsage }> {
  // Try local intent first
  const intent = matchLocalIntent(message);
  if (intent) {
    const reply = await executeLocalQuery(intent, landlordId);
    return { reply, source: 'local' };
  }

  // Fall back to AI
  const { reply, usage } = await sendToAI(message, landlordId);
  return { reply, source: 'ai', usage };
}

export async function getAiUsageToday(landlordId: string): Promise<AiChatUsage> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('ai_chat_usage' as any)
    .select('request_count')
    .eq('landlord_id', landlordId)
    .eq('usage_date', today)
    .maybeSingle();

  const count = (data as any)?.request_count ?? 0;
  return { request_count: count, limit: DAILY_LIMIT, remaining: DAILY_LIMIT - count };
}
