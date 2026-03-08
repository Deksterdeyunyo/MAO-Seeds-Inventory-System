import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Leaf
} from 'lucide-react';
import { Seed } from '../types';
import { getStatusColor, formatQuantity, cn } from '../lib/utils';
import SeedModal from './SeedModal';
import TransactionModal from './TransactionModal';

export default function Inventory() {
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);
  const [transactionType, setTransactionType] = useState<'in' | 'out'>('in');

  useEffect(() => {
    fetchSeeds();
  }, []);

  const fetchSeeds = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('seeds')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching seeds:', error);
    } else {
      setSeeds(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this seed?')) return;
    
    const { error } = await supabase.from('seeds').delete().eq('id', id);
    if (error) {
      alert('Error deleting seed: ' + error.message);
    } else {
      fetchSeeds();
    }
  };

  const filteredSeeds = seeds.filter(seed => 
    seed.name.toLowerCase().includes(search.toLowerCase()) ||
    seed.variety.toLowerCase().includes(search.toLowerCase()) ||
    seed.batch_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-stone-800">Seeds Inventory</h2>
          <p className="text-stone-500 font-medium">Manage and track your agricultural seed stocks</p>
        </div>
        <button 
          onClick={() => {
            setSelectedSeed(null);
            setIsSeedModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add New Seed
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search seeds by name, variety, or batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50"
            />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-3 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 flex items-center gap-2 font-bold">
              <Filter className="w-5 h-5" />
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Seed Details</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Variety</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Stock Level</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Expiry</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-400">
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredSeeds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-400">
                    No seeds found in inventory.
                  </td>
                </tr>
              ) : (
                filteredSeeds.map((seed) => (
                  <tr key={seed.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center shrink-0">
                          <Leaf className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-800">{seed.name}</p>
                          <p className="text-xs text-stone-400 font-mono">{seed.batch_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-600 font-medium">{seed.variety}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-stone-800">{formatQuantity(seed.quantity, seed.unit)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                        getStatusColor(seed.status)
                      )}>
                        {seed.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-stone-500 text-sm">
                      {new Date(seed.expiry_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedSeed(seed);
                            setTransactionType('in');
                            setIsTransactionModalOpen(true);
                          }}
                          title="Stock In"
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <ArrowDownLeft className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedSeed(seed);
                            setTransactionType('out');
                            setIsTransactionModalOpen(true);
                          }}
                          title="Record Distribution"
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <ArrowUpRight className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedSeed(seed);
                            setIsSeedModalOpen(true);
                          }}
                          className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(seed.id)}
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

        <div className="p-6 border-t border-stone-100 flex items-center justify-between">
          <p className="text-sm text-stone-400 font-medium">
            Showing <span className="text-stone-800 font-bold">{filteredSeeds.length}</span> of <span className="text-stone-800 font-bold">{seeds.length}</span> seeds
          </p>
          <div className="flex gap-2">
            <button className="p-2 border border-stone-200 rounded-lg text-stone-400 hover:bg-stone-50 disabled:opacity-50" disabled>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="p-2 border border-stone-200 rounded-lg text-stone-400 hover:bg-stone-50 disabled:opacity-50" disabled>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {isSeedModalOpen && (
        <SeedModal 
          isOpen={isSeedModalOpen} 
          onClose={() => setIsSeedModalOpen(false)} 
          seed={selectedSeed}
          onSuccess={fetchSeeds}
        />
      )}

      {isTransactionModalOpen && selectedSeed && (
        <TransactionModal
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
          seed={selectedSeed}
          type={transactionType}
          onSuccess={fetchSeeds}
        />
      )}
    </div>
  );
}
