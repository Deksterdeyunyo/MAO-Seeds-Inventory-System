import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  History, 
  Search, 
  Calendar,
  Download,
  User,
  MapPin,
  Phone,
  ArrowUpRight,
  Plus,
  Printer,
  Filter
} from 'lucide-react';
import { Transaction, Seed } from '../types';
import { cn } from '../lib/utils';
import TransactionModal from './TransactionModal';

export default function Distributions() {
  const [distributions, setDistributions] = useState<Transaction[]>([]);
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);

  useEffect(() => {
    fetchDistributions();
    fetchSeeds();
  }, []);

  const fetchSeeds = async () => {
    const { data } = await supabase.from('seeds').select('*').order('name');
    setSeeds(data || []);
  };

  const fetchDistributions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        seed:seeds (
          name,
          variety,
          unit
        )
      `)
      .eq('type', 'out')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching distributions:', error);
    } else {
      const formattedData = data?.map(tx => ({
        ...tx,
        seed_name: (tx.seed as any)?.name,
        seed_variety: (tx.seed as any)?.variety,
        seed_unit: (tx.seed as any)?.unit
      })) || [];
      setDistributions(formattedData);
    }
    setLoading(false);
  };

  const barangays = Array.from(new Set(distributions.map(d => d.barangay).filter(Boolean))).sort();

  const filteredDistributions = distributions.filter(tx => {
    const matchesSearch = 
      tx.seed_name?.toLowerCase().includes(search.toLowerCase()) ||
      tx.recipient_name?.toLowerCase().includes(search.toLowerCase()) ||
      tx.barangay?.toLowerCase().includes(search.toLowerCase());
    
    const matchesBarangay = selectedBarangay === 'all' || tx.barangay === selectedBarangay;
    
    return matchesSearch && matchesBarangay;
  });

  const handleExport = () => {
    const headers = ['Date', 'Recipient', 'Barangay', 'Contact', 'Seed', 'Variety', 'Quantity', 'Unit', 'Reason/Remarks'];
    const rows = filteredDistributions.map(tx => [
      tx.date,
      tx.recipient_name,
      tx.barangay,
      tx.contact_number,
      tx.seed_name,
      tx.seed_variety,
      tx.quantity,
      tx.seed_unit,
      tx.reason
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `seed_distribution_report_${selectedBarangay}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const groupedData = filteredDistributions.reduce((acc, curr) => {
      const brgy = curr.barangay || 'Unknown';
      if (!acc[brgy]) acc[brgy] = [];
      acc[brgy].push(curr);
      return acc;
    }, {} as Record<string, Transaction[]>);

    const html = `
      <html>
        <head>
          <title>Seed Distribution Log - ${selectedBarangay === 'all' ? 'All Barangays' : selectedBarangay}</title>
          <style>
            @page { size: portrait; margin: 20mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; color: #1a1a1a; line-height: 1.5; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #065f46; padding-bottom: 20px; }
            .header h1 { color: #065f46; margin: 0; font-size: 24px; text-transform: uppercase; }
            .header p { margin: 5px 0; color: #666; font-size: 14px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; color: #444; }
            h2 { color: #065f46; margin-top: 25px; background: #f0fdf4; padding: 8px 15px; border-radius: 6px; font-size: 18px; border-left: 4px solid #065f46; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; }
            .sig-box { border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px; font-size: 12px; }
            .report-info { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; }
            @media print {
              button { display: none; }
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <p>Republic of the Philippines</p>
            <h1>Municipal Agriculture Office</h1>
            <p>Seed Distribution Monitoring System</p>
          </div>
          
          <div class="meta">
            <div><strong>Report Type:</strong> Seed Distribution Log</div>
            <div><strong>Date Generated:</strong> ${new Date().toLocaleString()}</div>
            <div><strong>Barangay Filter:</strong> ${selectedBarangay === 'all' ? 'All Barangays' : selectedBarangay}</div>
          </div>
          
          ${Object.entries(groupedData).map(([brgy, items]) => `
            <div class="barangay-section">
              <h2>Barangay: ${brgy}</h2>
              <table>
                <thead>
                  <tr>
                    <th style="width: 15%">Date</th>
                    <th style="width: 25%">Recipient / Contact</th>
                    <th style="width: 25%">Seed Variety</th>
                    <th style="width: 15%">Quantity</th>
                    <th style="width: 20%">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  ${(items as Transaction[]).map(item => `
                    <tr>
                      <td>${new Date(item.date).toLocaleDateString()}</td>
                      <td>
                        <strong>${item.recipient_name}</strong><br/>
                        <span style="color: #64748b; font-size: 10px;">${item.contact_number || 'No contact'}</span>
                      </td>
                      <td>
                        ${(item as any).seed_name}<br/>
                        <span style="color: #64748b; font-size: 10px;">${(item as any).seed_variety}</span>
                      </td>
                      <td><strong>${item.quantity}</strong> ${(item as any).seed_unit}</td>
                      <td><span style="font-style: italic; color: #64748b;">${item.reason || '-'}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
          
          <div class="footer">
            <div>
              <p style="margin-bottom: 40px;">Prepared by:</p>
              <div class="sig-box">Staff Signature / Name</div>
            </div>
            <div>
              <p style="margin-bottom: 40px;">Noted by:</p>
              <div class="sig-box">Municipal Agriculturist</div>
            </div>
          </div>
          
          <div class="report-info">
            <p>This is a computer-generated report from the MAO Seed Inventory System.</p>
          </div>
          
          <script>
            window.onload = () => {
              window.print();
              // Optional: window.close();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-stone-800">Distribution Log</h2>
          <p className="text-stone-500 font-medium">Detailed record of seeds distributed to farmers</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-5 h-5" />
            Record Distribution
          </button>
          <button 
            onClick={handlePrint}
            className="bg-white border border-stone-200 text-stone-700 px-6 py-3 rounded-xl font-bold hover:bg-stone-50 flex items-center justify-center gap-2 transition-all"
          >
            <Printer className="w-5 h-5" />
            Print
          </button>
          <button 
            onClick={handleExport}
            className="bg-white border border-stone-200 text-stone-700 px-6 py-3 rounded-xl font-bold hover:bg-stone-50 flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by recipient, seed, or barangay..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50"
            />
          </div>
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            <select
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-stone-50 appearance-none font-bold text-stone-700"
            >
              <option value="all">All Barangays</option>
              {barangays.map(brgy => (
                <option key={brgy} value={brgy}>{brgy}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Date & Recipient</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Location</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Seed Distributed</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400 text-right">Quantity</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-stone-400">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
                    Loading distribution records...
                  </td>
                </tr>
              ) : filteredDistributions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
                    No distribution records found.
                  </td>
                </tr>
              ) : (
                filteredDistributions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-stone-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(tx.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-stone-500" />
                          </div>
                          <div>
                            <p className="font-bold text-stone-800">{tx.recipient_name || 'N/A'}</p>
                            {tx.contact_number && (
                              <p className="text-[10px] text-stone-400 flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5" /> {tx.contact_number}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-stone-600 font-medium">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        Brgy. {tx.barangay || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                          <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-800">{(tx as any).seed_name}</p>
                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{(tx as any).seed_variety}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-bold text-lg text-amber-600">
                        -{tx.quantity}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-stone-500 italic max-w-xs truncate" title={tx.reason}>
                        "{tx.reason}"
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && !selectedSeed && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200">
            <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <h3 className="text-2xl font-serif font-bold text-stone-800">Select Seed to Distribute</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
                <Plus className="w-6 h-6 text-stone-500 rotate-45" />
              </button>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-sm text-stone-500 font-medium mb-4">Choose a seed variety from the inventory to start recording a distribution.</p>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {seeds.map(seed => (
                  <button
                    key={seed.id}
                    onClick={() => setSelectedSeed(seed)}
                    disabled={seed.quantity <= 0}
                    className="w-full text-left p-4 rounded-xl border border-stone-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all flex items-center justify-between group disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-stone-100"
                  >
                    <div>
                      <p className="font-bold text-stone-800">{seed.name}</p>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{seed.variety}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-stone-600">{seed.quantity} {seed.unit}</p>
                      <p className="text-[10px] text-stone-400 font-bold uppercase">Available</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && selectedSeed && (
        <TransactionModal
          isOpen={true}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSeed(null);
          }}
          seed={selectedSeed}
          type="out"
          onSuccess={() => {
            fetchDistributions();
            fetchSeeds();
          }}
        />
      )}
    </div>
  );
}
