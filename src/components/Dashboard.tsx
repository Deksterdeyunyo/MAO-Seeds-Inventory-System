import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, 
  Package, 
  History, 
  LogOut, 
  User,
  Menu,
  X,
  Leaf,
  ClipboardList,
  Users
} from 'lucide-react';
import Inventory from './Inventory';
import Transactions from './Transactions';
import Overview from './Overview';
import Distributions from './Distributions';
import Recipients from './Recipients';
import RecordDistribution from './RecordDistribution';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'transactions' | 'distributions' | 'recipients' | 'record-distribution'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'inventory', label: 'Seeds Inventory', icon: Package },
    { id: 'recipients', label: 'Farmer Registration', icon: Users },
    { id: 'record-distribution', label: 'Record Distribution', icon: ClipboardList },
    { id: 'distributions', label: 'Distribution Log', icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white border-r border-stone-200 transition-all duration-300 flex flex-col z-50",
          isSidebarOpen ? "w-72" : "w-20"
        )}
      >
        <div className="p-6 flex items-center gap-4 border-bottom border-stone-100">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-100">
            <Leaf className="text-white w-6 h-6" />
          </div>
          {isSidebarOpen && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="font-serif font-bold text-stone-800 text-lg">MAO SEEDS</h1>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Inventory System</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium group",
                activeTab === item.id 
                  ? "bg-emerald-50 text-emerald-700 shadow-sm" 
                  : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 shrink-0",
                activeTab === item.id ? "text-emerald-600" : "text-stone-400 group-hover:text-stone-600"
              )} />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-100">
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-xl bg-stone-50 mb-4",
            !isSidebarOpen && "justify-center"
          )}>
            <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-stone-500" />
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-stone-700 truncate">{user?.email}</p>
                <p className="text-[10px] text-stone-400 uppercase font-bold">Staff Member</p>
              </div>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 transition-all font-medium",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-stone-200 flex items-center justify-between px-8 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-500"
          >
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Current Date</p>
              <p className="text-sm font-serif font-bold text-stone-800">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && <Overview />}
            {activeTab === 'inventory' && <Inventory />}
            {activeTab === 'recipients' && <Recipients />}
            {activeTab === 'record-distribution' && <RecordDistribution />}
            {activeTab === 'distributions' && <Distributions />}
            {activeTab === 'transactions' && <Transactions />}
          </div>
        </div>
      </main>
    </div>
  );
}
