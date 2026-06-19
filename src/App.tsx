import React, { useState, useEffect, type ReactNode } from 'react';
import { 
  LayoutDashboard, Layers, Briefcase, Users, Search, Bell, Clock, 
  LogOut, RefreshCw, Menu, X, CreditCard, ChevronDown, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LandingPage } from './components/landing/LandingPage';
import { cn } from './lib/utils';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, type User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, doc, writeBatch, updateDoc } from 'firebase/firestore';
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
  const [searchOpen, setSearchOpen] = useState(false);

  const handleCommand = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && commandValue) {
      if (commandValue.startsWith('/')) {
        const result = await parseCommand(commandValue.substring(1));
        if (result && result.action === 'NAVIGATE') {
          setActiveView(result.target as View);
          setCommandValue('');
          setSearchOpen(false);
        }
      }
    }
  };

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

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
    if (!user) {
      setNotifications([]);
      return;
    }
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docData = change.doc.data();
          // Notify if created in the last 5 seconds to avoid old notifications alerting
          const isRecent = docData.createdAt && (Date.now() / 1000 - docData.createdAt.seconds) < 5;
          if (isRecent && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(docData.title || "New Notification", {
                body: docData.message,
              });
            } catch (e) {
              // Sometimes Notification constructor fails if not in a service worker depending on browser restrictions
              console.error("Notification API failed:", e);
            }
          }
        }
      });

      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const markAllRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch(err) {}
  };

  // Global search shortcut ⌘K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeView]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-bg">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-bg text-txt-primary flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 h-[56px] bg-surface/80 backdrop-blur-md border-b border-ui-border flex flex-col justify-center px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden text-txt-secondary p-1">
                <Menu className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded border border-ui-border flex items-center justify-center text-primary bg-surface shadow-sm rotate-3 hidden sm:flex">
                 <Layers className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-txt-primary">Freelance Flow.</span>
            </div>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-1">
              <NavLink label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
              <NavLink label="Projects" active={activeView === 'projects'} onClick={() => setActiveView('projects')} />
              <NavLink label="Invoices" active={activeView === 'invoices'} onClick={() => setActiveView('invoices')} />
              <NavLink label="Clients" active={activeView === 'clients'} onClick={() => setActiveView('clients')} />
              <NavLink label="Settings" active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 bg-gray-50 border border-ui-border/50 hover:bg-gray-100 rounded-xl px-3 py-1.5 text-txt-secondary text-sm transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="mr-4 text-xs font-medium">Search or command...</span>
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded bg-surface border border-ui-border px-1.5 font-mono text-[10px] font-medium opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>

            <button className="md:hidden p-2 text-txt-secondary" onClick={() => setSearchOpen(true)}>
              <Search className="w-5 h-5" />
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-txt-secondary hover:text-txt-primary hover:bg-black/5 rounded-full transition-all relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-surface"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-surface border border-ui-border rounded-xl shadow-[var(--shadow-genesis-dropdown)] overflow-hidden z-[60] origin-top-right flex flex-col"
                  >
                    <div className="p-4 border-b border-ui-border flex justify-between items-center bg-gray-50/50">
                      <h3 className="text-sm font-semibold text-txt-primary">Notifications</h3>
                      <button onClick={() => setShowNotifications(false)} className="text-txt-secondary hover:text-txt-primary"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="max-h-80 overflow-y-auto p-2 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-txt-secondary">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "p-3 rounded-lg transition-colors cursor-pointer flex gap-4 items-start",
                              n.read ? "hover:bg-black/5" : "bg-primary/5 hover:bg-primary/10"
                            )}
                            onClick={() => {
                              if (!n.read) {
                                updateDoc(doc(db, 'notifications', n.id), { read: true });
                              }
                              if (n.link && n.type === 'message') {
                                setActiveView('projects');
                                setShowNotifications(false);
                              }
                            }}
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Bell className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className={cn("text-[13px] text-txt-primary", !n.read && "font-bold")}>{n.title}</p>
                              <p className="text-[12px] text-txt-secondary mt-1">{n.message}</p>
                              <span className="text-[10px] text-neutral mt-2 block">
                                {n.createdAt ? new Date(n.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-ui-border bg-gray-50 text-center">
                      <button onClick={markAllRead} className="text-[12px] font-medium text-primary hover:text-primary-hover transition-colors">Mark all as read</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 pl-2 p-1 rounded-full hover:bg-black/5 transition-colors focus:outline-none"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full border border-ui-border" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <ChevronDown className="w-4 h-4 text-txt-secondary" />
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-surface border border-ui-border rounded-xl shadow-[var(--shadow-genesis-dropdown)] overflow-hidden z-[60] origin-top-right py-1"
                  >
                    <div className="px-4 py-3 border-b border-ui-border bg-gray-50/50">
                      <p className="text-sm font-medium text-txt-primary truncate">{user.displayName || 'Freelancer'}</p>
                      <p className="text-xs text-txt-secondary truncate">{user.email}</p>
                    </div>
                    <button 
                      onClick={() => { auth.signOut(); setShowProfileMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error/5 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Global Search CMD+K Modal */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 sm:pt-32">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-txt-primary/20 backdrop-blur-sm"
              onClick={() => setSearchOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-[90%] max-w-2xl bg-surface border border-ui-border shadow-2xl rounded-xl overflow-hidden z-[101]"
            >
              <div className="flex items-center px-4 border-b border-ui-border bg-surface">
                <Search className="w-5 h-5 text-txt-secondary flex-shrink-0" />
                <input 
                  autoFocus
                  type="text" 
                  className="flex-1 h-16 bg-transparent border-none outline-none px-4 text-lg text-txt-primary placeholder:text-neutral"
                  placeholder="Ask AI or type a command (/) ..."
                  value={commandValue}
                  onChange={(e) => setCommandValue(e.target.value)}
                  onKeyDown={handleCommand}
                />
                <button onClick={() => setSearchOpen(false)} className="text-[10px] font-bold text-neutral bg-gray-100 px-2 py-1 rounded">ESC</button>
              </div>
              <div className="p-4 bg-gray-50/50 h-56 overflow-y-auto custom-scrollbar">
                <p className="text-xs font-semibold text-neutral uppercase tracking-wider mb-3">Suggestions</p>
                <div className="space-y-1">
                  <div className="px-3 py-2 text-sm text-txt-primary hover:bg-black/5 rounded-md cursor-pointer flex items-center gap-3">
                    <LayoutDashboard className="w-4 h-4 text-txt-secondary" /> Go to Dashboard
                  </div>
                  <div className="px-3 py-2 text-sm text-txt-primary hover:bg-black/5 rounded-md cursor-pointer flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-txt-secondary" /> Create New Invoice
                  </div>
                  <div className="px-3 py-2 text-sm text-txt-primary hover:bg-black/5 rounded-md cursor-pointer flex items-center gap-3">
                    <Search className="w-4 h-4 text-txt-secondary" /> Search active projects...
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-txt-primary/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-surface border-r border-ui-border shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-ui-border flex justify-between items-center">
                <span className="font-display font-bold text-xl text-txt-primary">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-txt-secondary hover:bg-gray-100 rounded-full flex items-center justify-center">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-4 flex flex-col gap-1 overflow-y-auto">
                <MobileNavItem icon={<LayoutDashboard className="w-5 h-5"/>} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
                <MobileNavItem icon={<Briefcase className="w-5 h-5"/>} label="Projects" active={activeView === 'projects'} onClick={() => setActiveView('projects')} />
                <MobileNavItem icon={<CreditCard className="w-5 h-5"/>} label="Invoices" active={activeView === 'invoices'} onClick={() => setActiveView('invoices')} />
                <MobileNavItem icon={<Users className="w-5 h-5"/>} label="Clients" active={activeView === 'clients'} onClick={() => setActiveView('clients')} />
                <MobileNavItem icon={<RefreshCw className="w-5 h-5"/>} label="Settings" active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative w-full h-full pb-12 custom-scrollbar">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
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
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-txt-secondary">
                  <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center mb-6 border border-ui-border">
                     <Clock className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="text-lg font-medium opacity-50">{activeView} module arriving soon...</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavLink({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-md text-[14px] font-medium transition-colors relative",
        active 
          ? "text-txt-primary bg-black/5" 
          : "text-txt-secondary hover:bg-black/5 hover:text-txt-primary"
      )}
    >
      {label}
    </button>
  );
}

function MobileNavItem({ icon, label, active, onClick }: { icon: ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-[15px] font-medium transition-all",
        active ? "bg-primary/10 text-primary" : "text-txt-secondary hover:bg-black/5 hover:text-txt-primary"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
