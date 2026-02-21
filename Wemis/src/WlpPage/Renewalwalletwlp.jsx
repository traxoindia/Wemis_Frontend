import React, { useEffect, useState, useContext } from "react";
import {
  X,
  Upload,
  Plus,
  Briefcase,
  Loader2,
  Package,
  Calendar,
  Layers,
  Send,
  History,
  CheckCircle2,
  User,
  Building2
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { UserAppContext } from "../contexts/UserAppProvider";
import WlpNavbar from "./WlpNavbar";

// --- API Endpoints ---
const FETCH_RENEWAL_API = "https://api.websave.in/api/manufactur/fetchAllRenewalPackages";
const CREATE_RENEWAL_API = "https://api.websave.in/api/manufactur/addReneWallPackage";
const SEND_RENEWAL_TO_MANU_API = "https://api.websave.in/api/manufactur/sendRenewalPackageToManuFacturer";
const FETCH_SENT_HISTORY_API = "https://api.websave.in/api/manufactur/fetchWlpSendRenewalPackage";
const FETCH_ELEMENTS_API = "https://api.websave.in/api/wlp/findElements";
const FETCH_MANUFACTURERS_API = "https://api.websave.in/api/manufactur/fetchManufacturerOnBasisOsState";

// --- Constants ---
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh",
  "Lakshadweep", "Puducherry",
];

const INITIAL_BILLING_CYCLES = ["3", "7", "30", "60", "90", "120", "150", "180", "210", "240", "270", "300", "330", "365"];
const INITIAL_PACKAGE_TYPES = ["TRACKER", "OFFERED"];

const initialWalletState = { elementName: "", packageType: "", packageName: "", billingCycle: "", description: "" };
const initialSendState = { state: "", manufacturerId: "", manufacturerName: "", renewalPackageId: "" };

function Renewalwalletwlp() {
  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  // State Management
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("available"); 
  const [renewalPlans, setRenewalPlans] = useState([]);
  const [sentHistory, setSentHistory] = useState([]);
  const [elements, setElements] = useState([]);
  
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  
  const [walletData, setWalletData] = useState(initialWalletState);
  const [sendData, setSendData] = useState(initialSendState);
  
  const [manufacturers, setManufacturers] = useState([]);
  const [isLoadingManufacturers, setIsLoadingManufacturers] = useState(false);
  const [submissionLoading, setSubmissionLoading] = useState(false);

  const [packageTypeList, setPackageTypeList] = useState(INITIAL_PACKAGE_TYPES);
  const [billingCycleList, setBillingCycleList] = useState(INITIAL_BILLING_CYCLES);

  const [miniModal, setMiniModal] = useState({ isOpen: false, targetField: "", title: "", value: "" });

  // --- API Fetching Functions ---
  const fetchRenewalPlans = async () => {
    if (!tkn) return;
    setLoading(true);
    try {
      const response = await fetch(FETCH_RENEWAL_API, {
        method: "GET",
        headers: { Authorization: `Bearer ${tkn}`, "Content-Type": "application/json" },
      });
      const resData = await response.json();
      setRenewalPlans(resData.renewalPackages || []);
    } catch (err) {
      toast.error("Failed to fetch renewal packages.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSentHistory = async () => {
    if (!tkn) return;
    setLoading(true);
    try {
      const response = await fetch(FETCH_SENT_HISTORY_API, {
        method: "GET",
        headers: { Authorization: `Bearer ${tkn}`, "Content-Type": "application/json" },
      });
      const resData = await response.json();
      // Updated to match your specific API response key: sendRenewal
      setSentHistory(resData.sendRenewal || []);
    } catch (err) {
      toast.error("Failed to fetch sent history.");
    } finally {
      setLoading(false);
    }
  };

  const fetchElements = async () => {
    if (!tkn) return;
    try {
      const response = await fetch(FETCH_ELEMENTS_API, {
        method: "POST",
        headers: { Authorization: `Bearer ${tkn}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const resData = await response.json();
      setElements(resData.elements || []);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (tkn) {
      if (activeTab === "available") fetchRenewalPlans();
      else fetchSentHistory();
      fetchElements();
    }
  }, [tkn, activeTab]);

  useEffect(() => {
    const fetchManufacturers = async () => {
      if (!sendData.state) return;
      setIsLoadingManufacturers(true);
      try {
        const response = await fetch(FETCH_MANUFACTURERS_API, {
          method: "POST",
          headers: { Authorization: `Bearer ${tkn}`, "Content-Type": "application/json" },
          body: JSON.stringify({ state: sendData.state }),
        });
        const resData = await response.json();
        setManufacturers(resData.data || resData.Manufactur || []);
      } catch (error) { toast.error("Could not fetch manufacturers"); }
      finally { setIsLoadingManufacturers(false); }
    };
    if (isSendModalOpen && sendData.state) fetchManufacturers();
  }, [sendData.state, isSendModalOpen, tkn]);

  // --- Handlers ---
  const handleWalletChange = (e) => setWalletData({ ...walletData, [e.target.name]: e.target.value });
  const handleSendChange = (e) => setSendData({ ...sendData, [e.target.name]: e.target.value });

  const openMiniModal = (field) => setMiniModal({
    isOpen: true, targetField: field,
    title: field === "packageType" ? "Add Package Type" : "Add Billing Cycle",
    value: ""
  });

  const saveMiniModal = (e) => {
    e.preventDefault();
    const val = miniModal.value.trim();
    if (!val) return;
    if (miniModal.targetField === "packageType") {
      setPackageTypeList([...packageTypeList, val]);
      setWalletData({ ...walletData, packageType: val });
    } else {
      setBillingCycleList([...billingCycleList, val]);
      setWalletData({ ...walletData, billingCycle: val });
    }
    setMiniModal({ ...miniModal, isOpen: false });
  };

  const handleCreateWalletSubmit = async (e) => {
    e.preventDefault();
    setSubmissionLoading(true);
    const tid = toast.loading("Creating Renewal Package...");
    try {
      const response = await fetch(CREATE_RENEWAL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tkn}` },
        body: JSON.stringify({ ...walletData, billingCycle: parseInt(walletData.billingCycle) }),
      });
      if (response.ok) {
        toast.success("Package Created!", { id: tid });
        fetchRenewalPlans();
        setIsWalletModalOpen(false);
        setWalletData(initialWalletState);
      } else { toast.error("Creation failed", { id: tid }); }
    } catch (err) { toast.error("Network error", { id: tid }); }
    finally { setSubmissionLoading(false); }
  };

  const handleSendToManufacturerSubmit = async (e) => {
    e.preventDefault();
    if (!sendData.renewalPackageId) return toast.error("Select a plan first");
    setSubmissionLoading(true);
    const tid = toast.loading("Sending Package...");
    try {
      const response = await fetch(SEND_RENEWAL_TO_MANU_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tkn}` },
        body: JSON.stringify({
          manufacturerId: sendData.manufacturerId,
          renewalPackageId: sendData.renewalPackageId,
          state: sendData.state,
        }),
      });
      if (response.ok) {
        toast.success("Renewal Package Sent!", { id: tid });
        setIsSendModalOpen(false);
        setSendData(initialSendState);
        if (activeTab === "history") fetchSentHistory();
      } else { toast.error("Failed to send", { id: tid }); }
    } catch (err) { toast.error("Network error", { id: tid }); }
    finally { setSubmissionLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans w-full pt-20">
      <Toaster position="top-right" />
      <WlpNavbar />

      <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm sticky top-16 z-10 mt-20">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-teal-600" /> Renewal Management
          </h1>
          <div className="flex gap-4 mt-3">
            <button 
                onClick={() => setActiveTab("available")}
                className={`text-sm font-semibold pb-1 border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'available' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-400'}`}
            >
                <Layers size={14} /> Available Plans
            </button>
            <button 
                onClick={() => setActiveTab("history")}
                className={`text-sm font-semibold pb-1 border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'history' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-400'}`}
            >
                <History size={14} /> Sent History
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsSendModalOpen(true)} className="px-4 py-2 bg-orange-500 text-white text-sm rounded flex items-center gap-2 font-semibold hover:bg-orange-600 transition-all shadow-md">
            <Send size={16} /> Send to Manufacturer
          </button>
          <button onClick={() => setIsWalletModalOpen(true)} className="px-4 py-2 bg-[#1f5f5b] text-white text-sm rounded flex items-center gap-2 font-semibold hover:bg-[#164744] transition-all shadow-md">
            <Plus size={16} /> Create Package
          </button>
        </div>
      </header>

      <main className="w-full px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border">
            <Loader2 className="animate-spin text-teal-700" size={40} />
            <p className="mt-4 text-gray-500">Syncing data...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Package / Element</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                      {activeTab === "available" ? "Type" : "Manufacturer & WLP"}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                      {activeTab === "available" ? "Cycle" : "State"}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(activeTab === "available" ? renewalPlans : sentHistory).length > 0 ? (
                    (activeTab === "available" ? renewalPlans : sentHistory).map((item, idx) => {
                      if (activeTab === "available") {
                        return (
                          <tr key={item._id || idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-bold text-gray-800 text-sm block">{item.packageName}</span>
                              <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-1"><Layers size={10}/> {item.elementName}</span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.packageType === 'TRACKER' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                    {item.packageType}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                                <Calendar size={14} className="text-orange-500" />
                                {item.billingCycle} Days
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-[10px] font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded uppercase">Live</span>
                            </td>
                          </tr>
                        );
                      } else {
                        // Mapping for Sent History Tab based on your API response
                        return (
                          <tr key={item._id || idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-bold text-gray-800 text-sm block">{item.renewalElementName}</span>
                              <span className="text-[10px] text-gray-400 font-mono">ID: {item.renewalId.slice(-6)}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-xs text-gray-700 font-semibold">
                                  <Building2 size={12} className="text-orange-500" />
                                  {item.manufacturerName}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                  <User size={12} className="text-gray-400" />
                                  {item.wlpName}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {item.state}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded uppercase">
                                <CheckCircle2 size={10} /> Sent
                              </span>
                            </td>
                          </tr>
                        );
                      }
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <Package size={40} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-gray-400 text-sm">No records found for this section.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* --- MODALS --- */}

      {/* 1. Create Wallet Modal */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Plus className="text-teal-600" /> New Renewal Package</h2>
              <button onClick={() => setIsWalletModalOpen(false)} className="hover:bg-gray-200 p-1 rounded transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateWalletSubmit}>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Element Name *</label>
                        <select name="elementName" value={walletData.elementName} onChange={handleWalletChange} required className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                        <option value="">Select Element</option>
                        {elements.map((el, i) => <option key={i} value={el.elementName}>{el.elementName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Package Name *</label>
                        <input type="text" name="packageName" value={walletData.packageName} onChange={handleWalletChange} required className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Standard Renewal" />
                    </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Package Type *</label>
                        <div className="flex gap-2">
                        <select name="packageType" value={walletData.packageType} onChange={handleWalletChange} required className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none flex-1">
                            <option value="">Select Type</option>
                            {packageTypeList.map((t, idx) => <option key={idx} value={t}>{t}</option>)}
                        </select>
                        <button type="button" onClick={() => openMiniModal("packageType")} className="px-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-600 hover:bg-teal-100"><Plus size={18} /></button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Billing Cycle (Days) *</label>
                        <div className="flex gap-2">
                        <select name="billingCycle" value={walletData.billingCycle} onChange={handleWalletChange} required className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none flex-1">
                            <option value="">Select Cycle</option>
                            {billingCycleList.map((d, idx) => <option key={idx} value={d}>{d} Days</option>)}
                        </select>
                        <button type="button" onClick={() => openMiniModal("billingCycle")} className="px-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-600 hover:bg-teal-100"><Plus size={18} /></button>
                        </div>
                    </div>
                    </div>
                    <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Description</label>
                    <textarea name="description" value={walletData.description} onChange={handleWalletChange} rows="3" className="w-full border rounded-lg p-2.5 text-sm resize-none focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Description..."></textarea>
                    </div>
                </div>
                <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
                    <button type="button" onClick={() => setIsWalletModalOpen(false)} className="text-sm font-semibold text-gray-600">Cancel</button>
                    <button type="submit" disabled={submissionLoading} className="bg-[#1f5f5b] text-white py-2.5 px-8 rounded-lg text-sm font-bold disabled:bg-gray-400 shadow-md">
                        {submissionLoading ? <Loader2 className="animate-spin" size={18} /> : "Create Package"}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Send to Manufacturer Modal */}
      {isSendModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-orange-50 text-orange-800">
              <h2 className="text-lg font-bold flex items-center gap-2"><Send size={18} /> Distribute Renewal Package</h2>
              <button onClick={() => setIsSendModalOpen(false)} className="hover:bg-orange-100 p-1 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSendToManufacturerSubmit}>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target State</label>
                        <select name="state" value={sendData.state} onChange={handleSendChange} className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none">
                        <option value="">Choose State</option>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Manufacturer</label>
                        <select name="manufacturer" value={sendData.manufacturerId} onChange={(e) => {
                            const opt = e.target.selectedOptions[0];
                            setSendData(p => ({ ...p, manufacturerId: opt.value, manufacturerName: opt.dataset.name }));
                        }} className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none">
                            <option value="">{isLoadingManufacturers ? "Searching..." : "Choose Manufacturer"}</option>
                            {manufacturers.map((mf, i) => <option key={i} value={mf._id} data-name={mf.business_Name}>{mf.business_Name}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-1"><Briefcase size={16} className="text-teal-600" /> Choose Renewal Plan</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border-2 border-dashed">
                    {renewalPlans.map((plan) => (
                        <div key={plan._id} onClick={() => setSendData(p => ({ ...p, renewalPackageId: plan._id }))} className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${sendData.renewalPackageId === plan._id ? "border-orange-500 bg-orange-50" : "border-gray-200 bg-white hover:border-orange-200"}`}>
                            <h4 className="text-sm font-bold text-gray-900">{plan.packageName}</h4>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-[10px] text-gray-400 font-mono">{plan.packageType}</span>
                                <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded-full font-bold">{plan.billingCycle} Days</span>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
                </div>
                <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
                    <button type="button" onClick={() => setIsSendModalOpen(false)} className="text-sm font-semibold text-gray-600">Cancel</button>
                    <button type="submit" disabled={submissionLoading || !sendData.renewalPackageId} className="bg-orange-500 text-white py-2.5 px-10 rounded-lg text-sm font-bold shadow-md">
                        {submissionLoading ? "Sending..." : "Confirm & Send"}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Mini Modal */}
      {miniModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-800 mb-4">{miniModal.title}</h3>
            <form onSubmit={saveMiniModal}>
              <input autoFocus type="text" className="w-full border-2 rounded-lg p-2.5 text-sm mb-4 focus:border-teal-500 outline-none" placeholder="Enter value..." value={miniModal.value} onChange={(e) => setMiniModal({ ...miniModal, value: e.target.value })} />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setMiniModal({ ...miniModal, isOpen: false })} className="text-sm text-gray-500 font-medium px-3">Cancel</button>
                <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Renewalwalletwlp;