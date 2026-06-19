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
    <div className="max-w-4xl space-y-8 mt-4 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-display text-txt-primary flex items-center gap-3">
            <span className="p-1.5 bg-error/10 text-error rounded-md"><AlertTriangle className="w-6 h-6" /></span>
             Danger Zone
          </h1>
          <p className="text-txt-secondary text-sm font-medium">Manage data destruction and workflow resets.</p>
        </div>
      </div>

      <AnimatePresence>
        {confirmingAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setConfirmingAction(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-md genesis-card p-8"
            >
              <div className="w-12 h-12 bg-error/10 text-error rounded-xl flex items-center justify-center mb-6 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <h3 className="text-xl font-display text-center text-txt-primary mb-2">Are you sure?</h3>
              <p className="text-txt-secondary text-center text-sm mb-6 leading-relaxed">
                This action will permanently delete <span className="font-semibold text-error">{confirmingAction === 'all' ? 'ALL SYSTEM DATA' : confirmingAction}</span>. This cannot be undone.
              </p>

              <div className="space-y-4">
                <p className="text-xs font-semibold text-txt-secondary uppercase tracking-widest text-center">Type <span className="text-error">RESET</span> to confirm</p>
                <input 
                  type="text" 
                  value={confirmInput} 
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="RESET"
                  className="input-default text-center font-mono tracking-widest uppercase focus:border-error"
                />
                
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setConfirmingAction(null)}
                    className="btn-secondary btn-md flex-1"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => confirmingAction && handleReset(confirmingAction)}
                    disabled={confirmInput !== 'RESET' || loading !== null}
                    className="flex-1 px-4 py-2 bg-error text-white hover:bg-error/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-md font-medium transition-colors shadow-sm text-sm"
                  >
                    {loading ? 'Processing...' : 'Execute Reset'}
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
               "genesis-card p-6 border-l-4",
               section.id === 'all' ? "border-l-error" : "border-l-warning"
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn(
                "p-2 rounded-lg text-bg",
                section.id === 'all' ? "bg-error" : "bg-warning"
              )}>
                {section.icon}
              </div>
              {success === section.id && (
                <div className="flex items-center space-x-1 text-success text-xs font-bold animate-pulse">
                  <CheckCircle className="w-4 h-4" />
                  <span>Wiped</span>
                </div>
              )}
            </div>

            <h3 className="font-display text-lg mb-2 text-txt-primary">{section.title}</h3>
            <p className="text-sm text-txt-secondary mb-6 leading-relaxed">
              {section.desc}
            </p>

            <button
              onClick={() => setConfirmingAction(section.id)}
              disabled={loading !== null}
              className={cn(
                "w-full py-2.5 rounded-md font-medium text-sm flex items-center justify-center space-x-2 transition-colors",
                section.id === 'all' 
                  ? "bg-error text-white hover:bg-error/90 shadow-sm"
                  : "bg-warning/10 text-warning hover:bg-warning/20 border border-warning/20"
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

      <div className="p-8 rounded-xl bg-primary/5 border border-primary/10 flex flex-col items-center text-center mt-8">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
          <Database className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-display mb-2 text-txt-primary">Restoring Sample Intelligence?</h3>
        <p className="text-txt-secondary text-sm mb-6 max-w-sm leading-relaxed">
          If you have wiped your data, you can always seed it again with our demo template to see how the dashboard performs.
        </p>
        <button 
           onClick={handleSeed}
           disabled={loading !== null}
           className="btn-primary btn-md gap-2"
        >
          {loading === 'seed' ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Apply Demo Data'}
        </button>
      </div>
    </div>
  );
}
