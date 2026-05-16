import React, { useEffect, useState, useMemo } from 'react';
import ManufactureNavbar from './ManufactureNavbar';
import { CheckCircle, Clock, Package, Truck, CreditCard, Search, RefreshCcw, Eye } from 'lucide-react';

function CustomerRenewalRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

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

  const filteredRequests = useMemo(() => {
    return requests.filter(req => 
      req.vechileNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.packageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.utrNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [requests, searchTerm]);

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
            placeholder="Search by vehicle number, package, or UTR..."
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

        {/* Table View */}
        {loading && requests.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {[1,2,3,4,5,6,7].map(i => (
                    <th key={i} className="px-6 py-4"><div className="h-4 bg-slate-200 rounded animate-pulse w-20"></div></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1,2,3,4,5].map(i => (
                  <tr key={i} className="border-b border-slate-100">
                    {[1,2,3,4,5,6,7].map(j => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-200 rounded animate-pulse"></div></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Package</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Vehicle No.</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Payment Method</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">UTR Number</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-50 rounded-lg">
                            <Package size={14} className="text-blue-600" />
                          </div>
                          <span className="font-medium text-slate-800">{req.packageName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Truck size={14} className="text-slate-400" />
                          <span className="text-slate-700">{req.vechileNo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800">₹{req.price}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600 text-sm">{req.paymentMethod}</span>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono">
                          {req.utrNo}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          req.status === 'Pending' 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {req.status === 'Pending' ? <Clock size={12} /> : <CheckCircle size={12} />}
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleAccept(req)}
                          disabled={req.status !== 'Pending' || processingId === req._id}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            req.status === 'Pending'
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {processingId === req._id ? (
                            <span className="flex items-center gap-2">
                              <RefreshCcw size={14} className="animate-spin" /> Processing...
                            </span>
                          ) : req.status === 'Pending' ? (
                            'Approve'
                          ) : (
                            'Completed'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-slate-400" size={24} />
            </div>
            <h3 className="text-slate-800 font-semibold text-lg">No requests found</h3>
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