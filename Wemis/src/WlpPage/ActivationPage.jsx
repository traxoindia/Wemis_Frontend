import React, { useEffect, useState, useContext } from "react";
import {
  Search,
  ArrowLeft,
  X,
  Upload,
  Plus,
  Layers,
  Package,
  CheckCircle,
  AlertCircle,
  Save,
  Loader2,
  Calculator,
  Briefcase,
  Check,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { UserAppContext } from "../contexts/UserAppProvider";
import WlpNavbar from "./WlpNavbar";
import Activetabs from "./Activetabs";

// --- API Endpoints ---
const FETCH_ACTIVATIONS_API = "https://api.websave.in/api/manufactur/fetchAllActivationPlans";
const CREATE_WALLET_API = "https://api.websave.in/api/manufactur/addActivationLogic";
const FETCH_ELEMENTS_API = "https://api.websave.in/api/wlp/findElements";
const FETCH_MANUFACTURERS_API = "https://api.websave.in/api/manufactur/fetchManufacturerOnBasisOsState";
const SEND_WALLET_TO_MANUFACTURER_API = "https://api.websave.in/api/manufactur/ActivationWalletToManufactur";
const FETCH_ASSIGNABLE_WALLETS_API = "https://api.websave.in/api/manufactur/fetchAssignActivationWallet";

// --- Constants ---
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh",
  "Lakshadweep", "Puducherry",
];

const INITIAL_BILLING_CYCLES = [
  "3 days", "7 days", "30 days", "60 days", "90 days", "120 days", "150 days", "180 days",
  "210 days", "240 days", "270 days", "300 days", "330 days", "365 DAYS",
];
const INITIAL_PACKAGE_TYPES = ["TRACKER", "OFFERED"];

// Initial States
const initialWalletState = {
  elementName: "",
  packageType: "",
  packageName: "",
  billingCycle: "",
  description: "",
};

const initialSendState = {
  state: "",
  manufacturerId: "",
  manufacturerName: "",
  elementType: "AIS-140",
  element: "",
  activationWallet: "",
};

function ActivationPage() {
  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  const [loading, setLoading] = useState(false);
  const [activations, setActivations] = useState([]);
  const [elements, setElements] = useState([]);
  const [packageTypeList, setPackageTypeList] = useState(INITIAL_PACKAGE_TYPES);
  const [billingCycleList, setBillingCycleList] = useState(INITIAL_BILLING_CYCLES);

  const [searchTerm, setSearchTerm] = useState("");
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletData, setWalletData] = useState(initialWalletState);
  const [submissionLoading, setSubmissionLoading] = useState(false);

  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendData, setSendData] = useState(initialSendState);
  const [manufacturers, setManufacturers] = useState([]);
  const [isLoadingManufacturers, setIsLoadingManufacturers] = useState(false);

  const [miniModal, setMiniModal] = useState({
    isOpen: false,
    targetField: "",
    title: "",
    value: "",
  });

  const fetchActivations = async () => {
    if (!tkn) return;
    setLoading(true);
    try {
      const response = await fetch(FETCH_ACTIVATIONS_API, {
        method: "GET",
        headers: { Authorization: `Bearer ${tkn}`, "Content-Type": "application/json" },
      });
      const resData = await response.json();
      setActivations(resData.data || []);
    } catch (err) {
      toast.error("Failed to fetch activation plans.");
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
    } catch (error) {
      console.error("Error fetching elements:", error);
    }
  };

  useEffect(() => {
    if (tkn) {
      fetchActivations();
      fetchElements();
    }
  }, [tkn]);

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
      } catch (error) {
        toast.error("Could not fetch manufacturers");
      } finally {
        setIsLoadingManufacturers(false);
      }
    };
    if (isSendModalOpen && sendData.state) fetchManufacturers();
  }, [sendData.state, isSendModalOpen, tkn]);

  const handleWalletChange = (e) => {
    const { name, value } = e.target;
    setWalletData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendChange = (e) => {
    const { name, value } = e.target;
    setSendData((prev) => ({ ...prev, [name]: value }));
  };

  const openMiniModal = (field) => {
    setMiniModal({
      isOpen: true,
      targetField: field,
      title: field === "packageType" ? "Add Package Type" : "Add Billing Cycle",
      value: "",
    });
  };

  const saveMiniModal = (e) => {
    e.preventDefault();
    const val = miniModal.value.trim();
    if (!val) return;
    if (miniModal.targetField === "packageType") {
      setPackageTypeList([...packageTypeList, val]);
      setWalletData((p) => ({ ...p, packageType: val }));
    } else {
      setBillingCycleList([...billingCycleList, val]);
      setWalletData((p) => ({ ...p, billingCycle: val }));
    }
    setMiniModal({ ...miniModal, isOpen: false });
  };

 const handleCreateWalletSubmit = async (e) => {
  e.preventDefault();
  setSubmissionLoading(true);
  const tid = toast.loading("Creating...");

  try {
    const numericBillingCycle = parseInt(walletData.billingCycle);

    const payload = {
      ...walletData,
      billingCycle: numericBillingCycle,
    };

    const response = await fetch(CREATE_WALLET_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tkn}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      toast.success("Created!", { id: tid });
      fetchActivations();
      setIsWalletModalOpen(false);
    } else {
      toast.error("Error creating wallet", { id: tid });
    }
  } catch (err) {
    toast.error("Network error", { id: tid });
  } finally {
    setSubmissionLoading(false);
  }
};


  const handleSendToManufacturerSubmit = async (e) => {
    e.preventDefault();
    setSubmissionLoading(true);
    const tid = toast.loading("Sending...");
    try {
      const payload = {
        state: sendData.state,
        manufacturer: sendData.manufacturerName,
        elementType: sendData.elementType,
        element: sendData.element,
        activationWallet: sendData.activationWallet,
      };
      const response = await fetch(SEND_WALLET_TO_MANUFACTURER_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tkn}` },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        toast.success("Sent Successfully!", { id: tid });
        setIsSendModalOpen(false);
        setSendData(initialSendState);
      } else {
        toast.error("Failed to send", { id: tid });
      }
    } catch (err) {
      toast.error("Network error", { id: tid });
    } finally {
      setSubmissionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans w-full pt-16 mt-40">
      <Toaster position="top-right" />
      <WlpNavbar />

      <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-end gap-2 shadow-sm">
        <button onClick={() => setIsSendModalOpen(true)} className="px-4 py-2 bg-orange-500 text-white text-sm rounded flex items-center gap-2 font-semibold">
          <Upload size={16} /> Send to Manufacturer
        </button>
        <button onClick={() => setIsWalletModalOpen(true)} className="px-4 py-2 bg-teal-800 text-white text-sm rounded flex items-center gap-2 font-semibold">
          <Plus size={16} /> Create Activation Wallet
        </button>
      </header>

      <main className="w-full px-4 py-6">
        <Activetabs />
      </main>

      {/* MODAL: Create Activation Wallet (PRICE REMOVED) */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h2 className="text-lg font-bold">Create Activation Wallet</h2>
              <button onClick={() => setIsWalletModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <form id="walletForm" onSubmit={handleCreateWalletSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Element Name *</label>
                    <select name="elementName" value={walletData.elementName} onChange={handleWalletChange} required className="w-full border rounded p-2 text-sm">
                      <option value="">Select Element</option>
                      {elements.map((el, i) => <option key={i} value={el.elementName}>{el.elementName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Package Name *</label>
                    <input type="text" name="packageName" value={walletData.packageName} onChange={handleWalletChange} required className="w-full border rounded p-2 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Package Type *</label>
                    <div className="flex gap-2">
                      <select name="packageType" value={walletData.packageType} onChange={handleWalletChange} required className="w-full border rounded p-2 text-sm">
                        <option value="">Select Type</option>
                        {packageTypeList.map((t, idx) => <option key={idx} value={t}>{t}</option>)}
                      </select>
                      <button type="button" onClick={() => openMiniModal("packageType")} className="px-2 bg-blue-50 border rounded text-blue-600"><Plus size={18} /></button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Billing Cycle *</label>
                    <div className="flex gap-2">
                      <select name="billingCycle" value={walletData.billingCycle} onChange={handleWalletChange} required className="w-full border rounded p-2 text-sm">
                        <option value="">Select Cycle</option>
                        {billingCycleList.map((d, idx) => <option key={idx} value={d}>{d}</option>)}
                      </select>
                      <button type="button" onClick={() => openMiniModal("billingCycle")} className="px-2 bg-blue-50 border rounded text-blue-600"><Plus size={18} /></button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Description</label>
                  <textarea name="description" value={walletData.description} onChange={handleWalletChange} rows="3" className="w-full border rounded p-2 text-sm resize-none"></textarea>
                </div>
              </form>
            </div>
            <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setIsWalletModalOpen(false)} className="text-sm font-semibold text-gray-600">Cancel</button>
              <button type="submit" form="walletForm" disabled={submissionLoading} className="bg-[#1f5f5b] text-white py-2 px-6 rounded text-sm font-bold">
                {submissionLoading ? "Saving..." : "Create Wallet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Send to Manufacturer (NO OF ACTIVATIONS REMOVED) */}
      {isSendModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold flex items-center gap-2"><Upload size={18} className="text-orange-500" /> Send Activation</h2>
              <button onClick={() => setIsSendModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="p-6">
              <form id="sendForm" onSubmit={handleSendToManufacturerSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">State</label>
                    <select name="state" value={sendData.state} onChange={handleSendChange} className="w-full border rounded p-2 text-sm">
                      <option value="">Choose State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Manufacturer</label>
                    <select name="manufacturer" value={sendData.manufacturerId} onChange={(e) => {
                      const opt = e.target.selectedOptions[0];
                      setSendData(p => ({ ...p, manufacturerId: opt.value, manufacturerName: opt.dataset.name }));
                    }} className="w-full border rounded p-2 text-sm">
                      <option value="">{isLoadingManufacturers ? "Loading..." : "Select Manufacturer"}</option>
                      {manufacturers.map((mf, i) => <option key={i} value={mf._id} data-name={mf.business_Name}>{mf.business_Name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Element Type</label>
                    <select name="elementType" value={sendData.elementType} onChange={handleSendChange} className="w-full border rounded p-2 text-sm">
                      <option value="AIS-140">AIS-140</option>
                      <option value="Non-AIS">Non-AIS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Element</label>
                    <select name="element" value={sendData.element} onChange={handleSendChange} required className="w-full border rounded p-2 text-sm">
                      <option value="">Select Element</option>
                      {elements.map((el, i) => <option key={i} value={el.elementName}>{el.elementName}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-1"><Briefcase size={16} /> Select Plan</label>
                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto bg-gray-50 p-2 rounded">
                    {activations.map((wallet) => (
                      <div key={wallet._id} onClick={() => setSendData(p => ({ ...p, activationWallet: wallet._id }))}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${sendData.activationWallet === wallet._id ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white"}`}>
                        <h4 className="text-sm font-bold">{wallet.packageName}</h4>
                        <p className="text-[10px] text-gray-500 uppercase">{wallet.packageType} | {wallet.billingCycle}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
              <button onClick={() => setIsSendModalOpen(false)} className="text-sm font-semibold text-gray-600">Cancel</button>
              <button type="submit" form="sendForm" disabled={submissionLoading} className="bg-[#1f5f5b] text-white py-2 px-6 rounded text-sm font-bold">
                {submissionLoading ? "Sending..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MINI MODAL */}
      {miniModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-sm p-5">
            <h3 className="font-bold mb-4">{miniModal.title}</h3>
            <form onSubmit={saveMiniModal}>
              <input autoFocus type="text" className="w-full border rounded p-2 text-sm mb-4" value={miniModal.value} onChange={(e) => setMiniModal({ ...miniModal, value: e.target.value })} />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setMiniModal({ ...miniModal, isOpen: false })} className="text-sm text-gray-600">Cancel</button>
                <button type="submit" className="bg-teal-600 text-white px-3 py-1.5 rounded text-sm">Add & Select</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivationPage;