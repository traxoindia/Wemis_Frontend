import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import WlpNavbar from "./WlpNavbar";
import axios from "axios";
import { UserAppContext } from "../contexts/UserAppProvider";
import { 
  Upload, 
  Save, 
  X,
  Loader2,
  MapPin,
  User,
  Globe
} from "lucide-react";

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

function CreateManufacture() {
  // Updated city -> state in initial state
  const [formData, setFormData] = useState({
    country: "",
    state: "", 
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

  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  // Fetch Parent WLP Name
  useEffect(() => {
    const fetchWlpNames = async () => {
      try {
        const res = await axios.post(
          "https://api.websave.in/api/wlp/fetchWlpName",
          {},
          {
            headers: {
              Authorization: `Bearer ${tkn}`,
              "Content-Type": "application/json",
            },
          }
        );

        setFormData((prev) => ({
          ...prev,
          Parent_WLP: res.data.wlpName,
        }));
      } catch (error) {
        console.error("Error fetching WLP names:", error);
        toast.error("Failed to fetch Parent WLP name");
      }
    };

    if (tkn) fetchWlpNames();
  }, [tkn]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files && files[0]) {
      setFormData({ ...formData, [name]: files[0] });
      setLogoPreview(URL.createObjectURL(files[0]));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Close Button Action
  const handleClose = () => {
     window.history.back(); 
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if(!formData.state) {
        toast.error("Please select a state.");
        setLoading(false);
        return;
    }

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          payload.append(key, value);
        }
      });

      const res = await axios.post(
        "https://api.websave.in/api/wlp/createManuFactur",
        payload, // Changed from formData to payload
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data) {
        toast.success("Manufacturer Created Successfully!");
        
        // Reset form
        setFormData((prev) => ({
          country: "",
          state: "",
          manufactur_code: "MFG-001",
          business_Name: "",
          gst_Number: "",
          Parent_WLP: prev.Parent_WLP,
          manufacturer_Name: "",
          mobile_Number: "",
          email: "",
          toll_Free_Number: "",
          website: "",
          address: "",
          logo: null,
        }));
        setLogoPreview(null);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(error.response?.data?.message || "Failed to create manufacturer.");
    } finally {
      setLoading(false);
    }
  };

  // Reusable Input Component
  const InputField = ({ label, name, type = "text", placeholder, value, onChange, readOnly, required }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'}`}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans pt-20">
      <WlpNavbar />

      <div className="w-full px-4 md:px-8 pb-10">
        
        {/* Header Bar */}
        <div className="bg-white border border-gray-200 rounded-t-xl p-5 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Add New Manufacturer</h1>
            <p className="text-sm text-gray-500">Enter details to register a manufacturing unit.</p>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Main Form Area */}
        <form onSubmit={handleSubmit} className="bg-white border-x border-b border-gray-200 rounded-b-xl p-6 md:p-8 space-y-8 shadow-sm">
            
            {/* SECTION 1: Location & Business */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                    <Globe size={16}/> Business Information
                </h3>
                
                {/* Responsive Grid: 1 col mobile, 2 col tablet, 3 col desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* Country */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                        <select
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Select Country</option>
                            <option value="India">India</option>
                            <option value="USA">USA</option>
                        </select>
                    </div>

                    {/* State (Replaces City) */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <select
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                            >
                                <option value="">Select State</option>
                                {INDIAN_STATES.map((state) => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                        </div>
                    </div>

                    <InputField label="Manufacturer Code" name="manufactur_code" value={formData.manufactur_code} onChange={handleChange} required />
                    <InputField label="Business Name" name="business_Name" value={formData.business_Name} onChange={handleChange} placeholder="Company Name" required />
                    <InputField label="GST Number" name="gst_Number" value={formData.gst_Number} onChange={handleChange} placeholder="GSTIN..." required />
                    <InputField label="Parent WLP" name="Parent_WLP" value={formData.Parent_WLP} readOnly />
                </div>
            </div>

            {/* SECTION 2: Contact Details */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                    <User size={16}/> Contact Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InputField label="Contact Person" name="manufacturer_Name" value={formData.manufacturer_Name} onChange={handleChange} placeholder="Full Name" required />
                    <InputField label="Mobile Number" name="mobile_Number" value={formData.mobile_Number} onChange={handleChange} placeholder="+91..." required />
                    <InputField label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@domain.com" required />
                    <InputField label="Toll Free Number" name="toll_Free_Number" value={formData.toll_Free_Number} onChange={handleChange} placeholder="1800..." />
                    <InputField label="Website" name="website" value={formData.website} onChange={handleChange} placeholder="www.example.com" />
                </div>
            </div>

            {/* SECTION 3: Address & Branding */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                    <MapPin size={16}/> Address & Branding
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Full Address <span className="text-red-500">*</span></label>
                        <textarea
                            name="address"
                            rows="3"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Complete street address..."
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Upload Logo <span className="text-red-500">*</span></label>
                        <div className="flex items-center gap-4">
                            <label className="flex-grow flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-all">
                                <Upload size={20} className="text-gray-400 mb-1" />
                                <span className="text-xs text-gray-500">Click to upload image</span>
                                <input type="file" name="logo" onChange={handleChange} className="hidden" accept="image/*" />
                            </label>
                            
                            {logoPreview && (
                                <div className="w-20 h-20 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center relative group">
                                    <img src={logoPreview} alt="Preview" className="max-w-full max-h-full object-contain" />
                                    <button 
                                      type="button" 
                                      onClick={() => { setLogoPreview(null); setFormData(prev => ({...prev, logo: null})); }}
                                      className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center text-white"
                                    >
                                      <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-end gap-4">
                <button
                    type="button"
                    onClick={handleClose}
                    className="w-full md:w-auto px-6 py-2.5 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors order-2 md:order-1"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full md:w-auto flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold text-white shadow-sm transition-all order-1 md:order-2 ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"}`}
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {loading ? "Creating..." : "Create Manufacturer"}
                </button>
            </div>

        </form>
      </div>
    </div>
  );
}

export default CreateManufacture;