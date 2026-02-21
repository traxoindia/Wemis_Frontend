import React, { useState, useEffect } from "react";
import { 
  Loader2, X, Package, CheckCircle2, Building2, CheckCircle
} from "lucide-react";
import ManufactureNavbar from "./ManufactureNavbar";

function Renewal() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showToast, setShowToast] = useState(false); // Toast State

  const [gstRate, setGstRate] = useState(18);
  const [formData, setFormData] = useState({
    basePrice: '',
    distributorMargin: '',
    dealerMargin: '',
  });

  const fetchRenewalData = async () => {
    try {
      const token = localStorage.getItem("token") || "YOUR_TOKEN";
      const res = await fetch("https://api.websave.in/api/manufactur/fetchManufacturRenewalWalletPackage", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setData(result);
        if (result.renewalPackages?.length > 0) setSelectedPackage(result.renewalPackages[0]);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRenewalData();
  }, []);

  const calc = (val) => {
    const num = Number(val) || 0;
    const gst = (num * gstRate) / 100;
    return { net: num, gst: gst, total: num + gst };
  };

  const baseData = calc(formData.basePrice);
  const distData = calc(formData.distributorMargin);
  const dealData = calc(formData.dealerMargin);
  const finalTotal = baseData.total + distData.total + dealData.total;

  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("https://api.websave.in/api/manufactur/manufacturerUpdareRenewalPackagePrice", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          renewalPackageId: selectedPackage._id,
          price: baseData.net,
          distributorOemMarginPrice: distData.net,
          delerMarginPrice: dealData.net,
          totalPrice: finalTotal.toFixed(2),
        }),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setFormData({ basePrice: '', distributorMargin: '', dealerMargin: '' }); // Reset form
        setShowToast(true); // Trigger Toast
        setTimeout(() => setShowToast(false), 3000); // Auto-hide toast
        fetchRenewalData();
      }
    } catch (err) {
      alert("Pricing update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] relative">
      <ManufactureNavbar />

      {/* --- TOAST NOTIFICATION --- */}
      {showToast && (
        <div className="fixed top-20 right-5 z-[100] animate-in slide-in-from-right duration-300">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-700">
            <CheckCircle className="text-green-400 w-5 h-5" />
            <span className="text-sm font-bold tracking-tight">Pricing updated successfully!</span>
          </div>
        </div>
      )}

      <div className="max-w-full mx-auto p-6 md:p-10">
        <div className="mb-8 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight uppercase">Inventory Control</h1>
            <div className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Building2 size={14}/> {data?.manufacturerName}
            </div>
        </div>

        {/* REFINED TABLE */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Manufacturer</th>
                <th className="px-6 py-4">WLP Name</th>
                <th className="px-6 py-4">Package Identity</th>
                <th className="px-6 py-4">Cycle</th>
                <th className="px-6 py-4 text-right">Gross Price</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.renewalPackages?.map((pkg) => (
                <tr key={pkg._id} className="hover:bg-blue-50/20 transition-all duration-200">
                  <td className="px-6 py-5 font-bold text-gray-800 text-sm">{data?.manufacturerName}</td>
                  <td className="px-6 py-5 text-sm font-medium text-gray-600">{data?.wlpName}</td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-blue-600 text-sm">{pkg.packageName}</div>
                    <div className="text-[11px] text-gray-400 font-bold">{pkg.elementName}</div>
                  </td>
                  <td className="px-6 py-5 text-xs font-bold text-gray-500">
                    {pkg.billingCycle} Days
                  </td>
                  <td className="px-6 py-5 text-right font-black text-gray-900">
                    ₹{pkg.totalPrice}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button 
                      onClick={() => { setSelectedPackage(pkg); setIsModalOpen(true); }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                    >
                      Update Price
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MINIMALIST MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/30 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 tracking-tight">Update Pricing</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X size={18} className="text-gray-400 hover:text-gray-600 transition-colors" />
              </button>
            </div>

            <form onSubmit={handleUpdatePrice} className="p-8 space-y-6">
              
              <div className="grid grid-cols-2 gap-3">
                {data?.renewalPackages?.map((pkg) => (
                  <button
                    key={pkg._id}
                    type="button"
                    onClick={() => setSelectedPackage(pkg)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      selectedPackage?._id === pkg._id ? 'border-blue-600 bg-blue-50/30' : 'border-gray-100'
                    }`}
                  >
                    {selectedPackage?._id === pkg._id && <CheckCircle2 className="absolute top-3 right-3 text-blue-600" size={14} />}
                    <p className="font-bold text-xs text-gray-800">{pkg.packageName}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">₹{pkg.totalPrice} (Current)</p>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Taxation Rate</span>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {[12, 18].map(r => (
                        <button key={r} type="button" onClick={() => setGstRate(r)} className={`px-4 py-1 text-[10px] font-black rounded-md transition-all ${gstRate === r ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>{r}%</button>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Base Price (Net)</label>
                  <input type="number" value={formData.basePrice} onChange={(e) => setFormData({...formData, basePrice: e.target.value})} className="w-full text-base font-bold border-b border-gray-200 focus:border-blue-600 outline-none py-1 transition-all" />
                  <p className="text-[10px] text-blue-500 font-medium italic">Gross: ₹{baseData.total.toFixed(0)}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Distributor Margin</label>
                  <input type="number" value={formData.distributorMargin} onChange={(e) => setFormData({...formData, distributorMargin: e.target.value})} className="w-full text-base font-bold border-b border-gray-200 focus:border-blue-600 outline-none py-1 transition-all" />
                  <p className="text-[10px] text-blue-500 font-medium italic">Gross: ₹{distData.total.toFixed(0)}</p>
                </div>

                <div className="space-y-1 col-span-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dealer Margin</label>
                  <input type="number" value={formData.dealerMargin} onChange={(e) => setFormData({...formData, dealerMargin: e.target.value})} className="w-full text-base font-bold border-b border-gray-200 focus:border-blue-600 outline-none py-1 transition-all" />
                  <p className="text-[10px] text-blue-500 font-medium italic">Gross: ₹{dealData.total.toFixed(0)}</p>
                </div>
              </div>

              <div className="pt-6 flex items-center justify-between border-t border-gray-50">
                <div className="text-left">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Final Total Gross</p>
                  <p className="text-2xl font-black text-gray-900 tracking-tighter">₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
                >
                  {isUpdating ? <Loader2 className="animate-spin" size={14} /> : "Save Changes"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Renewal;