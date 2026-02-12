import React from 'react'
import DealerOemNavbar from './DealerOemNavbar'
import { 
  Users, 
  ShoppingBag, 
  Clock, 
  ArrowUpRight, 
  Activity, 
  MoreHorizontal,
  ChevronRight
} from 'lucide-react'

export default function DealerDashboardOem() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DealerOemNavbar />

      <main className="max-w-7xl mx-auto p-6 lg:p-10">
        {/* Welcome Section */}
        <div className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dealer Overview</h1>
            <p className="text-slate-500 font-medium mt-1">Real-time performance and subscription metrics.</p>
          </div>
          <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            Download Report
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard 
            title="Total Dealers" 
            value="128" 
            icon={<Users className="text-blue-600" size={20} />} 
            trend="+4% this month"
            trendUp={true}
          />
          <StatCard 
            title="Active Orders" 
            value="42" 
            icon={<ShoppingBag className="text-emerald-600" size={20} />} 
            trend="Stable"
            trendUp={true}
          />
          <StatCard 
            title="Pending Requests" 
            value="09" 
            icon={<Clock className="text-amber-600" size={20} />} 
            trend="-2 since yesterday"
            trendUp={false}
          />
        </div>

        {/* Bottom Section: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Activity Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Activity size={18} className="text-indigo-600" />
                Recent Network Activity
              </h3>
              <button className="p-2 hover:bg-slate-50 rounded-lg"><MoreHorizontal size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-0">
              <ActivityRow name="SBT DEALER" action="Stock Dispatched" time="2 mins ago" status="Success" />
              <ActivityRow name="Global Tech" action="Wallet Refill" time="15 mins ago" status="Pending" />
              <ActivityRow name="Apex Solutions" action="New Signup" time="1 hour ago" status="Success" />
            </div>
          </div>

          {/* Quick Stats / Info Card */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-200">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Stock Utilization</h4>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-black">84%</span>
                <span className="text-emerald-400 text-xs font-bold pb-1 flex items-center"><ArrowUpRight size={12}/> 12%</span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full w-[84%] rounded-full" />
              </div>
              <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase">Optimal performance reached</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between group cursor-pointer hover:border-indigo-500 transition-all">
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Support Center</p>
                  <p className="font-bold text-slate-800">Check Open Tickets</p>
               </div>
               <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-all" size={20} />
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, icon, trend, trendUp }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
          {trend}
        </span>
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
    </div>
  )
}

function ActivityRow({ name, action, time, status }) {
  return (
    <div className="flex items-center justify-between p-5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-all">
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 bg-indigo-50 rounded-full flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase">
          {name.substring(0, 2)}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{name}</p>
          <p className="text-[10px] font-semibold text-slate-400 uppercase">{action}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-bold text-slate-700">{status}</p>
        <p className="text-[10px] text-slate-400 font-medium">{time}</p>
      </div>
    </div>
  )
}