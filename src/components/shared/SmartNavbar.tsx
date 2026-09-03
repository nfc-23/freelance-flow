import React, { useState, useRef, useEffect } from 'react';
import { 
  Layers, Search, Bell, Plus, ChevronDown, CheckCircle2, 
  Briefcase, CreditCard, Users, LayoutDashboard, Settings, 
  LogOut, X, ExternalLink, Keyboard, Sparkles, AlertCircle,
  Code2, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { firestoreService } from '../../services/firestoreService';
import type { User } from 'firebase/auth';

export interface SmartNavbarProps {
  user: User;
  activeView: 'dashboard' | 'projects' | 'invoices' | 'clients' | 'settings' | 'developer';
  onNavigate: (view: 'dashboard' | 'projects' | 'invoices' | 'clients' | 'settings' | 'developer') => void;
  onOpenSearch: () => void;
  onQuickCreate: (type: 'new_project' | 'new_invoice' | 'new_client') => void;
  onSignOut: () => void;
  // Live counts for smart glanceable awareness
  stats?: {
    activeProjectsCount?: number;
    pendingInvoicesCount?: number;
    overdueInvoicesCount?: number;
    clientsCount?: number;
  };
  notifications: any[];
  onMarkAllNotificationsRead: () => void;
  onNotificationClick: (notification: any) => void;
  onMobileMenuToggle?: () => void;
}

export function SmartNavbar({
  user,
  activeView,
  onNavigate,
  onOpenSearch,
  onQuickCreate,
  onSignOut,
  stats = { activeProjectsCount: 0, pendingInvoicesCount: 0, overdueInvoicesCount: 0, clientsCount: 0 },
  notifications,
  onMarkAllNotificationsRead,
  onNotificationClick,
  onMobileMenuToggle
}: SmartNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');

  const createMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setShowCreateMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = notificationFilter === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  const isDev = firestoreService.isDeveloper(user);

  return (
    <>
      <header className="sticky top-0 z-40 h-16 bg-surface/85 backdrop-blur-md border-b border-ui-border transition-all">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          
          {/* Brand & Left Section */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  if (onMobileMenuToggle) onMobileMenuToggle();
                  else setMobileMenuOpen(true);
                }} 
                className="lg:hidden p-2 -ml-2 text-txt-secondary hover:text-txt-primary hover:bg-black/5 rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <div className="w-5 h-4 flex flex-col justify-between">
                  <span className="w-full h-0.5 bg-current rounded-full" />
                  <span className="w-3/4 h-0.5 bg-current rounded-full" />
                  <span className="w-full h-0.5 bg-current rounded-full" />
                </div>
              </button>
              
              <div 
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary transition-transform group-hover:scale-105 shadow-xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-lg tracking-tight text-txt-primary leading-none">
                    Freelance Flow
                  </span>
                  <span className="text-[10px] font-medium text-success flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" />
                    Synced
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Links with Smart Badges */}
            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => onNavigate('dashboard')}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
                  activeView === 'dashboard'
                    ? "bg-bg text-txt-primary shadow-xs border border-ui-border/80"
                    : "text-txt-secondary hover:text-txt-primary hover:bg-black/5"
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>

              <button
                onClick={() => onNavigate('projects')}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  activeView === 'projects'
                    ? "bg-bg text-txt-primary shadow-xs border border-ui-border/80"
                    : "text-txt-secondary hover:text-txt-primary hover:bg-black/5"
                )}
              >
                <Briefcase className="w-4 h-4" />
                Projects
                {stats.activeProjectsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                    {stats.activeProjectsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onNavigate('invoices')}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  activeView === 'invoices'
                    ? "bg-bg text-txt-primary shadow-xs border border-ui-border/80"
                    : "text-txt-secondary hover:text-txt-primary hover:bg-black/5"
                )}
              >
                <CreditCard className="w-4 h-4" />
                Invoices
                {stats.overdueInvoicesCount > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-error/10 text-error border border-error/20 flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-error" />
                    {stats.overdueInvoicesCount}
                  </span>
                ) : stats.pendingInvoicesCount > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    {stats.pendingInvoicesCount}
                  </span>
                ) : null}
              </button>

              <button
                onClick={() => onNavigate('clients')}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  activeView === 'clients'
                    ? "bg-bg text-txt-primary shadow-xs border border-ui-border/80"
                    : "text-txt-secondary hover:text-txt-primary hover:bg-black/5"
                )}
              >
                <Users className="w-4 h-4" />
                Clients
                {stats.clientsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[11px] font-medium bg-bg text-txt-secondary border border-ui-border">
                    {stats.clientsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onNavigate('settings')}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
                  activeView === 'settings'
                    ? "bg-bg text-txt-primary shadow-xs border border-ui-border/80"
                    : "text-txt-secondary hover:text-txt-primary hover:bg-black/5"
                )}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>

              {isDev && (
                <button
                  onClick={() => onNavigate('developer')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
                    activeView === 'developer'
                      ? "bg-primary text-white shadow-xs font-semibold"
                      : "text-txt-secondary hover:text-txt-primary hover:bg-black/5"
                  )}
                >
                  <Code2 className="w-4 h-4 text-primary" />
                  <span>Dev Console</span>
                </button>
              )}
            </nav>
          </div>

          {/* Right Section: Smart Quick Actions, Omni-Search, Notifications, Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* Quick Action "+ Create" Dropdown */}
            <div className="relative" ref={createMenuRef}>
              <button
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-txt-primary text-bg hover:bg-txt-primary/90 transition-all shadow-xs text-sm font-medium"
                title="Create something new"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New</span>
                <ChevronDown className={cn("w-3.5 h-3.5 opacity-70 transition-transform", showCreateMenu && "rotate-180")} />
              </button>

              <AnimatePresence>
                {showCreateMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-surface border border-ui-border rounded-xl shadow-xl p-1.5 z-50 origin-top-right"
                  >
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                      Quick Create
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowCreateMenu(false);
                        onQuickCreate('new_project');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-txt-primary hover:bg-primary/10 hover:text-primary transition-colors text-left"
                    >
                      <Briefcase className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-medium leading-none">New Project</p>
                        <p className="text-[11px] text-txt-secondary mt-0.5">Initialize pipeline work</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowCreateMenu(false);
                        onQuickCreate('new_invoice');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-txt-primary hover:bg-success/10 hover:text-success transition-colors text-left"
                    >
                      <CreditCard className="w-4 h-4 text-success" />
                      <div>
                        <p className="font-medium leading-none">Issue Invoice</p>
                        <p className="text-[11px] text-txt-secondary mt-0.5">Bill client for work</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowCreateMenu(false);
                        onQuickCreate('new_client');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-txt-primary hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-left"
                    >
                      <Users className="w-4 h-4 text-indigo-600" />
                      <div>
                        <p className="font-medium leading-none">Add Client</p>
                        <p className="text-[11px] text-txt-secondary mt-0.5">Create company record</p>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Omni-Search Trigger Button */}
            <button 
              onClick={onOpenSearch}
              className="hidden md:flex items-center gap-2 bg-bg hover:bg-black/5 border border-ui-border rounded-xl px-3 py-1.5 text-txt-secondary text-sm transition-colors shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="text-xs font-medium text-txt-secondary">Search or command...</span>
              <kbd className="inline-flex h-5 items-center gap-0.5 rounded bg-surface border border-ui-border px-1.5 font-mono text-[10px] font-semibold text-neutral ml-2">
                ⌘K
              </kbd>
            </button>

            <button 
              className="md:hidden p-2 text-txt-secondary hover:text-txt-primary hover:bg-black/5 rounded-lg transition-colors" 
              onClick={onOpenSearch}
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Smart Notification Center */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-txt-secondary hover:text-txt-primary hover:bg-black/5 rounded-full transition-all relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary text-white font-mono text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-surface shadow-xs animate-in fade-in zoom-in">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface border border-ui-border rounded-2xl shadow-2xl overflow-hidden z-50 origin-top-right flex flex-col max-h-[85vh]"
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-ui-border bg-bg/50 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-txt-primary">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                          <button 
                            onClick={onMarkAllNotificationsRead}
                            className="text-[11px] font-medium text-primary hover:text-primary-hover px-2 py-1 rounded hover:bg-primary/10 transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                        <button 
                          onClick={() => setShowNotifications(false)} 
                          className="text-txt-secondary hover:text-txt-primary p-1 rounded-md"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex border-b border-ui-border px-4 pt-2 gap-4 text-xs font-medium bg-surface">
                      <button 
                        onClick={() => setNotificationFilter('all')}
                        className={cn(
                          "pb-2 border-b-2 transition-colors",
                          notificationFilter === 'all' ? "border-primary text-primary font-semibold" : "border-transparent text-txt-secondary hover:text-txt-primary"
                        )}
                      >
                        All ({notifications.length})
                      </button>
                      <button 
                        onClick={() => setNotificationFilter('unread')}
                        className={cn(
                          "pb-2 border-b-2 transition-colors",
                          notificationFilter === 'unread' ? "border-primary text-primary font-semibold" : "border-transparent text-txt-secondary hover:text-txt-primary"
                        )}
                      >
                        Unread ({unreadCount})
                      </button>
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto p-2 custom-scrollbar max-h-80">
                      {filteredNotifications.length === 0 ? (
                        <div className="py-12 text-center text-txt-secondary">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success opacity-80" />
                          <p className="text-sm font-medium">All caught up!</p>
                          <p className="text-xs text-neutral mt-0.5">
                            {notificationFilter === 'unread' ? "No unread alerts." : "No notifications yet."}
                          </p>
                        </div>
                      ) : (
                        filteredNotifications.map((n) => (
                          <div 
                            key={n.id} 
                            className={cn(
                              "p-3 rounded-xl transition-all cursor-pointer flex gap-3 items-start mb-1",
                              n.read 
                                ? "hover:bg-black/5 opacity-80 hover:opacity-100" 
                                : "bg-primary/5 hover:bg-primary/10 border border-primary/10"
                            )}
                            onClick={() => {
                              onNotificationClick(n);
                              setShowNotifications(false);
                            }}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                              n.read ? "bg-bg text-txt-secondary" : "bg-primary/20 text-primary"
                            )}>
                              <Bell className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={cn("text-xs text-txt-primary truncate", !n.read && "font-bold")}>
                                  {n.title}
                                </p>
                                {!n.read && (
                                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-txt-secondary mt-1 line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>
                              <span className="text-[10px] text-neutral mt-1.5 block">
                                {n.createdAt ? new Date(n.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Smart Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-black/5 transition-colors focus:outline-none"
              >
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-8 h-8 rounded-full border border-ui-border object-cover shadow-xs" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20 shadow-xs">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                )}
                <ChevronDown className={cn("w-3 h-3 text-txt-secondary transition-transform", showProfileMenu && "rotate-180")} />
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-surface border border-ui-border rounded-xl shadow-2xl overflow-hidden z-50 origin-top-right py-1"
                  >
                    <div className="px-4 py-3 border-b border-ui-border bg-bg/50">
                      <p className="text-sm font-semibold text-txt-primary truncate">{user.displayName || 'Lead Freelancer'}</p>
                      <p className="text-xs text-txt-secondary truncate mt-0.5">{user.email}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                        Studio Workspace
                      </span>
                    </div>

                    <div className="py-1">
                      {isDev && (
                        <button 
                          onClick={() => {
                            setShowProfileMenu(false);
                            onNavigate('developer');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-txt-primary hover:bg-black/5 flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-2.5">
                            <Code2 className="w-4 h-4 text-primary" />
                            Developer Console
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">
                            Superuser
                          </span>
                        </button>
                      )}

                      <button 
                        onClick={() => {
                          setShowProfileMenu(false);
                          onNavigate('settings');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-txt-primary hover:bg-black/5 flex items-center gap-2.5 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-txt-secondary" />
                        Account & Preferences
                      </button>

                      <button 
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowShortcutsModal(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-txt-primary hover:bg-black/5 flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <Keyboard className="w-4 h-4 text-txt-secondary" />
                          Keyboard Shortcuts
                        </span>
                        <kbd className="px-1.5 py-0.5 bg-bg border border-ui-border rounded text-[10px] font-mono text-neutral">
                          ?
                        </kbd>
                      </button>

                      <a
                        href="https://umaerislam.com"
                        target="_blank"
                        rel="author external noopener noreferrer"
                        className="w-full text-left px-4 py-2 text-sm text-txt-primary hover:bg-black/5 flex items-center justify-between transition-colors group"
                      >
                        <span className="flex items-center gap-2.5">
                          <ExternalLink className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                          <span className="text-xs">Developer: <strong>Umaer Islam</strong></span>
                        </span>
                        <span className="text-[10px] font-mono text-primary font-medium">umaerislam.com</span>
                      </a>
                    </div>

                    <div className="border-t border-ui-border pt-1">
                      <button 
                        onClick={() => {
                          setShowProfileMenu(false);
                          onSignOut();
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error/5 flex items-center gap-2.5 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </header>

      {/* Keyboard Shortcuts Dialog */}
      <AnimatePresence>
        {showShortcutsModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-txt-primary/30 backdrop-blur-sm"
              onClick={() => setShowShortcutsModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-surface border border-ui-border rounded-2xl shadow-2xl p-6 z-[111]"
            >
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-display text-txt-primary">Keyboard Shortcuts</h3>
                </div>
                <button onClick={() => setShowShortcutsModal(false)} className="text-txt-secondary hover:text-txt-primary p-1 rounded-md">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-ui-border/60">
                  <span className="text-txt-secondary">Global Omni-Search & Commands</span>
                  <kbd className="px-2 py-1 bg-bg border border-ui-border rounded font-mono text-xs font-semibold">⌘K / Ctrl+K</kbd>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-ui-border/60">
                  <span className="text-txt-secondary">Go to Dashboard</span>
                  <kbd className="px-2 py-1 bg-bg border border-ui-border rounded font-mono text-xs font-semibold">⌘1</kbd>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-ui-border/60">
                  <span className="text-txt-secondary">Go to Projects</span>
                  <kbd className="px-2 py-1 bg-bg border border-ui-border rounded font-mono text-xs font-semibold">⌘2</kbd>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-ui-border/60">
                  <span className="text-txt-secondary">Go to Invoices</span>
                  <kbd className="px-2 py-1 bg-bg border border-ui-border rounded font-mono text-xs font-semibold">⌘3</kbd>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-ui-border/60">
                  <span className="text-txt-secondary">Go to Clients</span>
                  <kbd className="px-2 py-1 bg-bg border border-ui-border rounded font-mono text-xs font-semibold">⌘4</kbd>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-txt-secondary">Close Modal / Menu</span>
                  <kbd className="px-2 py-1 bg-bg border border-ui-border rounded font-mono text-xs font-semibold">ESC</kbd>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-txt-primary/30 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: '-100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '-100%' }} 
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-surface border-r border-ui-border shadow-2xl flex flex-col z-[101]"
            >
              <div className="p-4 border-b border-ui-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="font-display font-bold text-lg text-txt-primary">Freelance Flow</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-txt-secondary hover:text-txt-primary rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Actions in Mobile */}
              <div className="p-4 border-b border-ui-border bg-bg/40">
                <p className="text-[11px] font-semibold text-neutral uppercase tracking-wider mb-2">Quick Create</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onQuickCreate('new_project');
                    }}
                    className="p-2 bg-surface border border-ui-border rounded-lg text-center hover:border-primary/40 transition-colors"
                  >
                    <Briefcase className="w-4 h-4 text-primary mx-auto mb-1" />
                    <span className="text-[11px] font-medium text-txt-primary block">Project</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onQuickCreate('new_invoice');
                    }}
                    className="p-2 bg-surface border border-ui-border rounded-lg text-center hover:border-primary/40 transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-primary mx-auto mb-1" />
                    <span className="text-[11px] font-medium text-txt-primary block">Invoice</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onQuickCreate('new_client');
                    }}
                    className="p-2 bg-surface border border-ui-border rounded-lg text-center hover:border-primary/40 transition-colors"
                  >
                    <Users className="w-4 h-4 text-primary mx-auto mb-1" />
                    <span className="text-[11px] font-medium text-txt-primary block">Client</span>
                  </button>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="p-4 flex-1 overflow-y-auto space-y-1.5">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'projects', label: 'Projects', icon: Briefcase, count: stats?.activeProjectsCount },
                  { id: 'invoices', label: 'Invoices', icon: CreditCard, count: stats?.pendingInvoicesCount },
                  { id: 'clients', label: 'Clients', icon: Users, count: stats?.clientsCount },
                  { id: 'settings', label: 'Settings', icon: Settings },
                  ...(isDev ? [{ id: 'developer', label: 'Developer Console', icon: Code2 }] : []),
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onNavigate(item.id as any);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-primary text-white" 
                          : "text-txt-secondary hover:text-txt-primary hover:bg-black/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {typeof item.count === 'number' && item.count > 0 && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-semibold",
                          isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                        )}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* User Footer in Mobile */}
              <div className="p-4 border-t border-ui-border bg-bg/50">
                <div className="flex items-center gap-3 mb-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full border border-ui-border" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-txt-primary truncate">{user.displayName || 'Freelancer'}</p>
                    <p className="text-xs text-txt-secondary truncate">{user.email}</p>
                  </div>
                </div>

                <a
                  href="https://umaerislam.com"
                  target="_blank"
                  rel="author external noopener noreferrer"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-txt-secondary hover:text-txt-primary bg-surface border border-ui-border mb-2.5 transition-colors"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <Code2 className="w-3.5 h-3.5 text-primary" />
                    <span>Dev: <strong>Umaer Islam</strong></span>
                  </span>
                  <span className="text-[10px] text-primary font-mono">umaerislam.com</span>
                </a>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-error hover:bg-error/10 border border-error/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
