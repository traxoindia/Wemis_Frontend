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
const FETCH_ACTIVATIONS_API =
  "https://api.websave.in/api/manufactur/fetchAllActivationPlans"; // GET
const CREATE_WALLET_API =
  "https://api.websave.in/api/manufactur/addActivationLogic"; // POST
const FETCH_ELEMENTS_API = "https://api.websave.in/api/wlp/findElements"; // POST

// --- NEW / UPDATED ENDPOINTS ---
const FETCH_MANUFACTURERS_API =
  "https://api.websave.in/api/manufactur/fetchManufacturerOnBasisOsState";
const SEND_WALLET_TO_MANUFACTURER_API =
  "https://api.websave.in/api/manufactur/ActivationWalletToManufactur";
const FETCH_ASSIGNABLE_WALLETS_API =
  "https://api.websave.in/api/manufactur/fetchAssignActivationWallet";

// --- Constants ---
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const INITIAL_BILLING_CYCLES = [
  "3 days",
  "7 days",
  "30 days",
  "60 days",
  "90 days",
  "120 days",
  "150 days",
  "180 days",
  "210 days",
  "240 days",
  "270 days",
  "300 days",
  "330 days",
  "365 DAYS",
];
const INITIAL_PACKAGE_TYPES = ["TRACKER", "OFFERED"];
const GST_RATES = [0, 5, 12, 18, 28]; // GST Slabs

// Initial State for Create Wallet Form
const initialWalletState = {
  elementName: "",
  packageType: "",
  packageName: "",
  billingCycle: "",
  basePrice: "",
  gst: 18,
  price: 0,
  description: "",
};

// Initial State for Send to Manufacturer Form
const initialSendState = {
  state: "",
  manufacturerId: "",
  manufacturerName: "", // 👈 ADD THIS
  elementType: "AIS-140",
  element: "",
  noOfActivationWallets: 1,
  activationWallet: "",
};

function ActivationPage() {
  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  // --- Main Data State ---
  const [loading, setLoading] = useState(false);
  const [activations, setActivations] = useState([]); // Table Data
  const [elements, setElements] = useState([]);

  // --- Dynamic Options State ---
  const [packageTypeList, setPackageTypeList] = useState(INITIAL_PACKAGE_TYPES);
  const [billingCycleList, setBillingCycleList] = useState(
    INITIAL_BILLING_CYCLES,
  );

  // --- UI State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletData, setWalletData] = useState(initialWalletState);
  const [submissionLoading, setSubmissionLoading] = useState(false);

  // --- Send Activation State ---
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendData, setSendData] = useState(initialSendState);

  const [manufacturers, setManufacturers] = useState([]);
  const [assignableWallets, setAssignableWallets] = useState([]);
  const [isLoadingManufacturers, setIsLoadingManufacturers] = useState(false);

  // --- Mini Modal State ---
  const [miniModal, setMiniModal] = useState({
    isOpen: false,
    targetField: "",
    title: "",
    value: "",
  });

  // --- Fetch Initial Data (Native Fetch) ---
  const fetchActivations = async () => {
    if (!tkn) return toast.error("Token not found. Please log in.");
    setLoading(true);
    try {
      const response = await fetch(FETCH_ACTIVATIONS_API, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tkn}`,
          "Content-Type": "application/json",
        },
      });

      const resData = await response.json();
      const data = resData.data || [];

      const sanitized = Array.isArray(data)
        ? data.map((sub) => ({
            ...sub,
            price: parseFloat(sub.price) || 0,
            elementName: sub.elementName || "",
          }))
        : [];

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
      const response = await fetch(FETCH_ELEMENTS_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tkn}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}), // Empty body for POST
      });
      const resData = await response.json();
      setElements(resData.elements || []);
    } catch (error) {
      console.error("Error fetching WLP elements:", error);
    }
  };

  const fetchAssignableWallets = async () => {
    if (!tkn) return;
    try {
      const response = await fetch(FETCH_ASSIGNABLE_WALLETS_API, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tkn}`,
          "Content-Type": "application/json",
        },
      });
      const resData = await response.json();
      console.log("Send data", resData);
      const data = resData.data || resData.result || resData || [];

      setAssignableWallets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching assignable wallets:", error);
    }
  };

  useEffect(() => {
    if (tkn) {
      fetchActivations();
      fetchElements();
    }
  }, [tkn]);

  useEffect(() => {
    if (isSendModalOpen && tkn) {
      fetchAssignableWallets();
    }
  }, [isSendModalOpen, tkn]);

  // --- Effect: Auto Calculate GST ---
  useEffect(() => {
    if (isWalletModalOpen) {
      const base = parseFloat(walletData.basePrice) || 0;
      const taxRate = parseFloat(walletData.gst) || 0;

      const taxAmount = (base * taxRate) / 100;
      const total = base + taxAmount;

      if (total !== walletData.price) {
        setWalletData((prev) => ({
          ...prev,
          price: parseFloat(total.toFixed(2)),
        }));
      }
    }
  }, [walletData.basePrice, walletData.gst, isWalletModalOpen]);

  // --- Effect: Fetch Manufacturers ---
  useEffect(() => {
    const fetchManufacturers = async () => {
      if (!sendData.state) {
        setManufacturers([]);
        return;
      }

      setIsLoadingManufacturers(true);
      try {
        const response = await fetch(FETCH_MANUFACTURERS_API, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ state: sendData.state }),
        });

        const resData = await response.json();

        if (resData && Array.isArray(resData.data)) {
          setManufacturers(resData.data);
        } else if (resData && Array.isArray(resData.Manufactur)) {
          setManufacturers(resData.Manufactur);
        } else if (resData && Array.isArray(resData.manufacturers)) {
          setManufacturers(resData.manufacturers);
        } else if (Array.isArray(resData)) {
          setManufacturers(resData);
        } else {
          setManufacturers([]);
        }
      } catch (error) {
        console.error("Error fetching manufacturers:", error);
        setManufacturers([]);
        toast.error("Could not fetch manufacturers");
      } finally {
        setIsLoadingManufacturers(false);
      }
    };

    if (isSendModalOpen && sendData.state) {
      fetchManufacturers();
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
    setSendData((prev) => ({ ...prev, [name]: value }));

    if (name === "state") {
      setSendData((prev) => ({ ...prev, state: value, manufacturer: "" }));
    }
  };

  // --- Mini Modal Handlers ---
  const openMiniModal = (field) => {
    const title =
      field === "packageType"
        ? "Add New Package Type"
        : "Add New Billing Cycle";
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
      setWalletData((prev) => ({ ...prev, packageType: newValue }));
    } else if (miniModal.targetField === "billingCycle") {
      if (!billingCycleList.includes(newValue)) {
        setBillingCycleList([...billingCycleList, newValue]);
      }
      setWalletData((prev) => ({ ...prev, billingCycle: newValue }));
    }

    toast.success("Added and selected!");
    closeMiniModal();
  };

  // --- Submit: Create Activation Wallet ---
  const handleCreateWalletSubmit = async (e) => {
    e.preventDefault();
    if (!tkn) return toast.error("Missing token.");

    if (
      !walletData.elementName ||
      !walletData.packageName ||
      !walletData.packageType ||
      !walletData.billingCycle
    ) {
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
        price: Number(walletData.price) || 0,
        description: walletData.description,
      };

      const response = await fetch(CREATE_WALLET_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tkn}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (response.ok) {
        // Status 200-299
        toast.success("Activation Wallet Created Successfully!", {
          id: toastId,
        });
        await fetchActivations();
        closeModal();
      } else {
        toast.error(resData.message || "Unexpected response.", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create wallet. Network error.", { id: toastId });
    } finally {
      setSubmissionLoading(false);
    }
  };

  // --- Submit: Send Activation To Manufacturer ---
  const handleSendToManufacturerSubmit = async (e) => {
    e.preventDefault();

    if (
      !sendData.state ||
      !sendData.manufacturerName ||
      !sendData.element ||
      !sendData.activationWallet
    ) {
      return toast.error("Please fill all required fields.");
    }

    setSubmissionLoading(true);
    const toastId = toast.loading("Sending to Manufacturer...");

    try {
      const payload = {
        state: sendData.state,
        manufacturer: sendData.manufacturerName, // ✅ BUSINESS NAME SENT
        elementType: sendData.elementType,
        element: sendData.element,
        noOfActivationWallets: Number(sendData.noOfActivationWallets),
        activationWallet: sendData.activationWallet,
      };

      const response = await fetch(SEND_WALLET_TO_MANUFACTURER_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tkn}`,
        },
        body: JSON.stringify(payload),
      });
      console.log(payload);

      const resData = await response.json();

      if (response.ok) {
        // Status 200-299
        toast.success("Wallets Sent Successfully!", { id: toastId });
        setIsSendModalOpen(false);
        setSendData(initialSendState);
      } else {
        toast.error(resData.message || "Failed to send.", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send. Network error.", { id: toastId });
    } finally {
      setSubmissionLoading(false);
    }
  };

  const filteredActivations = activations.filter(
    (s) =>
      s.packageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.elementName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.packageType?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const closeModal = () => {
    setIsWalletModalOpen(false);
    setWalletData(initialWalletState);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans w-full pt-16 mt-40">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: "#363636", color: "#fff" },
        }}
      />

      <WlpNavbar />

      {/* --- TOP HEADER NAVIGATION --- */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm w-full">
        <div className="text-gray-600 font-medium text-sm w-full md:w-auto"></div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Send Activation Button */}
          <button
            onClick={() => setIsSendModalOpen(true)}
            className="px-4 py-2 bg-orange-500 text-white font-semibold text-sm rounded hover:bg-orange-600 transition shadow-sm flex items-center gap-2"
          >
            <Upload size={16} /> Send to Manufacturer
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
        <Activetabs />

        {/* Search Bar */}
        <div className="w-full mb-4 flex"></div>
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
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              <form id="walletForm" onSubmit={handleCreateWalletSubmit}>
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Element Name <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="elementName"
                      value={walletData.elementName}
                      onChange={handleWalletChange}
                      required
                      className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select Element</option>
                      {elements.map((el, i) => (
                        <option key={i} value={el.elementName || el.name}>
                          {el.elementName || el.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Package Name <span className="text-red-500">*</span>
                    </label>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Package Type <span className="text-red-500">*</span>
                    </label>
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
                          <option key={idx} value={t}>
                            {t}
                          </option>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Billing Cycle <span className="text-red-500">*</span>
                    </label>
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
                          <option key={idx} value={d}>
                            {d}
                          </option>
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
                    <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                      Base Amount
                    </label>
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
                    <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                      GST %
                    </label>
                    <select
                      name="gst"
                      value={walletData.gst}
                      onChange={handleWalletChange}
                      className="w-full border border-gray-300 rounded p-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                    >
                      {GST_RATES.map((rate) => (
                        <option key={rate} value={rate}>
                          {rate}% GST
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Final Price (Read Only) */}
                  <div>
                    <label className="block text-xs uppercase font-bold text-teal-700 mb-1 flex items-center gap-1">
                      <Calculator size={12} /> Total Price
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Description
                  </label>
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

      {/* --- MODAL 2: Send Activation To Manufacturer --- */}
      {isSendModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Upload size={18} className="text-orange-500" />
                Send Activation to Manufacturer
              </h2>
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
              <form
                id="sendActivationForm"
                onSubmit={handleSendToManufacturerSubmit}
              >
                {/* Row 1: State & Manufacturer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      State
                    </label>
                    <div className="relative">
                      <select
                        name="state"
                        value={sendData.state}
                        onChange={handleSendChange}
                        className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="">Choose State</option>
                        {INDIAN_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Manufacturer
                    </label>
                    <div className="relative">
                      <select
                        name="manufacturer"
                        value={sendData.manufacturerId}
                        onChange={(e) => {
                          const selectedOption = e.target.selectedOptions[0];
                          setSendData((prev) => ({
                            ...prev,
                            manufacturerId: selectedOption.value,
                            manufacturerName: selectedOption.dataset.name,
                          }));
                        }}
                        disabled={!sendData.state || isLoadingManufacturers}
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                      >
                        <option value="">
                          {isLoadingManufacturers
                            ? "Fetching..."
                            : !sendData.state
                              ? "Select State First"
                              : "Choose Manufacturer"}
                        </option>

                        {manufacturers.map((mf, index) => (
                          <option
                            key={mf._id || index}
                            value={mf._id}
                            data-name={mf.business_Name} // 👈 IMPORTANT
                          >
                            {mf.business_Name}
                          </option>
                        ))}
                      </select>

                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        {isLoadingManufacturers && (
                          <Loader2
                            size={16}
                            className="animate-spin text-teal-600"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Element Type & Element Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Element Type
                    </label>
                    <select
                      name="elementType"
                      value={sendData.elementType}
                      onChange={handleSendChange}
                      className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="AIS-140">AIS-140</option>
                      <option value="Non-AIS">Non-AIS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Element
                    </label>
                    <select
                      name="element"
                      value={sendData.element}
                      onChange={handleSendChange}
                      required
                      className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="">Select Element</option>
                      {elements.map((el, i) => (
                        <option key={i} value={el.elementName || el.name}>
                          {el.elementName || el.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 3: Activation Wallet Plan (New Selectable Box Style) */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <Briefcase size={16} className="text-teal-600" />
                    Select Activation Plan
                  </label>

                  {/* New Grid Container */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-1 bg-gray-50 p-2 rounded border border-gray-100">
                    {activations.length === 0 ? (
                      <div className="col-span-full text-center text-gray-400 py-6 text-sm">
                        No activation plans available.
                      </div>
                    ) : (
                      activations.map((wallet) => {
                        const isSelected =
                          sendData.activationWallet === wallet._id;
                        return (
                          <div
                            key={wallet._id}
                            onClick={() =>
                              setSendData((prev) => ({
                                ...prev,
                                activationWallet: wallet._id,
                              }))
                            }
                            className={`
          relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between
          ${
            isSelected
              ? "border-teal-500 bg-teal-50 shadow-sm"
              : "border-gray-200 bg-white hover:border-teal-300 hover:shadow-sm"
          }
        `}
                          >
                            {/* Selected Indicator */}
                            {isSelected && (
                              <div className="absolute top-2 right-2 text-teal-600">
                                <CheckCircle
                                  size={18}
                                  fill="currentColor"
                                  className="text-white"
                                />
                              </div>
                            )}

                            {/* Header: Name & Price */}
                            <div className="flex justify-between items-start mb-2 pr-6">
                              <div>
                                <h4 className="text-sm font-bold text-gray-800">
                                  {wallet.packageName}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {wallet.elementName}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="block text-sm font-bold text-teal-700">
                                  ₹{wallet.price}
                                </span>
                              </div>
                            </div>

                            {/* Footer: Type & Cycle */}
                            <div className="flex justify-between items-end mt-2 pt-2 border-t border-gray-100 border-dashed">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 uppercase">
                                {wallet.packageType}
                              </span>
                              <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                <AlertCircle size={10} /> {wallet.billingCycle}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Click on a card to select the plan
                  </p>
                </div>

                {/* Row 4: No of Activations */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    No of Activations
                  </label>
                  <input
                    type="number"
                    name="noOfActivationWallets"
                    value={sendData.noOfActivationWallets}
                    onChange={handleSendChange}
                    min="1"
                    required
                    className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsSendModalOpen(false);
                  setSendData(initialSendState);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="sendActivationForm"
                disabled={submissionLoading}
                className={`bg-[#1f5f5b] hover:bg-[#164a47] text-white font-bold py-2 px-6 rounded text-sm transition-colors shadow-sm ${submissionLoading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {submissionLoading ? "Sending..." : "Submit to Manufacturer"}
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
              <button
                onClick={closeMiniModal}
                className="text-gray-400 hover:text-red-500"
              >
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
                  onChange={(e) =>
                    setMiniModal({ ...miniModal, value: e.target.value })
                  }
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
