import React, { useState, useEffect, useContext } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { UserAppContext } from "../contexts/UserAppProvider";
import {
  Upload, Save, X, Loader2, User, Globe, Building2, CheckCircle2, Phone, Mail, Link, Hash
} from "lucide-react";

// 1. CONSTANTS & SUB-COMPONENTS (Defined outside to prevent re-render focus loss)
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh"
];


const InputField = ({ label, name, value, onChange, placeholder, readOnly, required, type = "text", icon: Icon }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label} {required && "*"}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        required={required}
        autoComplete="off"
        className={`w-full p-2.5 ${Icon ? 'pl-10' : 'pl-3'} border rounded-lg text-sm transition-all outline-none focus:ring-2 focus:ring-blue-500/20 ${readOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white border-gray-300 hover:border-gray-400'
          }`}
      />
    </div>
  </div>
);

function CreateManufacture() {
  const [formData, setFormData] = useState({
    country: "India",
    state: "",
    city: "",
    manufactur_code: "MFG-001",
    business_Name: "",
    gst_Number: "",
    Parent_WLP: "",
    manufacturer_Name: "",
    mobile_Number: "",
    email: "",
    toll_Free_Number: "",
    website: "",
    address: "",
    logo: null,
  });
  const navigate = useNavigate();
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  useEffect(() => {
    const fetchWlpNames = async () => {
      try {
        const res = await axios.post(
          "https://api.websave.in/api/wlp/fetchWlpName",
          {},
          { headers: { Authorization: `Bearer ${tkn}` } }
        );
        setFormData((prev) => ({ ...prev, Parent_WLP: res.data.wlpName || "Default WLP" }));
      } catch (error) {
        console.error("WLP Fetch Error:", error);
      }
    };
    if (tkn) fetchWlpNames();
  }, [tkn]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      const file = files[0];
      if (file) {
        setFormData(prev => ({ ...prev, [name]: file }));
        setLogoPreview(URL.createObjectURL(file));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "") payload.append(key, value);
      });

      await axios.post(
        "https://api.websave.in/api/wlp/createManuFactur",
        payload,
        { headers: { Authorization: `Bearer ${tkn}`, "Content-Type": "multipart/form-data" } }
      );

      setShowSuccessModal(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-12">
      <ToastContainer />

      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white p-6 rounded-t-3xl border-b flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-800">New Manufacturer</h1>
            <p className="text-slate-500 text-sm font-medium">Register a partner entity to the platform</p>
          </div>
          <button onClick={() => window.history.back()} className="bg-slate-100 hover:bg-red-50 hover:text-red-500 p-2.5 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="bg-white rounded-b-3xl p-8 space-y-12 shadow-xl border border-t-0 border-slate-200">

          {/* Section 1: Identity */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <h3 className="font-black text-slate-800 flex items-center gap-2 ">
                <Building2 size={18} /> BUSINESS IDENTITY
              </h3>
              <p className="text-xs text-slate-400 mt-2">Legal naming and system identifiers.</p>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField label="Business Name" name="business_Name" value={formData.business_Name} onChange={handleChange} required placeholder="" icon={Building2} />
              <InputField label="GST Number" name="gst_Number" value={formData.gst_Number} onChange={handleChange} required placeholder="22AAAAA0000A1Z5" icon={Hash} />
              <InputField label="Manufacturer Code" name="manufactur_code" value={formData.manufactur_code} onChange={handleChange} required icon={Hash} />
              <InputField label="Parent WLP" name="Parent_WLP" value={formData.Parent_WLP} readOnly icon={Globe} />
            </div>
          </section>

          {/* Section 2: Contact Person */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <h3 className="font-black text-slate-800 flex items-center gap-2 ">
                <User size={18} /> CONTACT PERSON
              </h3>
              <p className="text-xs text-slate-400 mt-2">Primary point of contact for this entity.</p>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField label="Full Name" name="manufacturer_Name" value={formData.manufacturer_Name} onChange={handleChange} required placeholder="John Doe" icon={User} />
              <InputField label="Mobile Number" name="mobile_Number" value={formData.mobile_Number} onChange={handleChange} required placeholder="+91 00000 00000" icon={Phone} />
              <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="contact@business.com" icon={Mail} />
              <InputField label="Toll Free" name="toll_Free_Number" value={formData.toll_Free_Number} onChange={handleChange} placeholder="1800-XXX-XXXX" icon={Phone} />
            </div>
          </section>

          {/* Section 3: Location & Online */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <h3 className="font-black text-slate-800 flex items-center gap-2 ">
                <Globe size={18} /> LOCATION & WEB
              </h3>
              <p className="text-xs text-slate-400 mt-2">Physical address and online presence.</p>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField label="Country" name="country" value={formData.country} onChange={handleChange} required icon={Globe} />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">State *</label>
                <select name="state" value={formData.state} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <InputField label="City" name="city" value={formData.city} onChange={handleChange} required placeholder="City Name" icon={Globe} />
              <InputField label="Website" name="website" value={formData.website} onChange={handleChange} placeholder="https://example.com" icon={Link} />
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Full Office Address *</label>
                <textarea name="address" value={formData.address} onChange={handleChange} required rows="3" className="w-full mt-1 p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Suite, Street, Area, Zip Code..." />
              </div>
            </div>
          </section>

          {/* Section 4: Branding */}
          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-8">
            <div className="flex-1">
              <h3 className="font-black text-slate-800 mb-2">Company Branding</h3>
              <p className="text-sm text-slate-500 mb-4">Upload a high-resolution logo (PNG/JPG).</p>
              <label className="cursor-pointer bg-white border-2 border-dashed border-blue-200 hover:border-blue-500 p-6 rounded-xl flex flex-col items-center justify-center transition-all group">
                <Upload size={28} className="text-blue-400 group-hover:scale-110 transition-transform mb-2" />
                <span className="text-sm font-bold text-slate-600">Choose File</span>
                <input type="file" name="logo" onChange={handleChange} className="hidden" accept="image/*" />
              </label>
            </div>
            <div className="w-32 h-32 bg-white rounded-2xl border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
              {logoPreview ? <img src={logoPreview} className="object-contain w-full h-full" alt="Logo Preview" /> : <Building2 className="text-slate-100" size={60} />}
            </div>
          </section>

          {/* Submit */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full sm:w-auto px-16 py-4 rounded-2xl font-black text-white shadow-xl transition-all flex items-center justify-center gap-3 ${loading ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"}`}
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={22} />}
              {loading ? "PROCESSING..." : "REGISTER MANUFACTURER"}
            </button>
          </div>
        </form>
      </div>

      {/* --- SIMPLE SUCCESS MODAL --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl scale-up-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={56} className="text-green-600" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-3">All Set!</h3>
            <p className="text-slate-500 font-medium mb-8">Manufacturer profile has been created and is now active.</p>
            <button
              onClick={() => {
                window.location.href = "/wlp/manufacturelist";
              }}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:shadow-lg transition-all"
            >
              Great, thanks!
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

export default CreateManufacture;