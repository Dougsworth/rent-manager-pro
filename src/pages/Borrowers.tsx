import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getBorrowers, addBorrower, updateBorrower, deleteBorrower } from '@/services/borrowers';
import { addBorrowerSchema } from '@/schemas';
import type { Borrower } from '@/types/app.types';
import { PageHeader } from '@/components/PageHeader';
import { FilterTabs } from '@/components/FilterTabs';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { Pagination, paginate } from '@/components/Pagination';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

type BorrowerStatus = 'all' | 'active' | 'inactive';

const emptyAdd = { firstName: '', lastName: '', email: '', phone: '', notes: '' };

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function FormError({ message }: { message: string }) {
  if (!message) return null;
  return <p role="alert" className="text-sm font-medium text-late">{message}</p>;
}

function DialogButtons({ busy, label, busyLabel, onCancel }: { busy: boolean; label: string; busyLabel: string; onCancel: () => void }) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="ghost" onClick={onCancel} className="max-sm:h-12">Cancel</Button>
      <Button type="submit" disabled={busy} className="max-sm:h-12">{busy ? busyLabel : label}</Button>
    </div>
  );
}

export default function Borrowers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BorrowerStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBorrower, setEditingBorrower] = useState<Borrower | null>(null);
  const [adding, setAdding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Add form state
  const [form, setForm] = useState(emptyAdd);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', phone: '', notes: '' });
  const [formError, setFormError] = useState('');

  const loadBorrowers = async () => {
    if (!user) return;
    try {
      const data = await getBorrowers(user.id);
      setBorrowers(data);
    } catch (err) {
      console.error('Failed to load borrowers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBorrowers(); }, [user]);

  const filtered = borrowers
    .filter(b => activeTab === 'all' || b.status === activeTab)
    .filter(b => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const name = `${b.first_name} ${b.last_name}`.toLowerCase();
      return name.includes(q) || b.email.toLowerCase().includes(q) || b.phone.includes(q);
    });

  const pageItems = paginate(filtered, currentPage, PAGE_SIZE);

  const activeCount = borrowers.filter(b => b.status === 'active').length;
  const inactiveCount = borrowers.filter(b => b.status === 'inactive').length;

  const tabs = [
    { value: 'all' as BorrowerStatus, label: 'All', count: borrowers.length },
    { value: 'active' as BorrowerStatus, label: 'Active', count: activeCount },
    { value: 'inactive' as BorrowerStatus, label: 'Inactive', count: inactiveCount },
  ];

  const openAdd = () => { setForm(emptyAdd); setFormError(''); setShowAddModal(true); };

  const handleAdd = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setFormError('');
    const result = addBorrowerSchema.safeParse(form);
    if (!result.success) {
      setFormError(result.error.issues[0].message);
      return;
    }
    setAdding(true);
    try {
      await addBorrower(user!.id, {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        notes: form.notes || undefined,
      });
      toast(`${form.firstName} ${form.lastName} added.`.replace(/\s+/g, ' '));
      setShowAddModal(false);
      setForm(emptyAdd);
      await loadBorrowers();
    } catch (err) {
      setFormError('That borrower was not added. Check your connection and try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editingBorrower) return;
    setFormError('');
    setAdding(true);
    try {
      await updateBorrower(editingBorrower.id, editForm);
      toast('Changes saved.');
      setEditingBorrower(null);
      await loadBorrowers();
    } catch (err) {
      setFormError('Your changes were not saved. Check your connection and try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (b: Borrower) => {
    const name = `${b.first_name} ${b.last_name}`.trim();
    if (!confirm(`Delete ${name}? Their loans are deleted too.`)) return;
    try {
      await deleteBorrower(b.id);
      toast(`${name} deleted.`);
      await loadBorrowers();
    } catch (err) {
      toast('That borrower was not deleted. Try again.', 'error');
    }
  };

  const openEdit = (b: Borrower) => {
    setEditForm({ first_name: b.first_name, last_name: b.last_name, email: b.email, phone: b.phone, notes: b.notes });
    setEditingBorrower(b);
    setFormError('');
  };

  if (loading) {
    return (
      <div aria-busy="true">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="mt-6 h-5 w-72" />
        <Skeleton className="mt-6 h-11 w-full max-w-md" />
        <div className="mt-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center justify-between gap-4 border-t border-rule py-3.5">
              <div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3.5 w-56" /></div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const emptyMessage = searchQuery
    ? `No borrowers match "${searchQuery}"`
    : activeTab !== 'all'
    ? `No ${activeTab} borrowers`
    : 'No borrowers yet';

  return (
    <>
      <PageHeader
        title="Borrowers"
        count={borrowers.length}
        action={
          borrowers.length > 0 ? (
            <Button onClick={openAdd} className="max-sm:h-12 max-sm:w-full">Add borrower</Button>
          ) : undefined
        }
      />

      {borrowers.length > 0 && (
        <p className="mb-6 text-[15px]">
          {activeCount} active, {inactiveCount} inactive. <span className="text-quiet">Open a name to see their loans and repayments.</span>
        </p>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <FilterTabs tabs={tabs} activeTab={activeTab} onTabChange={(v) => { setActiveTab(v); setCurrentPage(1); }} />
        <div className="relative w-full sm:w-64">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-quiet" />
          <Input
            aria-label="Search borrowers"
            placeholder="Search by name, email or phone"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          message={emptyMessage}
          description={!searchQuery && activeTab === 'all' ? 'Each person you lend to shows here. Add them, then add a loan from their page or from Loans.' : undefined}
          action={!searchQuery && activeTab === 'all' ? <Button onClick={openAdd}>Add borrower</Button> : undefined}
        />
      ) : (
        <>
          <ul>
            {pageItems.map(b => {
              const name = `${b.first_name} ${b.last_name}`.trim();
              const contact = [b.phone, b.email].filter(Boolean).join(', ');
              const active = b.status === 'active';
              return (
                <li
                  key={b.id}
                  className="grid grid-cols-[1fr_auto] items-start gap-x-4 border-t border-rule py-3 sm:grid-cols-[minmax(0,1fr)_110px_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <Link to={`/borrowers/${b.id}`} className={cn('block truncate text-base font-medium hover:underline', active ? 'text-ink' : 'text-quiet')}>
                      {name}
                    </Link>
                    <p className="truncate text-[13.5px] text-quiet">{contact || 'No phone or email yet'}</p>
                  </div>
                  <div className="flex flex-col items-end sm:contents">
                    <p className={cn('text-[13.5px]', active ? 'text-ink' : 'text-quiet')}>
                      {active ? 'Active' : 'Inactive'}
                    </p>
                    <div className="-mr-3 flex sm:justify-end">
                      <Button variant="ghost" size="sm" className="h-8 text-quiet hover:text-ink" onClick={() => openEdit(b)} aria-label={`Edit ${name}`}>Edit</Button>
                      <Button variant="ghost" size="sm" className="h-8 text-quiet hover:text-late" onClick={() => handleDelete(b)} aria-label={`Delete ${name}`}>Delete</Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <Pagination currentPage={currentPage} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
        </>
      )}

      {/* Add borrower */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add borrower</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="b-first" label="First name"><Input id="b-first" autoComplete="off" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} /></Field>
              <Field id="b-last" label="Last name"><Input id="b-last" autoComplete="off" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} /></Field>
            </div>
            <Field id="b-phone" label="Phone (optional)"><Input id="b-phone" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></Field>
            <Field id="b-email" label="Email (optional)"><Input id="b-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Field>
            <Field id="b-notes" label="Notes (optional)"><Input id="b-notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></Field>
            <FormError message={formError} />
            <DialogButtons busy={adding} label="Add borrower" busyLabel="Adding" onCancel={() => setShowAddModal(false)} />
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit borrower */}
      <Dialog open={!!editingBorrower} onOpenChange={() => setEditingBorrower(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit borrower</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="be-first" label="First name"><Input id="be-first" value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} /></Field>
              <Field id="be-last" label="Last name"><Input id="be-last" value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} /></Field>
            </div>
            <Field id="be-phone" label="Phone"><Input id="be-phone" type="tel" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} /></Field>
            <Field id="be-email" label="Email"><Input id="be-email" type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} /></Field>
            <Field id="be-notes" label="Notes"><Input id="be-notes" value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} /></Field>
            <FormError message={formError} />
            <DialogButtons busy={adding} label="Save changes" busyLabel="Saving" onCancel={() => setEditingBorrower(null)} />
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
