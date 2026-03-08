import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  MapPin, 
  Phone,
  UserPlus
} from 'lucide-react';
import { Recipient } from '../types';
import RecipientModal from './RecipientModal';

export default function Recipients() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('recipients')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching recipients:', error);
    } else {
      setRecipients(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this registered farmer? This will not delete their transaction history.')) return;
    
    const { error } = await supabase.from('recipients').delete().eq('id', id);
    if (error) {
      alert('Error deleting recipient: ' + error.message);
    } else {
      fetchRecipients();
    }
  };

  const filteredRecipients = recipients.filter(r => 
    r.full_name.toLowerCase().includes(search.toLowerCase()) ||
    r.barangay.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-stone-800">Farmer Registration</h2>
          <p className="text-stone-500 font-medium">Register and manage farmers for seed distribution</p>
        </div>
        <button 
          onClick={() => {
            setSelectedRecipient(null);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 transition-all"
        >
          <UserPlus className="w-5 h-5" />
          Register New Farmer
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or barangay..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Full Name</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Barangay</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Contact Number</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Farm Location</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
                    Loading registered farmers...
                  </td>
                </tr>
              ) : filteredRecipients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
                    No farmers registered yet.
                  </td>
                </tr>
              ) : (
                filteredRecipients.map((recipient) => (
                  <tr key={recipient.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5 text-emerald-600" />
                        </div>
                        <p className="font-bold text-stone-800">{recipient.full_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-stone-600 font-medium">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        Brgy. {recipient.barangay}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-stone-600 font-medium">
                        <Phone className="w-4 h-4 text-stone-400" />
                        {recipient.contact_number || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-500 text-sm italic">
                      {recipient.farm_location || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedRecipient(recipient);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(recipient.id)}
                          className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <RecipientModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          recipient={selectedRecipient}
          onSuccess={fetchRecipients}
        />
      )}
    </div>
  );
}
