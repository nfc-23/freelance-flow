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
  const [newType, setNewType] = useState('client');
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
    setNewType('client');
    setSelectedClient('');
    setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, project: any) => {
    e.stopPropagation();
    setEditingProject(project);
    setNewTitle(project.title);
    setNewBudget(project.budget.toString());
    setNewStatus(project.status || 'untouched');
    setNewType(project.type || 'client');
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
        type: newType,
        clientId: newType === 'client' ? (selectedClient || null) : null,
        budget: Number(newBudget) || 0,
        status: editingProject ? newStatus : (newStatus || 'untouched'),
      };

      if (editingProject) {
        await firestoreService.update('projects', editingProject.id, projectData);
      } else {
        await firestoreService.create('projects', {
          ...projectData,
          createdAt: new Date().toISOString()
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
    <div className="space-y-12 max-w-7xl mx-auto pb-10 mt-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-display text-txt-primary">Pipeline</h1>
          <p className="text-txt-secondary text-sm font-medium">Manage and monitor all ongoing and past initiatives.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
          <div className="flex p-1 bg-surface border border-ui-border rounded-lg shadow-sm">
            {['all', 'active', 'completed'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 font-medium text-sm capitalize rounded-md transition-all",
                  filter === f 
                    ? "bg-bg text-txt-primary shadow-sm border border-ui-border" 
                    : "text-txt-secondary hover:text-txt-primary"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <button onClick={openAddModal} className="btn-primary btn-md gap-2 w-full sm:w-auto">
             <Plus className="w-4 h-4" /> Initialize
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
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-xl genesis-card p-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display text-txt-primary">
                  {editingProject ? 'Configure Project' : 'New Project'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-txt-secondary hover:bg-black/5 p-1 rounded">
                  <X className="w-5 h-5"/>
                </button>
              </div>
              
              <form onSubmit={handleSaveProject} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-txt-primary mb-2">Project Title *</label>
                  <input type="text" required value={newTitle} onChange={e => setNewTitle(e.target.value)} className="input-default" placeholder="e.g. Genesis Redesign" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-txt-primary mb-2">Type</label>
                    <select value={newType} onChange={e => setNewType(e.target.value)} className="input-default">
                      <option value="client">Client Project</option>
                      <option value="personal">Personal / Internal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-txt-primary mb-2">Status</label>
                    <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input-default">
                      <option value="untouched">Untouched</option>
                      <option value="planned">Planned</option>
                      <option value="started">In Progress</option>
                      <option value="paused">On Hold</option>
                      <option value="finished">Completed</option>
                      <option value="left">Cancelled</option>
                    </select>
                  </div>
                </div>

                {newType === 'client' && (
                  <div>
                    <label className="block text-sm font-medium text-txt-primary mb-2">Client</label>
                    <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="input-default">
                      <option value="">-- Select Client --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-txt-primary mb-2">Target Budget</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-txt-secondary font-medium">$</span>
                    <input type="number" min="0" step="1" value={newBudget} onChange={e => setNewBudget(e.target.value)} className="input-default pl-8" placeholder="5000" />
                  </div>
                </div>
                
                <div className="pt-6 flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary btn-md">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving || !newTitle} className="btn-primary btn-md">
                    {saving ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {loading ? (
           <div className="col-span-full p-20 flex justify-center">
             <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-4 border-ui-border border-t-primary rounded-full" />
           </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full py-20 text-center border border-dashed border-ui-border rounded-xl bg-surface/50">
            <Box className="w-10 h-10 mx-auto mb-4 text-neutral" />
            <h3 className="text-xl font-display text-txt-primary mb-2">No Projects Found</h3>
            <p className="text-sm font-medium text-txt-secondary">Initialize a new project to get started.</p>
          </div>
        ) : (
          filteredProjects.map((project, i) => (
            <motion.div 
              key={project.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
              onClick={() => setSelectedProject(project)}
              className="genesis-card p-6 flex flex-col group cursor-pointer hover:-translate-y-[2px]"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                <button onClick={(e) => openEditModal(e, project)} className="p-1.5 bg-surface text-txt-secondary hover:text-primary rounded-md border border-ui-border shadow-sm"><MoreHorizontal className="w-4 h-4" /></button>
                <button onClick={(e) => handleDeleteProject(e, project.id)} className="p-1.5 bg-surface text-txt-secondary hover:text-error hover:bg-error/5 rounded-md border border-ui-border shadow-sm"><X className="w-4 h-4" /></button>
              </div>

              <div className="flex flex-col mb-6 mt-1 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn(
                    "chip-default capitalize",
                    project.status === 'finished' ? "bg-success/10 text-success" : 
                    project.status === 'started' ? "bg-primary/10 text-primary" : 
                    project.status === 'paused' ? "bg-warning/10 text-warning" : 
                    project.status === 'planned' ? "bg-indigo-100 text-indigo-700" : 
                    project.status === 'left' ? "bg-error/10 text-error" : 
                    "bg-bg text-txt-secondary border border-ui-border"
                  )}>
                    {project.status || 'untouched'}
                  </span>
                  <span className="text-[11px] font-medium uppercase text-txt-secondary bg-surface px-2 py-1 rounded bg-bg border border-ui-border truncate max-w-[120px]">
                    {project.type === 'personal' ? 'Personal' : (project.clientId ? clients.find(c => c.id === project.clientId)?.name || 'Client' : 'Internal')}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-txt-primary leading-snug group-hover:text-primary transition-colors line-clamp-2">{project.title}</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-ui-border">
                <div>
                  <p className="text-xs text-txt-secondary mb-1 uppercase">Budget Cap</p>
                  <p className="font-mono text-lg font-medium text-txt-primary">{formatCurrency(project.budget || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-txt-secondary mb-1 uppercase">Net Yield</p>
                  <p className={cn(
                    "font-mono text-lg font-bold inline-block shrink-0", 
                    project.profit >= 0 ? "text-success" : "text-error"
                  )}>
                    {formatCurrency(project.profit || 0)}
                  </p>
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
  
  // Comments
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const clientName = project.type === 'personal' ? 'Personal' : (project.clientId ? clients.find(c => c.id === project.clientId)?.name : 'Internal');

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
    loadComments();
  }, [project.id]);

  const loadTasks = async () => {
    const userId = auth.currentUser?.uid;
    const q = query(collection(db, 'tasks'), where('userId', '==', userId), where('projectId', '==', project.id));
    const snap = await getDocs(q);
    setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const loadComments = async () => {
    const q = query(collection(db, 'project_comments'), where('projectId', '==', project.id));
    const snap = await getDocs(q);
    setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText) return;

    try {
      setSendingComment(true);
      const success = await firestoreService.addPortalComment(project.id, commentText, 'You');
      if (success) {
        setCommentText('');
        await loadComments();
      }
    } finally {
      setSendingComment(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    try {
      setAddingTask(true);
      const newTask = { projectId: project.id, title: taskTitle, completed: false, updatedAt: new Date() };
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
      await updateDoc(doc(db, 'tasks', task.id), { completed: updated, updatedAt: serverTimestamp() });
    } catch(err) {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !updated } : t));
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await firestoreService.delete('tasks', id);
      setTasks(tasks.filter(t => t.id !== id));
    } catch(err) {}
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    try {
      setAddingExpense(true);
      const newExpense = { projectId: project.id, description, amount: Number(amount), date: new Date().toISOString() };
      const expenseId = await firestoreService.create('expenses', newExpense);
      setExpenses([{ id: expenseId, ...newExpense }, ...expenses]);
      setDescription('');
      setAmount('');
    } finally {
      setAddingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await firestoreService.delete('expenses', id);
      setExpenses(expenses.filter(e => e.id !== id));
    } catch(err) {}
  };

  const currentExpensesTotal = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const currentProfit = project.totalPayments - currentExpensesTotal;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 mt-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button onClick={onBack} className="text-sm font-medium text-txt-secondary hover:text-primary transition-colors flex items-center gap-1.5 px-3 py-1.5 -ml-3 hover:bg-black/5 rounded-md">
          <ChevronRight className="w-4 h-4 rotate-180" /> Back to Pipeline
        </button>
        <button 
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.set('portal', project.id);
            window.open(url.toString(), '_blank');
          }}
          className="btn-secondary btn-md gap-2"
        >
          <ExternalLink className="w-4 h-4" /> Client Portal
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          
          <div className="genesis-card bg-txt-primary text-white p-8 sm:p-10 relative overflow-hidden">
             <div className="relative z-10 flex flex-col items-start gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(
                  "chip-default capitalize border-0",
                  project.status === 'finished' ? "bg-success/20 text-success" : 
                  project.status === 'started' ? "bg-primary/20 text-primary" : 
                  project.status === 'paused' ? "bg-warning/20 text-warning" : 
                  project.status === 'planned' ? "bg-indigo-500/20 text-indigo-300" : 
                  "bg-white/10 text-white"
                )}>
                  {project.status || 'untouched'}
                </span>
                <span className="chip-default bg-white/10 text-white/80 border border-white/5 capitalize">
                  {clientName}
                </span>
              </div>
              <div className="mt-2 text-left">
                <h1 className="text-3xl sm:text-4xl font-display mb-1">{project.title}</h1>
                <p className="text-gray-400 font-mono text-sm">ID: {project.id.slice(0, 8)}</p>
              </div>
            </div>
          </div>

          <div className="genesis-card p-6 sm:p-8">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-display mb-1">Objectives</h3>
                  <p className="text-sm text-txt-secondary">Operational task list</p>
                </div>
                <button 
                  onClick={handleAiSuggestTasks}
                  disabled={isAiSuggesting}
                  className="btn-secondary btn-sm gap-2"
                >
                  {isAiSuggesting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-primary" />}
                  {isAiSuggesting ? "Generating..." : "Auto-Plan"}
                </button>
             </div>

             <form onSubmit={handleAddTask} className="flex gap-3 mb-8">
               <input
                 type="text"
                 value={taskTitle}
                 onChange={e => setTaskTitle(e.target.value)}
                 placeholder="Define new objective..."
                 className="input-default flex-1"
               />
               <button 
                 type="submit"
                 disabled={addingTask || !taskTitle}
                 className="btn-primary btn-md shrink-0 px-4"
               >
                 <Plus className="w-5 h-5" />
               </button>
             </form>

              <div className="space-y-3">
               {tasks.length === 0 ? (
                 <div className="text-center py-10 border border-dashed border-ui-border rounded-xl bg-surface/50">
                   <Activity className="w-6 h-6 text-neutral mx-auto mb-2" />
                   <p className="text-sm font-medium text-txt-secondary">No objectives yet.</p>
                 </div>
               ) : (
                 tasks.map((task: any) => (
                   <div key={task.id} className="flex items-center justify-between p-4 bg-surface border border-ui-border rounded-lg group">
                     <label className="flex items-center gap-3 cursor-pointer flex-1">
                         <input 
                           type="checkbox" 
                           checked={task.completed} 
                           onChange={() => toggleTask(task)}
                           className="w-5 h-5 rounded border-ui-border text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                         />
                       <span className={cn(
                         "font-medium text-sm transition-colors", 
                         task.completed ? "text-neutral line-through" : "text-txt-primary"
                       )}>
                         {task.title}
                       </span>
                     </label>
                     <button 
                       onClick={() => handleDeleteTask(task.id)}
                       className="text-neutral hover:text-error hover:bg-error/10 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                 ))
               )}
             </div>
          </div>
          
          <div className="genesis-card p-6 sm:p-8">
            <h3 className="text-xl font-display mb-6">Discussions</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto mb-6 pr-2 custom-scrollbar">
              {comments.length === 0 ? (
                 <div className="text-center py-8 border border-dashed border-ui-border rounded-xl bg-surface/50">
                   <p className="text-sm font-medium text-txt-secondary">No discussions yet.</p>
                 </div>
              ) : (
                comments.sort((a, b) => {
                  const t1 = a.createdAt?.seconds || 0;
                  const t2 = b.createdAt?.seconds || 0;
                  return t1 - t2;
                }).map((c: any, idx: number) => (
                  <div key={idx} className="bg-surface border border-ui-border p-4 rounded-xl">
                    <p className="text-[12px] font-bold text-txt-secondary mb-1">{c.username}</p>
                    <p className="text-sm text-txt-primary leading-relaxed">{c.text}</p>
                  </div>
                ))
              )}
            </div>
            
            <form onSubmit={handlePostComment} className="flex gap-3">
               <input
                 type="text"
                 value={commentText}
                 onChange={e => setCommentText(e.target.value)}
                 placeholder="Reply or add a note..."
                 className="input-default flex-1"
               />
               <button 
                 type="submit"
                 disabled={sendingComment || !commentText}
                 className="btn-primary btn-md shrink-0 px-4"
               >
                 Send
               </button>
            </form>
          </div>

        </div>

        <div className="space-y-8">
          <div className="genesis-card p-6 sm:p-8">
            <h3 className="text-xl font-display mb-6">Financial Ledger</h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-xs text-txt-secondary mb-1 uppercase">Approved Budget Cap</p>
                <p className="text-2xl font-mono text-txt-primary">{formatCurrency(project.budget || 0)}</p>
              </div>
              
              <div className="h-px bg-ui-border w-full" />
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-xs text-txt-secondary mb-1 uppercase">Gross Collected</p>
                   <p className="text-lg font-mono font-medium text-txt-primary">{formatCurrency(project.totalPayments)}</p>
                 </div>
                 <div>
                   <p className="text-xs text-txt-secondary mb-1 uppercase">Gross Expenses</p>
                   <p className="text-lg font-mono font-medium text-error">{formatCurrency(currentExpensesTotal)}</p>
                 </div>
              </div>
              
              <div className={cn(
                 "p-6 rounded-xl border",
                 currentProfit >= 0 ? "bg-success/5 border-success/20 text-success" : "bg-error/5 border-error/20 text-error"
              )}>
                <div>
                  <p className="text-xs uppercase mb-1 opacity-80 font-medium">Net Yield</p>
                  <p className="text-3xl font-mono font-bold">{formatCurrency(currentProfit)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Add Expense Section */}
          <div className="genesis-card p-6 sm:p-8">
             <h3 className="text-lg font-display mb-4">Capital Burn</h3>
             <form onSubmit={handleAddExpense} className="space-y-3">
               <div>
                  <input
                    type="text" required value={description} onChange={e => setDescription(e.target.value)}
                    className="input-default" placeholder="Description..."
                  />
               </div>
               <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-txt-secondary font-medium">$</span>
                  <input
                    type="number" required min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                    className="input-default pl-8 font-mono" placeholder="0.00"
                  />
               </div>
               <button 
                 type="submit" disabled={addingExpense || !amount || !description}
                 className="btn-secondary btn-md w-full mt-2"
               >
                 {addingExpense ? 'Recording...' : 'Register Expense'}
               </button>
             </form>
             
             {expenses.length > 0 && (
               <div className="mt-6 border-t border-ui-border pt-4">
                 <h4 className="text-xs text-txt-secondary uppercase mb-3">Recent Burn</h4>
                 <div className="space-y-2">
                   {expenses.slice(0, 5).map((exp: any, i: number) => (
                      <div key={exp.id || i} className="flex justify-between items-center p-3 bg-bg rounded-md border border-ui-border">
                         <div className="overflow-hidden">
                           <p className="text-[13px] font-medium text-txt-primary truncate">{exp.description}</p>
                           <p className="text-[10px] text-txt-secondary mt-0.5">{new Date(exp.date).toLocaleDateString()}</p>
                         </div>
                         <div className="flex items-center gap-2 shrink-0">
                           <p className="text-[13px] font-mono font-medium text-error">{formatCurrency(exp.amount)}</p>
                           <button onClick={() => handleDeleteExpense(exp.id)} className="text-neutral hover:text-error p-1">
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
