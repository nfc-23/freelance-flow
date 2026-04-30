import React, { useState, useEffect, type ReactNode } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Users, 
  Search, 
  Bell,
  Clock,
  Moon,
  Sun,
  LogOut,
  RefreshCw,
  Menu,
  X,
  CreditCard,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { auth } from './services/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, type User } from 'firebase/auth';
import { ClientList } from './components/clients/ClientList';
import { Dashboard } from './components/dashboard/Dashboard';
import { ProjectList } from './components/projects/ProjectList';
import { InvoiceList } from './components/invoices/InvoiceList';
import { SystemSettings } from './components/settings/SystemSettings';
import { PublicInvoiceView } from './components/invoices/PublicInvoiceView';
import { ClientPortalView } from './components/projects/ClientPortalView';
import { parseCommand } from './services/aiService';

type View = 'dashboard' | 'projects' | 'invoices' | 'clients' | 'settings';

export default function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [commandValue, setCommandValue] = useState('');

  const handleCommand = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && commandValue) {
      if (commandValue.startsWith('/')) {
        const result = await parseCommand(commandValue.substring(1));
        if (result && result.action === 'NAVIGATE') {
          setActiveView(result.target as View);
          setCommandValue('');
        }
      }
    }
  };
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);

  // Check for public views
  const urlParams = new URLSearchParams(window.location.search);
  const publicInvoiceId = urlParams.get('invoice');
  const publicPortalId = urlParams.get('portal');
  
  if (publicInvoiceId) {
    return <PublicInvoiceView invoiceId={publicInvoiceId} />;
  }

  if (publicPortalId) {
    return <ClientPortalView projectId={publicPortalId} />;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Close sidebar on view change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeView]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-dark-bg">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-dark-bg p-6 font-sans">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          className="w-20 h-20 bg-brand-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-brand-500/40"
        >
          <Briefcase className="text-white w-10 h-10" />
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight"
        >
          FreelanceFlow
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm text-center font-medium leading-relaxed"
        >
          The ultimate intelligence dashboard for professional creators and independent teams.
        </motion.p>
        <motion.button 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={handleLogin}
          className="bg-brand-600 hover:bg-brand-700 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-brand-500/25 flex items-center space-x-3 active:scale-95"
        >
          <span>Authenticate with Google</span>
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-slate-200 overflow-hidden transition-colors duration-500 font-sans technical-grid">
      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Responsive */}
      <aside className={cn(
        "fixed inset-y-0 left-0 bg-white dark:bg-dark-card border-r border-slate-200 dark:border-dark-border flex flex-col shrink-0 z-50 transition-all duration-300 transform lg:relative",
        isDesktopSidebarCollapsed ? "lg:w-24 w-72" : "w-72",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <button 
          onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)} 
          className="absolute -right-3.5 top-8 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border w-7 h-7 rounded-full hidden lg:flex items-center justify-center text-slate-400 hover:text-emerald-500 z-50 shadow-sm transition-transform hover:scale-110"
        >
          {isDesktopSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className={cn("p-8 flex items-center mb-4 transition-all", isDesktopSidebarCollapsed ? "justify-center px-4" : "justify-between")}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 shrink-0 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-500/30 rotate-3 transition-transform hover:rotate-6">
               <Briefcase className="w-5 h-5" />
            </div>
            {!isDesktopSidebarCollapsed && <span className="font-bold text-2xl tracking-tight text-slate-900 dark:text-white">Flow</span>}
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto overflow-x-hidden">
          {!isDesktopSidebarCollapsed && <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-4 ml-4 mt-2">Core Console</p>}
          <SidebarItem 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Intelligence Hub" 
            active={activeView === 'dashboard'} 
            onClick={() => setActiveView('dashboard')}
            collapsed={isDesktopSidebarCollapsed}
          />
          <SidebarItem 
            icon={<Briefcase className="w-5 h-5" />} 
            label="Projects" 
            active={activeView === 'projects'} 
            onClick={() => setActiveView('projects')}
            collapsed={isDesktopSidebarCollapsed}
          />
          <SidebarItem 
            icon={<CreditCard className="w-5 h-5" />} 
            label="Financial Ledger" 
            active={activeView === 'invoices'} 
            onClick={() => setActiveView('invoices')}
            collapsed={isDesktopSidebarCollapsed}
          />
          
          <div className="pt-8 mb-4">
            {!isDesktopSidebarCollapsed && <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-4 ml-4">Management</p>}
            <SidebarItem 
              icon={<Users className="w-5 h-5" />} 
              label="Clients" 
              active={activeView === 'clients'} 
              onClick={() => setActiveView('clients')}
              collapsed={isDesktopSidebarCollapsed}
            />
            <SidebarItem 
              icon={<RefreshCw className="w-5 h-5" />} 
              label="System Settings" 
              active={activeView === 'settings'} 
              onClick={() => setActiveView('settings')}
              collapsed={isDesktopSidebarCollapsed}
            />
          </div>
        </nav>

        {!isDesktopSidebarCollapsed && (
          <div className="p-6">
            <div className="p-6 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-3 relative z-10">Peak Performance</p>
              <div className="flex items-end justify-between relative z-10">
                 <span className="text-2xl font-bold text-slate-900 dark:text-white">82%</span>
                 <div className="flex gap-1 items-end h-8">
                    {[40, 70, 45, 90, 60].map((h, i) => (
                      <motion.div 
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        className="w-1 bg-emerald-500 rounded-full" 
                      />
                    ))}
                 </div>
              </div>
            </div>
          </div>
        )}

        <div className={cn("border-t border-slate-100 dark:border-dark-border", isDesktopSidebarCollapsed ? "p-4 flex flex-col gap-4 items-center" : "p-4")}>
          {isDesktopSidebarCollapsed && (
            <button 
              onClick={() => auth.signOut()}
              title="Sign Out"
              className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-border"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}

          <div className={cn("flex space-x-3 rounded-xl transition-colors cursor-pointer group", isDesktopSidebarCollapsed ? "p-0 justify-center" : "p-2 hover:bg-slate-50 dark:hover:bg-emerald-500/5 items-center")}>
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 shrink-0 rounded-full border border-slate-100 dark:border-dark-border" />
            ) : (
              <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
                {user.displayName?.charAt(0) || 'U'}
              </div>
            )}
            {!isDesktopSidebarCollapsed && (
              <>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold truncate dark:text-slate-200">{user.displayName || 'Freelancer'}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">Pro Account</p>
                </div>
                <button 
                  onClick={() => auth.signOut()}
                  title="Sign Out"
                  className="ml-auto text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative transition-colors duration-500">
        <header className="h-24 bg-white/70 dark:bg-dark-bg/70 backdrop-blur-xl px-4 lg:px-10 flex items-center justify-between shrink-0 z-10 border-b border-slate-100 dark:border-dark-border transition-colors duration-500">
          <div className="flex items-center gap-3 lg:gap-4 shrink-0 min-w-0 pr-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-slate-100 dark:bg-dark-card hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors rounded-xl text-slate-500"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-[10px] sm:text-xs lg:text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.4em] truncate">
                {activeView === 'settings' ? 'Global Configuration' : activeView}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Core Synchronized</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 lg:space-x-5 shrink-0">
            <div className="hidden lg:relative lg:block group">
              <div className="absolute inset-0 bg-brand-500/5 rounded-2xl blur-md group-focus-within:bg-brand-500/10 transition-all" />
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
              <input 
                type="text" 
                placeholder="EXECUTE COMMAND (/) ..." 
                value={commandValue}
                onChange={(e) => setCommandValue(e.target.value)}
                onKeyDown={handleCommand}
                className="relative pl-12 pr-6 py-3 bg-slate-100 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-brand-500/20 transition-all w-80 outline-none dark:text-slate-200 group-hover:border-brand-500/30"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-slate-200 dark:bg-dark-border rounded text-[9px] font-bold text-slate-500">
                 K
              </div>
            </div>

            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 bg-slate-100 dark:bg-dark-card text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all rounded-xl"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button className="p-2.5 bg-slate-100 dark:bg-dark-card text-slate-400 hover:text-brand-600 transition-all rounded-xl relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand-500 rounded-full border-2 border-white dark:border-dark-card"></span>
            </button>
            
            <button className="hidden sm:block p-2 text-slate-400 hover:text-brand-600 transition-all rounded-xl border border-slate-200 dark:border-dark-border">
               <Layers className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="p-6 lg:p-10 overflow-y-auto flex-1 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeView === 'dashboard' && <Dashboard />}
              {activeView === 'projects' && <ProjectList />}
              {activeView === 'clients' && <ClientList />}
              {activeView === 'invoices' && <InvoiceList />}
              {activeView === 'settings' && <SystemSettings onReset={() => window.location.reload()} />}
              {activeView !== 'dashboard' && activeView !== 'projects' && activeView !== 'clients' && activeView !== 'invoices' && activeView !== 'settings' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 dark:text-slate-600">
                  <div className="w-20 h-20 rounded-[2rem] bg-slate-100 dark:bg-dark-card flex items-center justify-center mb-6 border border-slate-200 dark:border-dark-border">
                     <Clock className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="text-xl font-bold opacity-50">{activeView} module arriving soon...</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Nav Bar */}
        <div className="lg:hidden h-20 bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl border-t border-slate-200 dark:border-dark-border flex items-center justify-around px-2 sm:px-6 shrink-0 transition-colors z-20 pb-[env(safe-area-inset-bottom)]">
            <MobileNavItem icon={<LayoutDashboard className="w-5 h-5 lg:w-6 lg:h-6"/>} active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
            <MobileNavItem icon={<Briefcase className="w-5 h-5 lg:w-6 lg:h-6"/>} active={activeView === 'projects'} onClick={() => setActiveView('projects')} />
            <MobileNavItem icon={<Users className="w-5 h-5 lg:w-6 lg:h-6"/>} active={activeView === 'clients'} onClick={() => setActiveView('clients')} />
            <MobileNavItem icon={<CreditCard className="w-5 h-5 lg:w-6 lg:h-6"/>} active={activeView === 'invoices'} onClick={() => setActiveView('invoices')} />
            <MobileNavItem icon={<RefreshCw className="w-5 h-5 lg:w-6 lg:h-6"/>} active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, collapsed }: { icon: ReactNode, label: string, active?: boolean, onClick: () => void, collapsed?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center px-4 py-3 rounded-2xl transition-all font-semibold text-sm relative group",
        collapsed ? "justify-center" : "space-x-3",
        active 
          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/5" 
          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-dark-bg"
      )}
      title={collapsed ? label : undefined}
    >
      <div className={cn("transition-colors duration-300 z-10 flex-shrink-0", active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500 group-hover:text-emerald-500")}>
        {icon}
      </div>
      {!collapsed && <span className="z-10 truncate">{label}</span>}
      {active && (
        <motion.div 
          layoutId="active-bg"
          className="absolute inset-0 rounded-2xl border-l-4 border-emerald-500" 
        />
      )}
    </button>
  );
}

function MobileNavItem({ icon, active, onClick }: { icon: ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-3 rounded-2xl transition-all relative",
        active ? "text-brand-600" : "text-slate-400"
      )}
    >
      <div className="relative z-10">{icon}</div>
      {active && <motion.div layoutId="mobile-nav-active" className="absolute inset-0 bg-brand-500/10 rounded-2xl" />}
    </button>
  );
}
