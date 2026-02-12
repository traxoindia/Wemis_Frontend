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
    { title: 'Total Revenue', value: '₹4,25,890', growth: '+12.5%', trend: 'up', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Active Dealers', value: '1,240', growth: '+3.2%', trend: 'up', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Pending Stock', value: '450 Units', growth: '-2.1%', trend: 'down', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'System Uptime', value: '99.9%', growth: 'Stable', trend: 'up', icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const recentRequests = [
    { id: '1', dealer: 'SBT DEALER', plan: 'TRAXO ELITE', amount: '₹14.16', status: 'completed', time: '2 mins ago' },
    { id: '2', dealer: 'Global Tech', plan: 'STANDARD', amount: '₹28.32', status: 'pending', time: '15 mins ago' },
    { id: '3', dealer: 'Apex Solutions', plan: 'PREMIUM', amount: '₹42.48', status: 'completed', time: '1 hour ago' },
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
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
              <Search size={16} />
              Quick Search
            </button>
            <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-indigo-600 transition-all">
              <Plus size={16} />
              Create Request
            </button>
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
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Recent Wallet Transactions</h3>
                <button className="text-xs font-bold text-indigo-600 hover:underline">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Dealer</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Plan</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Amount</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-700">{req.dealer}</span>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">{req.plan}</td>
                        <td className="px-6 py-4 text-sm font-black text-slate-900">{req.amount}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                            req.status === 'completed' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            {/* Quick Actions / Notifications */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Bell size={18} className="text-indigo-600" />
                Live Notifications
              </h3>
              <div className="space-y-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex gap-4 relative">
                    <div className="h-2 w-2 rounded-full bg-indigo-500 mt-2 shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-tight">New Dealer signup request from Mumbai Zone</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">10 Minutes Ago</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 py-3 bg-slate-50 text-slate-600 font-bold text-[11px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all">
                Mark All as Read
              </button>
            </div>

            {/* Support Card */}
            <div className="bg-slate-900 p-6 rounded-2xl shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <h4 className="text-white font-bold text-sm uppercase tracking-wide">Business Insight</h4>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                Your network sales are up by <span className="text-emerald-400">18%</span> this month. Consider expanding to Northern zones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhiteDashboard;