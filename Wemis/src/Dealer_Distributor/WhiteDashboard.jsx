import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Wallet, 
  Settings, 
  Bell, 
  Search, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreVertical,
  Activity,
  Plus
} from 'lucide-react';

const WhiteDashboard = () => {
  const [activeTab, setActiveTab] = useState('Overview');

  // Mock Data for the UI
  const stats = [
   
  ];

  const recentRequests = [
   
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">

      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h1>
            <p className="text-slate-500 text-sm font-medium">Welcome back, here's what's happening with your network today.</p>
          </div>
          
          
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <div className={`flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full ${
                  item.trend === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                }`}>
                  {item.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {item.growth}
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.title}</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{item.value}</h2>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Activity Area */}
        

         
        </div>
      </div>
    </div>
  );
};

export default WhiteDashboard;