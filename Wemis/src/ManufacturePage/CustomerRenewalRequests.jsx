import React, { useEffect, useState, useMemo } from 'react';
import ManufactureNavbar from './ManufactureNavbar';
import { CheckCircle, Clock, Package, Truck, CreditCard, Search, RefreshCcw } from 'lucide-react';

function CustomerRenewalRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const token = localStorage.getItem('token');

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        'https://api.websave.in/api/manufactur/fetchManufactuerRenewalRequest',
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.requests || []);
      } else {
        setError(data.message || 'Failed to fetch requests');
      }
    } catch (err) {
      setError('Connection error. Please try again later.');
    }
    setLoading(false);
  };

  const handleAccept = async (req) => {
    const requestId = req._id;
    const activationId = req.deviceActivationId;
    setProcessingId(requestId);

    try {
      const res = await fetch(
        'https://api.websave.in/api/manufactur/manufacturConformTheRenewalRequest',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ requestId, activationId }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        fetchRequests();
      } else {
        alert(data.message || 'Failed to accept request');
      }
    } catch (err) {
      alert('Error connecting to server');
    }
    setProcessingId(null);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Filter Logic
  const filteredRequests = useMemo(() => {
    return requests.filter(req => 
      req.vechileNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.packageName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [requests, searchTerm]);

  // Quick Stats
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'Pending').length,
    completed: requests.filter(r => r.status !== 'Pending').length
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <ManufactureNavbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Renewal Management</h1>
            <p className="text-slate-500">Manage and approve customer device renewals</p>
          </div>
          <button 
            onClick={fetchRequests}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Requests" value={stats.total} icon={<Package className="text-blue-600" />} color="blue" />
          <StatCard title="Pending Approval" value={stats.pending} icon={<Clock className="text-amber-600" />} color="amber" />
          <StatCard title="Completed" value={stats.completed} icon={<CheckCircle className="text-emerald-600" />} color="emerald" />
        </div>

        {/* Filter Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search by vehicle number or package..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Grid Container */}
        {loading && requests.length === 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
             {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRequests.map((req) => (
              <div
                key={req._id}
                className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Package size={20} />
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold ${
                    req.status === 'Pending' 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {req.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight">
                  {req.packageName}
                </h3>
                <p className="text-slate-400 text-xs mb-4">ID: {req._id.slice(-8).toUpperCase()}</p>

                <div className="space-y-3 border-t border-slate-50 pt-4 mb-6">
                  <div className="flex items-center text-slate-600">
                    <Truck size={14} className="mr-2" />
                    <span className="text-sm font-medium">{req.vechileNo}</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <CreditCard size={14} className="mr-2" />
                    <span className="text-sm">₹{req.price} • {req.paymentMethod}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded text-[11px] font-mono text-slate-500 overflow-hidden text-ellipsis">
                    UTR: {req.utrNo}
                  </div>
                </div>

                <button
                  onClick={() => handleAccept(req)}
                  disabled={req.status !== 'Pending' || processingId === req._id}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    req.status === 'Pending'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {processingId === req._id ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCcw size={16} className="animate-spin" /> Verifying...
                    </span>
                  ) : req.status === 'Pending' ? (
                    'Approve Renewal'
                  ) : (
                    'Renewal Active'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRequests.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <Search className="text-slate-400" />
            </div>
            <h3 className="text-slate-800 font-semibold">No requests found</h3>
            <p className="text-slate-500">Try adjusting your search filters.</p>
          </div>
        )}
      </main>
    </div>
  );
}

// Sub-component for Stats
function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: 'border-l-blue-500',
    amber: 'border-l-amber-500',
    emerald: 'border-l-emerald-500'
  };
  return (
    <div className={`bg-white p-5 rounded-2xl border-l-4 ${colors[color]} shadow-sm border-y border-r border-slate-200 flex justify-between items-center`}>
      <div>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
      <div className="p-3 bg-slate-50 rounded-xl">
        {icon}
      </div>
    </div>
  );
}

export default CustomerRenewalRequests;