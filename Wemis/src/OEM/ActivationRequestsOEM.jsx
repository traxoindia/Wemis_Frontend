import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { X, Send, User, ChevronRight, MapPin, Info, ShieldCheck, Loader2, IndianRupee, CheckCircle2 } from 'lucide-react';
import OemNavbar from './OemNavbar';

function ActivationRequestsOEM() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requests, setRequests] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [fetchingId, setFetchingId] = useState(null);
    const [processedRequests, setProcessedRequests] = useState([]);

    const [formData, setFormData] = useState({
        requestId: '',
        state: '',
        dealerName: '',
        qty: 0,
        price: 0,
        planId: '',
        oemDelerId: '' 
    });

    const API_GET_HISTORY = "https://api.websave.in/api/manufactur/fetchAllRequestsFromDealer";
    const API_POST_DETAILS = "https://api.websave.in/api/manufactur/fetchParticularDelerRequestForSendWallet";
    const FETCH_PLANS_API = "https://api.websave.in/api/manufactur/plansShowOEMandDistributor";
    const DISPATCH_API = "https://api.websave.in/api/manufactur/sendWalletOemToDeler";

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        fetchHistory();
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await axios.get(FETCH_PLANS_API, config);
            if (res.data.success) {
                const extractedPlans = res.data.data.map(item => item.activationWallet);
                setPlans(extractedPlans || []);
            }
        } catch (error) {
            console.error("Plans Fetch Error:", error);
        }
    };

    const fetchHistory = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axios.get(API_GET_HISTORY, config);
            if (res.data.success) {
                setRequests(res.data.data || []);
            }
        } catch (err) {
            toast.error("Failed to load history");
        } finally {
            setLoading(false);
        }
    };

    const handleFillRequest = async (item) => {
        setFetchingId(item._id);
        try {
            const response = await axios.post(API_POST_DETAILS, { requestId: item._id }, config);
            if (response.data.success) {
                const apiData = response.data.data;
                setFormData({
                    requestId: item._id,
                    state: apiData.state || '',
                    dealerName: item.dealerName || apiData.partnerName,
                    qty: item.requestedWalletCount || apiData.requestedWalletCount,
                    price: item.totalPrice || 0,
                    planId: item.activationPlanId?._id || apiData.activationPlanId || '',
                    // FIXED: Fetching oemDelerId directly from the request item
                    oemDelerId: item.oemDelerId 
                });
                setIsModalOpen(true);
            }
        } catch (error) {
            toast.error("Error fetching request details");
        } finally {
            setFetchingId(null);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'planId' || name === 'qty') {
                const selectedPlan = plans.find(p => p._id === (name === 'planId' ? value : prev.planId));
                if (selectedPlan) {
                    newData.price = Number(selectedPlan.price) * Number(name === 'qty' ? value : prev.qty);
                }
            }
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.oemDelerId) {
            toast.error("OEM Dealer ID is missing");
            return;
        }

        setSubmitting(true);
        const tid = toast.loading("Processing Dispatch...");

        try {
            const payload = {
                state: formData.state,
                partnerName: formData.dealerName,
                oemDelerId: formData.oemDelerId,
                activationPlanId: formData.planId,
                sentWalletAmount: Number(formData.price),
                sentStockQuantity: Number(formData.qty),
            };
console.log(payload)
            const response = await axios.post(DISPATCH_API, payload, config);
            
            if (response.data.success) {
                toast.success("Inventory Dispatched Successfully", { id: tid });
                setProcessedRequests(prev => [...prev, formData.requestId]);
                setIsModalOpen(false);
                fetchHistory(); 
            } else {
                toast.error(response.data.message || "Dispatch Failed", { id: tid });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred during dispatch", { id: tid });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans text-slate-900">
            <Toaster position="top-right" />
            <OemNavbar />

            <div className="max-w-full mx-auto p-6 mt-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dealer OEM Requests</h1>
                        <p className="text-slate-500 mt-1">Review and process inventory subscription requests</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-xs font-bold text-slate-500 uppercase">
                        Pending Orders: {requests.filter(r => r.requestStatus === 'pending' && !processedRequests.includes(r._id)).length}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dealer</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan="6" className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" size={32} /></td></tr>
                                ) : requests.map((item) => {
                                    const isCompleted = item.requestStatus === 'completed' || processedRequests.includes(item._id);

                                    return (
                                        <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                                                        <User size={18} />
                                                    </div>
                                                    <span className="font-bold text-slate-700">{item.dealerName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-500 uppercase">
                                                {item.activationPlanId?.elementName || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-600">{item.requestedWalletCount}</td>
                                            <td className="px-6 py-4 font-black text-slate-900">₹{item.totalPrice?.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${isCompleted
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                    {isCompleted ? <ShieldCheck size={12} /> : <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                                                    {isCompleted ? 'Completed' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    disabled={fetchingId === item._id || isCompleted}
                                                    onClick={() => handleFillRequest(item)}
                                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all shadow-sm flex items-center gap-2 ml-auto ${isCompleted
                                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-100'
                                                        }`}
                                                >
                                                    {fetchingId === item._id ? <Loader2 size={14} className="animate-spin" /> : null}
                                                    {isCompleted ? "Dispatched" : "Fulfill Request"}
                                                    {!isCompleted && fetchingId !== item._id && <ChevronRight size={14} />}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">OEM Stock Dispatch</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    Dealer ID: <span className="text-indigo-600">{formData.oemDelerId}</span>
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="overflow-y-auto p-8 flex-1">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-3">
                                        <Info className="text-indigo-600 shrink-0" size={18} />
                                        <p className="text-[11px] text-indigo-700 leading-relaxed font-bold uppercase tracking-tight">
                                            Action: Transferring stock to <strong>{formData.dealerName}</strong>. This process is irreversible.
                                        </p>
                                    </div>

                                    <div className="space-y-5">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Dispatch State</label>
                                            <div className="relative group">
                                                <MapPin className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                                                <input required name="state" placeholder="e.g. Karnataka" value={formData.state} onChange={handleInputChange} className="w-full bg-white border border-slate-200 p-3.5 pl-10 rounded-xl font-bold text-slate-700 focus:border-indigo-500 outline-none transition-all" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Quantity</label>
                                                <input required type="number" name="qty" value={formData.qty} onChange={handleInputChange} className="w-full border border-slate-200 p-3.5 rounded-xl font-black text-slate-800 focus:border-indigo-500 outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Final Amount</label>
                                                <div className="relative">
                                                    <IndianRupee className="absolute left-3 top-4 text-slate-400" size={14} />
                                                    <input readOnly type="number" value={formData.price} className="w-full bg-slate-50 border border-slate-200 p-3.5 pl-8 rounded-xl font-black text-slate-900 outline-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Activation Plan</label>
                                    <div className="grid grid-cols-1 gap-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                                        {plans.map((plan) => (
                                            <div
                                                key={plan._id}
                                                onClick={() => handleInputChange({ target: { name: 'planId', value: plan._id } })}
                                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex justify-between items-center ${formData.planId === plan._id
                                                    ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                                                    : 'border-slate-100 hover:border-slate-200 bg-white'
                                                    }`}
                                            >
                                                <div>
                                                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight">{plan.elementName}</h4>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{plan.billingCycle}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-indigo-600">₹{plan.price}</p>
                                                    {formData.planId === plan._id && <CheckCircle2 className="text-indigo-600 inline-block mt-1" size={16} />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 pt-6 border-t border-slate-100 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-8 py-4 rounded-xl font-black text-slate-400 hover:bg-slate-100 transition-all text-[10px] uppercase tracking-widest"
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !formData.planId || !formData.state}
                                    className="flex-1 bg-slate-900 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-black disabled:opacity-50 transition-all shadow-lg text-[10px] uppercase tracking-widest"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={16} />}
                                    Send Wallet Stock
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ActivationRequestsOEM;