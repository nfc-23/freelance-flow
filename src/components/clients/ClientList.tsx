import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, MoreHorizontal, UserPlus, Search, Plus, Box, X } from 'lucide-react';
import { firestoreService } from '../../services/firestoreService';
import type { Client } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

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

  useEffect(() => { loadClients(); }, []);

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
      const clientData = { name, company, email, phone, address };

      if (editingClient) {
        await firestoreService.update('clients', editingClient.id, clientData);
      } else {
        await firestoreService.create('clients', { ...clientData, createdAt: new Date().toISOString() });
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

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-10 mt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-display text-txt-primary">Clients</h1>
          <p className="text-txt-secondary text-sm font-medium">Manage your professional relationships.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
          <div className="relative w-full sm:w-64">
             <Search className="w-4 h-4 text-txt-secondary absolute left-3 top-1/2 -translate-y-1/2" />
             <input 
               type="text"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="Search clients..."
               className="w-full pl-9 pr-4 py-2 bg-surface border border-ui-border rounded-lg text-sm text-txt-primary focus:outline-none focus:border-primary transition-colors"
             />
          </div>
          <button onClick={openAddModal} className="btn-primary btn-md gap-2 w-full sm:w-auto">
             <Plus className="w-4 h-4" /> Add Client
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-xl genesis-card p-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display text-txt-primary">
                  {editingClient ? 'Edit Client' : 'New Client'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-txt-secondary hover:bg-black/5 p-1 rounded">
                  <X className="w-5 h-5"/>
                </button>
              </div>
              <form onSubmit={handleSaveClient} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-txt-primary mb-2">Name *</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="input-default" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-txt-primary mb-2">Company</label>
                  <input type="text" value={company} onChange={e => setCompany(e.target.value)} className="input-default" placeholder="Acme Corp" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-txt-primary mb-2">Email *</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-default" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-txt-primary mb-2">Phone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="input-default" placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-txt-primary mb-2">Address</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="input-default" placeholder="123 Main St, City, Country" />
                </div>
                <div className="pt-4 flex justify-end gap-3 mt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary btn-md">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving || !name || !email} className="btn-primary btn-md">
                    {saving ? 'Saving...' : editingClient ? 'Update Client' : 'Save Client'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading ? (
            <div className="flex items-center justify-center p-20">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-4 border-ui-border border-t-primary rounded-full" />
            </div>
        ) : filteredClients.length === 0 ? (
          <div className="w-full py-20 text-center border border-dashed border-ui-border rounded-xl bg-surface/50">
            <UserPlus className="w-10 h-10 mx-auto mb-4 text-neutral" />
            <h3 className="text-xl font-display text-txt-primary mb-2">No Clients Found</h3>
            <p className="text-sm font-medium text-txt-secondary">Your client roster is currently empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                key={client.id}
                className="genesis-card p-5 group flex flex-col hover:-translate-y-[2px]"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-display text-xl">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(client)} className="p-1.5 text-txt-secondary hover:text-primary bg-surface rounded-md border border-ui-border shadow-sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteClient(client.id)} className="p-1.5 text-txt-secondary hover:text-error hover:bg-error/5 bg-surface rounded-md border border-ui-border shadow-sm">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-medium text-txt-primary text-lg truncate">{client.name}</h3>
                  <p className="text-txt-secondary text-sm truncate">{client.company || 'Independent'}</p>
                </div>
                
                <div className="space-y-3 pt-4 border-t border-ui-border mt-auto">
                  <div className="flex items-center space-x-3 text-sm text-txt-primary">
                    <Mail className="w-4 h-4 text-txt-secondary shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                   <div className="flex items-center space-x-3 text-sm text-txt-primary">
                      <Phone className="w-4 h-4 text-txt-secondary shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.address && (
                   <div className="flex items-center space-x-3 text-sm text-txt-primary">
                      <MapPin className="w-4 h-4 text-txt-secondary shrink-0" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
