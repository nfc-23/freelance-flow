import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Users, Eye, Database, Download, UploadCloud, 
  Search, RefreshCw, FileSpreadsheet, Activity, Globe, Laptop, 
  Smartphone, Tablet, CheckCircle, DollarSign, Briefcase, 
  Shield, Code2, AlertTriangle, UserPlus, UserMinus, Copy, 
  Check, Clock, Trash2, Cpu, Server, Filter, ChevronRight
} from 'lucide-react';
import { firestoreService } from '../../services/firestoreService';
import { excelService } from '../../services/excelService';
import { ExcelDataViewerModal } from './ExcelDataViewerModal';
import { ImportAccountModal } from './ImportAccountModal';
import { AddAuthorizedDeveloperModal } from './AddAuthorizedDeveloperModal';
import type { UserAccount, VisitorLogEntry, AccountFullData, AuthorizedDeveloper, SystemHealthMetrics } from '../../types';
import toast from 'react-hot-toast';

interface DeveloperConsoleProps {
  currentUser: any;
  onNavigate?: (view: string) => void;
}

export function DeveloperConsole({ currentUser, onNavigate }: DeveloperConsoleProps) {
  const isDev = firestoreService.isDeveloper(currentUser);

  const [activeTab, setActiveTab] = useState<'access' | 'health' | 'users' | 'visitors' | 'everything' | 'export_import'>('access');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [developers, setDevelopers] = useState<AuthorizedDeveloper[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [visitors, setVisitors] = useState<VisitorLogEntry[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<SystemHealthMetrics | null>(null);
  const [allRawProjects, setAllRawProjects] = useState<any[]>([]);
  const [allRawInvoices, setAllRawInvoices] = useState<any[]>([]);
  const [allRawClients, setAllRawClients] = useState<any[]>([]);
  const [allRawTasks, setAllRawTasks] = useState<any[]>([]);
  const [allRawExpenses, setAllRawExpenses] = useState<any[]>([]);

  // Filters & Search
  const [devSearch, setDevSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'freelancer' | 'developer'>('all');
  const [visitorSearch, setVisitorSearch] = useState('');
  const [visitorTimeFilter, setVisitorTimeFilter] = useState<'all' | '24h' | '7d'>('all');
  const [collectionFilter, setCollectionFilter] = useState<'projects' | 'invoices' | 'clients' | 'tasks' | 'expenses' | 'visitor_logs' | 'users' | 'authorized_developers'>('projects');
  const [collectionRecords, setCollectionRecords] = useState<any[]>([]);
  const [collectionSearch, setCollectionSearch] = useState('');
  
  // Modals & Popups
  const [selectedRecordJson, setSelectedRecordJson] = useState<any | null>(null);
  const [viewerData, setViewerData] = useState<AccountFullData | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddDevOpen, setIsAddDevOpen] = useState(false);
  const [importTargetUser, setImportTargetUser] = useState<string>(currentUser?.uid || '');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<{ collection: string; id: string } | null>(null);
  const [devToRevoke, setDevToRevoke] = useState<AuthorizedDeveloper | null>(null);

  const loadAllDeveloperData = async () => {
    if (!isDev) return;
    setRefreshing(true);
    try {
      // 1. Fetch authorized developers
      const loadedDevs = await firestoreService.listAuthorizedDevelopers();
      setDevelopers(loadedDevs);

      // 2. Load users with aggregated totals
      const loadedUsers = await firestoreService.listAllUsers();
      setUsers(loadedUsers);

      // 3. Load visitor logs
      const loadedVisitors = await firestoreService.listVisitorLogs(300);
      setVisitors(loadedVisitors);

      // 4. Load raw records for collections
      const [allProjects, allInvoices, allClients, allTasks, allExpenses] = await Promise.all([
        firestoreService.listAll('projects'),
        firestoreService.listAll('invoices'),
        firestoreService.listAll('clients'),
        firestoreService.listAll('tasks'),
        firestoreService.listAll('expenses'),
      ]);

      setAllRawProjects(allProjects);
      setAllRawInvoices(allInvoices);
      setAllRawClients(allClients);
      setAllRawTasks(allTasks);
      setAllRawExpenses(allExpenses);

      // 5. Load health metrics
      const health = await firestoreService.getSystemHealthMetrics();
      setHealthMetrics(health);

      // 6. Refresh current collection view
      loadCollectionData(collectionFilter);
    } catch (err) {
      console.error('Failed to load developer console data:', err);
      toast.error('Failed to refresh developer telemetry');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCollectionData = async (colName: string) => {
    if (!isDev) return;
    try {
      const records = await firestoreService.listAll(colName);
      setCollectionRecords(records);
    } catch (err) {
      console.error(`Failed to load ${colName}:`, err);
    }
  };

  useEffect(() => {
    if (isDev) {
      loadAllDeveloperData();
      // Real-time listener for authorized developers
      const unsubscribe = firestoreService.listenAuthorizedDevelopers((updatedDevs) => {
        setDevelopers(updatedDevs);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [currentUser, isDev]);

  useEffect(() => {
    if (isDev) {
      loadCollectionData(collectionFilter);
    }
  }, [collectionFilter, isDev]);

  // Master System Excel Backup
  const handleExportSystemMasterBackup = () => {
    const loadingToast = toast.loading('Compiling Master Full System Backup (.xlsx)...');
    try {
      excelService.exportSystemMasterBackup({
        users,
        developers,
        projects: allRawProjects,
        invoices: allRawInvoices,
        clients: allRawClients,
        tasks: allRawTasks,
        expenses: allRawExpenses,
        visitors,
        metrics: healthMetrics,
      });
      toast.success('Master System Backup (.xlsx) generated successfully!', { id: loadingToast });
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to generate master backup: ' + (err.message || 'Unknown error'), { id: loadingToast });
    }
  };

  // Export specific account to Excel
  const handleExportAccountExcel = async (targetUser: UserAccount) => {
    const loadingToast = toast.loading(`Compiling Excel workbook for ${targetUser.email || targetUser.id}...`);
    try {
      const fullData = await firestoreService.exportAccountData(targetUser.id);
      excelService.exportAccountToExcel(fullData);
      toast.success(`Exported ${targetUser.email}'s data to Excel!`, { id: loadingToast });
    } catch (err: any) {
      console.error(err);
      toast.error('Export failed: ' + (err.message || 'Unknown error'), { id: loadingToast });
    }
  };

  // Inspect account data in in-app Excel Sheet Viewer
  const handleInspectAccountSheet = async (targetUser: UserAccount) => {
    const loadingToast = toast.loading(`Loading account sheet for ${targetUser.email || targetUser.id}...`);
    try {
      const fullData = await firestoreService.exportAccountData(targetUser.id);
      setViewerData(fullData);
      setIsViewerOpen(true);
      toast.dismiss(loadingToast);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load account sheet', { id: loadingToast });
    }
  };

  // Toggle user role in directory
  const handleToggleUserRole = async (targetUser: UserAccount) => {
    const isCurrentlyDev = targetUser.role === 'developer';
    const newRole = isCurrentlyDev ? 'freelancer' : 'developer';

    if (isCurrentlyDev && targetUser.email === firestoreService.PRIMARY_DEVELOPER_EMAIL) {
      toast.error('Primary root developer role cannot be downgraded.');
      return;
    }

    try {
      await firestoreService.update('users', targetUser.id, { role: newRole });
      if (newRole === 'developer') {
        await firestoreService.addAuthorizedDeveloper({
          email: targetUser.email,
          displayName: targetUser.displayName,
          role: 'admin',
          addedBy: currentUser?.email || 'superuser',
          notes: 'Promoted directly via Users Directory'
        });
      } else {
        await firestoreService.removeAuthorizedDeveloper(targetUser.email);
      }
      toast.success(`User role updated to ${newRole}`);
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    }
  };

  // Revoke developer access
  const handleConfirmRevokeDeveloper = async () => {
    if (!devToRevoke) return;
    try {
      await firestoreService.removeAuthorizedDeveloper(devToRevoke.email);
      toast.success(`Revoked developer privileges for ${devToRevoke.email}`);
      setDevelopers(prev => prev.filter(d => d.email.toLowerCase() !== devToRevoke.email.toLowerCase()));
      setDevToRevoke(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke access');
    }
  };

  // Delete record from Database Inspector
  const handleConfirmDeleteRecord = async () => {
    if (!recordToDelete) return;
    try {
      await firestoreService.deleteRecord(recordToDelete.collection, recordToDelete.id);
      toast.success(`Deleted record ${recordToDelete.id} from ${recordToDelete.collection}`);
      setCollectionRecords(prev => prev.filter(r => r.id !== recordToDelete.id));
      setRecordToDelete(null);
      loadAllDeveloperData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete record');
    }
  };

  // Prune visitor logs
  const handlePruneVisitors = async (days: number) => {
    const loadingToast = toast.loading(`Pruning visitor logs older than ${days} days...`);
    try {
      const count = await firestoreService.clearVisitorLogs(days);
      toast.success(`Pruned ${count} historical visitor logs.`, { id: loadingToast });
      loadAllDeveloperData();
    } catch (err: any) {
      toast.error('Failed to prune logs: ' + (err.message || 'Unknown error'), { id: loadingToast });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  // Filter developers
  const filteredDevelopers = developers.filter(d => {
    if (!devSearch) return true;
    const term = devSearch.toLowerCase();
    return (
      d.email?.toLowerCase().includes(term) ||
      d.displayName?.toLowerCase().includes(term) ||
      d.role?.toLowerCase().includes(term) ||
      d.notes?.toLowerCase().includes(term)
    );
  });

  // Filter users
  const filteredUsers = users.filter(u => {
    if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
    if (!userSearch) return true;
    const term = userSearch.toLowerCase();
    return (
      u.email?.toLowerCase().includes(term) ||
      u.displayName?.toLowerCase().includes(term) ||
      u.id?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    );
  });

  // Filter visitors
  const filteredVisitors = visitors.filter(v => {
    // Time filter
    if (visitorTimeFilter !== 'all') {
      const logDate = new Date(v.createdAt || Date.now()).getTime();
      const cutoff = visitorTimeFilter === '24h' 
        ? Date.now() - 24 * 60 * 60 * 1000 
        : Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (logDate < cutoff) return false;
    }

    if (!visitorSearch) return true;
    const term = visitorSearch.toLowerCase();
    return (
      v.path?.toLowerCase().includes(term) ||
      v.visitorId?.toLowerCase().includes(term) ||
      v.userEmail?.toLowerCase().includes(term) ||
      v.device?.toLowerCase().includes(term) ||
      v.browser?.toLowerCase().includes(term) ||
      v.action?.toLowerCase().includes(term)
    );
  });

  // Device counts
  const deviceCounts = filteredVisitors.reduce((acc, v) => {
    const dev = v.device || 'Desktop';
    acc[dev] = (acc[dev] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalVisitorsCount = filteredVisitors.length || 1;
  const desktopPct = Math.round(((deviceCounts['Desktop'] || 0) / totalVisitorsCount) * 100);
  const mobilePct = Math.round(((deviceCounts['Mobile'] || 0) / totalVisitorsCount) * 100);
  const tabletPct = Math.round(((deviceCounts['Tablet'] || 0) / totalVisitorsCount) * 100);

  // Filter records
  const filteredRecords = collectionRecords.filter(r => {
    if (!collectionSearch) return true;
    const term = collectionSearch.toLowerCase();
    return JSON.stringify(r).toLowerCase().includes(term);
  });

  // Access check
  if (!isDev) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-surface border border-ui-border rounded-2xl text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-txt-primary">Access Restricted</h2>
          <p className="text-xs text-txt-secondary leading-relaxed">
            The Developer Console is restricted strictly to authorized administrators. Your account (<span className="font-mono font-medium text-txt-primary">{currentUser?.email || 'Guest'}</span>) does not have developer privileges.
          </p>
        </div>
        <button
          onClick={() => onNavigate?.('dashboard')}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-txt-primary text-bg hover:opacity-90 transition-all shadow-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-ui-border">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-txt-primary">Developer Console</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-white tracking-wide uppercase">
                  Superuser
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Whitelisted Access
                </span>
              </div>
              <p className="text-xs text-txt-secondary mt-0.5">
                System Administration: RBAC & Developer Access, Live Telemetry, Full Database Inspector, and Master Backups.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Developer Button */}
          <button
            onClick={() => setIsAddDevOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Authorize Developer
          </button>

          {/* Master Excel Backup */}
          <button
            onClick={handleExportSystemMasterBackup}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all"
            title="Download full multi-sheet Excel file of the entire system database"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Master System Backup (.xlsx)
          </button>

          {/* Import Account */}
          <button
            onClick={() => {
              setImportTargetUser(currentUser?.uid || '');
              setIsImportOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-ui-border hover:bg-black/5 text-txt-primary shadow-xs transition-all"
          >
            <UploadCloud className="w-4 h-4 text-primary" />
            Import Account
          </button>

          {/* Refresh Button */}
          <button
            onClick={loadAllDeveloperData}
            disabled={refreshing}
            className="p-2 rounded-xl border border-ui-border bg-surface text-txt-secondary hover:text-txt-primary hover:bg-black/5 transition-colors"
            title="Refresh All Feeds & Diagnostics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Live System Diagnostics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-surface border border-ui-border rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[11px] font-medium text-txt-secondary">Firestore Latency</p>
            <p className="text-base font-bold text-txt-primary font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {healthMetrics?.latencyMs ? `${healthMetrics.latencyMs} ms` : 'Active'}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-surface border border-ui-border rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[11px] font-medium text-txt-secondary">Authorized Developers</p>
            <p className="text-base font-bold text-primary font-mono">{developers.length} accounts</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-surface border border-ui-border rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[11px] font-medium text-txt-secondary">Gross System Revenue</p>
            <p className="text-base font-bold text-emerald-600 font-mono">
              ${(healthMetrics?.totalRevenuePaid || 0).toLocaleString()}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-surface border border-ui-border rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[11px] font-medium text-txt-secondary">Traffic Today (24h)</p>
            <p className="text-base font-bold text-txt-primary font-mono">
              {healthMetrics?.todayVisitors || 0} hits
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="border-b border-ui-border flex items-center gap-2 overflow-x-auto custom-scrollbar">
        {[
          { id: 'access', label: 'Authorized Developers (RBAC)', icon: ShieldCheck, count: developers.length },
          { id: 'health', label: 'System Health & Metrics', icon: Cpu },
          { id: 'users', label: 'Users & Accounts', icon: Users, count: users.length },
          { id: 'visitors', label: 'Live Traffic & Visitors', icon: Globe, count: visitors.length },
          { id: 'everything', label: "Database Inspector ('Everything')", icon: Database, count: collectionRecords.length },
          { id: 'export_import', label: 'Account Migrator & Portability', icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-xs transition-all whitespace-nowrap ${
                isActive
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-txt-secondary hover:text-txt-primary'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-primary/10 text-primary' : 'bg-black/5 text-txt-secondary'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AUTHORIZED DEVELOPERS & RBAC ACCESS CONTROL */}
      {/* ========================================================================= */}
      {activeTab === 'access' && (
        <div className="space-y-6">
          {/* Informational Hero Card */}
          <div className="p-5 bg-surface border border-ui-border rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-txt-primary">Developer Access & Permission Whitelist</h2>
              </div>
              <p className="text-xs text-txt-secondary max-w-2xl leading-relaxed">
                Accounts registered in this whitelist gain full developer privileges, bypassing user isolation in Firestore security rules to inspect databases, manage telemetry, and execute account migrations.
              </p>
            </div>

            <button
              onClick={() => setIsAddDevOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs transition-all shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              Add Authorized Email
            </button>
          </div>

          {/* Search and Summary */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-txt-secondary" />
              <input
                type="text"
                placeholder="Search authorized developer email, name, role..."
                value={devSearch}
                onChange={(e) => setDevSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface border border-ui-border rounded-xl text-xs text-txt-primary outline-none focus:border-primary"
              />
            </div>
            <p className="text-xs text-txt-secondary">
              Total Authorized Developers: <strong className="text-txt-primary">{filteredDevelopers.length}</strong>
            </p>
          </div>

          {/* Developer Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDevelopers.map((dev) => {
              const isRoot = dev.email.toLowerCase() === firestoreService.PRIMARY_DEVELOPER_EMAIL.toLowerCase();
              const isCurrentSession = currentUser?.email?.toLowerCase() === dev.email.toLowerCase();

              return (
                <div
                  key={dev.id || dev.email}
                  className={`p-5 bg-surface border rounded-2xl shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                    isRoot ? 'border-primary/40 bg-primary/[0.02]' : 'border-ui-border hover:border-ui-border/80'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm uppercase">
                          {dev.displayName?.charAt(0) || dev.email.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-txt-primary">{dev.displayName || 'Authorized Developer'}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-xs text-txt-secondary truncate max-w-[170px]">{dev.email}</span>
                            <button
                              onClick={() => copyToClipboard(dev.email, 'email')}
                              className="p-1 rounded hover:bg-black/5 text-txt-secondary hover:text-txt-primary transition-colors"
                              title="Copy email"
                            >
                              {copiedEmail === dev.email ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {isRoot ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white tracking-wide uppercase">
                          Root Owner
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 uppercase">
                          {dev.role || 'Admin'}
                        </span>
                      )}
                    </div>

                    {dev.notes && (
                      <div className="p-2.5 bg-bg/80 border border-ui-border/60 rounded-xl text-[11px] text-txt-secondary leading-relaxed">
                        {dev.notes}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-ui-border/60 flex items-center justify-between text-[11px] text-txt-secondary">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Added: {dev.addedAt ? new Date(dev.addedAt).toLocaleDateString() : 'Active'}</span>
                    </div>

                    {isRoot ? (
                      <span className="font-semibold text-emerald-600 flex items-center gap-1 text-[10px]">
                        <CheckCircle className="w-3 h-3" /> Protected
                      </span>
                    ) : (
                      <button
                        onClick={() => setDevToRevoke(dev)}
                        className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold hover:underline"
                      >
                        <UserMinus className="w-3 h-3" />
                        Revoke Access
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredDevelopers.length === 0 && (
            <div className="p-12 text-center bg-surface border border-ui-border rounded-2xl">
              <Shield className="w-8 h-8 mx-auto text-txt-secondary mb-2" />
              <p className="text-sm font-semibold text-txt-primary">No matching authorized developer found</p>
              <p className="text-xs text-txt-secondary mt-1">Try adjusting your search criteria or add a new authorized developer.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SYSTEM HEALTH & METRICS */}
      {/* ========================================================================= */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-surface border border-ui-border rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">Cloud Engine Status</p>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-2xl font-bold text-txt-primary capitalize">{healthMetrics?.databaseStatus || 'Operational'}</p>
              <p className="text-xs text-txt-secondary">
                Connected to Google Cloud Firestore with real-time websocket synchronization.
              </p>
            </div>

            <div className="p-5 bg-surface border border-ui-border rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">Active Daily Users</p>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-primary">{healthMetrics?.activeTodayUsers || 0}</p>
              <p className="text-xs text-txt-secondary">
                Unique accounts active or logged in during the past 24-hour cycle.
              </p>
            </div>

            <div className="p-5 bg-surface border border-ui-border rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">Database Total Records</p>
                <Database className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-600">
                {Object.values(healthMetrics?.collectionsBreakdown || {}).reduce((a: number, b: any) => a + Number(b || 0), 0)}
              </p>
              <p className="text-xs text-txt-secondary">
                Cumulative documents across all business tables.
              </p>
            </div>
          </div>

          {/* Detailed Collections Breakdown */}
          <div className="p-6 bg-surface border border-ui-border rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-txt-primary">Database Collection Storage Distribution</h3>
                <p className="text-xs text-txt-secondary">Record count breakdown across primary Firestore collections.</p>
              </div>
              <button
                onClick={loadAllDeveloperData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ui-border text-xs font-medium text-txt-secondary hover:text-txt-primary hover:bg-black/5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Run Diagnostics
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
              {[
                { name: 'Users', count: healthMetrics?.collectionsBreakdown.users || 0, color: 'text-blue-600' },
                { name: 'Projects', count: healthMetrics?.collectionsBreakdown.projects || 0, color: 'text-primary' },
                { name: 'Invoices', count: healthMetrics?.collectionsBreakdown.invoices || 0, color: 'text-emerald-600' },
                { name: 'Clients', count: healthMetrics?.collectionsBreakdown.clients || 0, color: 'text-amber-600' },
                { name: 'Tasks', count: healthMetrics?.collectionsBreakdown.tasks || 0, color: 'text-purple-600' },
                { name: 'Expenses', count: healthMetrics?.collectionsBreakdown.expenses || 0, color: 'text-rose-600' },
                { name: 'Visitor Logs', count: healthMetrics?.collectionsBreakdown.visitorLogs || 0, color: 'text-cyan-600' },
              ].map((col) => (
                <div key={col.name} className="p-3 bg-bg border border-ui-border rounded-xl text-center">
                  <p className="text-[11px] font-medium text-txt-secondary truncate">{col.name}</p>
                  <p className={`text-xl font-bold mt-1 ${col.color}`}>{col.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: USERS & ACCOUNTS */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-txt-secondary" />
                <input
                  type="text"
                  placeholder="Search user by email, name, role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-surface border border-ui-border rounded-xl text-xs text-txt-primary outline-none focus:border-primary"
                />
              </div>

              {/* Role filter buttons */}
              <div className="flex items-center gap-1 p-1 bg-surface border border-ui-border rounded-xl">
                {(['all', 'freelancer', 'developer'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setUserRoleFilter(r)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                      userRoleFilter === r
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-txt-secondary hover:text-txt-primary'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-txt-secondary">
              Showing <strong className="text-txt-primary">{filteredUsers.length}</strong> user accounts
            </p>
          </div>

          <div className="border border-ui-border rounded-2xl overflow-hidden bg-surface shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-ui-border bg-gray-50/80">
                    <th className="p-3.5 font-semibold text-txt-secondary uppercase tracking-wider">User Account</th>
                    <th className="p-3.5 font-semibold text-txt-secondary uppercase tracking-wider">Role</th>
                    <th className="p-3.5 font-semibold text-txt-secondary uppercase tracking-wider">Projects</th>
                    <th className="p-3.5 font-semibold text-txt-secondary uppercase tracking-wider">Clients</th>
                    <th className="p-3.5 font-semibold text-txt-secondary uppercase tracking-wider">Invoices</th>
                    <th className="p-3.5 font-semibold text-txt-secondary uppercase tracking-wider">Revenue</th>
                    <th className="p-3.5 font-semibold text-txt-secondary uppercase tracking-wider">Last Login</th>
                    <th className="p-3.5 font-semibold text-txt-secondary uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ui-border/60">
                  {filteredUsers.map((u) => {
                    const isUserDev = u.role === 'developer';
                    return (
                      <tr key={u.id} className="hover:bg-black/5 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full border border-ui-border shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                                {u.displayName?.charAt(0) || u.email?.charAt(0) || 'U'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-txt-primary truncate">{u.displayName || 'Freelancer'}</p>
                              <p className="text-[11px] text-txt-secondary font-mono truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleUserRole(u)}
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase transition-all ${
                              isUserDev
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-txt-secondary hover:bg-gray-200'
                            }`}
                            title="Click to toggle role"
                          >
                            {u.role || 'freelancer'}
                          </button>
                        </td>

                        <td className="p-3.5 font-bold text-txt-primary">{u.totalProjects || 0}</td>
                        <td className="p-3.5 font-bold text-txt-primary">{u.totalClients || 0}</td>
                        <td className="p-3.5 font-bold text-txt-primary">{u.totalInvoices || 0}</td>
                        <td className="p-3.5 font-bold text-emerald-600">${(u.totalRevenue || 0).toLocaleString()}</td>
                        <td className="p-3.5 text-txt-secondary text-[11px]">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleInspectAccountSheet(u)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                              title="Inspect account data in Excel Spreadsheet Viewer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Sheet
                            </button>

                            <button
                              onClick={() => handleExportAccountExcel(u)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                              title="Export all data of this account as .xlsx workbook"
                            >
                              <Download className="w-3.5 h-3.5" />
                              .xlsx
                            </button>

                            <button
                              onClick={() => {
                                setImportTargetUser(u.id);
                                setIsImportOpen(true);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface border border-ui-border text-txt-primary hover:bg-black/5 transition-colors"
                              title="Import data into this account"
                            >
                              <UploadCloud className="w-3.5 h-3.5 text-primary" />
                              Import
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-txt-secondary">
                        No user accounts found matching your query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: VISITORS & TRAFFIC */}
      {/* ========================================================================= */}
      {activeTab === 'visitors' && (
        <div className="space-y-6">
          {/* Device Distribution Progress */}
          <div className="p-5 bg-surface border border-ui-border rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-txt-primary">Device & Platform Distribution</h3>
                <p className="text-xs text-txt-secondary">Breakdown of recorded visitor hardware signatures.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePruneVisitors(30)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-ui-border text-xs font-medium text-txt-secondary hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete logs older than 30 days"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Prune &gt;30d
                </button>

                <button
                  onClick={() => excelService.exportVisitorsToExcel(filteredVisitors)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Export (.xlsx)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-txt-secondary flex items-center gap-1">
                    <Laptop className="w-3.5 h-3.5 text-blue-600" /> Desktop
                  </span>
                  <span className="text-xs font-bold text-txt-primary">{desktopPct}%</span>
                </div>
                <p className="text-lg font-bold text-txt-primary mt-1">{deviceCounts['Desktop'] || 0}</p>
              </div>

              <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-txt-secondary flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> Mobile
                  </span>
                  <span className="text-xs font-bold text-txt-primary">{mobilePct}%</span>
                </div>
                <p className="text-lg font-bold text-txt-primary mt-1">{deviceCounts['Mobile'] || 0}</p>
              </div>

              <div className="p-3 bg-purple-500/5 border border-purple-500/15 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-txt-secondary flex items-center gap-1">
                    <Tablet className="w-3.5 h-3.5 text-purple-600" /> Tablet / Other
                  </span>
                  <span className="text-xs font-bold text-txt-primary">{tabletPct}%</span>
                </div>
                <p className="text-lg font-bold text-txt-primary mt-1">{deviceCounts['Tablet'] || 0}</p>
              </div>
            </div>
          </div>

          {/* Time & Search Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-txt-secondary" />
                <input
                  type="text"
                  placeholder="Search visitor logs by path, email, device..."
                  value={visitorSearch}
                  onChange={(e) => setVisitorSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-surface border border-ui-border rounded-xl text-xs text-txt-primary outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-surface border border-ui-border rounded-xl">
                {(['all', '24h', '7d'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setVisitorTimeFilter(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                      visitorTimeFilter === t
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-txt-secondary hover:text-txt-primary'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-txt-secondary">
              Showing <strong className="text-txt-primary">{filteredVisitors.length}</strong> visitor events
            </p>
          </div>

          {/* Table */}
          <div className="border border-ui-border rounded-2xl overflow-hidden bg-surface shadow-xs">
            <div className="overflow-x-auto max-h-[550px] custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-gray-50 border-b border-ui-border z-10">
                  <tr>
                    <th className="p-3.5 font-semibold text-txt-secondary uppercase tracking-wider">Visitor Hash</th>
                    <th className="p-3.5 font-semibold text-txt-secondary uppercase tracking-wider">Page / Path</th>
                    <th className="p-3.5 font-semibold text-txt-secondary uppercase tracking-wider">Device & Browser</th>
                    <th className="p-3.5 font-semibold text-txt-secondary uppercase tracking-wider">Action</th>
                    <th className="p-3.5 font-semibold text-txt-secondary uppercase tracking-wider">User Identity</th>
                    <th className="p-3.5 font-semibold text-txt-secondary uppercase tracking-wider text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ui-border/60">
                  {filteredVisitors.map((v) => (
                    <tr key={v.id} className="hover:bg-black/5 transition-colors">
                      <td className="p-3.5 font-mono text-txt-secondary text-[11px] select-all">
                        {v.visitorId || v.id.substring(0, 10)}
                      </td>
                      <td className="p-3.5 font-medium text-txt-primary font-mono">{v.path}</td>
                      <td className="p-3.5 text-txt-secondary">
                        <span className="font-semibold text-txt-primary">{v.device}</span> ({v.browser})
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary">
                          {v.action}
                        </span>
                      </td>
                      <td className="p-3.5 text-txt-secondary">
                        {v.userEmail ? (
                          <span className="font-semibold text-txt-primary">{v.userEmail}</span>
                        ) : (
                          <span className="text-neutral italic">Guest / Visitor</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right text-txt-secondary font-mono text-[11px]">
                        {v.createdAt ? new Date(v.createdAt).toLocaleString() : 'Just now'}
                      </td>
                    </tr>
                  ))}
                  {filteredVisitors.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-txt-secondary">
                        No visitor logs captured for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: DATABASE INSPECTOR ('EVERYTHING') */}
      {/* ========================================================================= */}
      {activeTab === 'everything' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Collection Select Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-surface border border-ui-border rounded-xl overflow-x-auto custom-scrollbar">
              {(['projects', 'invoices', 'clients', 'tasks', 'expenses', 'visitor_logs', 'users', 'authorized_developers'] as const).map((col) => (
                <button
                  key={col}
                  onClick={() => setCollectionFilter(col)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                    collectionFilter === col
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-txt-secondary hover:text-txt-primary hover:bg-black/5'
                  }`}
                >
                  {col.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-txt-secondary" />
              <input
                type="text"
                placeholder={`Search ${collectionFilter}...`}
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface border border-ui-border rounded-xl text-xs text-txt-primary outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="border border-ui-border rounded-2xl overflow-hidden bg-surface shadow-xs">
            <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-gray-50 border-b border-ui-border z-10">
                  <tr>
                    <th className="p-3.5 font-semibold text-txt-secondary uppercase tracking-wider w-1/4">Document ID</th>
                    <th className="p-3.5 font-semibold text-txt-secondary uppercase tracking-wider w-1/4">Owner / Reference</th>
                    <th className="p-3.5 font-semibold text-txt-secondary uppercase tracking-wider">Key Attributes</th>
                    <th className="p-3.5 font-semibold text-txt-secondary uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ui-border/60">
                  {filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-black/5 transition-colors">
                      <td className="p-3.5 font-mono font-semibold text-txt-primary select-all">{rec.id}</td>
                      <td className="p-3.5 font-mono text-txt-secondary text-[11px] select-all">
                        {rec.userId || rec.email || 'N/A'}
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          {rec.title && <p className="font-semibold text-txt-primary">{rec.title}</p>}
                          {rec.name && <p className="font-semibold text-txt-primary">{rec.name} {rec.email && `(${rec.email})`}</p>}
                          {rec.invoiceNumber && (
                            <p className="font-semibold text-txt-primary">
                              {rec.invoiceNumber} - ${Number(rec.amount || 0).toLocaleString()} ({rec.status})
                            </p>
                          )}
                          {rec.description && <p className="text-txt-secondary truncate max-w-md">{rec.description}</p>}
                          {rec.path && <p className="font-mono text-txt-secondary">{rec.path}</p>}
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedRecordJson(rec)}
                            className="px-2.5 py-1 rounded-lg border border-ui-border bg-surface text-txt-secondary hover:text-txt-primary text-xs font-mono"
                          >
                            JSON
                          </button>
                          <button
                            onClick={() => setRecordToDelete({ collection: collectionFilter, id: rec.id })}
                            className="p-1 rounded-lg text-txt-secondary hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete this document from Firestore"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-txt-secondary">
                        No records in this collection matching your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ACCOUNT MIGRATOR & PORTABILITY */}
      {/* ========================================================================= */}
      {activeTab === 'export_import' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Master System Export */}
          <div className="p-6 bg-surface border border-ui-border rounded-2xl shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-txt-primary">Master System Full Database Backup (.xlsx)</h3>
              <p className="text-xs text-txt-secondary mt-1">
                Generates a multi-sheet Excel file containing every table in the platform: Overview, Users, Projects, Tasks, Invoices, Clients, Expenses, Traffic, and Whitelisted Developers.
              </p>
            </div>

            <div className="p-3.5 bg-bg border border-ui-border rounded-xl text-xs space-y-2">
              <p className="font-semibold text-txt-primary">Master Workbook Contents:</p>
              <ul className="list-disc list-inside text-txt-secondary space-y-1">
                <li><strong>Overview:</strong> Platform KPIs, total revenue, global record counts</li>
                <li><strong>Authorized Devs:</strong> Whitelisted developer accounts and roles</li>
                <li><strong>Users Directory:</strong> Full roster of registered freelancers</li>
                <li><strong>Projects & Invoices:</strong> All client work, statuses, and financials</li>
                <li><strong>Traffic Telemetry:</strong> Up to 1,000 recent visitor hits and referrers</li>
              </ul>
            </div>

            <button
              onClick={handleExportSystemMasterBackup}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all"
            >
              <Download className="w-4 h-4" />
              Download Master Database Backup (.xlsx)
            </button>
          </div>

          {/* Account Importer Box */}
          <div className="p-6 bg-surface border border-ui-border rounded-2xl shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-txt-primary">Import / Migrate Data into Account</h3>
              <p className="text-xs text-txt-secondary mt-1">
                Upload an Excel workbook (.xlsx) or JSON export to clone, migrate, or restore projects, invoices, and clients into any registered account.
              </p>
            </div>

            <div className="p-3.5 bg-bg border border-ui-border rounded-xl text-xs space-y-2">
              <p className="font-semibold text-txt-primary">Portability Highlights:</p>
              <ul className="list-disc list-inside text-txt-secondary space-y-1">
                <li>Automatic column parsing & schema normalization</li>
                <li>Preserves relational mapping between projects, clients, and invoices</li>
                <li>Allows re-assigning foreign user data to any target account ID</li>
                <li>Transaction-safe batch insertion</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setImportTargetUser(currentUser?.uid || '');
                setIsImportOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              Launch Account Importer
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Add Authorized Developer Modal */}
      <AddAuthorizedDeveloperModal
        isOpen={isAddDevOpen}
        onClose={() => setIsAddDevOpen(false)}
        currentUser={currentUser}
        onDeveloperAdded={(newDev) => {
          setDevelopers(prev => [...prev.filter(d => d.email.toLowerCase() !== newDev.email.toLowerCase()), newDev]);
          loadAllDeveloperData();
        }}
      />

      {/* Confirm Revoke Developer Dialog */}
      <AnimatePresence>
        {devToRevoke && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-ui-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-txt-primary">Revoke Developer Privileges?</h3>
                <p className="text-xs text-txt-secondary leading-relaxed">
                  Are you sure you want to remove developer privileges for <strong className="text-txt-primary">{devToRevoke.email}</strong>? They will immediately lose superuser access and be downgraded to a standard freelancer account.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-ui-border">
                <button
                  onClick={() => setDevToRevoke(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-txt-secondary hover:text-txt-primary hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRevokeDeveloper}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                >
                  Confirm Revoke
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Document Dialog */}
      <AnimatePresence>
        {recordToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-ui-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-txt-primary">Delete Firestore Document?</h3>
                <p className="text-xs text-txt-secondary leading-relaxed">
                  Permanently remove document <code className="font-mono text-txt-primary">{recordToDelete.id}</code> from collection <code className="font-mono text-txt-primary">{recordToDelete.collection}</code>. This action is irreversible.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-ui-border">
                <button
                  onClick={() => setRecordToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-txt-secondary hover:text-txt-primary hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteRecord}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                >
                  Delete Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Raw Record JSON Modal */}
      <AnimatePresence>
        {selectedRecordJson && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-surface border border-ui-border rounded-2xl shadow-2xl p-5 z-[141] max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-ui-border">
                <p className="font-bold text-sm text-txt-primary font-mono">Document: {selectedRecordJson.id}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(selectedRecordJson, null, 2), 'JSON')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-ui-border text-xs text-txt-secondary hover:text-txt-primary hover:bg-black/5"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                  <button onClick={() => setSelectedRecordJson(null)} className="p-1 rounded text-txt-secondary hover:text-txt-primary">
                    ✕
                  </button>
                </div>
              </div>
              <pre className="flex-1 overflow-auto p-4 bg-gray-900 text-emerald-400 font-mono text-xs rounded-xl mt-4 custom-scrollbar select-all">
                {JSON.stringify(selectedRecordJson, null, 2)}
              </pre>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Excel Spreadsheet Viewer Modal */}
      <ExcelDataViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        data={viewerData}
      />

      {/* Account Importer Modal */}
      <ImportAccountModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        users={users}
        currentUserId={importTargetUser || currentUser?.uid || ''}
        onSuccess={loadAllDeveloperData}
      />
    </div>
  );
}
