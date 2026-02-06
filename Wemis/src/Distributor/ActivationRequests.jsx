import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, 
  Circle, 
  CreditCard, 
  Plus, 
  X, 
  Loader2,
  Search,
  IndianRupee,
  Tag,
  History,
  Info
} from 'lucide-react';
import DistributorNavbar from './DistributorNavbar';
import WalletStock from './WalletStock';
import WalletTable from './WalletTable';

const ActivationRequests = () => {
  // --- Data States ---
  const [plans, setPlans] = useState([]);
  const [requests, setRequests] = useState([]);
  
  // --- UI States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState(''); // This will now store activationWallet._id
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // --- Form States ---
  const [formData, setFormData] = useState({
    walletCount: '',
    price: '',
    paymentMethod: 'UPI',
    utrNumber: ''
  });

  const token = localStorage.getItem('token');
  const paymentMethods = ["UPI", "Net Banking", "Card Payment", "Wallet Payment", "Other"];

  // 1. Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      setFetchingData(true);
      try {
        const plansRes = await axios.get('https://api.websave.in/api/manufactur/plansShowOEMandDistributor', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setPlans(plansRes.data.data || []);
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, [token]);

  // 2. Auto-Calculate Total Price
  useEffect(() => {
    if (selectedPlanId && formData.walletCount) {
      // Find the plan where the nested activationWallet._id matches our selection
      const selectedPlan = plans.find(p => p.activationWallet?._id === selectedPlanId);
      if (selectedPlan) {
        const unitPrice = selectedPlan.activationWallet?.price || 0;
        const total = unitPrice * parseInt(formData.walletCount);
        setFormData(prev => ({ ...prev, price: total }));
      }
    } else {
      setFormData(prev => ({ ...prev, price: '' }));
    }
  }, [selectedPlanId, formData.walletCount, plans]);

  // 3. Filter Logic
  const filteredPlans = plans.filter(plan => 
    plan.activationWallet?.packageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.activationWallet?.packageType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlanId) return;

    setLoading(true);
    try {
      const payload = {
        activationPlanId: selectedPlanId, // Correctly sending activationWallet._id
        requestedWalletCount: parseInt(formData.walletCount),
        totalPrice: formData.price,
        paymentMethod: formData.paymentMethod,
        utrNumber: formData.utrNumber
      };

      await axios.post('https://api.websave.in/api/manufactur/distributorAndOemRequestForActivationWallet',
        payload,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setMessage({ type: 'success', text: 'Request submitted successfully!' });
      
      setTimeout(() => {
        setIsModalOpen(false);
        resetForm();
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Submission failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ walletCount: '', price: '', paymentMethod: 'UPI', utrNumber: '' });
    setSelectedPlanId('');
    setMessage({ type: '', text: '' });
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans">
      <DistributorNavbar />
      <div className=' '>
        <WalletStock/>
      </div>

      <div className="max-w-full mx-auto py-10 px-6 -mt-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Activation Requests</h1>
            <p className="text-slate-500 text-sm font-medium">Request wallet credits for your distribution network</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-black transition-all font-bold shadow-sm active:scale-95"
          >
            <Plus size={20} /> Create New Request
          </button>
        </div>

        {/* Minimal Data Table */}
       
          <div className="overflow-x-auto">
           <WalletTable/>
          </div>
      
      </div>

      {/* --- MINIMAL MODAL BOX --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-10 py-6 border-b border-slate-50">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Wallet Credit Request</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* 1. Selection Side */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">1. Choose Plan</h3>
                    <div className="relative">
                      <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input 
                        type="text" placeholder="Filter..." value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-5 py-1 text-xs outline-none bg-transparent font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-3 custom-scrollbar">
                    {filteredPlans.map((item) => (
                      <div 
                        key={item._id}
                        // UPDATED: Use item.activationWallet._id for selection
                        onClick={() => setSelectedPlanId(item.activationWallet?._id)}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                          selectedPlanId === item.activationWallet?._id 
                          ? 'border-slate-900 bg-slate-900 text-white' 
                          : 'border-slate-100 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-3">
                            <p className="font-bold leading-tight">{item.activationWallet?.packageName}</p>
                            <div className="flex gap-2">
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${selectedPlanId === item.activationWallet?._id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                {item.activationWallet?.packageType}
                              </span>
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${selectedPlanId === item.activationWallet?._id ? 'bg-emerald-400 text-slate-900' : 'bg-emerald-50 text-emerald-600'}`}>
                                ₹{item.activationWallet?.price} /Unit
                              </span>
                            </div>
                          </div>
                          {selectedPlanId === item.activationWallet?._id ? <CheckCircle2 size={20} className="text-emerald-400" /> : <Circle size={20} className="text-slate-100" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Form Side */}
                <div className="space-y-8">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100 pb-2">2. Payment Details</h3>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quantity</label>
                        <input 
                          type="number" required value={formData.walletCount}
                          onChange={(e) => setFormData({...formData, walletCount: e.target.value})}
                          className="w-full bg-slate-50 rounded-xl px-4 py-3 focus:bg-white border-2 border-transparent focus:border-slate-100 outline-none transition-all font-bold"
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Price</label>
                        <input 
                          type="text" readOnly value={`₹ ${formData.price}`}
                          className="w-full bg-slate-100 rounded-xl px-4 py-3 border-2 border-transparent outline-none font-bold text-slate-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Method</label>
                      <select 
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 outline-none font-bold text-sm border-2 border-transparent focus:border-slate-100"
                      >
                        {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">UTR / Reference Number</label>
                      <input 
                        type="text" required value={formData.utrNumber}
                        onChange={(e) => setFormData({...formData, utrNumber: e.target.value})}
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 focus:bg-white border-2 border-transparent focus:border-slate-100 outline-none font-mono text-sm"
                        placeholder="Transaction ID"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    {message.text && (
                      <div className={`mb-4 p-3 rounded-lg text-xs font-bold text-center ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {message.text}
                      </div>
                    )}
                    <button 
                      type="submit" 
                      disabled={loading || !selectedPlanId || !formData.walletCount}
                      className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <><CreditCard size={18}/> Confirm & Submit</>}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivationRequests;