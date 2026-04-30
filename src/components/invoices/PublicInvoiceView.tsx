import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { firestoreService } from '../../services/firestoreService';
import { formatCurrency, cn } from '../../lib/utils';
import { Download, CheckCircle2, Clock, Printer, CreditCard, Edit3 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { auth } from '../../services/firebase';
import { InvoiceEditor } from './InvoiceEditor';

export function PublicInvoiceView({ invoiceId }: { invoiceId: string }) {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
 
  const isOwner = auth.currentUser?.uid === invoice?.userId;

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await firestoreService.getInvoiceWithDetails(invoiceId);
      if (data) {
        setInvoice(data);
      } else {
        setError('Invoice not found');
      }
    } catch (err) {
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || downloading) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${invoice?.invoiceNumber || 'Download'}.pdf`);
    } catch (err) {
      console.error('PDF generation failed', err);
    } finally {
      setDownloading(false);
    }
  };

  const currentUrl = window.location.href;

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-dark-bg">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-dark-bg p-6 text-center">
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{error || 'Invoice not available'}</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">This invoice may have been deleted or the link is invalid.</p>
      </div>
    );
  }

  const isPaid = invoice.status === 'paid';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-dark-bg py-8 px-4 font-sans text-slate-800 dark:text-slate-200 print:bg-white print:p-0 print:m-0">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print-hidden {
            display: none !important;
          }
          .a4-container {
            width: 210mm;
            height: 297mm;
            margin: 0 auto;
            padding: 12mm !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .table-container {
            flex: 1 !important;
            overflow: visible !important;
          }
        }
      `}} />

      <div className="max-w-4xl mx-auto space-y-6">
        
        {isEditing && (
          <InvoiceEditor 
            invoice={invoice}
            onClose={() => setIsEditing(false)}
            onSave={() => {
              setIsEditing(false);
              loadInvoice();
            }}
          />
        )}
        
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-6 bg-white dark:bg-dark-card rounded-3xl shadow-sm border border-slate-200 dark:border-dark-border print-hidden">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isPaid ? (
               <div className="bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm">
                 <CheckCircle2 className="w-5 h-5" />
                 Settled
               </div>
            ) : (
               <div className="bg-amber-500/10 text-amber-600 px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm">
                 <Clock className="w-5 h-5" />
                 Pending
               </div>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isOwner && (
              <button onClick={() => setIsEditing(true)} className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 hover:scale-105">
                <Edit3 className="w-4 h-4" />
                Customize
              </button>
            )}
            <button onClick={() => window.print()} className="px-4 py-2.5 bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs rounded-xl transition-all flex flex-1 sm:flex-none items-center justify-center gap-2 border border-transparent dark:border-dark-border">
               <Printer className="w-4 h-4" />
               Print
            </button>
            <button 
              onClick={handleDownloadPDF} 
              disabled={downloading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex flex-1 sm:flex-none items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
               <Download className="w-4 h-4" />
               {downloading ? 'Sizing...' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* Invoice Paper (A4) */}
        <div 
          ref={invoiceRef} 
          className="bg-white dark:bg-dark-card rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-dark-border overflow-hidden a4-container flex flex-col"
          style={{ minHeight: '297mm' }}
        >
          {/* Top Section */}
          <div className="px-10 py-10 bg-slate-50 dark:bg-dark-bg/50 border-b border-slate-100 dark:border-dark-border flex justify-between items-start">
            <div>
              <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-2 italic">
                {invoice.invoiceTitle || 'INVOICE'}
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded uppercase tracking-widest">{invoice.invoiceNumber}</span>
                <span className="text-slate-400 font-bold text-xs">Issued on {new Date(invoice.issueDate).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="text-right">
              {isPaid ? (
                <div className="text-emerald-600 border-2 border-emerald-600 px-4 py-1 rounded-lg font-black text-xl rotate-[-5deg] inline-block">PAID</div>
              ) : (
                <div className="text-amber-500 border-2 border-amber-500 px-4 py-1 rounded-lg font-black text-xl uppercase tracking-widest">{invoice.status}</div>
              )}
              <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="p-10 flex-1 flex flex-col gap-10">
            {/* Parties */}
            <div className="grid grid-cols-2 gap-16">
               <div>
                  <p className="text-[9px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Recipient / Bill To</p>
                  {invoice.client ? (
                    <div className="space-y-1">
                      <h3 className="font-black text-xl text-slate-900 dark:text-white">{invoice.client.name}</h3>
                      <p className="text-sm font-bold text-slate-500">{invoice.client.company}</p>
                      <p className="text-xs font-medium text-slate-400">{invoice.client.email}</p>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-sm">General Billing Client</p>
                  )}
               </div>
               <div className="text-right">
                  <p className="text-[9px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Billed By / Provider</p>
                  <div className="space-y-1">
                    <h3 className="font-black text-xl text-slate-900 dark:text-white">{invoice.providerName || 'Your Business'}</h3>
                    <div className="text-xs font-bold text-slate-500 space-y-0.5">
                      {invoice.providerEmail && <p>{invoice.providerEmail}</p>}
                      {invoice.providerPhone && <p>{invoice.providerPhone}</p>}
                      {invoice.providerAddress && <p>{invoice.providerAddress}</p>}
                    </div>
                  </div>
               </div>
            </div>

            {/* Project Banner (if linked) */}
            {invoice.project && (
              <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{invoice.project.title}</p>
                 </div>
                 {invoice.duration && (
                   <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest px-2 py-1 bg-white rounded-lg border border-emerald-500/20">{invoice.duration}</span>
                 )}
              </div>
            )}

            {/* Line Items Table */}
            <div className="table-container min-h-0 overflow-y-auto">
               <table className="w-full">
                  <thead className="border-b-2 border-slate-900 dark:border-white/10 uppercase">
                     <tr>
                        <th className="py-3 text-left text-[9px] font-black text-slate-400 tracking-widest">Description of Services</th>
                        <th className="py-3 text-right text-[9px] font-black text-slate-400 tracking-widest w-32">Aggregated Amount</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                     {invoice.services && invoice.services.length > 0 ? (
                       invoice.services.map((item: any, idx: number) => (
                         <tr key={idx}>
                            <td className="py-5 pr-4">
                               <p className="font-black text-slate-900 dark:text-white text-sm">{item.description}</p>
                            </td>
                            <td className="py-5 text-right font-mono font-black text-slate-900 dark:text-white text-sm">
                               {formatCurrency(item.amount)}
                            </td>
                         </tr>
                       ))
                     ) : (
                       <tr>
                         <td className="py-12 text-center text-slate-400 italic text-sm" colSpan={2}>
                           No billing items specified
                         </td>
                       </tr>
                     )}
                  </tbody>
               </table>
            </div>

            {/* Bottom Section */}
            <div className="mt-auto pt-10 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-end gap-10">
               <div className="max-w-md w-full">
                  <p className="text-[9px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Declarations & Notes</p>
                  <div className="p-5 bg-slate-50 dark:bg-dark-bg/20 rounded-3xl border border-slate-100 dark:border-white/5 text-[11px] font-bold text-slate-500 leading-relaxed whitespace-pre-wrap">
                    {invoice.notes || "This is a computer generated invoice. No signature required. Please make payment to the account details provided in your contract."}
                  </div>
               </div>

               <div className="flex items-center gap-8 bg-slate-900 dark:bg-emerald-600 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-500/20 w-full sm:w-auto">
                  <div className="p-2 bg-white rounded-xl">
                     <QRCodeSVG value={currentUrl} size={64} level="H" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Total Aggregate</p>
                    <p className="text-3xl font-black font-mono tracking-tight">{formatCurrency(invoice.amount)}</p>
                    <button className="mt-3 flex items-center gap-2 text-[8px] font-black text-emerald-400 dark:text-emerald-200 uppercase tracking-widest py-1 px-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                       <CreditCard className="w-3 h-3" />
                       Verify & Clear Payment
                    </button>
                  </div>
               </div>
            </div>
            
            {/* Branding Footer */}
            <div className="text-center">
              <p className="text-[8px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-[0.3em]">Powered by FreelanceFlow.inc • Electronic Document</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
