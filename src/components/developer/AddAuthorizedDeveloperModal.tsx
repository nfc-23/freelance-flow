import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Mail, User, Shield, Info, Check } from 'lucide-react';
import { firestoreService } from '../../services/firestoreService';
import type { AuthorizedDeveloper } from '../../types';
import toast from 'react-hot-toast';

interface AddAuthorizedDeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onDeveloperAdded: (newDev: AuthorizedDeveloper) => void;
}

export function AddAuthorizedDeveloperModal({
  isOpen,
  onClose,
  currentUser,
  onDeveloperAdded,
}: AddAuthorizedDeveloperModalProps) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'admin' | 'analyst' | 'owner'>('admin');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      toast.error('Please provide a valid email address.');
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading('Authorizing developer access...');
    try {
      const newDev = await firestoreService.addAuthorizedDeveloper({
        email: cleanEmail,
        displayName: displayName.trim() || undefined,
        role,
        notes: notes.trim() || undefined,
        addedBy: currentUser?.email || 'superuser',
      });

      toast.success(`Access granted! ${cleanEmail} is now an authorized developer.`, { id: loadingToast });
      onDeveloperAdded(newDev);
      onClose();
      setEmail('');
      setDisplayName('');
      setNotes('');
      setRole('admin');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to authorize developer email', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-surface border border-ui-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-ui-border bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-txt-primary">Authorize Developer Access</h3>
                <p className="text-xs text-txt-secondary">
                  Grant superuser and developer console capabilities to an email address.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="p-1.5 rounded-lg text-txt-secondary hover:text-txt-primary hover:bg-black/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl flex items-start gap-2.5 text-xs text-txt-secondary">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p>
                Authorized accounts gain access to the Developer Console, global telemetry, and unrestricted Firestore database read operations according to cloud security rules.
              </p>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-txt-primary flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-txt-secondary" />
                Developer Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-ui-border rounded-xl text-xs text-txt-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-mono"
              />
              <p className="text-[11px] text-txt-secondary">
                Must match the Google account or email they sign in with.
              </p>
            </div>

            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-txt-primary flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-txt-secondary" />
                Full Name / Alias (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Morgan"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-ui-border rounded-xl text-xs text-txt-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Access Role Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-txt-primary flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-txt-secondary" />
                Administrative Role & Permissions
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: 'admin',
                    title: 'Admin Dev',
                    desc: 'Full console & database access',
                  },
                  {
                    id: 'analyst',
                    title: 'Analyst',
                    desc: 'Telemetry & reports view',
                  },
                  {
                    id: 'owner',
                    title: 'Co-Owner',
                    desc: 'Full superuser privileges',
                  },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === r.id
                        ? 'border-primary bg-primary/5 text-txt-primary shadow-xs'
                        : 'border-ui-border bg-surface text-txt-secondary hover:border-ui-border/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-txt-primary">{r.title}</span>
                      {role === r.id && <Check className="w-3.5 h-3.5 text-primary" />}
                    </div>
                    <p className="text-[10px] text-txt-secondary leading-tight">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Operational Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-txt-primary">
                Internal Operational Note / Audit Reason
              </label>
              <input
                type="text"
                placeholder="e.g., Engineering Team Lead / External Security Auditor"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-ui-border rounded-xl text-xs text-txt-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-ui-border">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-medium text-txt-secondary hover:text-txt-primary hover:bg-black/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !email}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50 text-white shadow-sm transition-all"
              >
                <UserPlus className="w-4 h-4" />
                {submitting ? 'Granting Access...' : 'Authorize Developer'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
