import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Trash2, Save, Calculator, AlertCircle } from 'lucide-react';
import { firestoreService } from '../../services/firestoreService';
import { formatCurrency, cn } from '../../lib/utils';

interface ServiceItem {
  description: string;
  amount: number;
}

interface InvoiceEditorProps {
  invoice: any;
  onClose: () => void;
  onSave: () => void;
}

export function InvoiceEditor({ invoice, onClose, onSave }: InvoiceEditorProps) {
  const [formData, setFormData] = useState({
    invoiceNumber: invoice.invoiceNumber || '',
    issueDate: invoice.issueDate ? invoice.issueDate.split('T')[0] : new Date().toISOString().split('T')[0],
    dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: invoice.status || 'sent',
    duration: invoice.duration || '',
    providerName: invoice.providerName || 'Your Company Name',
    providerAddress: invoice.providerAddress || '',
    providerEmail: invoice.providerEmail || '',
    providerPhone: invoice.providerPhone || '',
    notes: invoice.notes || '',
    invoiceTitle: invoice.invoiceTitle || 'INVOICE',
    billedToLabel: invoice.billedToLabel || 'Billed To',
    services: (invoice.services || []).map((s: any) => ({ 
      description: s.description || '', 
      amount: Number(s.amount) || 0 
    })) as ServiceItem[]
  });

  const [isSaving, setIsSaving] = useState(false);

  const calculateTotal = () => {
    return formData.services.reduce((sum, item) => sum + item.amount, 0);
  };

  const handleAddService = () => {
    setFormData({
      ...formData,
      services: [...formData.services, { description: '', amount: 0 }]
    });
  };

  const handleRemoveService = (index: number) => {
    const newServices = [...formData.services];
    newServices.splice(index, 1);
    setFormData({ ...formData, services: newServices });
  };

  const handleServiceChange = (index: number, field: keyof ServiceItem, value: string | number) => {
    const newServices = [...formData.services];
    newServices[index] = {
      ...newServices[index],
      [field]: field === 'amount' ? Number(value) : value
    };
    setFormData({ ...formData, services: newServices });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const totalAmount = calculateTotal();
      await firestoreService.update('invoices', invoice.id, {
        ...formData,
        amount: totalAmount,
        issueDate: new Date(formData.issueDate).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString()
      });
      onSave();
    } catch (error) {
      console.error("Failed to update invoice", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-2xl bg-white dark:bg-dark-card rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-slate-100 dark:border-dark-border flex items-center justify-between bg-slate-50/50 dark:bg-dark-bg/20">
           <div>
             <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Invoice Editor</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
               {invoice.invoiceNumber || 'New Draft'} {invoice.clientId ? '• Linked to Client' : ''}
             </p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-dark-bg rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-500" />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
           {/* Top Grid */}
           <div className="grid grid-cols-2 gap-6">
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Invoice Number</label>
                 <input 
                   type="text" 
                   value={formData.invoiceNumber}
                   onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
                   className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                   placeholder="INV-001"
                 />
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                 <select 
                   value={formData.status}
                   onChange={(e) => setFormData({...formData, status: e.target.value})}
                   className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                 >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                 </select>
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Issue Date</label>
                 <input 
                   type="date" 
                   value={formData.issueDate}
                   onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                   className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                 />
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Due Date</label>
                 <input 
                   type="date" 
                   value={formData.dueDate}
                   onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                   className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                 />
              </div>
           </div>

           {/* Provider Information */}
           <div className="p-6 bg-slate-50 dark:bg-dark-bg/40 rounded-3xl border border-slate-100 dark:border-dark-border space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Provider / Branding Info</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <input 
                   type="text" 
                   value={formData.providerName}
                   onChange={(e) => setFormData({...formData, providerName: e.target.value})}
                   placeholder="Your Business Name"
                   className="w-full px-4 py-3 bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                 />
                 <input 
                   type="text" 
                   value={formData.providerEmail}
                   onChange={(e) => setFormData({...formData, providerEmail: e.target.value})}
                   placeholder="billing@yourbusiness.com"
                   className="w-full px-4 py-3 bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                 />
                 <input 
                   type="text" 
                   value={formData.providerPhone}
                   onChange={(e) => setFormData({...formData, providerPhone: e.target.value})}
                   placeholder="+1 (555) 000-0000"
                   className="w-full px-4 py-3 bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                 />
                 <input 
                   type="text" 
                   value={formData.providerAddress}
                   onChange={(e) => setFormData({...formData, providerAddress: e.target.value})}
                   placeholder="123 Creative Way, Hub City"
                   className="w-full px-4 py-3 bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                 />
              </div>
           </div>

           {/* Services Section */}
           <div>
              <div className="flex items-center justify-between mb-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Line items / Services</label>
                 <button 
                   type="button"
                   onClick={handleAddService}
                   className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1 hover:text-emerald-700 transition-colors"
                 >
                    <Plus className="w-3 h-3" />
                    Add Entry
                 </button>
              </div>
              
              <div className="space-y-3">
                 {formData.services.map((service, index) => (
                   <div key={index} className="flex gap-3 group">
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value={service.description}
                          onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                          placeholder="Project Milestone / Service Description"
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                      </div>
                      <div className="w-32">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                          <input 
                            type="number" 
                            value={service.amount}
                            onChange={(e) => handleServiceChange(index, 'amount', e.target.value)}
                            className="w-full pl-7 pr-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none text-right"
                          />
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleRemoveService(index)}
                        className="p-3 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                 ))}
                 
                 {formData.services.length === 0 && (
                   <div className="p-8 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl text-center">
                      <Calculator className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-bold text-slate-400">No items added to this invoice</p>
                   </div>
                 )}
              </div>
           </div>

           {/* Total Preview */}
           <div className="p-6 bg-emerald-50 dark:bg-emerald-500/5 rounded-3xl border border-emerald-100 dark:border-emerald-500/10 flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Total Aggregate</p>
                 <div className="flex items-center gap-2">
                    <span className="text-2xl font-mono font-black text-slate-900 dark:text-white">{formatCurrency(calculateTotal())}</span>
                    <AlertCircle className="w-4 h-4 text-emerald-300 dark:text-emerald-600" />
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Net Payable</p>
                 <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">100% Volume</p>
              </div>
           </div>

           {/* Notes Section */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Display Title</label>
                 <input 
                   type="text" 
                   value={formData.invoiceTitle}
                   onChange={(e) => setFormData({...formData, invoiceTitle: e.target.value})}
                   placeholder="INVOICE / BILL / ESTIMATE"
                   className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                 />
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Billing Label</label>
                 <input 
                   type="text" 
                   value={formData.billedToLabel}
                   onChange={(e) => setFormData({...formData, billedToLabel: e.target.value})}
                   placeholder="Billed To / Client"
                   className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                 />
              </div>
           </div>

           <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Invoice Notes / Terms</label>
              <textarea 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Payment terms, bank details, or additional project notes..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none min-h-[100px] resize-none"
              />
           </div>
        </form>

        <div className="px-8 py-6 border-t border-slate-100 dark:border-dark-border flex justify-end gap-3 bg-slate-50/50 dark:bg-dark-bg/20">
           <button 
             type="button"
             onClick={onClose}
             className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
           >
              Discard
           </button>
           <button 
             onClick={handleSubmit}
             disabled={isSaving}
             className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
           >
              {isSaving ? "Syncing..." : "Apply Changes"}
              <Save className="w-3.5 h-3.5" />
           </button>
        </div>
      </motion.div>
    </div>
  );
}
