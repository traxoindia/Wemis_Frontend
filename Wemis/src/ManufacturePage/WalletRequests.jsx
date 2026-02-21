import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { 
  ClipboardList, Clock, CheckCircle2, 
  Search, Loader2 
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import ManufactureNavbar from "./ManufactureNavbar";

const FETCH_REQUESTS_API = "https://api.websave.in/api/manufactur/manufacturCanSeeRequestwallets";
const GET_REQUEST_DETAILS_API = "https://api.websave.in/api/manufactur/fetchActivationDisptachData";

const WalletRequests = () => {
  const tkn = localStorage.getItem("token");
  const navigate = useNavigate(); // Initialize navigate
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (tkn) fetchRequests();
  }, [tkn]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(FETCH_REQUESTS_API, {
        headers: { "Authorization": `Bearer ${tkn}`, "Content-Type": "application/json" }
      });
      const resData = await response.json();
      if (resData.success) setRequests(resData.result || []);
    } catch (error) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFulfillNavigation = async (req) => {
    const tid = toast.loading("Fetching request details...");
    try {
      const response = await fetch(GET_REQUEST_DETAILS_API, {
        method: "POST",
        headers: { "Authorization": `Bearer ${tkn}`, "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: req._id })
      });
      const resData = await response.json();

      if (resData.success) {
        toast.dismiss(tid);
        // Navigate to another page and pass data via state
        navigate("/wallet/activation", { 
          state: { 
            fulfillmentData: resData.data,
            requestId: req._id,
            partnerType: req.distributorId ? "distributor" : "oem",
            partnerId: req.distributorId || req.oemId
          } 
        });
      } else {
        toast.error("Could not fetch request details", { id: tid });
      }
    } catch (error) {
      toast.error("Error connecting to server", { id: tid });
    }
  };

  const filteredData = requests.filter(req => filter === "all" ? true : req.requestStatus === filter);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Toaster position="top-right" />
      <ManufactureNavbar />

      <main className="max-w-full mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <ClipboardList className="text-blue-600" /> Wallet Requests
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage partner stock requests.</p>
          </div>

          <div className="flex bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
            {["all", "pending", "complete"].map((s) => (
              <button key={s} onClick={() => setFilter(s)} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${filter === s ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-600"}`}>{s}</button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Partner</th>
                <th className="px-6 py-4">Package</th>
                <th className="px-6 py-4 text-center">Qty</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr><td colSpan="5" className="py-20 text-center"><Loader2 className="animate-spin inline mr-2" /> Loading...</td></tr>
              ) : filteredData.map((req) => (
                <tr key={req._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold">{req.distributorName || req.oemName}</div>
                    <div className="text-[10px] text-blue-600 font-bold uppercase">{req.distributorId ? "Distributor" : "OEM"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{req.activationPlanDetails?.packageName}</div>
                  </td>
                  <td className="px-6 py-4 text-center"><span className="bg-slate-100 px-3 py-1 rounded-full font-bold">{req.requestedWalletCount}</span></td>
                  <td className="px-6 py-4">
                    {req.requestStatus === "pending" ? (
                      <span className="text-orange-600 font-bold text-xs flex items-center gap-1"><Clock size={14}/> PENDING</span>
                    ) : (
                      <span className="text-emerald-600 font-bold text-xs flex items-center gap-1"><CheckCircle2 size={14}/> COMPLETE</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {req.requestStatus === "pending" && (
                      <button onClick={() => handleOpenFulfillNavigation(req)} className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-blue-700 shadow-sm">Fulfill</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default WalletRequests;