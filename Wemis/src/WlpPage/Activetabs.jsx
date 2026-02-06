import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  Search, ArrowLeft, X, Upload, Plus, Layers,
  Package, CheckCircle, AlertCircle, Save, Loader2, Calculator, Briefcase, Check, Send, RefreshCw
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { UserAppContext } from "../contexts/UserAppProvider";
import WlpNavbar from "./WlpNavbar";

// --- API Endpoints ---
const FETCH_ACTIVATIONS_API = "https://api.websave.in/api/manufactur/fetchAllActivationPlans";
const FETCH_ASSIGNABLE_WALLETS_API = "https://api.websave.in/api/manufactur/fetchAssignActivationWallet";

function Activetabs() {
  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  // --- Main Data State ---
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activations, setActivations] = useState([]); 
  const [assignedWallets, setAssignedWallets] = useState([]);

  // --- UI State ---
  const [currentTab, setCurrentTab] = useState("wallets"); 
  const [searchTerm, setSearchTerm] = useState("");

  // --- 1. Fetch Logic wrapped in useCallback to prevent re-renders ---
  const fetchData = useCallback(async (showToast = false) => {
    if (!tkn) return;
    
    if (showToast) setIsRefreshing(true);
    else setLoading(true);

    try {
      // Run both fetches in parallel for speed
      const [resPlans, resAssigned] = await Promise.all([
        fetch(FETCH_ACTIVATIONS_API, { headers: { "Authorization": `Bearer ${tkn}` } }),
        fetch(FETCH_ASSIGNABLE_WALLETS_API, { headers: { "Authorization": `Bearer ${tkn}` } })
      ]);

      const dataPlans = await resPlans.json();
      const dataAssigned = await resAssigned.json();
      

      setActivations(dataPlans.data || []);
      setAssignedWallets(dataAssigned.fetchAssignActivation || []);

      if (showToast) toast.success("Data updated from server");
    } catch (err) {
      console.error("Refresh error:", err);
      if (showToast) toast.error("Failed to sync with server");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [tkn]);

  // --- 2. Auto-Refresh Effect (Polls every 30 seconds) ---
  useEffect(() => {
    fetchData(); // Initial load

    const interval = setInterval(() => {
      fetchData(false); // Background sync (no toast)
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchData]);

  // --- 3. Refresh when switching tabs ---
  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    fetchData(false); 
  };

  // Filter Logic
  const filteredActivations = activations.filter(s => 
    s.packageName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAssigned = assignedWallets.filter(s => 
    s.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.element?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans w-full pt-16 -mt-52">
      <Toaster position="top-right" />
      <WlpNavbar />

      <header className="bg-white border-b border-gray-200 px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm w-full">
        <div className="text-gray-600 font-medium text-sm">
          <span className="text-gray-400"> WLP Management »</span>
          <span className="text-gray-800 font-bold"> Activation Wallet</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* --- REFRESH BUTTON --- */}
          <button 
            onClick={() => fetchData(true)}
            disabled={isRefreshing || loading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
          >
            <RefreshCw size={16} className={isRefreshing || loading ? "animate-spin text-teal-600" : ""} />
            {isRefreshing ? "Syncing..." : "Refresh Data"}
          </button>
        </div>
      </header>

      <main className="w-full px-4 py-6">
        {/* --- TABS --- */}
        <div className="flex items-end gap-1 border-b border-gray-300 mb-6">
          <button 
            onClick={() => handleTabChange("wallets")}
            className={`px-6 py-2 text-sm font-semibold flex items-center gap-2 rounded-t-lg border transition-all ${currentTab === "wallets" ? "bg-white border-gray-300 border-b-white text-teal-700 z-10 -mb-px" : "bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200"}`}
          >
            <Package size={16} /> Activation Wallets
          </button>
          <button 
            onClick={() => handleTabChange("assigned")}
            className={`px-6 py-2 text-sm font-semibold flex items-center gap-2 rounded-t-lg border transition-all ${currentTab === "assigned" ? "bg-white border-gray-300 border-b-white text-teal-700 z-10 -mb-px" : "bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200"}`}
          >
            <Send size={16} /> Assigned to Manufacturer
          </button>
        </div>

        {/* Search Bar */}
        <div className="w-full mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder={currentTab === "wallets" ? "Search plans..." : "Search manufacturers or elements..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 rounded"
            />
          </div>
          {loading && !isRefreshing && <Loader2 size={18} className="animate-spin text-teal-600" />}
        </div>

        {/* --- TABLES --- */}
        <div className="overflow-x-auto border border-gray-200 shadow-sm bg-white rounded-lg min-h-[300px]">
          {currentTab === "wallets" ? (
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#4a89dc] text-white text-xs uppercase">
                <tr>
                  <th className="p-3">Element Name</th>
                  <th className="p-3">Package Name</th>
                  <th className="p-3">Type</th>

                  <th className="p-3">Cycle</th>
                   <th className="p-3 text-right">Description</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {loading && activations.length === 0 ? (
                  <tr><td colSpan="5" className="p-10 text-center text-gray-400">Loading plans...</td></tr>
                ) : filteredActivations.map((s, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{s.elementName}</td>
                    <td className="p-3 text-teal-700 font-bold">{s.packageName}</td>
                    <td className="p-3">{s.packageType}</td>

                    <td className="p-3">{s.billingCycle}</td>
                       <td className="p-3 text-right font-bold">{s.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-teal-700 text-white text-xs uppercase">
                <tr>
                  <th className="p-3">Manufacturer</th>
                  <th className="p-3">State</th>
                  <th className="p-3">Element</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-center">Quantity</th>
                  <th className="p-3">Assigned Date</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {loading && assignedWallets.length === 0 ? (
                  <tr><td colSpan="6" className="p-10 text-center text-gray-400">Loading history...</td></tr>
                ) : filteredAssigned.length === 0 ? (
                  <tr><td colSpan="6" className="p-10 text-center text-gray-400">No history found.</td></tr>
                ) : (
                  filteredAssigned.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold text-gray-800">{item.manufacturer}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium border border-blue-100">
                          {item.state}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 font-medium">{item.element}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.elementType === 'AIS-140' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                          {item.elementType}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-teal-700">{item.noOfActivationWallets}</td>
                      <td className="p-3 text-gray-500 text-xs">
                        {new Date(item.createdAt).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

export default Activetabs;