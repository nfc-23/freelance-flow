import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Briefcase, CreditCard, Users, LayoutDashboard, Settings, 
  Plus, ArrowRight, X, Clock, CheckCircle2, AlertCircle, Sparkles,
  Command, Code2, ShieldCheck, FileSpreadsheet
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { auth } from '../../services/firebase';
import { firestoreService } from '../../services/firestoreService';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: any[];
  invoices?: any[];
  clients?: any[];
  onNavigate: (view: 'dashboard' | 'projects' | 'invoices' | 'clients' | 'settings' | 'developer', targetId?: string) => void;
  onQuickAction: (action: 'new_project' | 'new_invoice' | 'new_client') => void;
}

interface CommandItem {
  id: string;
  category: 'Actions' | 'Navigation' | 'Projects' | 'Invoices' | 'Clients';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  onSelect: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  projects = [],
  invoices = [],
  clients = [],
  onNavigate,
  onQuickAction,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build searchable items
  const items: CommandItem[] = [];

  const lowerQuery = query.toLowerCase().trim();

  // 1. Quick Actions
  if (!lowerQuery || 'create new project invoice client'.includes(lowerQuery) || lowerQuery.startsWith('new') || lowerQuery.startsWith('+')) {
    items.push(
      {
        id: 'action-new-project',
        category: 'Actions',
        title: 'New Project',
        subtitle: 'Start a new client or internal initiative',
        icon: <Plus className="w-4 h-4 text-primary" />,
        badge: 'Action',
        badgeColor: 'bg-primary/10 text-primary',
        onSelect: () => { onQuickAction('new_project'); onClose(); }
      },
      {
        id: 'action-new-invoice',
        category: 'Actions',
        title: 'Issue New Invoice',
        subtitle: 'Generate a bill for a project or client',
        icon: <Plus className="w-4 h-4 text-success" />,
        badge: 'Action',
        badgeColor: 'bg-success/10 text-success',
        onSelect: () => { onQuickAction('new_invoice'); onClose(); }
      },
      {
        id: 'action-new-client',
        category: 'Actions',
        title: 'Add Client',
        subtitle: 'Register a new business contact',
        icon: <Plus className="w-4 h-4 text-indigo-600" />,
        badge: 'Action',
        badgeColor: 'bg-indigo-50 text-indigo-700',
        onSelect: () => { onQuickAction('new_client'); onClose(); }
      }
    );
  }

  // 2. Navigation Items
  const isDev = firestoreService.isDeveloper(auth.currentUser);
  const navMatches = [
    { label: 'Dashboard', view: 'dashboard' as const, icon: <LayoutDashboard className="w-4 h-4" />, shortcut: 'G D' },
    { label: 'Projects & Pipeline', view: 'projects' as const, icon: <Briefcase className="w-4 h-4" />, shortcut: 'G P' },
    { label: 'Invoices & Ledger', view: 'invoices' as const, icon: <CreditCard className="w-4 h-4" />, shortcut: 'G I' },
    { label: 'Clients Directory', view: 'clients' as const, icon: <Users className="w-4 h-4" />, shortcut: 'G C' },
    { label: 'System Settings', view: 'settings' as const, icon: <Settings className="w-4 h-4" />, shortcut: 'G S' },
    ...(isDev ? [{ label: 'Developer Console (Superuser)', view: 'developer' as const, icon: <Code2 className="w-4 h-4 text-primary" />, shortcut: 'G DEV' }] : []),
  ].filter(nav => !lowerQuery || nav.label.toLowerCase().includes(lowerQuery) || (nav.view === 'developer' && (lowerQuery.includes('dev') || lowerQuery.includes('excel') || lowerQuery.includes('visitor') || lowerQuery.includes('user') || lowerQuery.includes('import'))));

  navMatches.forEach(nav => {
    items.push({
      id: `nav-${nav.view}`,
      category: 'Navigation',
      title: `Go to ${nav.label}`,
      subtitle: `Switch view to ${nav.label}`,
      icon: nav.icon,
      badge: nav.shortcut,
      badgeColor: 'bg-neutral/10 text-txt-secondary font-mono text-[10px]',
      onSelect: () => { onNavigate(nav.view); onClose(); }
    });
  });

  // 3. Projects match
  if (lowerQuery) {
    const matchedProjects = projects.filter(p => 
      p.title?.toLowerCase().includes(lowerQuery) ||
      p.status?.toLowerCase().includes(lowerQuery) ||
      (p.type && p.type.toLowerCase().includes(lowerQuery))
    ).slice(0, 5);

    matchedProjects.forEach(p => {
      items.push({
        id: `proj-${p.id}`,
        category: 'Projects',
        title: p.title,
        subtitle: `Budget: ${formatCurrency(p.budget || 0)} • ${p.status || 'Active'}`,
        icon: <Briefcase className="w-4 h-4 text-primary" />,
        badge: p.status || 'active',
        badgeColor: p.status === 'finished' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary',
        onSelect: () => { onNavigate('projects', p.id); onClose(); }
      });
    });

    // 4. Invoices match
    const matchedInvoices = invoices.filter(inv =>
      inv.invoiceNumber?.toLowerCase().includes(lowerQuery) ||
      inv.status?.toLowerCase().includes(lowerQuery)
    ).slice(0, 4);

    matchedInvoices.forEach(inv => {
      items.push({
        id: `inv-${inv.id}`,
        category: 'Invoices',
        title: inv.invoiceNumber || 'Invoice',
        subtitle: `${formatCurrency(inv.amount || 0)} • Due ${new Date(inv.dueDate).toLocaleDateString()}`,
        icon: <CreditCard className="w-4 h-4 text-txt-secondary" />,
        badge: inv.status || 'sent',
        badgeColor: inv.status === 'paid' ? 'bg-success/10 text-success' : inv.status === 'overdue' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning',
        onSelect: () => { onNavigate('invoices'); onClose(); }
      });
    });

    // 5. Clients match
    const matchedClients = clients.filter(c =>
      c.name?.toLowerCase().includes(lowerQuery) ||
      c.company?.toLowerCase().includes(lowerQuery) ||
      c.email?.toLowerCase().includes(lowerQuery)
    ).slice(0, 4);

    matchedClients.forEach(c => {
      items.push({
        id: `client-${c.id}`,
        category: 'Clients',
        title: c.name,
        subtitle: `${c.company ? `${c.company} • ` : ''}${c.email}`,
        icon: <Users className="w-4 h-4 text-indigo-600" />,
        badge: c.company || 'Client',
        badgeColor: 'bg-bg text-txt-secondary border border-ui-border',
        onSelect: () => { onNavigate('clients'); onClose(); }
      });
    });
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].onSelect();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Group items by category
  const categories: string[] = Array.from(new Set(items.map(item => item.category)));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-txt-primary/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: -10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-2xl bg-surface border border-ui-border shadow-2xl rounded-2xl overflow-hidden z-[101] flex flex-col max-h-[80vh]"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3 border-b border-ui-border bg-surface">
              <Search className="w-5 h-5 text-txt-secondary flex-shrink-0 mr-3" />
              <input 
                ref={inputRef}
                type="text" 
                className="flex-1 bg-transparent border-none outline-none text-base sm:text-lg text-txt-primary placeholder:text-neutral"
                placeholder="Search projects, clients, invoices, or type a command..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
              />
              {query && (
                <button 
                  onClick={() => setQuery('')}
                  className="p-1 text-txt-secondary hover:text-txt-primary rounded-md mr-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded bg-bg border border-ui-border px-2 font-mono text-[11px] font-medium text-txt-secondary">
                ESC
              </kbd>
            </div>

            {/* Results Body */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 custom-scrollbar">
              {items.length === 0 ? (
                <div className="py-12 text-center text-txt-secondary">
                  <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No results found for &ldquo;{query}&rdquo;</p>
                  <p className="text-xs text-neutral mt-1">Try searching for a project name, invoice ID, or client.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {categories.map(category => {
                    const categoryItems = items.filter(item => item.category === category);
                    return (
                      <div key={category}>
                        <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral uppercase tracking-wider">
                          {category}
                        </div>
                        <div className="space-y-1 mt-1">
                          {categoryItems.map(item => {
                            const itemIndex = items.indexOf(item);
                            const isSelected = itemIndex === selectedIndex;
                            return (
                              <div
                                key={item.id}
                                onMouseEnter={() => setSelectedIndex(itemIndex)}
                                onClick={item.onSelect}
                                className={cn(
                                  "px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-colors",
                                  isSelected 
                                    ? "bg-primary/10 text-txt-primary font-medium" 
                                    : "hover:bg-black/5 text-txt-primary"
                                )}
                              >
                                <div className="flex items-center gap-3 min-w-0 pr-3">
                                  <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-ui-border/50",
                                    isSelected ? "bg-surface" : "bg-bg"
                                  )}>
                                    {item.icon}
                                  </div>
                                  <div className="truncate">
                                    <p className="text-sm font-medium truncate">{item.title}</p>
                                    {item.subtitle && (
                                      <p className="text-xs text-txt-secondary truncate mt-0.5">{item.subtitle}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {item.badge && (
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-md text-[11px] font-medium capitalize",
                                      item.badgeColor || "bg-bg text-txt-secondary border border-ui-border"
                                    )}>
                                      {item.badge}
                                    </span>
                                  )}
                                  {isSelected && (
                                    <ArrowRight className="w-3.5 h-3.5 text-primary" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Shortcuts Hint */}
            <div className="px-4 py-2.5 bg-bg/80 border-t border-ui-border flex items-center justify-between text-xs text-txt-secondary">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-surface border border-ui-border rounded text-[10px] font-mono">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-surface border border-ui-border rounded text-[10px] font-mono">↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-surface border border-ui-border rounded text-[10px] font-mono">↵</kbd>
                  Select
                </span>
              </div>
              <span className="text-[11px] text-neutral">Freelance Flow Omni-Search</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
