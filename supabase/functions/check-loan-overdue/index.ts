import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const today = new Date().toISOString().split('T')[0];

    // Find loan installments that are still pending but past their due date
    const { data: installments, error: instErr } = await supabase
      .from('loan_installments')
      .select('id, landlord_id, amount, due_date, loan_id, loans(loan_number, borrowers(first_name, last_name))')
      .eq('status', 'pending')
      .lt('due_date', today);

    if (instErr) {
      console.error('Failed to fetch pending installments:', instErr);
      return new Response(JSON.stringify({ error: 'Failed to fetch installments' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!installments || installments.length === 0) {
      return new Response(JSON.stringify({ marked: 0, notified: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let marked = 0;
    let notified = 0;

    // Group by landlord to batch the status update
    const byLandlord = new Map<string, typeof installments>();
    for (const inst of installments) {
      const list = byLandlord.get(inst.landlord_id) ?? [];
      list.push(inst);
      byLandlord.set(inst.landlord_id, list);
    }

    for (const [landlordId, landlordInstallments] of byLandlord) {
      // Flip pending → overdue. Once flipped they no longer match the query
      // above, so a borrower is notified only the first day an installment slips.
      const ids = landlordInstallments.map((i) => i.id);
      const { error: updateErr } = await supabase
        .from('loan_installments')
        .update({ status: 'overdue' })
        .in('id', ids);

      if (updateErr) {
        console.error(`Failed to mark installments overdue for landlord ${landlordId}:`, updateErr);
        continue;
      }

      marked += ids.length;

      // One notification per overdue installment
      for (const inst of landlordInstallments) {
        const loan = (inst as any).loans;
        const borrower = loan?.borrowers;
        const borrowerName = borrower
          ? `${borrower.first_name} ${borrower.last_name}`.trim()
          : 'A borrower';
        const daysOverdue = Math.floor(
          (new Date(today).getTime() - new Date(inst.due_date).getTime()) / 86400000,
        );

        await supabase.from('notifications').insert({
          landlord_id: landlordId,
          type: 'loan_overdue',
          title: 'Loan Payment Overdue',
          message: `${borrowerName}'s loan payment of J$${Number(inst.amount).toLocaleString()} is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
          related_entity_id: inst.loan_id,
        });
        notified++;
      }
    }

    return new Response(
      JSON.stringify({ marked, notified }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Check loan overdue error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
