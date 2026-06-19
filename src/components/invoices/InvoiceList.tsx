import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, ExternalLink, ArrowRight, X, Edit3, Banknote, ReceiptText, AlertTriangle, FileText, CheckCircle2, MoreHorizontal, FileClock, CheckCircle, Wallet } from 'lucide-react';
import { firestoreService } from '../../services/firestoreService';
import { formatCurrency, cn } from '../../lib/utils';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { InvoiceEditor } from './InvoiceEditor';

export function InvoiceList() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    loadInvoices();
    loadProjects();
    loadClients();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    const data = await firestoreService.list('invoices');
    setInvoices(data || []);
    setLoading(false);
  };

  const loadProjects = async () => {
    try {
       const q = query(collection(db, 'projects'), where('userId', '==', auth.currentUser?.uid));
       const snap = await getDocs(q);
       setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch(err) {}
  };

  const loadClients = async () => {
    try {
       const c = await firestoreService.list('clients');
       setClients(c || []);
    } catch(err) {}
  };

  const handleGenerateInvoice = async () => {
    if (!selectedProject) return;
    const project = projects.find(p => p.id === selectedProject);
    if (!project) return;
    
    setIsModalOpen(false);
    setLoading(true);
    
    await firestoreService.create('invoices', {
      projectId: project.id,
      clientId: project.clientId,
      amount: project.budget || 3000,
      status: 'sent',
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 'Standard',
      services: [
        { description: `Services for ${project.title}`, amount: project.budget || 3000 }
      ]
    });
    
    await loadInvoices();
  };

  const handleManualInvoice = async () => {
    setIsModalOpen(false);
    setLoading(true);
    
    const newInvoice = {
      clientId: selectedClientId || null,
      amount: 0,
      status: 'draft',
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 'Manual',
      services: []
    };
    
    const createdId = await firestoreService.create('invoices', newInvoice);
    await loadInvoices();
    setEditingInvoice({ id: createdId, ...newInvoice });
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      await firestoreService.delete('invoices', id);
      await loadInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!id) return;
    try {
      setUpdatingId(id);
      await firestoreService.update('invoices', id, { status });
      await loadInvoices();
    } finally {
      setUpdatingId(null);
    }
  };

  const searchedInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.projectId && projects.find(p => p.id === inv.projectId)?.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredInvoices = searchedInvoices.filter(inv => {
    if (filter === 'paid') return inv.status === 'paid';
    if (filter === 'pending') return ['sent', 'overdue'].includes(inv.status);
    if (filter === 'draft') return inv.status === 'draft';
    return true;
  });

  const stats = {
    totalPaid: invoices.filter(i => i.status === 'paid').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0),
    totalPending: invoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0),
    totalOverdue: invoices.filter(i => i.status === 'overdue').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-10 mt-4">
      {/* Header section matching Genesis design */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-display text-txt-primary">Ledger</h1>
          <p className="text-txt-secondary text-sm font-medium">Manage billing, payments, and financial history.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
          <button onClick={() => setIsModalOpen(true)} className="btn-primary btn-md gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Issue Invoice
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="genesis-card p-6 bg-success/5 border-success/20 group cursor-default">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold uppercase text-success">Total Collected</h3>
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display text-success">{formatCurrency(stats.totalPaid)}</p>
        </div>

        <div className="genesis-card p-6 group cursor-default">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold uppercase text-txt-secondary">Outstanding</h3>
            <div className="w-8 h-8 rounded-lg bg-bg flex items-center justify-center text-txt-secondary border border-ui-border">
              <ReceiptText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display text-txt-primary">{formatCurrency(stats.totalPending)}</p>
        </div>

        <div className="genesis-card p-6 bg-error/5 border-error/20 group cursor-default">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold uppercase text-error">Overdue</h3>
            <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center text-error">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display text-error">{formatCurrency(stats.totalOverdue)}</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex p-1 bg-surface border border-ui-border rounded-lg shadow-sm w-full sm:w-auto overflow-x-auto">
            {['all', 'paid', 'pending', 'draft'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 font-medium text-sm capitalize rounded-md transition-all whitespace-nowrap",
                  filter === f 
                    ? "bg-bg text-txt-primary shadow-sm border border-ui-border" 
                    : "text-txt-secondary hover:text-txt-primary"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-secondary" />
             <input 
               type="text" 
               placeholder="Search invoices..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-9 pr-4 py-2 bg-surface border border-ui-border rounded-lg text-sm text-txt-primary focus:outline-none focus:border-primary transition-colors"
             />
          </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-lg genesis-card p-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display text-txt-primary">New Invoice</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-txt-secondary hover:bg-black/5 p-1 rounded">
                  <X className="w-5 h-5"/>
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="p-5 bg-surface rounded-xl border border-ui-border">
                  <p className="text-sm font-semibold text-primary mb-3">Method A: From Active Project</p>
                  <label className="block text-xs font-medium text-txt-secondary uppercase tracking-wider mb-2">Target Project</label>
                  <select 
                    value={selectedProject}
                    onChange={(e) => {
                      setSelectedProject(e.target.value);
                      setSelectedClientId('');
                    }}
                    className="input-default"
                  >
                    <option value="">-- Choose a Project --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleGenerateInvoice} 
                    disabled={!selectedProject} 
                    className="btn-primary btn-md w-full mt-4"
                  >
                    Generate From Project
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-ui-border"></div></div>
                  <div className="relative flex justify-center"><span className="px-3 bg-bg text-xs font-medium text-txt-secondary uppercase">OR</span></div>
                </div>

                <div className="p-5 bg-surface rounded-xl border border-ui-border">
                  <p className="text-sm font-semibold text-txt-primary mb-3">Method B: Manual Entry</p>
                  <label className="block text-xs font-medium text-txt-secondary uppercase tracking-wider mb-2">Select Client (Optional)</label>
                  <select 
                    value={selectedClientId}
                    onChange={(e) => {
                      setSelectedClientId(e.target.value);
                      setSelectedProject('');
                    }}
                    className="input-default"
                  >
                    <option value="">-- General Billing --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleManualInvoice} 
                    className="btn-secondary btn-md w-full mt-4 gap-2"
                  >
                    Create Blank
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingInvoice && (
          <InvoiceEditor 
            invoice={editingInvoice}
            onClose={() => setEditingInvoice(null)}
            onSave={() => {
              setEditingInvoice(null);
              loadInvoices();
            }}
          />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-20 flex justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-4 border-ui-border border-t-primary rounded-full" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="col-span-full p-20 text-center bg-surface/50 rounded-xl border border-dashed border-ui-border">
            <FileText className="w-10 h-10 mx-auto mb-4 text-neutral" />
            <h3 className="text-xl font-display text-txt-primary mb-2">No Invoices Found</h3>
            <p className="text-sm font-medium text-txt-secondary">No ledgers match your criteria.</p>
          </div>
        ) : (
          filteredInvoices.map((invoice, i) => (
            <motion.div 
              key={invoice.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="genesis-card p-6 flex flex-col group cursor-default hover:-translate-y-[2px]"
            >
               <div className="absolute top-0 right-0 p-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingInvoice(invoice)} className="p-1.5 bg-surface text-txt-secondary hover:text-primary rounded-md border border-ui-border shadow-sm"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteInvoice(invoice.id)} className="p-1.5 bg-surface text-txt-secondary hover:text-error hover:bg-error/5 rounded-md border border-ui-border shadow-sm"><X className="w-4 h-4" /></button>
               </div>

               <div className="flex items-center gap-2 mb-4 pr-16">
                  <span className={cn(
                    "chip-default capitalize border-0",
                    invoice.status === 'paid' ? "bg-success/10 text-success" : 
                    invoice.status === 'sent' ? "bg-primary/10 text-primary" : 
                    invoice.status === 'overdue' ? "bg-error/10 text-error" : 
                    "bg-warning/10 text-warning"
                  )}>
                    {invoice.status}
                  </span>
                  <span className="text-[11px] font-medium uppercase text-txt-secondary bg-surface px-2 py-1 rounded bg-bg border border-ui-border truncate">
                    {invoice.projectId ? (projects.find(p => p.id === invoice.projectId)?.title || 'Project') : 'Standard'}
                  </span>
               </div>

               <div className="mb-6">
                  <h3 className="text-2xl font-display text-txt-primary mb-1">{invoice.invoiceNumber}</h3>
                  <p className="text-[12px] font-medium text-txt-secondary uppercase tracking-wider">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
               </div>

               <div className="mt-auto pt-4 border-t border-ui-border flex items-center justify-between">
                  <div>
                     <p className="text-[11px] font-semibold text-txt-secondary uppercase tracking-widest mb-1">Total Due</p>
                     <p className="font-mono text-xl font-bold text-txt-primary">{formatCurrency(invoice.amount)}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                     {invoice.status !== 'paid' && (
                        <button
                          onClick={() => handleUpdateStatus(invoice.id, 'paid')}
                          disabled={updatingId === invoice.id}
                          className="p-2 rounded-md bg-surface border border-ui-border text-txt-secondary hover:text-success hover:bg-success/10 transition-colors"
                          title="Mark Paid"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                     )}
                     <button
                       onClick={() => {
                         const url = new URL(window.location.href);
                         url.searchParams.set('invoice', invoice.id);
                         window.open(url.toString(), '_blank');
                       }}
                       className="p-2 rounded-md bg-txt-primary text-bg hover:bg-primary transition-colors"
                       title="View Invoice"
                     >
                        <ExternalLink className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
