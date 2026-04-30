import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, MoreHorizontal, UserPlus } from 'lucide-react';
import { firestoreService } from '../../services/firestoreService';
import { ModuleHeader } from '../shared/ModuleHeader';
import type { Client } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    const data = await firestoreService.list('clients');
    setClients(data as Client[]);
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingClient(null);
    setName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setAddress('');
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setCompany(client.company || '');
    setEmail(client.email);
    setPhone(client.phone || '');
    setAddress(client.address || '');
    setIsModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      setSaving(true);
      const clientData = {
        name,
        company,
        email,
        phone,
        address,
      };

      if (editingClient) {
        await firestoreService.update('clients', editingClient.id, clientData);
      } else {
        await firestoreService.create('clients', {
          ...clientData,
          createdAt: new Date().toISOString()
        });
      }

      setIsModalOpen(false);
      await loadClients();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await firestoreService.delete('clients', id);
      await loadClients();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div>
      <ModuleHeader 
        title="Clients" 
        buttonLabel="Add Client" 
        onAdd={openAddModal}
        onSearch={setSearchTerm}
      />

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-dark-card rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h3>
              <form onSubmit={handleSaveClient} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">Name *</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl font-medium focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-800 dark:text-slate-200" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">Company</label>
                  <input type="text" value={company} onChange={e => setCompany(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl font-medium focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-800 dark:text-slate-200" placeholder="Acme Corp" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">Email *</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl font-medium focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-800 dark:text-slate-200" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">Phone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl font-medium focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-800 dark:text-slate-200" placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">Address</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl font-medium focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-800 dark:text-slate-200" placeholder="123 Main St, City, Country" />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-bg transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving || !name || !email} className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-brand-500/20 disabled:opacity-50">
                    {saving ? 'Saving...' : editingClient ? 'Update Client' : 'Add Client'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {filteredClients.length === 0 ? (
        <div className="bg-white dark:bg-dark-card border-2 border-dashed border-slate-200 dark:border-dark-border rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 dark:bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="text-slate-300 dark:text-slate-700 w-8 h-8" />
          </div>
          <p className="text-slate-500 dark:text-slate-400">No clients found. Add your first client to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <motion.div 
              layout
              key={client.id}
              className="glass-card p-6 rounded-2xl border border-slate-200 hover:border-brand-200 transition-colors group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-brand-50 dark:bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-700 dark:text-brand-400 font-bold text-xl">
                  {client.name.charAt(0)}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openEditModal(client)}
                    className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    title="Edit Client"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteClient(client.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Client"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{client.name}</h3>
              <p className="text-slate-400 dark:text-slate-500 text-sm mb-4 font-medium">{client.company || 'Individual Freelancer'}</p>
              
              <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-dark-border">
                <div className="flex items-center space-x-3 text-sm text-slate-600 dark:text-slate-300">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center space-x-3 text-sm text-slate-600 dark:text-slate-300">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center space-x-3 text-sm text-slate-600 dark:text-slate-300">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{client.address}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
