import { useState } from 'react';
import { RefreshCw, Trash2, Database, AlertTriangle, CheckCircle, X, Code2, FileSpreadsheet, UploadCloud, Download, ShieldCheck, Globe, ExternalLink } from 'lucide-react';
import { firestoreService } from '../../services/firestoreService';
import { excelService } from '../../services/excelService';
import { auth } from '../../services/firebase';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export function SystemSettings({ onReset, onNavigate }: { onReset: () => void; onNavigate?: (view: string) => void }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<string | null>(null);
  const [confirmInput, setConfirmInput] = useState('');

  const handleExportMyAccount = async () => {
    try {
      const user = (await import('../../services/firebase')).auth.currentUser;
      if (!user) return toast.error('No logged in user');
      const loadToast = toast.loading('Compiling Excel workbook...');
      const fullData = await firestoreService.exportAccountData(user.uid);
      excelService.exportAccountToExcel(fullData);
      toast.success('Account exported as .xlsx workbook!', { id: loadToast });
    } catch (err: any) {
      toast.error('Export failed: ' + err.message);
    }
  };

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

  const isDev = firestoreService.isDeveloper(auth.currentUser);

  return (
    <div className="max-w-4xl space-y-8 mt-4 pb-10">
      {/* Developer & Telemetry Card (Only visible to Authorized Developers) */}
      {isDev ? (
        <div className="p-6 bg-surface border border-ui-border rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ui-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-txt-primary">Developer Console & Telemetry</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white uppercase">
                    Superuser
                  </span>
                </div>
                <p className="text-xs text-txt-secondary mt-0.5">
                  Inspect visitors, user accounts, and all database records. Export and import entire account workbooks.
                </p>
              </div>
            </div>

            {onNavigate && (
              <button
                onClick={() => onNavigate('developer')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-sm transition-all shrink-0"
              >
                <ShieldCheck className="w-4 h-4" />
                Open Developer Console
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-bg border border-ui-border rounded-xl flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-txt-primary">Export Account (.xlsx)</p>
                <p className="text-[11px] text-txt-secondary">Download all your projects, tasks, invoices, and clients as an Excel spreadsheet.</p>
              </div>
              <button
                onClick={handleExportMyAccount}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-all shrink-0 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>

            <div className="p-3.5 bg-bg border border-ui-border rounded-xl flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-txt-primary">Account Migrator</p>
                <p className="text-[11px] text-txt-secondary">Import an Excel or JSON account backup from another user or file.</p>
              </div>
              {onNavigate ? (
                <button
                  onClick={() => onNavigate('developer')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface border border-ui-border text-txt-primary hover:bg-black/5 transition-all shrink-0 shadow-xs"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-primary" />
                  Import
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        /* Regular User Data Portability */
        <div className="p-6 bg-surface border border-ui-border rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-ui-border">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-txt-primary">Data Backup & Portability</h2>
              <p className="text-xs text-txt-secondary mt-0.5">
                Download a clean, structured backup copy of your account data anytime.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-bg border border-ui-border rounded-xl flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-txt-primary">Export My Data (.xlsx)</p>
              <p className="text-[11px] text-txt-secondary">Download an Excel workbook with your projects, tasks, invoices, and clients.</p>
            </div>
            <button
              onClick={handleExportMyAccount}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-all shrink-0 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export .xlsx
            </button>
          </div>
        </div>
      )}

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

      {/* Engineering & Developer Attribution Card (SEO/AEO/GEO Certified) */}
      <div className="p-6 bg-surface border border-ui-border rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ui-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg text-txt-primary">Platform Engineering &amp; Architecture</h3>
              <p className="text-xs text-txt-secondary">System authorship, core design patterns, and engineering provenance</p>
            </div>
          </div>
          <a
            href="https://umaerislam.com"
            target="_blank"
            rel="author external noopener noreferrer"
            className="btn-secondary btn-sm gap-2 w-fit"
            title="Visit Umaer Islam's official website"
          >
            <Globe className="w-4 h-4 text-primary" />
            <span>umaerislam.com</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-bg rounded-xl border border-ui-border space-y-1">
            <p className="text-[11px] font-semibold text-neutral uppercase tracking-wider">Lead Architect &amp; Developer</p>
            <p className="font-medium text-txt-primary text-sm">Umaer Islam</p>
            <p className="text-xs text-txt-secondary">Software Architect &amp; Product Engineer</p>
          </div>
          <div className="p-4 bg-bg rounded-xl border border-ui-border space-y-1">
            <p className="text-[11px] font-semibold text-neutral uppercase tracking-wider">Official Website</p>
            <a 
              href="https://umaerislam.com" 
              target="_blank" 
              rel="author external noopener noreferrer" 
              className="font-medium text-primary hover:underline text-sm inline-flex items-center gap-1"
            >
              <span>umaerislam.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <p className="text-xs text-txt-secondary">Portfolio, solutions &amp; technical writing</p>
          </div>
          <div className="p-4 bg-bg rounded-xl border border-ui-border space-y-1">
            <p className="text-[11px] font-semibold text-neutral uppercase tracking-wider">Application Stack</p>
            <p className="font-medium text-txt-primary text-sm">React 18 + Vite + Tailwind</p>
            <p className="text-xs text-txt-secondary">Firebase Cloud Firestore &amp; Auth</p>
          </div>
        </div>
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
