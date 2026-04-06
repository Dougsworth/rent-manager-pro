import { useState, useEffect } from 'react';
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
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { AvatarInitial } from '@/components/ui/avatar-initial';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { Pagination, paginate } from '@/components/Pagination';
import { Search, Plus, Loader2, Users, Trash2, Edit2, UserCheck } from 'lucide-react';

type BorrowerStatus = 'all' | 'active' | 'inactive';

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
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', notes: '' });
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

  const tabs = [
    { value: 'all' as BorrowerStatus, label: 'All', count: borrowers.length },
    { value: 'active' as BorrowerStatus, label: 'Active', count: borrowers.filter(b => b.status === 'active').length },
    { value: 'inactive' as BorrowerStatus, label: 'Inactive', count: borrowers.filter(b => b.status === 'inactive').length },
  ];

  const handleAdd = async () => {
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
      toast('Borrower added!');
      setShowAddModal(false);
      setForm({ firstName: '', lastName: '', email: '', phone: '', notes: '' });
      await loadBorrowers();
    } catch (err) {
      setFormError('Failed to add borrower');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingBorrower) return;
    setFormError('');
    setAdding(true);
    try {
      await updateBorrower(editingBorrower.id, editForm);
      toast('Borrower updated!');
      setEditingBorrower(null);
      await loadBorrowers();
    } catch (err) {
      setFormError('Failed to update borrower');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this borrower? This will also delete their loans.')) return;
    try {
      await deleteBorrower(id);
      toast('Borrower deleted');
      await loadBorrowers();
    } catch (err) {
      toast('Failed to delete borrower', 'error');
    }
  };

  const openEdit = (b: Borrower) => {
    setEditForm({ first_name: b.first_name, last_name: b.last_name, email: b.email, phone: b.phone, notes: b.notes });
    setEditingBorrower(b);
    setFormError('');
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <PageHeader title="Borrowers" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-white/60 animate-pulse" />)}
        </div>
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-white/60 animate-pulse" />)}</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Borrowers"
        count={borrowers.length}
        action={
          <Button size="sm" onClick={() => { setForm({ firstName: '', lastName: '', email: '', phone: '', notes: '' }); setFormError(''); setShowAddModal(true); }}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Borrower
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total Borrowers" value={String(borrowers.length)} icon={Users} />
        <StatCard label="Active" value={String(borrowers.filter(b => b.status === 'active').length)} icon={UserCheck} />
        <StatCard label="Inactive" value={String(borrowers.filter(b => b.status === 'inactive').length)} icon={Users} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <FilterTabs tabs={tabs} activeTab={activeTab} onTabChange={(v) => { setActiveTab(v); setCurrentPage(1); }} />
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search borrowers..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-9"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          message="No borrowers yet"
          description="Add a borrower to start tracking loans"
          action={<Button size="sm" onClick={() => setShowAddModal(true)}><Plus className="h-4 w-4 mr-1.5" />Add Borrower</Button>}
        />
      ) : (
        <>
          <div className="space-y-2">
            {pageItems.map(b => (
              <div
                key={b.id}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200/60 hover:border-slate-300/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AvatarInitial name={`${b.first_name} ${b.last_name}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{b.first_name} {b.last_name}</p>
                    <p className="text-xs text-slate-500 truncate">{b.email || b.phone || 'No contact info'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge variant={b.status === 'active' ? 'paid' : 'default'}>
                    {b.status === 'active' ? 'Active' : 'Inactive'}
                  </StatusBadge>
                  <button onClick={() => openEdit(b)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={currentPage} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
        </>
      )}

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Borrower</DialogTitle></DialogHeader>
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First Name *</Label><Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} /></div>
              <div><Label>Last Name *</Label><Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} /></div>
            </div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={adding}>
                {adding && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Add Borrower
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingBorrower} onOpenChange={() => setEditingBorrower(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Borrower</DialogTitle></DialogHeader>
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First Name</Label><Input value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} /></div>
              <div><Label>Last Name</Label><Input value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} /></div>
            </div>
            <div><Label>Email</Label><Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label>Notes</Label><Input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingBorrower(null)}>Cancel</Button>
              <Button onClick={handleUpdate} disabled={adding}>
                {adding && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
