import React, { useState, useEffect } from "react";
import { Search, Loader2, Clock, Package, Calendar, Info } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import DistributorNavbar from "./DistributorNavbar";

// --- API Endpoint ---
const FETCH_WALLET_HISTORY_API = "https://api.websave.in/api/manufactur/plansShowOEMandDistributor";

const ActivationDistributor = () => {x
  const tkn = localStorage.getItem("token");

  // --- State Management ---
  const [walletHistory, setWalletHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (tkn) fetchWalletHistory();
  }, [tkn]);

  // --- API Function ---
  const fetchWalletHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(FETCH_WALLET_HISTORY_API, {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${tkn}`, 
          "Content-Type": "application/json" 
        }
      });
      const result = await res.json();
      
      // Based on your specific response structure: { success: true, data: [...] }
      if (result.success) {
        setWalletHistory(result.data || []);
      } else {
        toast.error(result.message || "Failed to load inventory");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Network error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };

  // --- Search Filtering ---
  const filteredData = walletHistory.filter(item => {
    const pkg = item.activationWallet || {};
    return (
      pkg.packageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.elementName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // --- Summary Calculations ---
  const totalQty = walletHistory.reduce((acc, curr) => acc + (curr.noOfActivationWallets || 0), 0);
  // Assuming price is inside activationWallet based on your nested structure
  const totalVal = walletHistory.reduce((acc, curr) => {
    const price = curr.activationWallet?.price || 0;
    return acc + (price * (curr.noOfActivationWallets || 0));
  }, 0);

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans text-slate-900">
      <Toaster position="top-right" />
      <DistributorNavbar />

      <main className="max-w-full mx-auto px-4 pt-14 pb-20">
        {/* --- STATS SUMMARY --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="flex rounded-md overflow-hidden shadow-sm h-16 bg-white border border-slate-200">
            <div className="bg-[#1e9a7e] w-1/3 flex items-center justify-center text-white text-[10px] font-bold uppercase">Available</div>
            <div className="w-2/3 flex items-center px-4 text-[#1e9a7e] text-xl font-bold">{totalQty}</div>
          </div>
          <div className="flex rounded-md overflow-hidden shadow-sm h-16 bg-white border border-slate-200">
            <div className="bg-[#2e86de] w-1/3 flex items-center justify-center text-white text-[10px] font-bold uppercase">Used</div>
            <div className="w-2/3 flex items-center px-4 text-[#2e86de] text-xl font-bold">0</div>
          </div>
          <div className="flex rounded-md overflow-hidden shadow-sm h-16 bg-white border border-slate-200">
            <div className="bg-[#e67e22] w-1/3 flex items-center justify-center text-white text-[10px] font-bold uppercase">Refund</div>
            <div className="w-2/3 flex items-center px-4 text-[#e67e22] text-xl font-bold">0</div>
          </div>
          <div className="flex rounded-md overflow-hidden shadow-sm h-16 bg-white border border-slate-200">
            <div className="bg-[#e74c3c] w-1/3 flex items-center justify-center text-white text-[10px] font-bold uppercase">Total Value</div>
            <div className="w-2/3 flex items-center px-4 text-[#e74c3c] text-lg font-bold">₹{totalVal.toLocaleString()}</div>
          </div>
        </div>

        {/* --- HEADER CONTROLS --- */}
        <div className="bg-white p-4 rounded-t-md border flex justify-between items-center shadow-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" placeholder="Search by Package, Element or Manufacturer..."
              className="w-full pl-10 pr-4 py-2 border rounded text-sm outline-none focus:ring-1 focus:ring-blue-400 transition-all"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchWalletHistory} 
            className="bg-white border px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 hover:bg-slate-50 transition-all text-slate-600"
          >
            <Clock size={16} /> Refresh Records
          </button>
        </div>

        {/* --- DATA TABLE --- */}
        <div className="bg-white shadow-md overflow-hidden rounded-b-md min-h-[400px] border-x border-b">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#5da2f0] text-white text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4 border-r border-white/20">Package Info</th>
                <th className="p-4 border-r border-white/20">Element Details</th>
                <th className="p-4 border-r border-white/20">Manufacturer</th>
          
                <th className="p-4 border-r border-white/20">Billing Cycle</th>
                <th className="p-4 border-r border-white/20">Description</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-blue-500 mb-2" size={32} />
                    <p className="text-slate-400 font-medium">Processing activation plans...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-20 text-center text-slate-400 font-medium">
                    No active distribution plans found.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const pkg = item.activationWallet || {};
                  return (
                    <tr key={item._id} className="border-b hover:bg-blue-50/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{pkg.packageName || "N/A"}</div>
                        <div className="text-[10px] font-bold text-blue-500 uppercase">{pkg.packageType}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Package size={14} className="text-slate-400" />
                          <span className="font-medium">{pkg.elementName || item.element}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">{item.elementType}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-700 font-semibold">{item.manufacturer}</div>
                        <div className="text-[10px] text-slate-400">{item.state}</div>
                      </td>
                    
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-600">
                          <Calendar size={14} className="text-orange-400" />
                          {pkg.billingCycle || "N/A"}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-start gap-1.5 max-w-[200px]">
                          <Info size={14} className="text-slate-300 mt-0.5 shrink-0" />
                          <span className="text-slate-500 text-xs italic line-clamp-2">
                            {pkg.description || "For Activation"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-[#4eb95e] text-white text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wider shadow-sm">
                          SUCCESS
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default ActivationDistributor;