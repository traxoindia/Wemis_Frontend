import React, { useState, useEffect } from "react";
import { 
  Search, Wallet, Loader2, CheckCircle, 
  ArrowUpRight, Clock, Send, X, Package, ShieldCheck
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import ManufactureNavbar from "./ManufactureNavbar";

const FETCH_WALLET_HISTORY_API = "https://api.websave.in/api/manufactur/fetchManufacturActivatioWallet";
const FETCH_OEM_API = "https://api.websave.in/api/manufactur/findOemUnderManufactur";
const FETCH_DISTRIBUTOR_API = "https://api.websave.in/api/manufactur/findDistributorUnderManufactur";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", 
  "Lakshadweep", "Puducherry"
];

const WalletSystem = () => {
  const tkn = localStorage.getItem("token");

  // --- Main State ---
  const [walletHistory, setWalletHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- Dynamic Dropdown States (from History API) ---
  const [elementTypes, setElementTypes] = useState([]);
  const [elements, setElements] = useState([]);

  // --- Modal State ---
  const [showModal, setShowModal] = useState(false);
  const [oemList, setOemList] = useState([]);
  const [distributorList, setDistributorList] = useState([]);
  const [fetchingLists, setFetchingLists] = useState(false);

  // --- Form State ---
  const [form, setForm] = useState({
    state: "",
    oemId: "",
    distributorId: "",
    elementType: "",
    element: "",
    selectedPackage: null,
    quantity: 1
  });

  // --- Calculations ---
  const totalPackages = walletHistory.reduce((acc, item) => acc + (item.noOfActivationWallets || 0), 0);
  const totalAmount = walletHistory.reduce((acc, item) => acc + (item.price * item.noOfActivationWallets || 0), 0);
  const activePackages = walletHistory.filter(item => item.activationStatus).length;
  const pendingPackages = walletHistory.filter(item => !item.activationStatus).length;

  useEffect(() => {
    fetchWalletHistory();
  }, [tkn]);

  useEffect(() => {
    if (form.state) {
      fetchPartners(form.state);
    } else {
      setOemList([]);
      setDistributorList([]);
    }
  }, [form.state]);

  const fetchWalletHistory = async () => {
    if (!tkn) return;
    setLoading(true);
    try {
      const response = await fetch(FETCH_WALLET_HISTORY_API, {
        method: "GET",
        headers: { "Authorization": `Bearer ${tkn}`, "Content-Type": "application/json" }
      });
      const result = await response.json();
      if (result.success) {
        const history = result.activationWallets || [];
        setWalletHistory(history);

        // --- Extract Dynamic Element Types and Elements ---
        const types = [...new Set(history.map(item => item.packageType))].filter(Boolean);
        const elms = [...new Set(history.map(item => item.elementName))].filter(Boolean);
        
        setElementTypes(types);
        setElements(elms);
      }
    } catch (error) {
      toast.error("Error fetching wallet history");
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async (stateName) => {
    setFetchingLists(true);
    try {
      const headers = { "Authorization": `Bearer ${tkn}`, "Content-Type": "application/json" };
      const body = JSON.stringify({ state: stateName });

      const [oemRes, distRes] = await Promise.all([
        fetch(FETCH_OEM_API, { method: "POST", headers, body }),
        fetch(FETCH_DISTRIBUTOR_API, { method: "POST", headers, body })
      ]);

      const oemData = await oemRes.json();
      const distData = await distRes.json();

      setOemList(oemData.oem || []);
      setDistributorList(distData.dist || []);
    } catch (error) {
      toast.error("Failed to fetch partners");
    } finally {
      setFetchingLists(false);
    }
  };

  const handleSubscriptionSubmit = async (e) => {
    e.preventDefault();
    if (!form.selectedPackage) return toast.error("Please select an activation plan");
    toast.success("Subscription request sent successfully!");
    setShowModal(false);
    setForm({ state: "", oemId: "", distributorId: "", elementType: "", element: "", selectedPackage: null, quantity: 1 });
  };

  const filteredData = walletHistory.filter(item => 
    item.packageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.elementName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Toaster position="top-right" />
      <ManufactureNavbar />

      <main className="p-4 lg:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Wallet Management</h1>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-[#1e88e5] hover:bg-blue-700 text-white px-5 py-2 rounded-md shadow-md flex items-center gap-2 text-sm font-bold transition-all"
          >
            <Send size={16} /> Send Subscription
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#43a047] text-white p-4 rounded shadow-md flex justify-between items-center">
            <span className="text-sm font-bold uppercase">Package Count</span>
            <span className="text-3xl font-light">{totalPackages}</span>
          </div>
          <div className="bg-[#1e88e5] text-white p-4 rounded shadow-md flex justify-between items-center">
            <span className="text-sm font-bold uppercase">Total Amount</span>
            <span className="text-3xl font-light">₹{totalAmount.toLocaleString()}</span>
          </div>
          <div className="bg-[#fb8c00] text-white p-4 rounded shadow-md flex justify-between items-center">
            <span className="text-sm font-bold uppercase">Pending</span>
            <span className="text-3xl font-light">{pendingPackages}</span>
          </div>
          <div className="bg-[#e53935] text-white p-4 rounded shadow-md flex justify-between items-center">
            <span className="text-sm font-bold uppercase">Active</span>
            <span className="text-3xl font-light">{activePackages}</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-3 rounded shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="relative flex-1 max-w-xl">
            <input 
              type="text" 
              placeholder="Search package or element name..." 
              className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded text-sm outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></div>
            ) : (
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="bg-[#64b5f6] text-white font-bold uppercase">
                    <th className="p-3">Package Name</th>
                    <th className="p-3">Element</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Cycle</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50 transition-all">
                      <td className="p-3 font-semibold text-blue-700">{item.packageName}</td>
                      <td className="p-3 text-gray-700 font-medium">{item.elementName}</td>
                      <td className="p-3 font-bold">{item.noOfActivationWallets}</td>
                      <td className="p-3 text-gray-600">₹{item.price}</td>
                      <td className="p-3 font-bold text-indigo-700">₹{(item.price * item.noOfActivationWallets).toLocaleString()}</td>
                      <td className="p-3 text-gray-500">{item.billingCycle}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white ${item.activationStatus ? 'bg-green-500' : 'bg-orange-400'}`}>
                          {item.activationStatus ? 'Success' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* --- SEND SUBSCRIPTION MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-4xl rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#1a2b3c] p-4 flex justify-between items-center text-white">
              <h2 className="flex items-center gap-2 font-bold tracking-wide text-sm uppercase">
                <Package size={20} className="text-blue-400" /> Send Subscription to Distributor & OEM
              </h2>
              <button onClick={() => setShowModal(false)} className="hover:rotate-90 transition-all p-1"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubscriptionSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
              {/* Row 1: State & Partners */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">State</label>
                  <select 
                    required
                    className="w-full border p-2.5 rounded bg-gray-50 outline-none focus:border-blue-500 text-sm"
                    value={form.state}
                    onChange={(e) => setForm({...form, state: e.target.value, oemId: "", distributorId: ""})}
                  >
                    <option value="">Choose State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Manufacturer</label>
                  <select 
                    disabled={!form.state || !!form.distributorId}
                    className="w-full border p-2.5 rounded bg-gray-50 outline-none focus:border-blue-500 text-sm disabled:opacity-50"
                    value={form.oemId}
                    onChange={(e) => setForm({...form, oemId: e.target.value})}
                  >
                    <option value="">{fetchingLists ? "Fetching..." : (form.state ? "Select OEM" : "Select State First")}</option>
                    {oemList.map(o => <option key={o._id} value={o._id}>{o.business_Name}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: Elements (DYNAMIC FROM API) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Element Type</label>
                  <select 
                    className="w-full border p-2.5 rounded bg-gray-50 text-sm outline-none"
                    value={form.elementType}
                    onChange={(e) => setForm({...form, elementType: e.target.value})}
                  >
                    <option value="">Select Element Type</option>
                    {elementTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Element</label>
                  <select 
                    className="w-full border p-2.5 rounded bg-gray-50 text-sm outline-none"
                    value={form.element}
                    onChange={(e) => setForm({...form, element: e.target.value})}
                  >
                    <option value="">Select Element</option>
                    {elements.map(elm => <option key={elm} value={elm}>{elm}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 3: Distributor Toggle */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Distributor</label>
                <select 
                  disabled={!form.state || !!form.oemId}
                  className="w-full border p-2.5 rounded bg-gray-50 outline-none focus:border-blue-500 text-sm disabled:opacity-50"
                  value={form.distributorId}
                  onChange={(e) => setForm({...form, distributorId: e.target.value})}
                >
                  <option value="">Select Distributor</option>
                  {distributorList.map(d => <option key={d._id} value={d._id}>{d.business_Name || d.name}</option>)}
                </select>
              </div>

              {/* Row 4: Package Cards (DYNAMIC FROM HISTORY) */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase italic">Click on a card to select activation plan</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {walletHistory.slice(0, 2).map((pkg, i) => ( // Showing first 2 unique packages as example
                    <div 
                      key={i}
                      onClick={() => setForm({...form, selectedPackage: pkg})}
                      className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${form.selectedPackage?._id === pkg._id ? 'border-blue-500 bg-blue-50 shadow-inner' : 'border-gray-200 hover:border-blue-300'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">{pkg.packageName}</h4>
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{pkg.elementName}</p>
                        </div>
                        <span className="text-base font-bold text-blue-700 font-mono">₹{pkg.price}</span>
                      </div>
                      <div className="mt-4 flex justify-between items-center text-[10px] border-t pt-2">
                        <span className="bg-gray-200 px-2 py-0.5 rounded font-black text-gray-600">{pkg.packageType}</span>
                        <span className="flex items-center gap-1 text-gray-500 font-bold tracking-widest uppercase"><Clock size={12}/> {pkg.billingCycle}</span>
                      </div>
                      {form.selectedPackage?._id === pkg._id && (
                         <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 shadow-md">
                           <ShieldCheck size={16} />
                         </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 5: Quantity */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">No of Activations</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full border p-2.5 rounded bg-white outline-none focus:ring-2 focus:ring-blue-500/10 text-sm"
                  value={form.quantity}
                  onChange={(e) => setForm({...form, quantity: e.target.value})}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 rounded font-bold text-gray-500 hover:bg-gray-100 text-xs">Cancel</button>
                <button type="submit" className="px-8 py-2 bg-[#1a2b3c] hover:bg-slate-800 text-white rounded font-bold shadow-lg flex items-center gap-2 text-xs">
                  <ArrowUpRight size={18} /> Submit to Distributor & OEM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletSystem;