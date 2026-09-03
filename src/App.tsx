import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LandingPage } from './components/landing/LandingPage';
import { auth, db } from './services/firebase';
import { Toaster, toast } from 'react-hot-toast';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, doc, writeBatch, updateDoc } from 'firebase/firestore';
import { firestoreService } from './services/firestoreService';
import { ClientList } from './components/clients/ClientList';
import { Dashboard } from './components/dashboard/Dashboard';
import { ProjectList } from './components/projects/ProjectList';
import { InvoiceList } from './components/invoices/InvoiceList';
import { SystemSettings } from './components/settings/SystemSettings';
import { PublicInvoiceView } from './components/invoices/PublicInvoiceView';
import { ClientPortalView } from './components/projects/ClientPortalView';
import { DeveloperConsole } from './components/developer/DeveloperConsole';
import { SmartNavbar } from './components/shared/SmartNavbar';
import { CommandPalette } from './components/shared/CommandPalette';
import { Clock } from 'lucide-react';

type View = 'dashboard' | 'projects' | 'invoices' | 'clients' | 'settings' | 'developer';

export default function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Quick-create triggers
  const [triggerCreateProject, setTriggerCreateProject] = useState(0);
  const [triggerCreateInvoice, setTriggerCreateInvoice] = useState(0);
  const [triggerCreateClient, setTriggerCreateClient] = useState(0);

  // Live navigation stats for badges
  const [navStats, setNavStats] = useState({
    activeProjectsCount: 0,
    pendingInvoicesCount: 0,
    overdueInvoicesCount: 0,
    clientsCount: 0,
  });

  const [paletteData, setPaletteData] = useState<{
    projects: any[];
    invoices: any[];
    clients: any[];
  }>({ projects: [], invoices: [], clients: [] });

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
      if (user) {
        firestoreService.syncUser(user).catch(err => console.error("syncUser error:", err));
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time visitor activity logging
  useEffect(() => {
    firestoreService.recordVisitor(`/${activeView}`, 'view_change', user?.email || undefined);
  }, [activeView, user?.email]);

  // Global ⌘K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch live stats and records for navbar pills and command palette
  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [projects, invoices, clients] = await Promise.all([
          firestoreService.list('projects'),
          firestoreService.list('invoices'),
          firestoreService.list('clients'),
        ]);
        const activeProjects = (projects as any[]).filter(
          p => p.status === 'started' || p.status === 'planned'
        ).length;
        const pendingInvoices = (invoices as any[]).filter(
          i => i.status === 'sent' || i.status === 'draft'
        ).length;
        setNavStats({
          activeProjectsCount: activeProjects,
          pendingInvoicesCount: pendingInvoices,
          overdueInvoicesCount: 0,
          clientsCount: (clients as any[]).length,
        });
        setPaletteData({
          projects: projects as any[],
          invoices: invoices as any[],
          clients: clients as any[],
        });
      } catch (err) {
        console.error("Failed to load nav stats:", err);
      }
    };
    loadData();
  }, [user, activeView]);

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
          if (isRecent) {
            // Internal toast notification
            toast.success(docData.title || "New Notification", {
              icon: '🔔',
              style: {
                borderRadius: '10px',
                background: '#fff',
                color: '#333',
              },
            });

            if ("Notification" in window && Notification.permission === "granted") {
              try {
                new Notification(docData.title || "New Notification", {
                  body: docData.message,
                });
              } catch (e) {
                console.error("Notification API failed:", e);
              }
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
      toast.success('All marked as read');
    } catch(err) {}
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      try {
        await updateDoc(doc(db, 'notifications', notification.id), { read: true });
      } catch (err) {}
    }
    if (notification.link || notification.type === 'message') {
      setActiveView('projects');
    }
  };

  const handleQuickCreate = (type: 'new_project' | 'new_invoice' | 'new_client') => {
    if (type === 'new_project') {
      setActiveView('projects');
      setTriggerCreateProject(Date.now());
    } else if (type === 'new_invoice') {
      setActiveView('invoices');
      setTriggerCreateInvoice(Date.now());
    } else if (type === 'new_client') {
      setActiveView('clients');
      setTriggerCreateClient(Date.now());
    }
  };

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
      <Toaster position="top-right" />

      {/* Upgraded Smart Navigation Bar */}
      <SmartNavbar 
        activeView={activeView}
        onNavigate={setActiveView}
        onOpenSearch={() => setSearchOpen(true)}
        onQuickCreate={handleQuickCreate}
        user={user}
        notifications={notifications}
        onMarkAllNotificationsRead={markAllRead}
        onNotificationClick={handleNotificationClick}
        onSignOut={() => auth.signOut()}
        stats={navStats}
      />

      {/* Global Command & Omni-Search Palette (⌘K) */}
      <CommandPalette 
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        projects={paletteData.projects}
        invoices={paletteData.invoices}
        clients={paletteData.clients}
        onNavigate={(view) => setActiveView(view as View)}
        onQuickAction={handleQuickCreate}
      />

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
              {activeView === 'dashboard' && <Dashboard onNavigate={(view) => setActiveView(view as View)} />}
              {activeView === 'projects' && <ProjectList triggerCreate={triggerCreateProject} />}
              {activeView === 'clients' && <ClientList triggerCreate={triggerCreateClient} />}
              {activeView === 'invoices' && <InvoiceList triggerCreate={triggerCreateInvoice} />}
              {activeView === 'settings' && <SystemSettings onReset={() => window.location.reload()} onNavigate={(view) => setActiveView(view as View)} />}
              {activeView === 'developer' && <DeveloperConsole currentUser={user} onNavigate={(view) => setActiveView(view as View)} />}
              {activeView !== 'dashboard' && activeView !== 'projects' && activeView !== 'clients' && activeView !== 'invoices' && activeView !== 'settings' && activeView !== 'developer' && (
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
