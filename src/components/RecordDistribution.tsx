import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  ClipboardList, 
  Search, 
  User, 
  MapPin, 
  Phone, 
  ArrowRight, 
  CheckCircle2,
  Loader2,
  Leaf,
  History,
  Calendar
} from 'lucide-react';
import { Seed, Recipient, Transaction } from '../types';

export default function RecordDistribution() {
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recentDistributions, setRecentDistributions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    seed_id: '',
    recipient_id: '',
    recipient_name: '',
    barangay: '',
    contact_number: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const [seedSearch, setSeedSearch] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [showSeedDropdown, setShowSeedDropdown] = useState(false);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setFetching(true);
    const [seedsRes, recipientsRes, distRes] = await Promise.all([
      supabase.from('seeds').select('*').order('name'),
      supabase.from('recipients').select('*').order('full_name'),
      supabase.from('transactions')
        .select(`
          *,
          seed:seeds(*)
        `)
        .eq('type', 'out')
        .order('created_at', { ascending: false })
        .limit(5)
    ]);
    setSeeds(seedsRes.data || []);
    setRecipients(recipientsRes.data || []);
    setRecentDistributions(distRes.data || []);
    setFetching(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(formData.quantity);
    const selectedSeed = seeds.find(s => s.id === formData.seed_id);

    if (!selectedSeed) return alert('Please select a seed variety');
    if (isNaN(qty) || qty <= 0) return alert('Please enter a valid quantity');
    if (qty > selectedSeed.quantity) return alert('Insufficient stock available');
    if (!formData.recipient_name.trim()) return alert('Recipient name is required');
    if (!formData.barangay.trim()) return alert('Barangay is required');

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Record Transaction
      const { error: txError } = await supabase.from('transactions').insert([{
        seed_id: formData.seed_id,
        recipient_id: formData.recipient_id || null,
        type: 'out',
        quantity: qty,
        reason: formData.reason || `Distribution of ${selectedSeed.name} to ${formData.recipient_name}`,
        date: formData.date,
        user_id: user?.id,
        recipient_name: formData.recipient_name,
        barangay: formData.barangay,
        contact_number: formData.contact_number
      }]);

      if (txError) throw txError;

      // 2. Update Seed Stock
      const { error: seedError } = await supabase.from('seeds').update({
        quantity: selectedSeed.quantity - qty,
        status: (selectedSeed.quantity - qty) === 0 ? 'out_of_stock' : (selectedSeed.quantity - qty) < 10 ? 'low_stock' : 'available'
      }).eq('id', formData.seed_id);

      if (seedError) throw seedError;

      setSuccess(true);
      setFormData({
        seed_id: '',
        recipient_id: '',
        recipient_name: '',
        barangay: '',
        contact_number: '',
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        reason: ''
      });
      setSeedSearch('');
      setRecipientSearch('');
      fetchData();
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert('Error recording distribution: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-serif font-bold text-stone-800">Record New Distribution</h2>
        <p className="text-stone-500 font-medium">Distribute seeds to farmers and log the transaction</p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-6 h-6" />
          <p className="font-bold">Distribution recorded successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Seed Selection */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-800">1. Select Seed</h3>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Search Seed Variety</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
              <input
                type="text"
                value={seedSearch}
                onChange={(e) => {
                  setSeedSearch(e.target.value);
                  setShowSeedDropdown(true);
                }}
                onFocus={() => setShowSeedDropdown(true)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 font-medium"
                placeholder="Type seed name..."
              />
            </div>

            {showSeedDropdown && seedSearch && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-stone-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {seeds.filter(s => s.name.toLowerCase().includes(seedSearch.toLowerCase()) || s.variety.toLowerCase().includes(seedSearch.toLowerCase())).map(seed => (
                  <button
                    key={seed.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, seed_id: seed.id });
                      setSeedSearch(`${seed.name} (${seed.variety})`);
                      setShowSeedDropdown(false);
                    }}
                    disabled={seed.quantity <= 0}
                    className="w-full text-left px-4 py-3 hover:bg-stone-50 flex items-center justify-between group disabled:opacity-50"
                  >
                    <div>
                      <p className="font-bold text-stone-800">{seed.name}</p>
                      <p className="text-[10px] text-stone-400 font-bold uppercase">{seed.variety}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-stone-600">{seed.quantity} {seed.unit}</p>
                      <p className="text-[10px] text-stone-400 font-bold uppercase">Available</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Quantity</label>
              <input
                type="number"
                step="0.1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 font-bold"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Recipient Selection */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-800">2. Recipient Info</h3>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Search Registered Farmer</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
              <input
                type="text"
                value={recipientSearch}
                onChange={(e) => {
                  setRecipientSearch(e.target.value);
                  setShowRecipientDropdown(true);
                  setFormData({ ...formData, recipient_id: '', recipient_name: e.target.value });
                }}
                onFocus={() => setShowRecipientDropdown(true)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 font-medium"
                placeholder="Type farmer name..."
              />
            </div>

            {showRecipientDropdown && recipientSearch && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-stone-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {recipients.filter(r => r.full_name.toLowerCase().includes(recipientSearch.toLowerCase())).map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setFormData({ 
                        ...formData, 
                        recipient_id: r.id, 
                        recipient_name: r.full_name,
                        barangay: r.barangay,
                        contact_number: r.contact_number
                      });
                      setRecipientSearch(r.full_name);
                      setShowRecipientDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-stone-50 flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-bold text-stone-800">{r.full_name}</p>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Brgy. {r.barangay}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-emerald-500 transition-colors" />
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
                value={formData.barangay}
                onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 font-medium"
                placeholder="Village name"
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

        <div className="md:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-stone-200 space-y-6">
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Reason / Remarks</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 font-medium min-h-[100px]"
              placeholder="Add any additional notes here..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 rounded-2xl bg-emerald-600 text-white font-bold text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <ClipboardList className="w-6 h-6 mr-2" />
                Confirm and Record Distribution
              </>
            )}
          </button>
        </div>
      </form>

      {/* Recent Distributions Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center">
            <History className="w-6 h-6 text-stone-600" />
          </div>
          <h3 className="text-xl font-serif font-bold text-stone-800">Recent Distributions</h3>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/50">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Date</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Farmer / Recipient</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Seed Variety</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Quantity</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recentDistributions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-stone-400 font-medium">
                      No recent distributions recorded.
                    </td>
                  </tr>
                ) : (
                  recentDistributions.map((dist) => (
                    <tr key={dist.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-stone-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold">{new Date(dist.date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-stone-800 text-sm">{dist.recipient_name}</p>
                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Brgy. {dist.barangay}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                          <p className="font-bold text-stone-700 text-sm">{dist.seed?.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-stone-800">{dist.quantity} {dist.seed?.unit}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
