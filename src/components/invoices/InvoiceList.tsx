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
    <div className="space-y-12 max-w-7xl mx-auto pb-10">
      {/* Header section matching ProjectList design */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            <Wallet className="w-3.5 h-3.5" /> Bookkeeping
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Ledger</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-end">
          <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 dark:bg-emerald-600 text-white hover:bg-slate-800 dark:hover:bg-emerald-500 px-6 py-3 rounded-2xl font-black transition-all shadow-xl shadow-slate-900/20 dark:shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto uppercase tracking-widest text-xs border border-white/10 relative overflow-hidden group">
            <span className="relative z-10 flex items-center gap-2"><Plus className="w-4 h-4" /> Issue Invoice</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-[2rem] p-6 border border-emerald-100 dark:border-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Total Collected</h3>
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-mono font-black text-emerald-700 dark:text-emerald-300 tracking-tighter">{formatCurrency(stats.totalPaid)}</p>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-[2rem] p-6 border border-slate-200 dark:border-dark-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Outstanding</h3>
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
              <ReceiptText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-mono font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(stats.totalPending)}</p>
        </div>

        <div className="bg-rose-50 dark:bg-rose-500/10 rounded-[2rem] p-6 border border-rose-100 dark:border-rose-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">Overdue</h3>
            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-mono font-black text-rose-700 dark:text-rose-300 tracking-tighter">{formatCurrency(stats.totalOverdue)}</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
         <div className="flex p-1.5 bg-slate-100 dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-inner w-full sm:w-auto overflow-x-auto">
            {['all', 'paid', 'pending', 'draft'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-5 py-2.5 font-black text-xs uppercase tracking-[0.2em] rounded-xl transition-all whitespace-nowrap",
                  filter === f 
                    ? "bg-white dark:bg-slate-800 shadow-md text-emerald-600 dark:text-emerald-400" 
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search invoices..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-11 pr-4 py-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-800 dark:text-slate-200"
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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-dark-card rounded-[2.5rem] p-8 sm:p-10 shadow-2xl border border-slate-200 dark:border-dark-border overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">New Invoice</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 border-b border-slate-100 dark:border-dark-border pb-6">Select Generation Method</p>
              
              <div className="space-y-6">
                <div className="p-6 bg-slate-50 dark:bg-dark-bg/50 rounded-2xl border border-slate-100 dark:border-dark-border">
                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4">Method A: From Project</p>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Project</label>
                  <select 
                    value={selectedProject}
                    onChange={(e) => {
                      setSelectedProject(e.target.value);
                      setSelectedClientId('');
                    }}
                    className="w-full px-5 py-4 bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-2xl font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-800 dark:text-slate-200 text-sm appearance-none"
                  >
                    <option value="">-- Choose a Project --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleGenerateInvoice} 
                    disabled={!selectedProject} 
                    className="w-full mt-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span>Generate</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-dark-border"></div></div>
                  <div className="relative flex justify-center"><span className="px-4 bg-white dark:bg-dark-card text-[9px] font-black text-slate-300 uppercase tracking-widest">OR</span></div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-dark-bg/50 rounded-2xl border border-slate-100 dark:border-dark-border">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Method B: Manual Entry</p>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Client (Optional)</label>
                  <select 
                    value={selectedClientId}
                    onChange={(e) => {
                      setSelectedClientId(e.target.value);
                      setSelectedProject('');
                    }}
                    className="w-full px-5 py-4 bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-2xl font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-800 dark:text-slate-200 text-sm appearance-none"
                  >
                    <option value="">-- General Billing --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleManualInvoice} 
                    className="w-full mt-4 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <span>Create Blank</span>
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-dark-border flex justify-end">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-2xl font-black text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-bg transition-colors uppercase tracking-widest text-xs">
                    Cancel
                  </button>
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
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-slate-200 dark:border-white/10 border-t-emerald-500 rounded-full" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="col-span-full p-20 text-center bg-slate-50 dark:bg-dark-card rounded-[3rem] border border-slate-200 dark:border-dark-border shadow-sm">
            <FileText className="w-16 h-16 mx-auto mb-6 text-slate-300 dark:text-slate-600" />
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">No Invoices Found</h3>
            <p className="text-sm font-bold text-slate-400">No ledgers match your current criteria.</p>
          </div>
        ) : (
          filteredInvoices.map((invoice, i) => (
            <motion.div 
              key={invoice.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
              className="group relative bg-white dark:bg-dark-card rounded-[2rem] p-8 border border-slate-200 dark:border-dark-border shadow-md hover:shadow-xl transition-all cursor-default flex flex-col"
            >
               <div className="absolute top-0 right-0 p-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                  <button onClick={() => setEditingInvoice(invoice)} className="p-2 bg-white dark:bg-dark-bg text-slate-400 hover:text-emerald-600 rounded-xl shadow-sm border border-slate-100 dark:border-dark-border"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteInvoice(invoice.id)} className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl shadow-sm transition-colors border border-rose-100 dark:border-rose-500/20"><X className="w-4 h-4" /></button>
               </div>

               <div className="flex items-center gap-3 mb-6 pr-20">
                  <span className={cn(
                    "text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-[0.2em] border",
                    invoice.status === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : 
                    invoice.status === 'sent' ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20" : 
                    invoice.status === 'overdue' ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20" : 
                    "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                  )}>
                    {invoice.status}
                  </span>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 dark:bg-dark-bg px-2.5 py-1 rounded-lg border border-slate-100 dark:border-white/5 truncate">
                    {invoice.projectId ? (projects.find(p => p.id === invoice.projectId)?.title || 'Project') : 'Standard'}
                  </span>
               </div>

               <div className="mb-8">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight uppercase mb-2">{invoice.invoiceNumber}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
               </div>

               <div className="mt-auto pt-6 border-t border-slate-100 dark:border-dark-border flex items-center justify-between">
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Due</p>
                     <p className="font-mono text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(invoice.amount)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                     {invoice.status !== 'paid' && (
                        <button
                          onClick={() => handleUpdateStatus(invoice.id, 'paid')}
                          disabled={updatingId === invoice.id}
                          className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-dark-bg dark:hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-600 flex items-center justify-center transition-all border border-slate-100 dark:border-dark-border"
                          title="Mark Paid"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                     )}
                     <button
                       onClick={() => {
                         const url = new URL(window.location.href);
                         url.searchParams.set('invoice', invoice.id);
                         window.open(url.toString(), '_blank');
                       }}
                       className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 flex items-center justify-center transition-all shadow-md active:scale-95"
                       title="View Invoice"
                     >
                        <ExternalLink className="w-5 h-5" />
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
