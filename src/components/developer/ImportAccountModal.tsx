import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, UserCheck } from 'lucide-react';
import { excelService } from '../../services/excelService';
import { firestoreService } from '../../services/firestoreService';
import type { AccountFullData, UserAccount } from '../../types';
import toast from 'react-hot-toast';

interface ImportAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  currentUserId: string;
  onSuccess?: () => void;
}

export function ImportAccountModal({
  isOpen,
  onClose,
  users,
  currentUserId,
  onSuccess,
}: ImportAccountModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<AccountFullData | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string>(currentUserId);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelection = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMsg(null);
    setParsing(true);
    try {
      const data = await excelService.parseAccountFile(selectedFile);
      setParsedData(data);
      toast.success(`Loaded ${selectedFile.name} successfully!`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to parse file. Ensure it is a valid Excel workbook or JSON backup.');
      setParsedData(null);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (!parsedData || !targetUserId) return;
    setImporting(true);
    try {
      const result = await firestoreService.importAccountData(parsedData, targetUserId);
      toast.success(
        `Import complete: ${result.importedCounts.projects} projects, ${result.importedCounts.invoices} invoices, ${result.importedCounts.clients} clients!`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Import failed: ' + (err.message || 'Unknown error'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-txt-primary/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-xl bg-surface border border-ui-border rounded-2xl shadow-2xl overflow-hidden flex flex-col z-[131]"
      >
        {/* Header */}
        <div className="p-5 border-b border-ui-border flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-txt-primary">Import Another Account</h3>
              <p className="text-xs text-txt-secondary">Restore from Excel workbook (.xlsx) or JSON export</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-txt-secondary hover:text-txt-primary rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* File Upload Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              file
                ? 'border-primary/50 bg-primary/5'
                : 'border-ui-border hover:border-primary/40 hover:bg-black/5'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelection(e.target.files[0]);
                }
              }}
            />
            <FileSpreadsheet className="w-10 h-10 text-primary/80 mx-auto mb-2" />
            <p className="text-sm font-semibold text-txt-primary">
              {file ? file.name : 'Click to select or drag & drop account backup'}
            </p>
            <p className="text-xs text-txt-secondary mt-1">
              Supports multi-sheet Excel (.xlsx, .csv) or JSON export files
            </p>
          </div>

          {parsing && (
            <div className="flex items-center justify-center gap-2 p-4 text-xs text-primary font-medium">
              <RefreshCw className="w-4 h-4 animate-spin" /> Reading and validating account structure...
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-xl flex items-start gap-2.5 text-xs text-error">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error reading backup</p>
                <p className="mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Parsed Summary Preview */}
          {parsedData && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Account Data Verified
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-surface rounded-lg border border-emerald-500/20">
                    <p className="font-bold text-txt-primary text-sm">{parsedData.projects?.length || 0}</p>
                    <p className="text-[11px] text-txt-secondary">Projects</p>
                  </div>
                  <div className="p-2 bg-surface rounded-lg border border-emerald-500/20">
                    <p className="font-bold text-txt-primary text-sm">{parsedData.invoices?.length || 0}</p>
                    <p className="text-[11px] text-txt-secondary">Invoices</p>
                  </div>
                  <div className="p-2 bg-surface rounded-lg border border-emerald-500/20">
                    <p className="font-bold text-txt-primary text-sm">{parsedData.clients?.length || 0}</p>
                    <p className="text-[11px] text-txt-secondary">Clients</p>
                  </div>
                  <div className="p-2 bg-surface rounded-lg border border-emerald-500/20">
                    <p className="font-bold text-txt-primary text-sm">{parsedData.tasks?.length || 0}</p>
                    <p className="text-[11px] text-txt-secondary">Tasks</p>
                  </div>
                  <div className="p-2 bg-surface rounded-lg border border-emerald-500/20">
                    <p className="font-bold text-txt-primary text-sm">{parsedData.expenses?.length || 0}</p>
                    <p className="text-[11px] text-txt-secondary">Expenses</p>
                  </div>
                  <div className="p-2 bg-surface rounded-lg border border-emerald-500/20">
                    <p className="font-bold text-emerald-600 text-sm">
                      ${(parsedData.invoices || []).reduce((acc, i) => acc + Number(i.amount || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-txt-secondary">Gross Vol</p>
                  </div>
                </div>
              </div>

              {/* Destination Account Selection */}
              <div>
                <label className="block text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-2">
                  Destination User Account
                </label>
                <div className="relative">
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface border border-ui-border rounded-xl text-xs text-txt-primary outline-none focus:border-primary font-medium"
                  >
                    <option value={currentUserId}>My Current Account (Self Import)</option>
                    {users
                      .filter((u) => u.id !== currentUserId)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.displayName || u.email} ({u.email}) - {u.role}
                        </option>
                      ))}
                  </select>
                </div>
                <p className="text-[11px] text-txt-secondary mt-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-primary" />
                  All projects, tasks, invoices, and clients will be assigned to this user ID.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-ui-border bg-gray-50/70 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-txt-secondary hover:bg-black/5"
          >
            Cancel
          </button>
          <button
            disabled={!parsedData || importing}
            onClick={handleImport}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-white disabled:opacity-50 shadow-sm transition-all"
          >
            {importing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Importing into Account...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" /> Start Import
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
