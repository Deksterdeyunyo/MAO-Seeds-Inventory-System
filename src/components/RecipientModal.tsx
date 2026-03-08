import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Loader2, UserPlus } from 'lucide-react';
import { Recipient } from '../types';

interface RecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: Recipient | null;
  onSuccess: () => void;
}

export default function RecipientModal({ isOpen, onClose, recipient, onSuccess }: RecipientModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: recipient?.full_name || '',
    barangay: recipient?.barangay || '',
    contact_number: recipient?.contact_number || '',
    farm_location: recipient?.farm_location || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (recipient) {
        const { error } = await supabase
          .from('recipients')
          .update(formData)
          .eq('id', recipient.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('recipients')
          .insert([formData]);
        if (error) throw error;
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Error saving farmer registration: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200">
        <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
              <UserPlus className="text-white w-6 h-6" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-stone-800">
              {recipient ? 'Edit Registration' : 'Farmer Registration'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-stone-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Full Name</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 font-medium"
              placeholder="e.g. Juan Dela Cruz"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Barangay</label>
            <input
              type="text"
              required
              value={formData.barangay}
              onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 font-medium"
              placeholder="e.g. San Jose"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Contact Number</label>
            <input
              type="text"
              value={formData.contact_number}
              onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 font-medium"
              placeholder="09xx-xxx-xxxx"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Farm Location / Details</label>
            <textarea
              value={formData.farm_location}
              onChange={(e) => setFormData({ ...formData, farm_location: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 font-medium min-h-[80px]"
              placeholder="e.g. Area 2, North Sector"
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-xl border border-stone-200 text-stone-600 font-bold hover:bg-stone-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {loading && <Loader2 className="animate-spin mr-2 w-5 h-5" />}
              {recipient ? 'Update' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
