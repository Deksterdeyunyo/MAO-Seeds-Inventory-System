import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Loader2 } from 'lucide-react';
import { Seed } from '../types';

interface SeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  seed: Seed | null;
  onSuccess: () => void;
}

export default function SeedModal({ isOpen, onClose, seed, onSuccess }: SeedModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: seed?.name || '',
    variety: seed?.variety || '',
    quantity: seed?.quantity || 0,
    unit: seed?.unit || 'kg',
    batch_number: seed?.batch_number || '',
    expiry_date: seed?.expiry_date || new Date().toISOString().split('T')[0],
    status: seed?.status || 'available'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (seed) {
        const { error } = await supabase
          .from('seeds')
          .update(formData)
          .eq('id', seed.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('seeds')
          .insert([formData]);
        if (error) throw error;
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Error saving seed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-stone-200">
        <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="text-2xl font-serif font-bold text-stone-800">
            {seed ? 'Edit Seed Details' : 'Add New Seed'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-stone-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Seed Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 font-medium"
                placeholder="e.g. Rice, Corn, Tomato"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Variety</label>
              <input
                type="text"
                required
                value={formData.variety}
                onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 font-medium"
                placeholder="e.g. Hybrid, Native"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Batch Number</label>
              <input
                type="text"
                required
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 font-mono font-bold"
                placeholder="BN-2024-001"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Initial Quantity</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  min="0"
                  value={isNaN(formData.quantity) ? '' : formData.quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, quantity: val === '' ? 0 : parseFloat(val) });
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 font-bold"
                />
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-24 px-2 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 font-bold"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="packs">packs</option>
                  <option value="bags">bags</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Expiry Date</label>
              <input
                type="date"
                required
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 font-medium"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Status</label>
              <div className="grid grid-cols-3 gap-3">
                {(['available', 'low_stock', 'out_of_stock'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: s })}
                    className={cn(
                      "py-3 px-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                      formData.status === s 
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100" 
                        : "bg-white border-stone-200 text-stone-400 hover:border-stone-300"
                    )}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 flex gap-4">
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
              {seed ? 'Update Seed' : 'Save Seed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
