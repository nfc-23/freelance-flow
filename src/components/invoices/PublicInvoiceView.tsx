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
      if (data) setInvoice(data);
      else setError('Invoice not found');
    } catch (err) {
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInvoice(); }, [invoiceId]);

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
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
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
      <div className="h-screen w-full flex items-center justify-center bg-bg">
        <div className="w-10 h-10 border-4 border-ui-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-bg p-6 text-center">
        <div className="w-16 h-16 bg-error/10 text-error rounded-2xl flex items-center justify-center mb-6">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-display text-txt-primary mb-2">{error || 'Invoice not available'}</h2>
        <p className="text-sm text-txt-secondary max-w-sm">This invoice may have been deleted or the link is invalid.</p>
      </div>
    );
  }

  const isPaid = invoice.status === 'paid';

  return (
    <div className="min-h-screen bg-bg py-12 px-4 font-sans text-txt-primary print:bg-white print:p-0 print:m-0 flex flex-col items-center">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 0; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; background: #ffffff !important; }
          .print-hidden { display: none !important; }
          .a4-container {
            width: 210mm; height: 297mm; margin: 0 auto; padding: 16mm !important;
            box-shadow: none !important; border: none !important; border-radius: 0 !important;
            display: flex !important; flex-direction: column !important; background: #ffffff !important;
          }
          .table-container { flex: 1 !important; overflow: visible !important; }
        }
      `}} />

      <div className="max-w-4xl w-full mx-auto space-y-6">
        
        {isEditing && (
          <InvoiceEditor 
            invoice={invoice}
            onClose={() => setIsEditing(false)}
            onSave={() => { setIsEditing(false); loadInvoice(); }}
          />
        )}
        
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 genesis-card print-hidden">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isPaid ? (
               <div className="bg-success/10 text-success px-4 py-2 rounded-md flex items-center gap-2 font-medium text-sm">
                 <CheckCircle2 className="w-4 h-4" /> Settled
               </div>
            ) : (
               <div className="bg-warning/10 text-warning px-4 py-2 rounded-md flex items-center gap-2 font-medium text-sm">
                 <Clock className="w-4 h-4" /> Pending
               </div>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isOwner && (
              <button onClick={() => setIsEditing(true)} className="btn-secondary btn-md gap-2 w-full sm:w-auto">
                <Edit3 className="w-4 h-4" /> Customize
              </button>
            )}
            <button onClick={() => window.print()} className="btn-secondary btn-md gap-2 w-full sm:w-auto">
               <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={handleDownloadPDF} disabled={downloading} className="btn-primary btn-md gap-2 w-full sm:w-auto">
               <Download className="w-4 h-4" /> {downloading ? 'Sizing...' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* Invoice Paper (A4) */}
        <div 
          ref={invoiceRef} 
          className="bg-white rounded-xl border border-ui-border shadow-sm overflow-hidden a4-container flex flex-col text-slate-800"
          style={{ minHeight: '297mm', padding: '16mm' }}
        >
          {/* Top Section */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <h1 className="text-4xl font-display text-slate-900 mb-2">
                {invoice.invoiceTitle || 'INVOICE'}
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-slate-100 text-slate-900 px-2 py-0.5 rounded capitalize">{invoice.invoiceNumber}</span>
                <span className="text-slate-500 font-medium text-xs">Issued on {new Date(invoice.issueDate).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="text-right">
              {isPaid ? (
                <div className="text-success border-2 border-success px-3 py-1 rounded inline-block font-display text-xl -rotate-2">PAID</div>
              ) : (
                <div className="text-warning border border-warning px-3 py-1 rounded inline-block text-sm font-semibold uppercase">{invoice.status}</div>
              )}
              <p className="mt-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-10">
            {/* Parties */}
            <div className="grid grid-cols-2 gap-16">
               <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Bill To</p>
                  {invoice.client ? (
                    <div className="space-y-1">
                      <h3 className="font-display text-xl text-slate-900">{invoice.client.name}</h3>
                      <p className="text-sm font-medium text-slate-600">{invoice.client.company}</p>
                      <p className="text-sm text-slate-500">{invoice.client.email}</p>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic text-sm">General Billing Client</p>
                  )}
               </div>
               <div className="text-right">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">From</p>
                  <div className="space-y-1">
                    <h3 className="font-display text-xl text-slate-900">{invoice.providerName || 'Your Business'}</h3>
                    <div className="text-sm text-slate-500 space-y-0.5">
                      {invoice.providerEmail && <p>{invoice.providerEmail}</p>}
                      {invoice.providerPhone && <p>{invoice.providerPhone}</p>}
                      {invoice.providerAddress && <p>{invoice.providerAddress}</p>}
                    </div>
                  </div>
               </div>
            </div>

            {/* Project Banner */}
            {invoice.project && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <p className="text-sm font-medium text-slate-900">{invoice.project.title}</p>
                 </div>
                 {invoice.duration && (
                   <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{invoice.duration}</span>
                 )}
              </div>
            )}

            {/* Line Items Table */}
            <div className="table-container min-h-0 overflow-y-auto w-full">
               <table className="w-full text-left">
                  <thead className="border-b-2 border-slate-900 uppercase">
                     <tr>
                        <th className="py-3 text-xs font-semibold text-slate-500 tracking-widest">Description</th>
                        <th className="py-3 text-right text-xs font-semibold text-slate-500 tracking-widest w-32">Amount</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {invoice.services && invoice.services.length > 0 ? (
                       invoice.services.map((item: any, idx: number) => (
                         <tr key={idx}>
                            <td className="py-5 pr-4">
                               <p className="font-medium text-slate-900">{item.description}</p>
                            </td>
                            <td className="py-5 text-right font-mono font-medium text-slate-900">
                               {formatCurrency(item.amount)}
                            </td>
                         </tr>
                       ))
                     ) : (
                       <tr>
                         <td className="py-8 text-center text-slate-500 italic text-sm" colSpan={2}>
                           No billing items specified
                         </td>
                       </tr>
                     )}
                  </tbody>
               </table>
            </div>

            {/* Bottom Section */}
            <div className="mt-auto pt-10 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-end gap-10">
               <div className="max-w-md w-full">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Notes</p>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {invoice.notes || "This is a computer generated invoice. No signature required. Please make payment to the account details provided in your contract."}
                  </div>
               </div>

               <div className="flex items-center gap-8 bg-slate-900 text-white p-6 rounded-2xl w-full sm:w-auto">
                  <div className="p-2 bg-white rounded-lg">
                     <QRCodeSVG value={currentUrl} size={64} level="L" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-3xl font-display">{formatCurrency(invoice.amount)}</p>
                    <button className="mt-3 flex items-center gap-2 text-xs font-medium text-primary-300 py-1 hover:text-primary transition-colors">
                       <CreditCard className="w-4 h-4" /> Secure Payment
                    </button>
                  </div>
               </div>
            </div>
            
            {/* Branding Footer */}
            <div className="text-center pt-8 border-t border-slate-100 mt-8">
              <p className="text-xs font-medium text-slate-400 tracking-wider">Freelance Flow • Secure Web Invoice</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
