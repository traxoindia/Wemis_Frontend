import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  IndianRupee, 
  Loader2, 
  Wallet,
  Calendar,
  ChevronRight
} from 'lucide-react';

function DealerWalletRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const API_GET_HISTORY = "https://api.websave.in/api/manufactur/fetchAllRequestsFromDealer";
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axios.get(API_GET_HISTORY, config);
            if (res.data.success) {
                setRequests(res.data.data || []);
            }
        } catch (err) {
            toast.error("Failed to fetch wallet requests");
        } finally {
            setLoading(false);
        }
    };

    const filteredRequests = requests.filter(req => 
        req.dealerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.activationPlanId?.elementName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 font-sans text-slate-900">
            <Toaster position="top-right" />
            
            <div className="max-w-full mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                            <Wallet className="text-indigo-600" size={28} />
                            Wallet Requests History
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Track and monitor the status of your inventory subscription requests</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search requests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white border border-slate-200 pl-10 pr-4 py-2 rounded-xl text-sm focus:border-indigo-500 outline-none w-64 transition-all shadow-sm"
                            />
                        </div>
                        <button onClick={fetchHistory} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                            <Filter size={18} className="text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Statistics Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Requests</p>
                        <p className="text-2xl font-black text-slate-900">{requests.length}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Completed</p>
                        <p className="text-2xl font-black text-slate-900">{requests.filter(r => r.requestStatus === 'completed').length}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Pending Approval</p>
                        <p className="text-2xl font-black text-slate-900">{requests.filter(r => r.requestStatus === 'pending').length}</p>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Price</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">UTR Reference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan="6" className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" size={32} /></td></tr>
                                ) : filteredRequests.length === 0 ? (
                                    <tr><td colSpan="6" className="py-20 text-center text-slate-400 font-medium italic">No wallet requests found.</td></tr>
                                ) : filteredRequests.map((item) => (
                                    <tr key={item._id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                                    <Package size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm uppercase">{item.activationPlanId?.elementName}</p>
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                                                        <Calendar size={10} /> Ref: {item._id.slice(-6)}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                                                {item.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-black text-slate-600">{item.requestedWalletCount}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 font-black text-slate-900">
                                                <IndianRupee size={14} className="text-slate-400" />
                                                {item.totalPrice?.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                                item.requestStatus === 'completed'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                                {item.requestStatus === 'completed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                {item.requestStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-xs font-mono font-bold text-slate-400 truncate max-w-[150px] ml-auto">
                                                {item.utrNumber || "N/A"}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DealerWalletRequests;