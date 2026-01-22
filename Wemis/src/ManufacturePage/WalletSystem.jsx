
import React, { useState, useEffect } from "react";
import { Search, Plus, Pencil, X, CheckCircle, Wallet, MapPin, Building2, User, Loader2 } from "lucide-react";
import ManufactureNavbar from "./ManufactureNavbar";

// --- CONSTANTS ---
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", 
  "Lakshadweep", "Puducherry"
];

const PACKAGES = [
  { id: 1, name: "1 Month", price: 272, days: 30 },
  { id: 2, name: "6 Month", price: 980, days: 180 },
  { id: 3, name: "1 Year", price: 1572, days: 365 },
  { id: 4, name: "AIS 140 VTS Annual", price: 2832, days: 365 },
  { id: 5, name: "AIS 140 Odisha State 24 Months", price: 4874, days: 730 },
  { id: 6, name: "AIS140", price: 590, days: 730 },
];

const WalletManagement = () => {
  // UI State
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistributor, setSelectedDistributor] = useState("");
  
  // Data State
  const [distributors, setDistributors] = useState([]);
  const [isLoadingDistributors, setIsLoadingDistributors] = useState(false);

  // Format currency helper
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);

  // --- API INTEGRATION ---
  useEffect(() => {
    const fetchDistributors = async () => {
      // Only fetch if a state is actually selected
      if (!selectedState) {
        setDistributors([]);
        return;
      }

      setIsLoadingDistributors(true);
      try {
        // Retrieve token from Local Storage
        const token = localStorage.getItem("token");

        if (!token) {
            alert("Authentication token not found. Please log in.");
            setIsLoadingDistributors(false);
            return;
        }

        const response = await fetch("https://api.websave.in/api/manufactur/fetchDistributorOnBasisOfState", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // Using the dynamic token
          },
          body: JSON.stringify({ state: selectedState })
        });

        const data = await response.json();
        console.log(data)

        // Adjust 'data.distributors' based on your actual API response structure
        if (data && (Array.isArray(data) || Array.isArray(data.result) || Array.isArray(data.distributors))) {
           setDistributors(data.distributors || data.result || data); 
        } else {
           console.warn("Unexpected API response structure", data);
           setDistributors([]);
        }

      } catch (error) {
        console.error("Error fetching distributors:", error);
        setDistributors([]);
      } finally {
        setIsLoadingDistributors(false);
      }
    };

    fetchDistributors();
  }, [selectedState]);

  // Reset form when modal closes
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedState("");
    setSelectedDistributor("");
    setSelectedPackage(null);
    setDistributors([]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans">
      <ManufactureNavbar />
      
      {/* Main Content */}
      <main className="flex-grow w-full p-4 md:p-6 lg:p-8">
        <div className="w-full space-y-6">

          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Wallet Management</h1>
              <p className="text-gray-500 mt-1">Configure and manage wallet packages for dealers.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
               {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search wallets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
                />
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md active:scale-95 whitespace-nowrap"
              >
                <Plus size={20} strokeWidth={2.5} /> Create Wallet
              </button>
            </div>
          </div>

          {/* TABLE SECTION */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                    <th className="px-6 py-5 font-bold w-1/3">Wallet Name</th>
                    <th className="px-6 py-5 font-bold">Type</th>
                    <th className="px-6 py-5 font-bold">Balance</th>
                    <th className="px-6 py-5 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="group hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100 group-hover:bg-white group-hover:border-indigo-200 transition-colors">
                          <Wallet size={22} />
                        </div>
                        <div>
                          <span className="block font-bold text-gray-900 text-lg">ELITE WALLET</span>
                          <span className="text-xs text-gray-500">ID: WAL-2024-001</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-gray-600">
                      <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 uppercase tracking-wide">
                        Tracker
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-emerald-600 font-black text-xl tracking-tight">₹2,000</span>
                        <span className="text-gray-400 text-sm">.00</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-xl transition-all">
                        <Pencil size={18} />
                      </button>
                    </td>
                  </tr>
                  
                  {/* Additional Dummy Row */}
                   <tr className="group hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100 group-hover:bg-white group-hover:border-indigo-200 transition-colors">
                          <Wallet size={22} />
                        </div>
                        <div>
                          <span className="block font-bold text-gray-900 text-lg">STANDARD WALLET</span>
                          <span className="text-xs text-gray-500">ID: WAL-2024-002</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-gray-600">
                      <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 uppercase tracking-wide">
                        Tracker
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-emerald-600 font-black text-xl tracking-tight">₹5,400</span>
                        <span className="text-gray-400 text-sm">.00</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-xl transition-all">
                        <Pencil size={18} />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ================= CREATE MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl relative flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create New Wallet</h2>
                <p className="text-gray-500 text-sm mt-1">Assign dealer details and select a subscription plan.</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-900 p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 flex-1">

              {/* SECTION 1: Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* State Dropdown */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
                    <MapPin size={14} /> State
                  </label>
                  <div className="relative group">
                    <select 
                      className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-sm group-hover:border-gray-300"
                      value={selectedState}
                      onChange={(e) => {
                        setSelectedState(e.target.value);
                        setSelectedDistributor(""); // Reset distributor when state changes
                      }}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                  </div>
                </div>

                {/* Organization / Distributor Dropdown (Dynamic) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
                    <Building2 size={14} /> Organization
                  </label>
                  <div className="relative group">
                    <select 
                      className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-sm group-hover:border-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      value={selectedDistributor}
                      onChange={(e) => setSelectedDistributor(e.target.value)}
                      disabled={!selectedState || isLoadingDistributors}
                    >
                      <option value="">
                        {isLoadingDistributors ? "Fetching Distributors..." : !selectedState ? "Select State First" : "Select Organization"}
                      </option>
                      
                      {!isLoadingDistributors && distributors.map((dist, index) => (
                        <option key={dist._id || index} value={dist._id || dist.name}>
                          {dist.business_Name || dist.name || "Unknown Org"}
                        </option>
                      ))}
                    </select>
                    
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      {isLoadingDistributors ? <Loader2 size={18} className="animate-spin" /> : "▼"}
                    </div>
                  </div>
                </div>

                {/* Dealer Select */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
                    <User size={14} /> Dealer Name
                  </label>
                  <div className="relative group">
                    <select className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-sm group-hover:border-gray-300">
                      <option>Select Dealer</option>
                      <option>John Doe</option>
                      <option>Jane Smith</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Packages */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="text-lg font-bold text-gray-800">Select Subscription Package</h3>
                  <div className="h-px flex-grow bg-gray-200"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PACKAGES.map((pkg) => {
                    const isSelected = selectedPackage === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg.id)}
                        className={`
                          relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 group flex flex-col justify-between h-full
                          ${isSelected 
                            ? "bg-indigo-50 border-indigo-500 shadow-md ring-1 ring-indigo-500 scale-[1.02]" 
                            : "bg-white border-gray-100 hover:border-indigo-200 hover:shadow-lg"
                          }
                        `}
                      >
                        {isSelected && (
                          <div className="absolute -top-3 -right-3 bg-indigo-600 text-white rounded-full p-1 shadow-md animate-in zoom-in duration-200">
                            <CheckCircle size={18} fill="currentColor" strokeWidth={0} /> 
                          </div>
                        )}

                        <div>
                          <h4 className={`font-bold text-lg mb-1 ${isSelected ? "text-indigo-900" : "text-gray-800"}`}>
                            {pkg.name}
                          </h4>
                          <p className="text-xs text-gray-500 font-medium">Auto-renewal available</p>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-baseline gap-1">
                            <span className={`text-3xl font-black ${isSelected ? "text-indigo-700" : "text-gray-900"}`}>
                              {formatCurrency(pkg.price)}
                            </span>
                            <span className="text-xs text-gray-500 font-semibold">+ 18% GST</span>
                          </div>

                          <div className="mt-4 pt-4 border-t border-dashed border-gray-200 space-y-2">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <CheckCircle size={12} className="text-emerald-500" /> SIM & Support Included
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <CheckCircle size={12} className="text-blue-500" /> Valid for <span className="text-gray-900 font-bold">{pkg.days} Days</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400 font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!selectedPackage) return alert("Please select a package.");
                  if (!selectedState) return alert("Please select a state.");
                  if (!selectedDistributor) return alert("Please select an organization.");
                  alert("Wallet Created Successfully!");
                  handleCloseModal();
                }}
                className="px-8 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold shadow-lg shadow-gray-900/10 transition-all active:scale-95"
              >
                Create Wallet
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default WalletManagement;

