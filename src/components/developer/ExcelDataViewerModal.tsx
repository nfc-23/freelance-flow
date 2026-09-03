import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Download, Table, Layers, CheckCircle, FileSpreadsheet, Search } from 'lucide-react';
import type { AccountFullData } from '../../types';
import { excelService } from '../../services/excelService';

interface ExcelDataViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AccountFullData | null;
}

export function ExcelDataViewerModal({ isOpen, onClose, data }: ExcelDataViewerModalProps) {
  const [activeSheet, setActiveSheet] = useState<'overview' | 'projects' | 'tasks' | 'invoices' | 'clients' | 'expenses'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen || !data) return null;

  const handleDownload = () => {
    excelService.exportAccountToExcel(data);
  };

  const sheets = [
    { id: 'overview', label: 'Overview', count: null },
    { id: 'projects', label: 'Projects', count: data.projects?.length || 0 },
    { id: 'tasks', label: 'Tasks', count: data.tasks?.length || 0 },
    { id: 'invoices', label: 'Invoices', count: data.invoices?.length || 0 },
    { id: 'clients', label: 'Clients', count: data.clients?.length || 0 },
    { id: 'expenses', label: 'Expenses', count: data.expenses?.length || 0 },
  ] as const;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-txt-primary/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="relative w-full max-w-5xl bg-surface border border-ui-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-[121]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-ui-border flex flex-wrap items-center justify-between gap-4 bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-txt-primary">Excel Sheet Viewer</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  .xlsx Live Data
                </span>
              </div>
              <p className="text-xs text-txt-secondary">
                Account: <span className="font-semibold text-txt-primary">{data.account.email || data.account.uid}</span>
                {data.account.displayName ? ` (${data.account.displayName})` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              Download .xlsx
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-txt-secondary hover:text-txt-primary hover:bg-black/5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sheet Tabs Bar */}
        <div className="border-b border-ui-border bg-surface px-4 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 py-2">
            {sheets.map((sheet) => (
              <button
                key={sheet.id}
                onClick={() => {
                  setActiveSheet(sheet.id);
                  setSearchTerm('');
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeSheet === sheet.id
                    ? 'bg-primary text-white shadow-sm font-semibold'
                    : 'text-txt-secondary hover:text-txt-primary hover:bg-black/5'
                }`}
              >
                <span>{sheet.label}</span>
                {sheet.count !== null && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      activeSheet === sheet.id
                        ? 'bg-white/20 text-white'
                        : 'bg-black/5 text-txt-secondary'
                    }`}
                  >
                    {sheet.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeSheet !== 'overview' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-bg border border-ui-border rounded-lg text-xs">
              <Search className="w-3.5 h-3.5 text-txt-secondary" />
              <input
                type="text"
                placeholder="Search rows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs w-28 sm:w-36 text-txt-primary placeholder:text-txt-secondary/60"
              />
            </div>
          )}
        </div>

        {/* Sheet Content Table */}
        <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-bg/30">
          {activeSheet === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-surface border border-ui-border rounded-xl">
                  <p className="text-xs text-txt-secondary">Total Projects</p>
                  <p className="text-xl font-bold text-txt-primary mt-1">{data.projects?.length || 0}</p>
                </div>
                <div className="p-3.5 bg-surface border border-ui-border rounded-xl">
                  <p className="text-xs text-txt-secondary">Total Invoices</p>
                  <p className="text-xl font-bold text-txt-primary mt-1">{data.invoices?.length || 0}</p>
                </div>
                <div className="p-3.5 bg-surface border border-ui-border rounded-xl">
                  <p className="text-xs text-txt-secondary">Total Invoiced Amount</p>
                  <p className="text-xl font-bold text-primary mt-1">
                    ${(data.invoices || []).reduce((acc, i) => acc + Number(i.amount || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3.5 bg-surface border border-ui-border rounded-xl">
                  <p className="text-xs text-txt-secondary">Total Clients</p>
                  <p className="text-xl font-bold text-txt-primary mt-1">{data.clients?.length || 0}</p>
                </div>
              </div>

              <div className="border border-ui-border rounded-xl overflow-hidden bg-surface">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ui-border bg-gray-50/80">
                      <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider w-1/3">Parameter</th>
                      <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ui-border/60">
                    <tr>
                      <td className="p-3 font-medium text-txt-primary">Account User ID</td>
                      <td className="p-3 font-mono text-txt-secondary select-all">{data.account.uid}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-txt-primary">Account Email</td>
                      <td className="p-3 text-txt-primary font-medium">{data.account.email || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-txt-primary">Display Name</td>
                      <td className="p-3 text-txt-primary">{data.account.displayName || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-txt-primary">Assigned Role</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                          {data.account.role || 'freelancer'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-txt-primary">Export / Snapshot Date</td>
                      <td className="p-3 text-txt-secondary">{new Date(data.account.exportedAt).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSheet === 'projects' && (
            <div className="border border-ui-border rounded-xl overflow-hidden bg-surface">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-ui-border bg-gray-50/80">
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Title</th>
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Status</th>
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Type</th>
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Budget</th>
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Timeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ui-border/60">
                  {(data.projects || [])
                    .filter(p => !searchTerm || p.title?.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((p, idx) => (
                      <tr key={p.id || idx} className="hover:bg-black/5 transition-colors">
                        <td className="p-3 font-semibold text-txt-primary">{p.title}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary uppercase">
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 capitalize text-txt-secondary">{p.type || 'client'}</td>
                        <td className="p-3 font-bold text-txt-primary">${Number(p.budget || 0).toLocaleString()}</td>
                        <td className="p-3 text-txt-secondary font-mono text-[11px]">
                          {p.startDate || '—'} → {p.endDate || '—'}
                        </td>
                      </tr>
                    ))}
                  {(data.projects || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-txt-secondary">No projects in this account.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeSheet === 'tasks' && (
            <div className="border border-ui-border rounded-xl overflow-hidden bg-surface">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-ui-border bg-gray-50/80">
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Task Title</th>
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Status</th>
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Priority</th>
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ui-border/60">
                  {(data.tasks || [])
                    .filter(t => !searchTerm || t.title?.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((t, idx) => (
                      <tr key={t.id || idx} className="hover:bg-black/5 transition-colors">
                        <td className="p-3 font-medium text-txt-primary">{t.title}</td>
                        <td className="p-3">
                          {t.completed ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                              <CheckCircle className="w-3.5 h-3.5" /> Completed
                            </span>
                          ) : (
                            <span className="text-amber-600 font-semibold">Pending</span>
                          )}
                        </td>
                        <td className="p-3 uppercase text-[11px] font-medium text-txt-secondary">{t.priority}</td>
                        <td className="p-3 text-txt-secondary font-mono">{t.dueDate || '—'}</td>
                      </tr>
                    ))}
                  {(data.tasks || []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-txt-secondary">No tasks found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeSheet === 'invoices' && (
            <div className="border border-ui-border rounded-xl overflow-hidden bg-surface">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-ui-border bg-gray-50/80">
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Invoice #</th>
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Amount</th>
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Status</th>
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Due Date</th>
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Items</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ui-border/60">
                  {(data.invoices || [])
                    .filter(i => !searchTerm || i.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((inv, idx) => (
                      <tr key={inv.id || idx} className="hover:bg-black/5 transition-colors">
                        <td className="p-3 font-mono font-bold text-txt-primary">{inv.invoiceNumber}</td>
                        <td className="p-3 font-bold text-emerald-600">${Number(inv.amount || 0).toLocaleString()}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-txt-primary uppercase">
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3 text-txt-secondary font-mono">{inv.dueDate || '—'}</td>
                        <td className="p-3 text-txt-secondary">{inv.items?.length || 0} line items</td>
                      </tr>
                    ))}
                  {(data.invoices || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-txt-secondary">No invoices in this account.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeSheet === 'clients' && (
            <div className="border border-ui-border rounded-xl overflow-hidden bg-surface">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-ui-border bg-gray-50/80">
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Name</th>
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Email</th>
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Company</th>
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ui-border/60">
                  {(data.clients || [])
                    .filter(c => !searchTerm || c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.email?.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((c, idx) => (
                      <tr key={c.id || idx} className="hover:bg-black/5 transition-colors">
                        <td className="p-3 font-semibold text-txt-primary">{c.name}</td>
                        <td className="p-3 text-txt-primary">{c.email}</td>
                        <td className="p-3 text-txt-secondary">{c.company || '—'}</td>
                        <td className="p-3 text-txt-secondary">{c.phone || '—'}</td>
                      </tr>
                    ))}
                  {(data.clients || []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-txt-secondary">No clients in this account.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeSheet === 'expenses' && (
            <div className="border border-ui-border rounded-xl overflow-hidden bg-surface">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-ui-border bg-gray-50/80">
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Description</th>
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Amount</th>
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Category</th>
                    <th className="p-3 font-semibold text-txt-secondary uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ui-border/60">
                  {(data.expenses || [])
                    .filter(e => !searchTerm || e.description?.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((e, idx) => (
                      <tr key={e.id || idx} className="hover:bg-black/5 transition-colors">
                        <td className="p-3 font-medium text-txt-primary">{e.description}</td>
                        <td className="p-3 font-bold text-rose-600">${Number(e.amount || 0).toLocaleString()}</td>
                        <td className="p-3 text-txt-secondary">{e.category || 'General'}</td>
                        <td className="p-3 text-txt-secondary font-mono">{e.date || '—'}</td>
                      </tr>
                    ))}
                  {(data.expenses || []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-txt-secondary">No expenses recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-ui-border bg-gray-50/70 flex items-center justify-between text-xs text-txt-secondary">
          <span>Viewing sheet: <strong className="text-txt-primary capitalize">{activeSheet}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-ui-border bg-surface text-txt-primary hover:bg-black/5 font-medium transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
