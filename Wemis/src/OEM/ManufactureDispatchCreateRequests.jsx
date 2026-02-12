import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { X, Send, History, Package, IndianRupee, Loader2, User, PlusCircle, CheckCircle2, Filter } from 'lucide-react';
import OemNavbar from './OemNavbar';
import WalletStock from './WalletStock';
import WalletTable from './WalletTable';

function ManufactureDispatchCreateRequests() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requests, setRequests] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        walletCount: '',
        paymentMethod: 'UPI',
        utrNumber: '',
        price: 0
    });

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // API Endpoints
    const API_HISTORY = "https://api.websave.in/api/manufactur/fetchAllRequestsFromDealer";
    const API_PLANS = "https://api.websave.in/api/manufactur/plansShowOEMandDistributor";
    const API_SUBMIT = "https://api.websave.in/api/manufactur/distributorAndOemRequestForActivationWallet";

    useEffect(() => {
        fetchHistory();
        fetchPlans();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await axios.get(API_HISTORY, config);
            if (res.data.success) setRequests(res.data.data || []);
        } catch (err) {
            toast.error("Failed to load request history");
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const res = await axios.get(API_PLANS, config);
            if (res.data.success) {
                setPlans(res.data.data);
                // Pre-select first plan if available
                if (res.data.data.length > 0) setSelectedPlan(res.data.data[0]);
            }
        } catch (err) {
            console.error("Error fetching plans", err);
        }
    };
    

    // Update total price whenever count or plan changes
    useEffect(() => {
        const unitPrice = selectedPlan?.activationWallet?.price || 0;
        const total = (parseFloat(formData.walletCount || 0) * unitPrice).toFixed(2);
        setFormData(prev => ({ ...prev, price: total }));
    }, [formData.walletCount, selectedPlan]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedPlan) return toast.error("Please select a plan");
        if (!formData.walletCount || formData.walletCount <= 0) return toast.error("Enter a valid quantity");

        try {
            const payload = {
                activationPlanId: selectedPlan.activationWallet._id, // As per your requirement
                requestedWalletCount: parseInt(formData.walletCount),
                totalPrice: parseFloat(formData.price),
                paymentMethod: formData.paymentMethod,
                utrNumber: formData.utrNumber
            };
console.log(payload)
            const res = await axios.post(API_SUBMIT, payload, config);

            if (res.data.success || res.status === 200) {
                toast.success("Request submitted successfully!");
                setTimeout(() => {
                    setIsModalOpen(false);
                    setFormData({ walletCount: '', paymentMethod: 'UPI', utrNumber: '', price: 0 });
                    fetchHistory();
                }, 1500);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Submission failed");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />
            <OemNavbar />
            <WalletStock />

            <div className="max-w-7xl mx-auto p-6">
                <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 tracking-tight text-left">Create Request</h1>
                        <p className="text-sm text-gray-500">Manage and monitor dealer dispatch requests</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-bold transition-all shadow-md active:scale-95"
                    >
                        <PlusCircle size={20} /> Create Requests
                    </button>
                </div>

                {/* Data Table */}
              <div className="bg-white -mt-5 border-gray-200">
                 <WalletTable/>
              </div>
            </div>

            {/* MODAL - As per ScreenShot */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in duration-200">
                        
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-extrabold text-slate-800">Wallet Credit Request</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                            
                            {/* 1. Choose Plan */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-slate-400 font-black text-[11px] uppercase tracking-widest">
                                    <span>1. Choose Plan</span>
                                    <div className="flex items-center gap-1"><Filter size={12}/> Filter...</div>
                                </div>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {plans.map((plan) => (
                                        <div 
                                            key={plan._id}
                                            onClick={() => setSelectedPlan(plan)}
                                            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                                                selectedPlan?._id === plan._id 
                                                ? 'border-slate-900 bg-slate-900 text-white' 
                                                : 'border-slate-100 bg-white text-slate-800 hover:border-slate-200'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="text-left">
                                                    <h4 className="font-bold text-lg leading-tight">{plan.activationWallet?.packageName || 'Plan'}</h4>
                                                    <p className={`text-xs mt-1 ${selectedPlan?._id === plan._id ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        {plan.activationWallet?.description}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${selectedPlan?._id === plan._id ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                                            {plan.activationWallet?.elementName}
                                                        </span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${selectedPlan?._id === plan._id ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                                            {plan.activationWallet?.billingCycle}
                                                        </span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-500">
                                                            ₹{plan.activationWallet?.price}/UNIT
                                                        </span>
                                                    </div>
                                                </div>
                                                {selectedPlan?._id === plan._id && <CheckCircle2 size={20} className="text-emerald-400" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 2. Payment Details */}
                            <div className="space-y-6 text-left">
                                <h3 className="text-slate-400 font-black text-[11px] uppercase tracking-widest">2. Payment Details</h3>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase">Quantity</label>
                                        <input 
                                            type="number" name="walletCount" required
                                            value={formData.walletCount}
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-lg font-bold focus:ring-2 focus:ring-slate-900 outline-none"
                                            placeholder="0"
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase">Total Price</label>
                                        <div className="w-full bg-slate-50 rounded-xl p-4 text-lg font-bold text-slate-600 flex items-center gap-2">
                                            <span>₹</span>
                                            <span>{formData.price}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase">Payment Method</label>
                                    <select 
                                        name="paymentMethod"
                                        className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-slate-900 outline-none"
                                        value={formData.paymentMethod}
                                        onChange={handleInputChange}
                                    >
                                        <option value="UPI">UPI</option>
                                        <option value="Net Banking">Net Banking</option>
                                        <option value="Card Payment">Card Payment</option>
                                        <option value="Wallet Payment">Wallet Payment</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase">UTR / Reference Number</label>
                                    <input 
                                        type="text" name="utrNumber" required
                                        value={formData.utrNumber}
                                        className="w-full bg-slate-50 border-none rounded-xl p-4 font-mono text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                        placeholder="Transaction ID"
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full bg-black  text-white font-bold py-5 rounded-2xl mt-4 transition-all flex items-center justify-center gap-3 shadow-lg"
                                >
                                    <Send size={20} /> Confirm & Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManufactureDispatchCreateRequests;