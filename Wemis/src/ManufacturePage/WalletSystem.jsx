import React, { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  Send,
  X,
  Edit3,
  Bell,
  Wallet,
  TrendingUp,
  Package,
  CheckCircle2,
  Clock,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import ManufactureNavbar from "./ManufactureNavbar";
import { useLocation } from "react-router-dom";

// --- API Endpoints ---
const FETCH_WALLET_VALUES_API = "https://api.websave.in/api/manufactur/fetchmanufacturwalletValues";
const FETCH_WALLET_HISTORY_API = "https://api.websave.in/api/manufactur/fetchManufacturActivatioWallet";
const UPDATE_PRICE_QTY_API = "https://api.websave.in/api/manufactur/manufacturCanAddPriceAndNoOfWallet";
const FETCH_OEM_API = "https://api.websave.in/api/manufactur/findOemUnderManufactur";
const FETCH_DISTRIBUTOR_API = "https://api.websave.in/api/manufactur/findDistributorUnderManufactur";
const DISPATCH_SUBSCRIPTION_API = "https://api.websave.in/api/manufactur/sendActivationWalletToDistributorOrOem";
const FETCH_REQUESTS_API = "https://api.websave.in/api/manufactur/manufacturCanSeeRequestwallets";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi",
];

const WalletSystem = () => {
  const tkn = localStorage.getItem("token");
  const location = useLocation();

  // --- Main State ---
  const [walletStats, setWalletStats] = useState({ balance: 0, avaliableStock: 0 });
  const [walletHistory, setWalletHistory] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // --- Modals ---
  const [activeModal, setActiveModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // --- Forms ---
  const [updateForm, setUpdateForm] = useState({
    activationWallet: "",
    basePrice: "",
    dealerBaseMargin: "",
    distributorBaseMargin: "",
    gstRate: 18,
    priceWithGst: 0,
    totalPrice: 0,
    distributorMarginWithGst: 0,
    dealerMarginWithGst: 0,
    noOfActivationWallets: "",
  });

  const [partners, setPartners] = useState({ oems: [], distributors: [], loading: false });
  const [subForm, setSubForm] = useState({
    state: "",
    partnerId: "",
    partnerName: "",
    partnerType: "oem",
    selectedPackage: null,
    quantity: 1,
    requestId: null,
  });

  // 1. Initial Data Fetch
  useEffect(() => {
    if (tkn) {
      fetchWalletValues();
      fetchWalletHistory();
      fetchRequests();
    }
  }, [tkn]);

  // 2. Fetch Partners when State is selected
  useEffect(() => {
    if (subForm.state && activeModal === "subscription") {
      fetchPartners(subForm.state);
    }
  }, [subForm.state, activeModal]);

  // 3. AUTO-DETECT fulfillment data from Location State
  useEffect(() => {
    if (location.state?.fulfillmentData && walletHistory.length > 0) {
      const data = location.state.fulfillmentData;
      const matchingPackage = walletHistory.find(
        (pkg) => pkg.activationWallet?._id === data.activationPlanId || pkg._id === data.activationPlanId
      );

      setSubForm({
        state: data.state || "",
        partnerId: "", // Logic in Effect #4 will find this ID by name
        partnerName: data.partnerName || "",
        partnerType: data.role === "distributor" ? "distributor" : "oem",
        quantity: data.requestedWalletCount || 1,
        selectedPackage: matchingPackage || null,
        requestId: location.state.requestId || null,
      });

      fetchPartners(data.state);
      setActiveModal("subscription");
      window.history.replaceState({}, document.title);
    }
  }, [location.state, walletHistory]);

  // 4. THE FIX: Auto-Select Partner ID based on Name after API loads
  useEffect(() => {
    if (subForm.partnerName && !subForm.partnerId && !partners.loading) {
      const list = subForm.partnerType === "oem" ? partners.oems : partners.distributors;
      const match = list.find(p => 
        (p.business_Name || p.name || "").toLowerCase() === subForm.partnerName.toLowerCase()
      );
      if (match) {
        setSubForm(prev => ({ ...prev, partnerId: match._id }));
      }
    }
  }, [partners.loading, subForm.partnerName, subForm.partnerType]);

  // --- Pricing Logic ---
  useEffect(() => {
    const gstFactor = (parseFloat(updateForm.gstRate) || 0) / 100;
    const basePrice = parseFloat(updateForm.basePrice) || 0;
    const distBase = parseFloat(updateForm.distributorBaseMargin) || 0;
    const dealerBase = parseFloat(updateForm.dealerBaseMargin) || 0;

    const basePriceWithGst = basePrice + basePrice * gstFactor;
    const distWithGst = distBase + distBase * gstFactor;
    const dealerWithGst = dealerBase + dealerBase * gstFactor;
    const subtotal = basePrice + distBase + dealerBase;
    const finalTotal = subtotal + subtotal * gstFactor;

    setUpdateForm((prev) => ({
      ...prev,
      priceWithGst: basePriceWithGst,
      distributorMarginWithGst: distWithGst,
      dealerMarginWithGst: dealerWithGst,
      totalPrice: finalTotal,
    }));
  }, [updateForm.basePrice, updateForm.dealerBaseMargin, updateForm.distributorBaseMargin, updateForm.gstRate]);

  // --- API Functions ---
  const fetchWalletValues = async () => {
    try {
      const response = await fetch(FETCH_WALLET_VALUES_API, { headers: { Authorization: `Bearer ${tkn}` } });
      const resData = await response.json();
      if (resData.success) {
        setWalletStats({ balance: resData.walletValues?.balance || 0, avaliableStock: resData.walletValues?.avaliableStock || 0 });
      }
    } catch (error) { console.error(error); }
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch(FETCH_REQUESTS_API, { headers: { Authorization: `Bearer ${tkn}` } });
      const resData = await response.json();
      if (resData.success) setAllRequests(resData.result || []);
    } catch (error) { console.error(error); }
  };

  const fetchWalletHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(FETCH_WALLET_HISTORY_API, { headers: { Authorization: `Bearer ${tkn}` } });
      const result = await response.json();
      if (result.success) setWalletHistory(result.activationWallets || []);
    } catch (error) { toast.error("Error loading packages"); }
    finally { setLoading(false); }
  };

  const fetchPartners = async (stateName) => {
    setPartners((prev) => ({ ...prev, loading: true }));
    try {
      const headers = { Authorization: `Bearer ${tkn}`, "Content-Type": "application/json" };
      const body = JSON.stringify({ state: stateName });
      const [oemRes, distRes] = await Promise.all([
        fetch(FETCH_OEM_API, { method: "POST", headers, body }),
        fetch(FETCH_DISTRIBUTOR_API, { method: "POST", headers, body }),
      ]);
      const oemData = await oemRes.json();
      const distData = await distRes.json();
      setPartners({ oems: oemData.oem || [], distributors: distData.dist || [], loading: false });
    } catch (error) { setPartners((prev) => ({ ...prev, loading: false })); }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const tid = toast.loading("Updating inventory...");
    try {
      const payload = {
        price: Number(updateForm.priceWithGst.toFixed(2)),
        totalPrice: Number(updateForm.totalPrice.toFixed(2)),
        distributorAndOemMarginPrice: Number(updateForm.distributorMarginWithGst.toFixed(2)),
        delerMarginPrice: Number(updateForm.dealerMarginWithGst.toFixed(2)),
        noOfActivationWallets: Number(updateForm.noOfActivationWallets),
        activationId: updateForm.activationWallet,
      };
      const res = await fetch(UPDATE_PRICE_QTY_API, { method: "POST", headers: { Authorization: `Bearer ${tkn}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        toast.success("Pricing Updated", { id: tid });
        setActiveModal(null);
        fetchWalletHistory();
        fetchWalletValues();
      }
    } catch (err) { toast.error("Server Error", { id: tid }); }
    finally { setSubmitting(false); }
  };

  const handleDispatchSubscription = async () => {
    if (!subForm.partnerId || !subForm.selectedPackage) return toast.error("Fill all details");
    setSubmitting(true);
    const tid = toast.loading("Dispatching...");
    try {
      const payload = {
        state: subForm.state,
        partnerName: subForm.partnerName,
        [subForm.partnerType === "oem" ? "oemId" : "distributorId"]: subForm.partnerId,
        activationPlanId: subForm.selectedPackage._id,
        sentWalletAmount: Number(( subForm.selectedPackage.price) * subForm.quantity),
        sentStockQuantity: Number(subForm.quantity),
      };
      console.log(payload)
      const response = await fetch(DISPATCH_SUBSCRIPTION_API, { method: "POST", headers: { Authorization: `Bearer ${tkn}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (response.ok) {
        toast.success("Inventory Dispatched", { id: tid });
        setActiveModal(null);
        fetchWalletHistory(); fetchRequests(); fetchWalletValues();
      }
    } catch (error) { toast.error("Dispatch Failed", { id: tid }); }
    finally { setSubmitting(false); }
  };

  const pendingRequests = allRequests.filter(r => r.requestStatus === "pending");
  const filteredHistory = walletHistory.filter(item => item.packageName?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Toaster position="top-right" />
      <ManufactureNavbar />

      <main className="max-w-full mx-auto px-6 py-8">
        {/* --- STAT CARDS --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2 text-slate-500 uppercase text-[10px] font-bold">Total Stock <Package size={14} className="text-emerald-500"/></div>
            <p className="text-2xl font-bold text-emerald-600">{walletStats.avaliableStock}</p>
          </div>
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2 text-slate-500 uppercase text-[10px] font-bold">Pending <Clock size={14} className="text-orange-500"/></div>
            <p className="text-2xl font-bold text-orange-600">{pendingRequests.length}</p>
          </div>
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2 text-slate-500 uppercase text-[10px] font-bold">Balance <Wallet size={14} className="text-slate-400"/></div>
            <p className="text-2xl font-bold">₹{walletStats.balance.toLocaleString()}</p>
          </div>
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2 text-slate-500 uppercase text-[10px] font-bold">Packages <TrendingUp size={14} className="text-blue-500"/></div>
            <p className="text-2xl font-bold text-blue-600">{walletHistory.length}</p>
          </div>
        </div>

        {/* --- TOP BAR --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search packages..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none shadow-sm" onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setActiveModal("notifications")} className="relative p-2 bg-white border border-slate-200 rounded-md hover:bg-slate-50">
              <Bell size={20} className="text-slate-600" />
              {pendingRequests.length > 0 && <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />}
            </button>
            <button onClick={() => setActiveModal("update")} className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-50">
              <Edit3 size={16} /> Update Price
            </button>
            <button onClick={() => { setSubForm({ state: "", partnerId: "", partnerName: "", partnerType: "oem", quantity: 1, selectedPackage: null }); setActiveModal("subscription"); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-200">
              <Send size={16} /> Dispatch
            </button>
          </div>
        </div>

        {/* --- DATA TABLE --- */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
              <tr>
                <th className="px-6 py-4">Package</th>
                <th className="px-6 py-4">Component</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4">Price (Base + GST)</th>
                <th className="px-6 py-4">Total (Incl. Margins)</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr><td colSpan="6" className="py-20 text-center"><Loader2 className="animate-spin inline mr-2 text-blue-600" /> Loading...</td></tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold">{item.packageName}</td>
                    <td className="px-6 py-4 text-slate-600">{item.elementName}</td>
                    <td className="px-6 py-4 text-center font-medium">{item.noOfActivationWallets}</td>
                    <td className="px-6 py-4 font-bold">₹{item.price}</td>
                    <td className="px-6 py-4 text-blue-600 font-bold">₹{item.totalPrice || item.price}</td>
                    <td className="px-6 py-4"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">Live</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* --- MODAL: DISPATCH INVENTORY --- */}
      {activeModal === "subscription" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2 text-blue-600 font-bold">
                <Send size={18} /> <span>Dispatch Inventory</span>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-200 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Detection Banner */}
              {subForm.partnerName && (
                <div className="bg-blue-600 p-4 rounded-xl text-white shadow-lg shadow-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg"><CheckCircle2 size={20} /></div>
                    <div>
                      <p className="text-[10px] font-bold uppercase opacity-80">Detected Request</p>
                      <h4 className="text-lg font-black uppercase tracking-tight leading-none">{subForm.partnerName}</h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{subForm.partnerType}</span>
                    <p className="text-[10px] font-bold mt-1 opacity-80">{subForm.state}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">State</label>
                  <select
                    className="w-full border-2 border-slate-100 rounded-xl p-2.5 text-xs bg-white font-bold focus:border-blue-500 outline-none"
                    value={subForm.state}
                    onChange={(e) => {
                      setSubForm({ ...subForm, state: e.target.value, partnerId: "", partnerName: "" });
                      fetchPartners(e.target.value);
                    }}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Partner Type</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {["oem", "distributor"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setSubForm({ ...subForm, partnerType: t, partnerId: "", partnerName: "" })}
                        className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${subForm.partnerType === t ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Select Partner</label>
                  <select
                    className={`w-full border-2 rounded-xl p-2.5 text-xs bg-white font-bold outline-none ${partners.loading ? "border-orange-200 animate-pulse" : "border-slate-100"}`}
                    value={subForm.partnerId}
                    disabled={partners.loading || !subForm.state}
                    onChange={(e) => {
                      const list = subForm.partnerType === "oem" ? partners.oems : partners.distributors;
                      const sel = list.find((p) => p._id === e.target.value);
                      setSubForm({ ...subForm, partnerId: e.target.value, partnerName: sel?.business_Name || sel?.name || "" });
                    }}
                  >
                    <option value="">{partners.loading ? "Syncing..." : "Choose Partner"}</option>
                    {(subForm.partnerType === "oem" ? partners.oems : partners.distributors).map((p) => (
                      <option key={p._id} value={p._id}>{p.business_Name || p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-black text-slate-800 uppercase flex items-center gap-2"><Package size={14}/> 4. Choose Plan</p>
                <div className="grid grid-cols-3 gap-3">
                  {walletHistory.map((pkg) => (
                    <button
                      key={pkg._id}
                      onClick={() => setSubForm({ ...subForm, selectedPackage: pkg })}
                      className={`p-3 border-2 rounded-xl text-left transition-all relative ${subForm.selectedPackage?._id === pkg._id ? "border-blue-600 bg-blue-50 ring-4 ring-blue-50" : "border-slate-100 hover:border-slate-300"}`}
                    >
                      <div className="text-[10px] font-bold text-slate-400 uppercase truncate">{pkg.packageName}</div>
                      <div className="text-sm font-black mt-1">₹{pkg.price}</div>
                      {subForm.selectedPackage?._id === pkg._id && <CheckCircle2 size={12} className="absolute top-2 right-2 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-end justify-between border-t pt-6 bg-slate-50 -mx-6 px-6 pb-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Quantity</label>
                  <input
                    type="number"
                    className="border-2 border-slate-200 rounded-xl p-2 w-32 text-xl font-black outline-none focus:border-blue-600"
                    value={subForm.quantity}
                    onChange={(e) => setSubForm({ ...subForm, quantity: e.target.value })}
                  />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Value</p>
                  <p className="text-3xl font-black text-slate-900">₹{((subForm.selectedPackage?.price || 0) * subForm.quantity).toLocaleString()}</p>
                </div>
                <button
                  onClick={handleDispatchSubscription}
                  disabled={submitting || !subForm.partnerId || !subForm.selectedPackage}
                  className="bg-slate-900 text-white px-10 py-3.5 rounded-xl font-black hover:bg-blue-600 disabled:opacity-30 transition-all shadow-xl shadow-slate-200"
                >
                  {submitting ? "Processing..." : "Confirm Dispatch"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: UPDATE PRICE --- */}
      {activeModal === "update" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-xl overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Update Inventory Pricing</h3>
              <button onClick={() => setActiveModal(null)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-3 block uppercase">1. Select Target Package</label>
                <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-1">
                  {walletHistory.map((pkg) => (
                    <button
                      key={pkg._id}
                      onClick={() => setUpdateForm({ ...updateForm, activationWallet: pkg._id })}
                      className={`rounded-lg border p-4 text-left transition-all ${updateForm.activationWallet === pkg._id ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}
                    >
                      <div className="font-semibold text-xs text-slate-800">{pkg.packageName}</div>
                      <div className="text-[11px] text-slate-500 mt-1">₹ {pkg.price} <span className="text-[10px] opacity-70">(Base + GST)</span></div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-4 border-r pr-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Base Price (Net)</label>
                    <input type="number" className="w-full border rounded p-2 text-sm font-semibold outline-none focus:ring-1 focus:ring-blue-500" value={updateForm.basePrice} onChange={(e) => setUpdateForm({...updateForm, basePrice: e.target.value})} />
                    <div className="mt-1 text-[10px] text-blue-600 font-bold uppercase">Incl. GST: ₹{updateForm.priceWithGst.toFixed(2)}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Add Stock Qty</label>
                    <input type="number" className="w-full border rounded p-2 text-sm font-semibold" value={updateForm.noOfActivationWallets} onChange={(e) => setUpdateForm({...updateForm, noOfActivationWallets: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Distributor Margin</label>
                    <div className="flex justify-between items-center">
                      <input type="number" className="w-20 border rounded p-1 text-xs" value={updateForm.distributorBaseMargin} onChange={(e) => setUpdateForm({...updateForm, distributorBaseMargin: e.target.value})} />
                      <span className="text-xs font-bold text-blue-600">₹{updateForm.distributorMarginWithGst.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Dealer Margin</label>
                    <div className="flex justify-between items-center">
                      <input type="number" className="w-20 border rounded p-1 text-xs" value={updateForm.dealerBaseMargin} onChange={(e) => setUpdateForm({...updateForm, dealerBaseMargin: e.target.value})} />
                      <span className="text-xs font-bold text-blue-600">₹{updateForm.dealerMarginWithGst.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl text-white flex justify-between items-center shadow-lg">
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-80">Final Total Price</p>
                  <p className="text-2xl font-black">₹{updateForm.totalPrice.toFixed(2)}</p>
                </div>
                <button onClick={handleUpdateSubmit} disabled={submitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all disabled:opacity-50">
                  {submitting ? "Updating..." : "Update Inventory"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- NOTIFICATIONS --- */}
      {activeModal === "notifications" && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-lg text-slate-800 uppercase tracking-tight">Pending Requests</h2>
              <button onClick={() => setActiveModal(null)}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {pendingRequests.map((req, i) => (
                <div key={i} className="p-4 bg-white border rounded-xl hover:border-blue-400 transition-all group">
                  <div className="flex justify-between text-[10px] font-bold text-orange-600 mb-2 uppercase">
                    <span>{req.distributorId ? "DISTRIBUTOR" : "OEM"}</span>
                    <span>PENDING</span>
                  </div>
                  <h4 className="font-bold mb-1 group-hover:text-blue-600">{req.distributorName || req.oemName}</h4>
                  <p className="text-xs text-slate-500 mb-4">Requesting {req.requestedWalletCount} wallets of {req.activationPlanDetails?.packageName}</p>
                  <button
                    onClick={() => {
                      setSubForm({
                        state: req.state || "",
                        partnerId: req.distributorId || req.oemId || "",
                        partnerName: req.distributorName || req.oemName || "",
                        partnerType: req.distributorId ? "distributor" : "oem",
                        quantity: req.requestedWalletCount,
                        selectedPackage: req.activationPlanDetails || null,
                      });
                      fetchPartners(req.state);
                      setActiveModal("subscription");
                    }}
                    className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Fulfill Request
                  </button>
                </div>
              ))}
              {pendingRequests.length === 0 && <div className="text-center py-20 text-slate-400 text-sm">No pending requests</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletSystem;