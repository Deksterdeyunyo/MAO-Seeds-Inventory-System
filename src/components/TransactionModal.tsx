import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Loader2, ArrowUpRight, ArrowDownLeft, Search, User } from 'lucide-react';
import { Seed, Recipient } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  seed: Seed;
  type: 'in' | 'out';
  onSuccess: () => void;
}

export default function TransactionModal({ isOpen, onClose, seed, type, onSuccess }: TransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [formData, setFormData] = useState({
    quantity: 0,
    reason: '',
    date: new Date().toISOString().split('T')[0],
    recipient_id: '',
    recipient_name: '',
    barangay: '',
    contact_number: ''
  });

  useEffect(() => {
    if (type === 'out') {
      fetchRecipients();
    }
  }, [type]);

  const fetchRecipients = async () => {
    const { data } = await supabase.from('recipients').select('*').order('full_name');
    setRecipients(data || []);
  };

  const selectRecipient = (r: Recipient) => {
    setFormData({
      ...formData,
      recipient_id: r.id,
      recipient_name: r.full_name,
      barangay: r.barangay,
      contact_number: r.contact_number
    });
    setRecipientSearch(r.full_name);
    setShowRecipientDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.quantity <= 0) return alert('Quantity must be greater than 0');
    if (type === 'out') {
      if (formData.quantity > seed.quantity) {
        return alert('Insufficient stock for this distribution');
      }
      if (!formData.recipient_name.trim()) {
        return alert('Recipient name is required for distribution');
      }
      if (!formData.barangay.trim()) {
        return alert('Barangay is required for distribution');
      }
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert([{
          seed_id: seed.id,
          type,
          quantity: formData.quantity,
          reason: formData.reason,
          date: formData.date,
          user_id: user?.id,
          recipient_id: type === 'out' ? (formData.recipient_id || null) : null,
          recipient_name: type === 'out' ? formData.recipient_name : null,
          barangay: type === 'out' ? formData.barangay : null,
          contact_number: type === 'out' ? formData.contact_number : null,
        }]);
      
      if (txError) throw txError;

      // 2. Update seed quantity
      const newQuantity = type === 'in' 
        ? seed.quantity + formData.quantity 
        : seed.quantity - formData.quantity;
      
      const newStatus = newQuantity === 0 
        ? 'out_of_stock' 
        : newQuantity < 10 
          ? 'low_stock' 
          : 'available';

      const { error: seedError } = await supabase
        .from('seeds')
        .update({ 
          quantity: newQuantity,
          status: newStatus
        })
        .eq('id', seed.id);

      if (seedError) throw seedError;

      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Error processing transaction: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200">
        <div className={cn(
          "px-8 py-6 border-b border-stone-100 flex items-center justify-between",
          type === 'in' ? "bg-emerald-50/50" : "bg-amber-50/50"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
              type === 'in' ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
            )}>
              {type === 'in' ? <ArrowDownLeft /> : <ArrowUpRight />}
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-stone-800">
                {type === 'in' ? 'Stock In' : 'Record Distribution'}
              </h3>
              <p className="text-xs text-stone-500 font-bold uppercase tracking-widest">{seed.name} ({seed.variety})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-stone-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Current Stock</p>
            <p className="text-2xl font-serif font-bold text-stone-800">{seed.quantity} {seed.unit}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Quantity to {type === 'in' ? 'Add' : 'Distribute'}</label>
            <div className="flex gap-2">
              <input
                type="number"
                required
                min="0.1"
                step="0.1"
                value={isNaN(formData.quantity) ? '' : formData.quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, quantity: val === '' ? 0 : parseFloat(val) });
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 font-bold text-lg"
              />
              <div className="w-24 px-4 py-3 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-500">
                {seed.unit}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 font-medium"
            />
          </div>

          {type === 'out' && (
            <div className="space-y-6 pt-2 border-t border-stone-100">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Recipient Information</p>
              
              <div className="relative">
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Search Registered Farmer</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                  <input
                    type="text"
                    required={type === 'out'}
                    value={recipientSearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRecipientSearch(val);
                      setShowRecipientDropdown(true);
                      setFormData({ ...formData, recipient_id: '', recipient_name: val });
                    }}
                    onFocus={() => setShowRecipientDropdown(true)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 font-medium"
                    placeholder="Search or type name..."
                  />
                </div>

                {showRecipientDropdown && recipientSearch && (
                  <div className="absolute z-[70] w-full mt-2 bg-white border border-stone-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {recipients
                      .filter(r => r.full_name.toLowerCase().includes(recipientSearch.toLowerCase()))
                      .map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => selectRecipient(r)}
                          className="w-full text-left px-4 py-3 hover:bg-stone-50 flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-stone-400" />
                            </div>
                            <div>
                              <p className="font-bold text-stone-800 text-sm">{r.full_name}</p>
                              <p className="text-[10px] text-stone-400 font-bold uppercase">Brgy. {r.barangay}</p>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 text-emerald-600 font-bold text-[10px] uppercase">Select</div>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Contact No.</label>
                  <input
                    type="text"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 font-medium"
                    placeholder="09xx..."
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Reason / Remarks</label>
            <textarea
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 font-medium min-h-[100px]"
              placeholder={type === 'in' ? "e.g. New shipment from regional office" : "e.g. Distribution to farmers in Brgy. San Jose"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full py-4 rounded-xl text-white font-bold shadow-lg transition-all flex items-center justify-center disabled:opacity-50",
              type === 'in' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" : "bg-amber-600 hover:bg-amber-700 shadow-amber-100"
            )}
          >
            {loading && <Loader2 className="animate-spin mr-2 w-5 h-5" />}
            Confirm Transaction
          </button>
        </form>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
