import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Package,
  ArrowRight,
  Leaf
} from 'lucide-react';
import { Seed, Transaction } from '../types';
import { cn, formatQuantity, getStatusColor } from '../lib/utils';

export default function Overview() {
  const [stats, setStats] = useState({
    totalSeeds: 0,
    lowStock: 0,
    outOfStock: 0,
    recentTransactions: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data: seeds } = await supabase.from('seeds').select('*');
      const { data: txs } = await supabase
        .from('transactions')
        .select('*, seed:seeds(name)')
        .order('date', { ascending: false })
        .limit(5);

      if (seeds) {
        setStats({
          totalSeeds: seeds.length,
          lowStock: seeds.filter(s => s.status === 'low_stock').length,
          outOfStock: seeds.filter(s => s.status === 'out_of_stock').length,
          recentTransactions: txs?.map(tx => ({
            ...tx,
            seed_name: (tx.seed as any)?.name
          })) || []
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { 
      label: 'Total Varieties', 
      value: stats.totalSeeds, 
      icon: Package, 
      color: 'bg-emerald-600',
      shadow: 'shadow-emerald-100'
    },
    { 
      label: 'Low Stock Items', 
      value: stats.lowStock, 
      icon: AlertTriangle, 
      color: 'bg-amber-500',
      shadow: 'shadow-amber-100'
    },
    { 
      label: 'Out of Stock', 
      value: stats.outOfStock, 
      icon: TrendingDown, 
      color: 'bg-rose-500',
      shadow: 'shadow-rose-100'
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-serif font-bold text-stone-800">Welcome Back</h2>
        <p className="text-stone-500 font-medium">Here's what's happening with the seed inventory today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 flex items-center gap-6">
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg", card.color, card.shadow)}>
              <card.icon className="text-white w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{card.label}</p>
              <p className="text-4xl font-serif font-bold text-stone-800">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-serif font-bold text-xl text-stone-800">Recent Activity</h3>
            <button className="text-emerald-600 font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:underline">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-stone-100">
            {stats.recentTransactions.length === 0 ? (
              <div className="p-12 text-center text-stone-400">No recent activity</div>
            ) : (
              stats.recentTransactions.map((tx, i) => (
                <div key={i} className="p-6 flex items-center justify-between hover:bg-stone-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      tx.type === 'in' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {tx.type === 'in' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-stone-800">{tx.seed_name}</p>
                      <p className="text-xs text-stone-400 font-medium">
                        {tx.type === 'out' && tx.recipient_name ? `Distributed to: ${tx.recipient_name}` : tx.reason}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-bold",
                      tx.type === 'in' ? "text-emerald-600" : "text-amber-600"
                    )}>
                      {tx.type === 'in' ? '+' : '-'}{tx.quantity}
                    </p>
                    <p className="text-[10px] text-stone-400 uppercase font-bold">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions / Tips */}
        <div className="space-y-6">
          <div className="bg-emerald-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-100">
            <Leaf className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12" />
            <h3 className="text-2xl font-serif font-bold mb-4 relative z-10">Inventory Tip</h3>
            <p className="text-emerald-50 font-medium mb-6 relative z-10 leading-relaxed">
              Regularly check expiry dates to ensure seed viability. Seeds nearing expiry should be prioritized for distribution.
            </p>
            <button className="bg-white text-emerald-700 px-6 py-3 rounded-xl font-bold text-sm relative z-10 hover:bg-emerald-50 transition-colors">
              Check Expiry Dates
            </button>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm">
            <h3 className="font-serif font-bold text-xl text-stone-800 mb-6">System Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-medium">Database Connection</span>
                <span className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-medium">Last Backup</span>
                <span className="text-stone-800 font-bold text-xs uppercase tracking-widest">Today, 04:00 AM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-medium">Storage Usage</span>
                <div className="w-32 h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="w-1/4 h-full bg-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
