import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Calendar,
  Download
} from 'lucide-react';
import { Transaction } from '../types';
import { cn } from '../lib/utils';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        seed:seeds (
          name,
          variety
        )
      `)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      const formattedData = data?.map(tx => ({
        ...tx,
        seed_name: (tx.seed as any)?.name,
        seed_variety: (tx.seed as any)?.variety
      })) || [];
      setTransactions(formattedData);
    }
    setLoading(false);
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.seed_name?.toLowerCase().includes(search.toLowerCase()) ||
    tx.reason.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-stone-800">Transaction History</h2>
          <p className="text-stone-500 font-medium">Log of all seed distributions and stock updates</p>
        </div>
        <button className="bg-white border border-stone-200 text-stone-700 px-6 py-3 rounded-xl font-bold hover:bg-stone-50 flex items-center justify-center gap-2 transition-all">
          <Download className="w-5 h-5" />
          Export Report
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by seed name or reason..."
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
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Date</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Seed</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Type</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400 text-right">Quantity</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Reason / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
                    No transactions recorded.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-stone-500 font-medium">
                        <Calendar className="w-4 h-4" />
                        {new Date(tx.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-stone-800">{tx.seed_name}</p>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{(tx as any).seed_variety}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest",
                        tx.type === 'in' ? "text-emerald-600" : "text-amber-600"
                      )}>
                        {tx.type === 'in' ? (
                          <><ArrowDownLeft className="w-4 h-4" /> Stock In</>
                        ) : (
                          <><ArrowUpRight className="w-4 h-4" /> Stock Out</>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className={cn(
                        "font-bold text-lg",
                        tx.type === 'in' ? "text-emerald-600" : "text-amber-600"
                      )}>
                        {tx.type === 'in' ? '+' : '-'}{tx.quantity}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-stone-600 max-w-xs truncate" title={tx.reason}>
                        {tx.reason}
                      </p>
                      {tx.recipient_name && (
                        <div className="mt-1 space-y-0.5">
                          <p className="text-[10px] text-emerald-600 font-bold uppercase">
                            Recipient: {tx.recipient_name}
                          </p>
                          <p className="text-[9px] text-stone-400 font-medium italic">
                            Brgy. {tx.barangay}
                          </p>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
