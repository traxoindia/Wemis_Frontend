import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { 
  Search, ArrowLeft, X, Upload, Plus, Layers, 
  Package, CheckCircle, AlertCircle, Save, Loader2, Calculator 
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { UserAppContext } from "../contexts/UserAppProvider";
import WlpNavbar from "./WlpNavbar";

// --- API Endpoints ---
const FETCH_ACTIVATIONS_API = "https://api.websave.in/api/manufactur/fetchAllActivationPlans"; // GET
const CREATE_WALLET_API = "https://api.websave.in/api/manufactur/addActivationLogic"; // POST (Create Wallet)
const SEND_ACTIVATION_API = "https://api.websave.in/api/manufactur/createNewSubscription"; // POST (Send to Distributor)
const FETCH_ELEMENTS_API = "https://api.websave.in/api/wlp/findElements";
const FETCH_DISTRIBUTORS_API = "https://api.websave.in/api/manufactur/fetchDistributorOnBasisOfState";

// --- Constants ---
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh",
  "Lakshadweep", "Puducherry"
];

const INITIAL_BILLING_CYCLES = [
  "3 days", "7 days", "30 days", "60 days", "90 days", "120 days", "150 days",
  "180 days", "210 days", "240 days", "270 days", "300 days", "330 days", "365 DAYS"
];
const INITIAL_PACKAGE_TYPES = ["TRACKER", "OFFERED"];
const GST_RATES = [0, 5, 12, 18, 28]; // GST Slabs

// Initial State for Create Wallet Form
const initialWalletState = {
  elementName: "",
  packageType: "",
  packageName: "",
  billingCycle: "", 
  basePrice: "", // Used for UI calculation
  gst: 18,       // Used for UI calculation
  price: 0,      // Final Calculated Price to send to API
  description: "",
};

// Initial State for Send Activation Form
const initialSendState = {
    state: "",
    distributorId: "",
    elementType: "AIS-140", 
    elementName: "",
    count: 1
};

function ActivationPage() {
  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  // --- Main Data State ---
  const [loading, setLoading] = useState(false);
  const [activations, setActivations] = useState([]);
  const [elements, setElements] = useState([]);
  
  // --- Dynamic Options State ---
  const [packageTypeList, setPackageTypeList] = useState(INITIAL_PACKAGE_TYPES);
  const [billingCycleList, setBillingCycleList] = useState(INITIAL_BILLING_CYCLES);

  // --- UI State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false); 
  const [walletData, setWalletData] = useState(initialWalletState);
  const [submissionLoading, setSubmissionLoading] = useState(false);

  // --- Send Activation State ---
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendData, setSendData] = useState(initialSendState);
  const [distributors, setDistributors] = useState([]);
  const [isLoadingDistributors, setIsLoadingDistributors] = useState(false);

  // --- Mini Modal State (For Manual Adds) ---
  const [miniModal, setMiniModal] = useState({
    isOpen: false,
    targetField: "", 
    title: "",
    value: ""
  });

  // --- Fetch Initial Data ---
  const fetchActivations = async () => {
    if (!tkn) return toast.error("Token not found. Please log in.");
    setLoading(true);
    try {
      const res = await axios.get(FETCH_ACTIVATIONS_API, { 
        headers: { Authorization: `Bearer ${tkn}` } 
      });
      
      // ✅ Updated to match your specific API response structure: res.data.data
      const data = res.data.data || [];
      
      const sanitized = Array.isArray(data) ? data.map((sub) => ({
        ...sub,
        price: parseFloat(sub.price) || 0,
        elementName: sub.elementName || "",
      })) : [];

      setActivations(sanitized);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to fetch activation plans.");
    } finally {
      setLoading(false);
    }
  };

  const fetchElements = async () => {
    if (!tkn) return;
    try {
      const response = await axios.post(FETCH_ELEMENTS_API, {}, {
          headers: { Authorization: `Bearer ${tkn}`, "Content-Type": "application/json" },
        }
      );
      setElements(response.data?.elements || []);
    } catch (error) {
      console.error("Error fetching WLP elements:", error);
    }
  };

  useEffect(() => {
    if (tkn) {
      fetchActivations();
      fetchElements();
    }
  }, [tkn]);

  // --- Effect: Auto Calculate GST ---
  useEffect(() => {
    if (isWalletModalOpen) {
        const base = parseFloat(walletData.basePrice) || 0;
        const taxRate = parseFloat(walletData.gst) || 0;
        
        const taxAmount = (base * taxRate) / 100;
        const total = base + taxAmount;
        
        if (total !== walletData.price) {
            setWalletData(prev => ({ ...prev, price: parseFloat(total.toFixed(2)) }));
        }
    }
  }, [walletData.basePrice, walletData.gst, isWalletModalOpen]);

  // --- Effect: Fetch Distributors ---
  useEffect(() => {
    const fetchDistributors = async () => {
        if (!sendData.state) {
            setDistributors([]);
            return;
        }

        setIsLoadingDistributors(true);
        try {
            const response = await axios.post(FETCH_DISTRIBUTORS_API, 
                { state: sendData.state },
                { headers: { Authorization: `Bearer ${tkn}` } }
            );
            const data = response.data;
            if (data && (Array.isArray(data.distributors) || Array.isArray(data.result) || Array.isArray(data))) {
                setDistributors(data.distributors || data.result || data);
            } else {
                setDistributors([]);
            }
        } catch (error) {
            console.error("Error fetching distributors:", error);
            setDistributors([]);
        } finally {
            setIsLoadingDistributors(false);
        }
    };

    if (isSendModalOpen && sendData.state) {
        fetchDistributors();
    }
  }, [sendData.state, isSendModalOpen, tkn]);


  // --- Form Handlers ---
  const handleWalletChange = (e) => {
    const { name, value, type, checked } = e.target;
    setWalletData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSendChange = (e) => {
      const { name, value } = e.target;
      setSendData(prev => ({...prev, [name]: value}));
      if (name === "state") {
          setSendData(prev => ({...prev, state: value, distributorId: ""}));
      }
  };

  // --- Mini Modal Handlers ---
  const openMiniModal = (field) => {
    const title = field === "packageType" ? "Add New Package Type" : "Add New Billing Cycle";
    setMiniModal({ isOpen: true, targetField: field, title: title, value: "" });
  };

  const closeMiniModal = () => {
    setMiniModal({ isOpen: false, targetField: "", title: "", value: "" });
  };

  const saveMiniModal = (e) => {
    e.preventDefault();
    const newValue = miniModal.value.trim();
    if (!newValue) return toast.error("Please enter a value");

    if (miniModal.targetField === "packageType") {
      if (!packageTypeList.includes(newValue)) {
        setPackageTypeList([...packageTypeList, newValue]);
      }
      setWalletData(prev => ({ ...prev, packageType: newValue }));
    } 
    else if (miniModal.targetField === "billingCycle") {
      if (!billingCycleList.includes(newValue)) {
        setBillingCycleList([...billingCycleList, newValue]);
      }
      setWalletData(prev => ({ ...prev, billingCycle: newValue }));
    }

    toast.success("Added and selected!");
    closeMiniModal();
  };

  // --- Submit: Create Activation Wallet ---
  const handleCreateWalletSubmit = async (e) => {
    e.preventDefault();
    if (!tkn) return toast.error("Missing token.");

    // Validation
    if(!walletData.elementName || !walletData.packageName || !walletData.packageType || !walletData.billingCycle) {
      return toast.error("Please fill all required fields marked with *");
    }

    setSubmissionLoading(true);
    const toastId = toast.loading("Creating Activation Wallet...");

    try {
      const payload = {
        elementName: walletData.elementName,
        packageName: walletData.packageName,
        packageType: walletData.packageType,
        billingCycle: walletData.billingCycle,
        price: parseFloat(walletData.price),
        description: walletData.description
      };

      const res = await axios.post(CREATE_WALLET_API, payload, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tkn}` },
      });

      if (res.status === 200 || res.status === 201) {
        toast.success("Activation Wallet Created Successfully!", { id: toastId });
        await fetchActivations();
        closeModal();
      } else {
        toast.error(res.data?.message || "Unexpected response.", { id: toastId });
      }
    } catch (err) {
      const backendError = err.response?.data?.message || err.message;
      toast.error(backendError, { id: toastId });
    } finally {
      setSubmissionLoading(false);
    }
  };

  // --- Submit: Send Activation ---
  const handleSendActivationSubmit = async (e) => {
    e.preventDefault();
    if(!sendData.distributorId || !sendData.elementName) {
        return toast.error("Please fill all required fields.");
    }

    setSubmissionLoading(true);
    const toastId = toast.loading("Sending Activation...");

    try {
        const payload = { ...sendData };
        const res = await axios.post(SEND_ACTIVATION_API, payload, {
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${tkn}` },
        });

        if (res.status === 200 || res.status === 201) {
            toast.success("Activation Sent Successfully!", { id: toastId });
            setIsSendModalOpen(false);
            setSendData(initialSendState);
        } else {
            toast.error(res.data?.message || "Failed to send.", { id: toastId });
        }
    } catch (err) {
        const backendError = err.response?.data?.message || err.message;
        toast.error(backendError, { id: toastId });
    } finally {
        setSubmissionLoading(false);
    }
  };

  const filteredActivations = activations.filter(
    (s) =>
      s.packageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.elementName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.packageType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const closeModal = () => {
    setIsWalletModalOpen(false);
    setWalletData(initialWalletState);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans w-full pt-16 mt-36">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
        }}
      />
      
      <WlpNavbar />

      {/* --- TOP HEADER NAVIGATION --- */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm w-full">
        <div className="text-gray-600 font-medium text-sm w-full md:w-auto">
          <span className="text-gray-400"> WLP Management »</span> 
          <span className="text-gray-800 font-bold"> Activation Wallet</span>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Send Activation Button */}
          <button 
             onClick={() => setIsSendModalOpen(true)}
             className="px-4 py-2 bg-orange-500 text-white font-semibold text-sm rounded hover:bg-orange-600 transition shadow-sm flex items-center gap-2"
          >
             <Upload size={16} /> Send Activation
          </button>

          {/* Create Wallet Button */}
          <button 
            onClick={() => {
              setIsWalletModalOpen(true);
              setWalletData(initialWalletState);
            }}
            className="px-4 py-2 bg-teal-800 text-white font-semibold text-sm rounded hover:bg-teal-900 transition shadow-sm flex items-center gap-2"
          >
            <Plus size={16} /> Create Activation Wallet
          </button>
          
          <button className="px-4 py-2 bg-red-500 text-white font-semibold text-sm rounded hover:bg-red-600 transition shadow-sm flex items-center gap-1">
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="w-full px-4 py-6">
        
        {/* Main Tabs */}
        <div className="flex items-end gap-1 border-b border-gray-300 mb-6">
          <button className="px-4 py-2 text-sm font-semibold text-teal-700 bg-white rounded-t-lg border border-gray-300 border-b-white -mb-px z-10 flex items-center gap-2">
            <Package size={16} /> Activation Wallets
          </button>
        </div>

        {/* Search Bar */}
        <div className="w-full mb-4 flex">
            <input 
                type="text" 
                placeholder="Search by Package, Element..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:border-teal-500 text-gray-700"
            />
            <button className="bg-gray-100 border border-l-0 border-gray-300 px-6 py-2 text-sm text-gray-600 hover:bg-gray-200 font-medium">
                Search
            </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-200 shadow-sm bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#4a89dc] text-white text-xs uppercase tracking-wide">
                <th className="p-3 font-semibold">Element Name</th>
                <th className="p-3 font-semibold">Package Name</th>
                <th className="p-3 font-semibold">Type</th>
                <th className="p-3 font-semibold text-right">Price</th>
                <th className="p-3 font-semibold">Cycle</th>
                <th className="p-3 font-semibold">Description</th>
                <th className="p-3 font-semibold text-center">Active Status</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {loading ? (
                 <tr><td colSpan="7" className="p-10 text-center text-gray-500">Loading wallets...</td></tr>
              ) : filteredActivations.length === 0 ? (
                 <tr><td colSpan="7" className="p-10 text-center text-gray-500">No activation wallets found.</td></tr>
              ) : (
                filteredActivations.map((s, idx) => (
                  <tr key={s._id || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-medium text-gray-800 flex items-center gap-2">
                        <Layers size={14} className="text-gray-400" />
                        {s.elementName || <span className="text-gray-400 italic">N/A</span>}
                    </td>
                    <td className="p-3 text-teal-700 font-semibold">{s.packageName}</td>
                    <td className="p-3">
                        <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs text-gray-600 font-medium">
                            {s.packageType}
                        </span>
                    </td>
                    <td className="p-3 text-right font-bold text-gray-800">₹{(s.price || 0).toFixed(2)}</td>
                    <td className="p-3 text-gray-600">{s.billingCycle}</td>
                    <td className="p-3 text-gray-500 truncate max-w-xs">{s.description || "-"}</td>
                    <td className="p-3 text-center">
                        {s.activationStatus ? (
                            <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-xs bg-green-50 px-2 py-1 rounded">
                                <CheckCircle size={12}/> Active
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-gray-500 font-semibold text-xs bg-gray-100 px-2 py-1 rounded">
                                <AlertCircle size={12}/> Inactive
                            </span>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* --- MODAL 1: Create Activation Wallet --- */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4 animate-in fade-in duration-200 mt-36">
            <div className="bg-white w-full max-w-2xl rounded shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 rounded-t">
                    <h2 className="text-lg font-bold text-gray-800">
                        Create Activation Wallet
                    </h2>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-800 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                    <form id="walletForm" onSubmit={handleCreateWalletSubmit}>
                        
                        {/* Row 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Element Name <span className="text-red-500">*</span></label>
                                <select 
                                    name="elementName"
                                    value={walletData.elementName}
                                    onChange={handleWalletChange}
                                    required
                                    className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                                >
                                    <option value="">Select Element</option>
                                    {elements.map((el, i) => (
                                        <option key={i} value={el.elementName || el.name}>{el.elementName || el.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Package Name <span className="text-red-500">*</span></label>
                                <input 
                                    type="text"
                                    name="packageName"
                                    value={walletData.packageName}
                                    onChange={handleWalletChange}
                                    required
                                    placeholder="e.g. Gold Plan"
                                    className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                        </div>

                        {/* Row 2: Selects with PLUS Button */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            
                            {/* Package Type Group */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Package Type <span className="text-red-500">*</span></label>
                                <div className="flex gap-2">
                                  <select
                                      name="packageType"
                                      value={walletData.packageType}
                                      onChange={handleWalletChange}
                                      required
                                      className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                                  >
                                    <option value="">Select Type</option>
                                    {packageTypeList.map((t, idx) => (
                                      <option key={idx} value={t}>{t}</option>
                                    ))}
                                  </select>
                                  <button 
                                    type="button" 
                                    onClick={() => openMiniModal("packageType")}
                                    className="px-3 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition"
                                    title="Add new Type manually"
                                  >
                                    <Plus size={18} />
                                  </button>
                                </div>
                            </div>

                            {/* Billing Cycle Group */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Billing Cycle <span className="text-red-500">*</span></label>
                                <div className="flex gap-2">
                                  <select
                                      name="billingCycle"
                                      value={walletData.billingCycle}
                                      onChange={handleWalletChange}
                                      required
                                      className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                                  >
                                    <option value="">Select Cycle</option>
                                    {billingCycleList.map((d, idx) => (
                                      <option key={idx} value={d}>{d}</option>
                                    ))}
                                  </select>
                                  <button 
                                    type="button" 
                                    onClick={() => openMiniModal("billingCycle")}
                                    className="px-3 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition"
                                    title="Add new Cycle manually"
                                  >
                                    <Plus size={18} />
                                  </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Row 3: Price & GST Calculation */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end bg-gray-50 p-3 rounded border border-gray-200">
                             
                             {/* Base Price */}
                             <div>
                                <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Base Amount</label>
                                <input 
                                    type="number"
                                    name="basePrice"
                                    value={walletData.basePrice}
                                    onChange={handleWalletChange}
                                    placeholder="0"
                                    min="0"
                                    className="w-full border border-gray-300 rounded p-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                                />
                            </div>

                            {/* GST Selection */}
                            <div>
                                <label className="block text-xs uppercase font-bold text-gray-500 mb-1">GST %</label>
                                <select 
                                    name="gst"
                                    value={walletData.gst}
                                    onChange={handleWalletChange}
                                    className="w-full border border-gray-300 rounded p-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                                >
                                    {GST_RATES.map(rate => (
                                        <option key={rate} value={rate}>{rate}% GST</option>
                                    ))}
                                </select>
                            </div>

                            {/* Final Price (Read Only) */}
                            <div>
                                <label className="block text-xs uppercase font-bold text-teal-700 mb-1 flex items-center gap-1">
                                    <Calculator size={12}/> Total Price
                                </label>
                                <input 
                                    type="number"
                                    name="price"
                                    value={walletData.price}
                                    readOnly
                                    className="w-full bg-white border border-teal-500 rounded p-2 text-sm text-teal-800 font-bold focus:outline-none shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                            <textarea 
                                name="description"
                                value={walletData.description}
                                onChange={handleWalletChange}
                                rows="3"
                                className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 resize-none"
                                placeholder="Optional details..."
                            ></textarea>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b">
                    <button 
                        onClick={closeModal}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition"
                        type="button"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        form="walletForm"
                        disabled={submissionLoading}
                        className={`bg-[#1f5f5b] hover:bg-[#164a47] text-white font-bold py-2 px-6 rounded text-sm transition-colors shadow-sm ${submissionLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                        {submissionLoading ? "Saving..." : "Create Wallet"}
                    </button>
                </div>

            </div>
        </div>
      )}

      {/* --- MODAL 2: Send Activation --- */}
      {isSendModalOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-2xl rounded shadow-2xl animate-in zoom-in-95 duration-200">
                  
                  {/* Header */}
                  <div className="flex justify-between items-center p-4 border-b border-gray-200">
                      <h2 className="text-lg font-bold text-gray-800">Send Activation</h2>
                      <button
                          onClick={() => {
                              setIsSendModalOpen(false);
                              setSendData(initialSendState);
                          }}
                          className="text-gray-400 hover:text-gray-800 transition-colors"
                      >
                          <X size={20} />
                      </button>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-4">
                      <form id="sendActivationForm" onSubmit={handleSendActivationSubmit}>
                          
                          {/* State Input */}
                          <div className="mb-4">
                              <label className="block text-sm font-semibold text-gray-700 mb-1">State</label>
                              <div className="relative">
                                  <select
                                      name="state"
                                      value={sendData.state}
                                      onChange={handleSendChange}
                                      className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 appearance-none"
                                  >
                                      <option value="">Choose State</option>
                                      {INDIAN_STATES.map((state) => (
                                          <option key={state} value={state}>{state}</option>
                                      ))}
                                  </select>
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                              </div>
                          </div>

                          {/* Distributor Input */}
                          <div className="mb-4">
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Distributor</label>
                              <div className="relative">
                                  <select
                                      name="distributorId"
                                      value={sendData.distributorId}
                                      onChange={handleSendChange}
                                      disabled={!sendData.state || isLoadingDistributors}
                                      className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                  >
                                      <option value="">
                                          {isLoadingDistributors ? "Fetching..." : !sendData.state ? "Select State First" : "Choose Distributor"}
                                      </option>
                                      {!isLoadingDistributors && distributors.map((dist, index) => (
                                          <option key={dist._id || index} value={dist._id}>
                                              {dist.business_Name || dist.name || "Unknown Distributor"}
                                          </option>
                                      ))}
                                  </select>
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                      {isLoadingDistributors ? <Loader2 size={16} className="animate-spin text-teal-600" /> : <span className="text-xs">▼</span>}
                                  </div>
                              </div>
                          </div>

                          {/* Element Type */}
                          <div className="mb-4">
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Element Type</label>
                              <select 
                                name="elementType"
                                value={sendData.elementType}
                                onChange={handleSendChange}
                                className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                              >
                                  <option value="AIS-140">AIS-140</option>
                                  <option value="Non-AIS">Non-AIS</option>
                              </select>
                          </div>

                          {/* Element Name */}
                          <div className="mb-4">
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Element</label>
                              <select 
                                name="elementName"
                                value={sendData.elementName}
                                onChange={handleSendChange}
                                required
                                className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                              >
                                  <option value="">Select Element</option>
                                  {elements.map((el, i) => (
                                      <option key={i} value={el.elementName || el.name}>{el.elementName || el.name}</option>
                                  ))}
                              </select>
                          </div>

                          {/* No of Activations */}
                          <div className="mb-4">
                              <label className="block text-sm font-semibold text-gray-700 mb-1">No of Activations</label>
                              <input
                                  type="number"
                                  name="count"
                                  value={sendData.count}
                                  onChange={handleSendChange}
                                  min="1"
                                  className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                              />
                          </div>
                      </form>
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-gray-200 flex justify-end">
                      <button 
                        type="submit"
                        form="sendActivationForm"
                        disabled={submissionLoading}
                        className={`bg-[#1f5f5b] hover:bg-[#164a47] text-white font-bold py-2 px-6 rounded text-sm transition-colors shadow-sm ${submissionLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                      >
                          {submissionLoading ? "Sending..." : "Submit"}
                      </button>
                  </div>

              </div>
          </div>
      )}

      {/* --- MINI MODAL (Add Manual Item) --- */}
      {miniModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">{miniModal.title}</h3>
              <button onClick={closeMiniModal} className="text-gray-400 hover:text-red-500">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={saveMiniModal}>
              <div className="mb-4">
                <label className="block text-xs uppercase text-gray-500 font-semibold mb-2">
                  New Value
                </label>
                <input 
                  autoFocus
                  type="text"
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Type here..."
                  value={miniModal.value}
                  onChange={(e) => setMiniModal({...miniModal, value: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={closeMiniModal}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded hover:bg-teal-700 flex items-center gap-2"
                >
                  <Save size={14} /> Add & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default ActivationPage;