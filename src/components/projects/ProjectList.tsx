import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, Plus, ExternalLink, ArrowRight, ChevronRight, X, MoreHorizontal, Sparkles, RefreshCcw, HandCoins, Activity, Box } from 'lucide-react';
import { suggestTasks } from '../../services/aiService';
import { firestoreService } from '../../services/firestoreService';
import { formatCurrency, cn } from '../../lib/utils';
import { collection, query, getDocs, where, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';

export function ProjectList() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  
  // Project Creation State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newStatus, setNewStatus] = useState('planned');
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadProjects();
    loadClients();
  }, []);

  const loadClients = async () => {
    const data = await firestoreService.list('clients');
    setClients(data || []);
  };

  const openAddModal = () => {
    setEditingProject(null);
    setNewTitle('');
    setNewBudget('');
    setNewStatus('untouched');
    setSelectedClient('');
    setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, project: any) => {
    e.stopPropagation();
    setEditingProject(project);
    setNewTitle(project.title);
    setNewBudget(project.budget.toString());
    setNewStatus(project.status || 'untouched');
    setSelectedClient(project.clientId || '');
    setIsModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    try {
      setSaving(true);
      const projectData = {
        title: newTitle,
        clientId: selectedClient || null,
        budget: Number(newBudget) || 0,
        status: editingProject ? newStatus : (newStatus || 'untouched'),
      };

      if (editingProject) {
        await firestoreService.update('projects', editingProject.id, projectData);
      } else {
        await firestoreService.create('projects', {
          ...projectData,
          createdAt: new Date().toISOString(),
          type: 'client'
        });
      }

      setIsModalOpen(false);
      await loadProjects();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await firestoreService.delete('projects', id);
      await loadProjects();
    } catch (error) {
      console.error(error);
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    const data = await firestoreService.list('projects');
    
    // Fetch expenses for all projects to calculate total expenses and profit
    const expensesQuery = query(collection(db, 'expenses'), where('userId', '==', auth.currentUser?.uid));
    const expensesSnap = await getDocs(expensesQuery);
    const expenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

    // Fetch invoices to get total payments for profit logic
    const invoicesQuery = query(collection(db, 'invoices'), where('userId', '==', auth.currentUser?.uid));
    const invoicesSnap = await getDocs(invoicesQuery);
    const invoices = invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

    const enrichedProjects = (data || []).map(p => {
      const pExpenses = expenses.filter(e => e.projectId === p.id);
      const totalExpenses = pExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      
      const pInvoices = invoices.filter(i => i.projectId === p.id && i.status === 'paid');
      const totalPayments = pInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      
      const profit = totalPayments - totalExpenses;
      
      return {
        ...p,
        totalExpenses,
        totalPayments,
        profit,
        expensesList: pExpenses
      };
    });

    setProjects(enrichedProjects);
    setLoading(false);
  };

  const filteredProjects = projects.filter(p => {
    if (filter === 'active') return ['planned', 'started'].includes(p.status);
    if (filter === 'completed') return p.status === 'finished';
    return true;
  });

  if (selectedProject) {
    return <ProjectDetails project={selectedProject} onBack={() => { setSelectedProject(null); loadProjects(); }} clients={clients} />;
  }

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 text-brand-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            <Briefcase className="w-3.5 h-3.5" /> Program Management
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Pipeline</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-end">
          <div className="flex p-1.5 bg-slate-100 dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-inner">
            {['all', 'active', 'completed'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-5 py-2.5 font-black text-xs uppercase tracking-[0.2em] rounded-xl transition-all",
                  filter === f 
                    ? "bg-white dark:bg-slate-800 shadow-md text-brand-600 dark:text-brand-400" 
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <button onClick={openAddModal} className="bg-slate-900 dark:bg-brand-600 text-white hover:bg-slate-800 dark:hover:bg-brand-500 px-6 py-3 rounded-2xl font-black transition-all shadow-xl shadow-slate-900/20 dark:shadow-brand-500/20 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto uppercase tracking-widest text-xs border border-white/10 relative overflow-hidden group">
            <span className="relative z-10 flex items-center gap-2"><Plus className="w-4 h-4" /> Initialize</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
          </button>
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
              className="relative z-10 w-full max-w-xl bg-white dark:bg-dark-card rounded-[2.5rem] p-8 sm:p-10 shadow-2xl border border-slate-200 dark:border-dark-border overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
                {editingProject ? 'Configure Project' : 'New Project'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 border-b border-slate-100 dark:border-dark-border pb-6">Establish project parameters</p>
              
              <form onSubmit={handleSaveProject} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Codename / Title <span className="text-rose-500">*</span></label>
                  <input type="text" required value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-2xl font-bold focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-800 dark:text-slate-200 text-sm" placeholder="Alpha Protocol v2" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Associated Client</label>
                    <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-2xl font-bold focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-800 dark:text-slate-200 text-sm">
                      <option value="">-- Internal / Skunkworks --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Status</label>
                    <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-2xl font-bold focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-800 dark:text-slate-200 text-sm">
                      <option value="untouched">Untouched</option>
                      <option value="planned">Planned / Scoping</option>
                      <option value="started">In Progress</option>
                      <option value="paused">On Hold</option>
                      <option value="finished">Completed</option>
                      <option value="left">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Financial Cap Target</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                    <input type="number" min="0" step="100" value={newBudget} onChange={e => setNewBudget(e.target.value)} className="w-full pl-10 pr-5 py-4 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-2xl font-bold focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-800 dark:text-slate-200 text-sm font-mono" placeholder="50000" />
                  </div>
                </div>
                
                <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 dark:border-dark-border">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-2xl font-black text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-bg transition-colors uppercase tracking-widest text-xs">
                    Abort
                  </button>
                  <button type="submit" disabled={saving || !newTitle} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-2xl font-black transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 uppercase tracking-widest text-xs border border-white/10 border-b-transparent active:translate-y-px">
                    {saving ? 'Processing...' : editingProject ? 'Update Core' : 'Launch Project'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {loading ? (
          <div className="col-span-full p-20 flex justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-slate-200 dark:border-white/10 border-t-brand-500 rounded-full" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full p-20 text-center bg-slate-50 dark:bg-dark-card rounded-[3rem] border border-slate-200 dark:border-dark-border shadow-sm">
            <Box className="w-16 h-16 mx-auto mb-6 text-slate-300 dark:text-slate-600" />
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">No Data Found</h3>
            <p className="text-sm font-bold text-slate-400">Initialize a new project to populate this sector.</p>
          </div>
        ) : (
          filteredProjects.map((project, i) => (
            <motion.div 
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
              onClick={() => setSelectedProject(project)}
              className="group relative bg-white dark:bg-dark-card rounded-[2.5rem] p-8 border border-slate-100 dark:border-dark-border shadow-lg shadow-slate-200/20 dark:shadow-none hover:shadow-2xl hover:shadow-slate-200/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer overflow-hidden flex flex-col"
            >
              <div className="absolute top-0 right-0 p-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                <button onClick={(e) => openEditModal(e, project)} className="p-2 bg-white dark:bg-dark-bg text-slate-400 hover:text-brand-600 rounded-xl shadow-sm border border-slate-100 dark:border-dark-border"><MoreHorizontal className="w-4 h-4" /></button>
                <button onClick={(e) => handleDeleteProject(e, project.id)} className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl shadow-sm transition-colors border border-rose-100 dark:border-rose-500/20"><X className="w-4 h-4" /></button>
              </div>

              <div className="flex flex-col mb-8 pr-20 flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className={cn(
                    "text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-[0.2em] border",
                    project.status === 'finished' ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : 
                    project.status === 'started' ? "bg-brand-50 text-brand-600 border-brand-200 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20" : 
                    project.status === 'paused' ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" : 
                    project.status === 'planned' ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20" : 
                    project.status === 'left' ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20" : 
                    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  )}>
                    {project.status || 'untouched'}
                  </span>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 dark:bg-dark-bg px-2.5 py-1 rounded-lg border border-slate-100 dark:border-white/5 truncate max-w-[120px]">
                    {project.clientId ? clients.find(c => c.id === project.clientId)?.name || 'Client' : 'Internal'}
                  </span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight group-hover:text-brand-600 transition-colors uppercase line-clamp-2">{project.title}</h3>
                  <p className="text-[10px] font-mono font-bold text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em] mt-3">ID:{project.id.slice(0,8)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-8 pt-6 border-t border-slate-100 dark:border-dark-border">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Financial Cap</p>
                  <p className="font-mono text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(project.budget || 0)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Net Yield</p>
                  <p className={cn(
                    "font-mono text-xl font-black inline-block rounded shrink-0", 
                    project.profit >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                  )}>
                    {formatCurrency(project.profit || 0)}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-dark-bg rounded-2xl p-5 flex items-center justify-between gap-6 border border-slate-100 dark:border-white/5">
                 <div className="flex-1 w-full">
                    <div className="flex justify-between items-end mb-2">
                       <span className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">Resource Usage</span>
                       <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{project.budget > 0 ? Math.round((project.totalPayments / project.budget) * 100) : 0}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner flex">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: project.budget > 0 ? `${Math.min(100, (project.totalPayments / project.budget) * 100)}%` : '0%' }}
                         transition={{ duration: 1, ease: "easeOut" }}
                         className={cn("h-full", project.profit < 0 ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]" : "bg-slate-900 dark:bg-white")}
                       />
                    </div>
                 </div>
                 <div className="w-12 h-12 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 group-hover:border-brand-500 group-hover:bg-brand-50 transition-all text-slate-400 group-hover:text-brand-600">
                   <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                 </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function ProjectDetails({ project, onBack, clients }: { project: any, onBack: () => void, clients: any[] }) {
  const [expenses, setExpenses] = useState<any[]>(project.expensesList || []);
  const [tasks, setTasks] = useState<any[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [addingExpense, setAddingExpense] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);

  const clientName = project.clientId ? clients.find(c => c.id === project.clientId)?.name : 'Internal / None';

  const handleAiSuggestTasks = async () => {
    if (isAiSuggesting) return;
    setIsAiSuggesting(true);
    try {
      const suggestions = await suggestTasks(project.title);
      for (const title of suggestions) {
        const newTask = {
          projectId: project.id,
          title,
          completed: false,
          updatedAt: new Date()
        };
        await firestoreService.create('tasks', newTask);
      }
      await loadTasks();
    } catch (e) {
      console.error("AI Task Suggestion failed", e);
    } finally {
      setIsAiSuggesting(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [project.id]);

  const loadTasks = async () => {
    const userId = auth.currentUser?.uid;
    const q = query(
      collection(db, 'tasks'), 
      where('userId', '==', userId),
      where('projectId', '==', project.id)
    );
    const snap = await getDocs(q);
    setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    try {
      setAddingTask(true);
      const newTask = {
        projectId: project.id,
        title: taskTitle,
        completed: false,
        updatedAt: new Date()
      };
      const taskId = await firestoreService.create('tasks', newTask);
      setTasks([...tasks, { id: taskId, ...newTask }]);
      setTaskTitle('');
    } finally {
      setAddingTask(false);
    }
  };

  const toggleTask = async (task: any) => {
    const updated = !task.completed;
    setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: updated } : t));
    try {
      const docRef = doc(db, 'tasks', task.id);
      await updateDoc(docRef, { completed: updated, updatedAt: serverTimestamp() });
    } catch(err) {
      console.error(err);
      // Revert on error
      setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !updated } : t));
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await firestoreService.delete('tasks', id);
      setTasks(tasks.filter(t => t.id !== id));
    } catch(err) {
      console.error(err);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    try {
      setAddingExpense(true);
      const newExpense = {
        projectId: project.id,
        description,
        amount: Number(amount),
        date: new Date().toISOString()
      };
      const expenseId = await firestoreService.create('expenses', newExpense);
      setExpenses([{ id: expenseId, ...newExpense }, ...expenses]);
      setDescription('');
      setAmount('');
      setAddingExpense(false);
    } catch(err) {
      console.error(err);
      setAddingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await firestoreService.delete('expenses', id);
      setExpenses(expenses.filter(e => e.id !== id));
    } catch(err) {
      console.error(err);
    }
  };

  const currentExpensesTotal = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const currentProfit = project.totalPayments - currentExpensesTotal;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button onClick={onBack} className="text-sm font-black text-slate-500 hover:text-brand-600 transition-colors flex items-center gap-2 px-4 py-2 hover:bg-slate-100 dark:hover:bg-dark-card rounded-xl uppercase tracking-widest">
          <ChevronRight className="w-4 h-4 rotate-180" /> Pipeline
        </button>
        <button 
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.set('portal', project.id);
            window.open(url.toString(), '_blank');
          }}
          className="bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:hover:bg-brand-500/20 px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-colors text-xs uppercase tracking-widest w-full sm:w-auto justify-center shadow-inner"
        >
          <ExternalLink className="w-4 h-4" /> Client Portal Interface
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-slate-900 dark:bg-dark-card text-white rounded-[2.5rem] p-10 sm:p-12 shadow-2xl relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/20 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-start gap-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className={cn(
                  "text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-[0.2em] shadow-inner",
                  project.status === 'finished' ? "bg-emerald-500 text-emerald-50 border border-emerald-400/20" : 
                  project.status === 'started' ? "bg-brand-500 text-brand-50 border border-brand-400/20" : 
                  project.status === 'paused' ? "bg-amber-500 text-amber-50 border border-amber-400/20" : 
                  project.status === 'planned' ? "bg-indigo-500 text-indigo-50 border border-indigo-400/20" : 
                  project.status === 'left' ? "bg-rose-500 text-rose-50 border border-rose-400/20" : 
                  "bg-slate-800 text-slate-300 border border-white/10"
                )}>
                  {project.status || 'untouched'}
                </span>
                <span className="text-[10px] bg-white/10 border border-white/5 text-white/70 font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">
                  {clientName}
                </span>
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter mb-4 uppercase leading-[0.9] text-white drop-shadow-xl">{project.title}</h1>
                <p className="text-white/40 font-mono text-sm tracking-[0.3em] uppercase">ID :: {project.id}</p>
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="bg-white dark:bg-dark-card rounded-[2.5rem] p-8 sm:p-10 border border-slate-200 dark:border-dark-border shadow-xl">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Mission Control</h3>
                  <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-[0.2em]">Operational Objectives</p>
                </div>
                <button 
                  onClick={handleAiSuggestTasks}
                  disabled={isAiSuggesting}
                  className="px-5 py-3 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-inner hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  {isAiSuggesting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isAiSuggesting ? "Generating..." : "Auto-Plan Mission"}
                </button>
             </div>

             <form onSubmit={handleAddTask} className="flex gap-4 mb-10">
               <input
                 type="text"
                 value={taskTitle}
                 onChange={e => setTaskTitle(e.target.value)}
                 placeholder="Define new objective..."
                 className="flex-1 px-6 py-4 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-2xl font-bold focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-800 dark:text-slate-200"
               />
               <button 
                 type="submit"
                 disabled={addingTask || !taskTitle}
                 className="bg-slate-900 py-4 px-6 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black transition-all disabled:opacity-50 flex items-center justify-center shadow-xl shadow-slate-900/10 border border-white/10 active:scale-95 shrink-0"
               >
                 <Plus className="w-6 h-6" />
               </button>
             </form>

             <div className="space-y-3">
               {tasks.length === 0 ? (
                 <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl">
                   <Activity className="w-8 h-8 text-slate-300 mx-auto mb-4" />
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Active Objectives</p>
                 </div>
               ) : (
                 tasks.map((task: any) => (
                   <div key={task.id} className="flex items-center justify-between p-5 bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded-2xl group/task transition-all hover:shadow-md hover:border-brand-200 dark:hover:border-brand-500/30">
                     <label className="flex items-center gap-5 cursor-pointer flex-1 overflow-hidden">
                       <div className="relative flex items-center justify-center">
                         <input 
                           type="checkbox" 
                           checked={task.completed} 
                           onChange={() => toggleTask(task)}
                           className="w-6 h-6 rounded-lg border-2 border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500 focus:ring-offset-2 appearance-none checked:bg-brand-600 checked:border-brand-600 transition-colors cursor-pointer"
                         />
                         {task.completed && <Box className="w-3.5 h-3.5 text-white absolute pointer-events-none" />}
                       </div>
                       <span className={cn(
                         "font-bold text-base md:text-lg select-none truncate transition-all duration-300", 
                         task.completed ? "text-slate-300 dark:text-slate-600 line-through" : "text-slate-800 dark:text-slate-200"
                       )}>
                         {task.title}
                       </span>
                     </label>
                     <button 
                       onClick={() => handleDeleteTask(task.id)}
                       className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all ml-4 shrink-0"
                     >
                       <X className="w-5 h-5" />
                     </button>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-dark-card rounded-[2.5rem] p-8 border border-slate-200 dark:border-dark-border shadow-xl">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">Financial Ledger</h3>
            
            <div className="space-y-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Approved Budget Cap</p>
                <p className="text-3xl font-mono font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(project.budget || 0)}</p>
              </div>
              
              <div className="h-px bg-slate-100 dark:bg-dark-border w-full" />
              
              <div className="grid grid-cols-2 gap-6">
                 <div>
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 line-clamp-1">Gross Collected</p>
                   <p className="text-xl font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(project.totalPayments)}</p>
                 </div>
                 <div>
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 line-clamp-1">Gross Expenses</p>
                   <p className="text-xl font-mono font-bold text-rose-500">{formatCurrency(currentExpensesTotal)}</p>
                 </div>
              </div>
              
              <div className={cn(
                 "p-6 sm:p-8 rounded-[2rem] relative overflow-hidden",
                 currentProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-500/5 text-emerald-900 dark:text-emerald-50" : "bg-rose-50 dark:bg-rose-500/5 text-rose-900 dark:text-rose-50"
              )}>
                <div className="relative z-10">
                  <p className={cn(
                     "text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80",
                     currentProfit >= 0 ? "text-emerald-600 drop-shadow-sm" : "text-rose-600 drop-shadow-sm"
                  )}>Calculated Net Yield</p>
                  <p className={cn(
                     "text-4xl sm:text-5xl font-mono font-black tracking-tighter drop-shadow-sm",
                     currentProfit >= 0 ? "text-emerald-500" : "text-rose-500"
                  )}>{formatCurrency(currentProfit)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Add Expense Section */}
          <div className="bg-slate-50 dark:bg-dark-bg rounded-[2.5rem] p-8 border border-slate-200 dark:border-dark-border shadow-inner">
             <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                <HandCoins className="w-5 h-5 text-rose-500" /> Capital Burn
             </h3>
             <form onSubmit={handleAddExpense} className="space-y-4">
               <div>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-5 py-4 bg-white dark:bg-dark-card border border-slate-200 dark:border-white/5 rounded-2xl font-bold focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400"
                    placeholder="Brief description..."
                  />
               </div>
               <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full pl-10 pr-5 py-4 bg-white dark:bg-dark-card border border-slate-200 dark:border-white/5 rounded-2xl font-bold focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-800 dark:text-slate-200 text-sm font-mono placeholder:text-slate-400"
                    placeholder="0.00"
                  />
               </div>
               <button 
                 type="submit" 
                 disabled={addingExpense || !amount || !description}
                 className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all disabled:opacity-50 active:scale-95"
               >
                 {addingExpense ? 'Recording...' : 'Register Expense'}
               </button>
             </form>
             
             {/* Expense History Preview */}
             {expenses.length > 0 && (
               <div className="mt-8 border-t border-slate-200 dark:border-dark-border pt-6">
                 <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Recent Burn Log</h4>
                 <div className="space-y-3">
                   {expenses.slice(0, 5).map((exp: any, i: number) => (
                      <div key={exp.id || i} className="flex justify-between items-center p-3 bg-white dark:bg-dark-card rounded-xl border border-slate-100 dark:border-white/5">
                         <div className="overflow-hidden">
                           <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{exp.description}</p>
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date(exp.date).toLocaleDateString()}</p>
                         </div>
                         <div className="flex items-center gap-3 shrink-0 ml-2">
                           <p className="text-sm font-mono font-bold text-rose-500">{formatCurrency(exp.amount)}</p>
                           <button 
                             onClick={() => handleDeleteExpense(exp.id)}
                             className="text-slate-300 hover:text-rose-500 p-1"
                           >
                             <X className="w-3 h-3" />
                           </button>
                         </div>
                      </div>
                   ))}
                 </div>
               </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}
