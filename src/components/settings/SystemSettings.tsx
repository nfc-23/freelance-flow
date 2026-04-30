import { useState } from 'react';
import { RefreshCw, Trash2, Database, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { firestoreService } from '../../services/firestoreService';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function SystemSettings({ onReset }: { onReset: () => void }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<string | null>(null);
  const [confirmInput, setConfirmInput] = useState('');

  const handleReset = async (type: string) => {
    setLoading(type);
    try {
      if (type === 'all') {
        await firestoreService.resetAllData();
      } else if (type === 'invoices') {
        await firestoreService.clearCollection('invoices');
        await firestoreService.clearCollection('expenses');
      } else if (type === 'projects') {
        await firestoreService.clearCollection('projects');
        await firestoreService.clearCollection('tasks');
        await firestoreService.clearCollection('project_comments');
      } else {
        await firestoreService.clearCollection(type);
      }
      setSuccess(type);
      setTimeout(() => setSuccess(null), 3000);
      onReset();
    } catch (error) {
      console.error("Reset failed:", error);
    } finally {
      setLoading(null);
      setConfirmingAction(null);
      setConfirmInput('');
    }
  };

  const handleSeed = async () => {
    setLoading('seed');
    await firestoreService.seedDemoData();
    setSuccess('seed');
    setTimeout(() => setSuccess(null), 3000);
    onReset();
    setLoading(null);
  };

  const sections = [
    { id: 'all', title: 'Full System Reset', desc: 'Wipe every single client, project, invoice, and task. Everything goes back to zero.', icon: <RefreshCw />, color: 'rose' },
    { id: 'clients', title: 'Clear Clients', desc: 'Delete all client entries. This will likely make related projects and invoices invalid.', icon: <Database />, color: 'amber' },
    { id: 'projects', title: 'Clear Projects', desc: 'Remove all project tracking data and progress logs.', icon: <Database />, color: 'amber' },
    { id: 'invoices', title: 'Clear Financials', desc: 'Delete all invoices and payment history records.', icon: <Database />, color: 'amber' },
    { id: 'tasks', title: 'Clear Tasks', desc: 'Remove todo lists and completed task histories.', icon: <Database />, color: 'amber' }
  ];

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Danger Zone</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage data destruction and workflow resets.</p>
        </div>
      </div>

      <AnimatePresence>
        {confirmingAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setConfirmingAction(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-md bg-white dark:bg-dark-card rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 dark:border-dark-border"
            >
              <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
              
              <h3 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">Are you absolutely sure?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-center mb-8 leading-relaxed">
                This action will permanently delete <span className="font-bold text-rose-500">{confirmingAction === 'all' ? 'ALL SYSTEM DATA' : confirmingAction}</span>. This cannot be undone.
              </p>

              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Type <span className="text-rose-500">RESET</span> to confirm</p>
                <input 
                  type="text" 
                  value={confirmInput} 
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="RESET"
                  className="w-full px-6 py-4 bg-slate-100 dark:bg-dark-bg border-none rounded-2xl text-center font-black tracking-[0.2em] uppercase focus:ring-2 focus:ring-rose-500/20 outline-none text-slate-800 dark:text-white"
                />
                
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setConfirmingAction(null)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-bg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => confirmingAction && handleReset(confirmingAction)}
                    disabled={confirmInput !== 'RESET'}
                    className="flex-1 px-6 py-4 bg-rose-500 hover:bg-rose-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all shadow-xl shadow-rose-500/20 active:scale-95"
                  >
                    Execute Reset
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <div 
            key={section.id} 
            className={cn(
               "glass-card p-6 rounded-[2rem] border-l-4 transition-all hover:shadow-xl",
               section.id === 'all' ? "border-rose-500" : "border-amber-500"
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn(
                "p-3 rounded-2xl text-white",
                section.id === 'all' ? "bg-rose-500 shadow-lg shadow-rose-500/20" : "bg-amber-500 shadow-lg shadow-amber-500/20"
              )}>
                {section.icon}
              </div>
              {success === section.id && (
                <div className="flex items-center space-x-1 text-emerald-500 text-xs font-bold animate-pulse">
                  <CheckCircle className="w-3 h-3" />
                  <span>Wiped</span>
                </div>
              )}
            </div>

            <h3 className="font-bold text-xl mb-2">{section.title}</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-6 leading-relaxed">
              {section.desc}
            </p>

            <button
              onClick={() => setConfirmingAction(section.id)}
              disabled={loading !== null}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition-all active:scale-95",
                section.id === 'all' 
                  ? "bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/10"
                  : "bg-amber-500/10 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/20"
              )}
            >
              {loading === section.id ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Reset {section.id === 'all' ? 'Everything' : section.id.charAt(0).toUpperCase() + section.id.slice(1)}</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="p-10 rounded-[3rem] bg-brand-500/5 border border-brand-500/10 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-brand-500/10 text-brand-500 rounded-3xl flex items-center justify-center mb-6">
          <Database className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Restoring Sample Intelligence?</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm leading-relaxed">
          If you've wiped your data, you can always seed it again with our demo template to see how the dashboard performs.
        </p>
        <button 
           onClick={handleSeed}
           disabled={loading !== null}
           className="px-10 py-4 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/20 active:scale-95 disabled:opacity-50"
        >
          {loading === 'seed' ? <RefreshCw className="w-5 h-5 animate-spin mr-2 inline" /> : 'Apply Demo Intelligence'}
        </button>
      </div>
    </div>
  );
}

