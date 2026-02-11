import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import DistributorNavbar from './DistributorNavbar';
import { X, Send, History, Package, IndianRupee, Loader2, User } from 'lucide-react';

function DealerRequestsDispatch() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        state: '',
        dealerName: '',
        qty: '',
        price: ''
    });

    const API_GET_HISTORY = "https://api.websave.in/api/manufactur/fetchAllRequestsFromDealer";
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Fetch history on mount
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axios.get(API_GET_HISTORY, config);
            // Looking at your JSON, the data is in res.data.data
            if (res.data.success) {
                setRequests(res.data.data || []);
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            toast.error("Failed to load request history");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Dispatching Request:", formData);
        setIsModalOpen(false);
        toast.success("Request submitted successfully (Mock)");
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />
            <DistributorNavbar />

            <div className="max-w-full mx-auto p-6">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-8 bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 border-b-4 border-yellow-400 inline-block pb-1">
                            Dealer Requests
                        </h1>
                        <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-tighter">Manage and dispatch wallet activations</p>
                    </div>
                    
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-black text-yellow-400 px-6 py-3 rounded-md font-bold hover:bg-neutral-800 transition-all shadow-lg active:scale-95"
                    >
                        <Send size={18} /> Send Dealer
                    </button>
                </div>

                {/* Data Table Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b flex items-center gap-2 font-bold text-gray-600">
                        <History size={18} />
                        <span className="text-sm uppercase tracking-wider">Active Requests Log</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100/50 text-gray-500 uppercase text-[11px] font-black tracking-widest border-b">
                                    <th className="p-4">Dealer Name</th>
                                    <th className="p-4 text-center">Plan Name</th>
                                    <th className="p-4 text-center">Qty</th>
                                    <th className="p-4 text-center">Method</th>
                                    <th className="p-4 text-center">Total Price</th>
                                    <th className="p-4">UTR Number</th>
                                    <th className="p-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="p-20 text-center">
                                            <Loader2 className="animate-spin mx-auto text-yellow-500 mb-2" size={32} />
                                            <span className="text-gray-400 text-xs font-bold uppercase">Syncing data...</span>
                                        </td>
                                    </tr>
                                ) : requests.length > 0 ? (
                                    requests.map((item) => (
                                        <tr key={item._id} className="hover:bg-yellow-50/30 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gray-100 rounded-full text-gray-400 group-hover:bg-yellow-100 group-hover:text-yellow-600 transition-colors">
                                                        <User size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800">{item.dealerName || "N/A"}</p>
                                                        <p className="text-[10px] text-gray-400 font-mono">ID: {item.distributorId?.slice(-6)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded border border-blue-100 uppercase">
                                                    {item.activationPlanId?.elementName || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center font-black text-gray-700">
                                                {item.requestedWalletCount}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100">
                                                    {item.paymentMethod}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-1 text-green-700 font-black">
                                                    <IndianRupee size={12} />
                                                    <span>{item.totalPrice?.toFixed(2)}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 font-mono text-xs text-gray-500 tracking-tighter">
                                                {item.utrNumber}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`text-[10px] px-3 py-1 font-black uppercase border rounded-full ${
                                                    item.requestStatus === 'approved' ? 'bg-green-50 text-green-600 border-green-200' :
                                                    item.requestStatus === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                    'bg-red-50 text-red-600 border-red-200'
                                                }`}>
                                                    {item.requestStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="p-20 text-center">
                                            <div className="flex flex-col items-center opacity-30">
                                                <Package size={48} className="mb-2" />
                                                <p className="text-xs font-bold uppercase tracking-widest">No Active Requests Found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Request Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border-t-4 border-yellow-400">
                        <div className="bg-black p-4 flex justify-between items-center">
                            <h3 className="text-yellow-400 font-bold text-lg flex items-center gap-2">
                                <Send size={18} /> Send New Request
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-yellow-400 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Target State</label>
                                <input 
                                    type="text" name="state" required
                                    className="w-full border-b-2 border-gray-100 focus:border-yellow-400 outline-none py-2 transition-colors font-bold text-gray-700"
                                    placeholder="e.g. Odisha"
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Dealer Entity Name</label>
                                <input 
                                    type="text" name="dealerName" required
                                    className="w-full border-b-2 border-gray-100 focus:border-yellow-400 outline-none py-2 transition-colors font-bold text-gray-700"
                                    placeholder="Enter full name"
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Quantity</label>
                                    <input 
                                        type="number" name="qty" required
                                        className="w-full border-b-2 border-gray-100 focus:border-yellow-400 outline-none py-2 transition-colors font-bold text-gray-700"
                                        placeholder="0"
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Unit Price (₹)</label>
                                    <input 
                                        type="number" name="price" required
                                        className="w-full border-b-2 border-gray-100 focus:border-yellow-400 outline-none py-2 transition-colors font-bold text-gray-700"
                                        placeholder="0.00"
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                className="w-full bg-black text-yellow-400 font-black py-4 rounded-lg mt-6 hover:bg-neutral-800 transition-all uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                            >
                                <Send size={16} /> Dispatch Request
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DealerRequestsDispatch;