import React, { useState, useMemo, useEffect, useCallback, useContext } from "react";
import { ChevronRight, ChevronLeft, AlertCircle, RefreshCw, Loader, Ban, Search, CheckCircle, XCircle, ArrowRight, ArrowLeft } from "lucide-react";
import axios from 'axios';
import ManufactureNavbar from "./ManufactureNavbar";
import toast, { Toaster } from "react-hot-toast";

// --- Context for Token Retrieval ---
const UserAppContext = React.createContext({
  token: localStorage.getItem("token") || null,
});

// --- API Endpoints ---
const DISTRIBUTOR_API = "https://api.websave.in/api/manufactur/findDistributorUnderManufactur";
const OEM_API = "https://api.websave.in/api/manufactur/findOemUnderManufactur";
const DEALER_UNDER_DISTRIBUTOR_API = "https://api.websave.in/api/manufactur/findDelerUnderDistributor";
const DEALER_UNDER_OEM_API = "https://api.websave.in/api/manufactur/findDelerUnderOem";
const FETCH_ALLOCATED_BARCODES_API = "https://api.websave.in/api/manufactur/fetchAllAllocatedDISTRIBUTOROrOEMBarcodeLists";
const ROLLBACK_API = "https://api.websave.in/api/manufactur/rollBackAllocatedBarCode";
const ELEMENT_DATA_API = "https://api.websave.in/api/manufactur/fetchElementData";

// --- Mock/Static Options ---
const MOCK_OPTIONS = {
  countries: [
    { value: "US", label: "United States", flag: "🇺🇸" },
    { value: "IN", label: "India", flag: "🇮🇳" },
    { value: "UK", label: "United Kingdom", flag: "🇬🇧" },
  ],
  statesByCountry: {
    US: [
      { value: "CA", label: "California" },
      { value: "TN", label: "Tennessee" },
    ],
    IN: [
      { value: "Karnataka", label: "Karnataka" },
      { value: "Odisha", label: "Odisha" },
      { value: "Maharashtra", label: "Maharashtra" },
      { value: "Delhi", label: "Delhi" },
      { value: "TamilNadu", label: "TamilNadu" },
    ],
    UK: [
      { value: "ENG", label: "England" },
      { value: "SCT", label: "Scotland" },
    ],
  },
  barCodeTypes: [
    { value: "All_Barcodes", label: "All Barcodes", icon: "📦" },
    { value: "RFID", label: "RFID Tag", icon: "🏷️" },
    { value: "QR", label: "QR Code", icon: "📱" }
  ],
};

const INITIAL_API_OPTIONS = {
  elements: [],
  distributors: [],
  oems: [],
  dealers: [],
};

// --- Reusable SelectField Component with Better UI ---
const SelectField = ({ id, label, options, required = false, disabled = false, isLoading = false, error = null, value, onChange, icon = null }) => {
  return (
    <div className="flex-grow min-w-[200px] group">
      <label htmlFor={id} className="block font-semibold text-sm text-yellow-300 mb-1 flex items-center gap-1">
        {icon && <span className="text-base">{icon}</span>}
        {label} {required && <span className="text-red-500 text-lg leading-none">*</span>}
        {isLoading && <Loader className="inline ml-2 animate-spin" size={12} />}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        disabled={disabled || isLoading}
        className={`w-full p-2.5 border rounded-lg bg-gray-800 text-yellow-200 focus:ring-2 focus:ring-yellow-500 transition-all duration-200 
          ${error ? "border-red-500 shake" : "border-yellow-500/50 hover:border-yellow-400"}
          ${disabled || isLoading ? "opacity-50 cursor-not-allowed bg-gray-700" : "cursor-pointer"}
          outline-none`}
      >
        <option value="" className="bg-gray-800">Select {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-gray-800">
            {opt.flag && `${opt.flag} `}{opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1 animate-fadeIn">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
};

// --- Radio Group Component ---
const RadioGroup = ({ label, name, value, onChange, options }) => (
  <div className="flex flex-col">
    <label className="block font-semibold text-sm text-yellow-300 mb-2">{label}</label>
    <div className="flex gap-4">
      {options.map(option => (
        <label key={option.value} className="flex items-center space-x-2 cursor-pointer group">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            className="form-radio h-4 w-4 text-yellow-500 bg-gray-900 border-yellow-500 focus:ring-yellow-400 cursor-pointer"
          />
          <span className="text-yellow-300 group-hover:text-yellow-400 transition">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  </div>
);

// --- Barcode Card Component ---
const BarcodeCard = ({ barcode, selected, onToggle }) => (
  <div
    onClick={() => onToggle(barcode.id)}
    className={`
      p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-between group
      ${selected 
        ? 'bg-red-600/20 border-2 border-red-500 shadow-lg shadow-red-500/20' 
        : 'bg-gray-800/50 border border-yellow-500/30 hover:border-yellow-400 hover:bg-gray-700'
      }
    `}
  >
    <span className="font-mono text-sm text-yellow-200 group-hover:text-yellow-100">
      {barcode.label}
    </span>
    {selected ? (
      <CheckCircle size={18} className="text-red-500" />
    ) : (
      <div className="w-4 h-4 rounded-full border-2 border-yellow-500/50 group-hover:border-yellow-400" />
    )}
  </div>
);

// --- Main Component ---
function RollbackBarcode() {
  // Token Retrieval
  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  // State Management
  const [formData, setFormData] = useState({
    country: "",
    state: "",
    partnerType: "Distributor",
    distributor: "",
    oem: "",
    dealer: "",
    barCode_Type: "All_Barcodes",
    element: "",
  });

  const [apiOptions, setApiOptions] = useState(INITIAL_API_OPTIONS);
  
  // Loading States
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [isLoadingDealers, setIsLoadingDealers] = useState(false);
  const [isLoadingBarcodes, setIsLoadingBarcodes] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  
  // Barcode Selection States
  const [availableBarcodes, setAvailableBarcodes] = useState([]);
  const [selectedBarcodes, setSelectedBarcodes] = useState([]);
  const [barcodeSearchTerm, setBarcodeSearchTerm] = useState("");
  const [lastFetchedParams, setLastFetchedParams] = useState(null);
  
  // UI States
  const [errors, setErrors] = useState({});

  // Filter states based on selected country
  const filteredStates = useMemo(() => {
    return MOCK_OPTIONS.statesByCountry[formData.country] || [];
  }, [formData.country]);

  // Check if all required fields for fetching are filled
  const isFetchReady = useMemo(() => {
    const hasBasicFields = formData.country && formData.state && formData.element && formData.barCode_Type;
    const hasPartner = formData.partnerType === "Distributor" 
      ? formData.distributor 
      : formData.oem;
    return hasBasicFields && hasPartner;
  }, [formData]);

  // Auto-fetch effect
  useEffect(() => {
    if (isFetchReady && !isLoadingBarcodes && !isRollingBack) {
      const currentParams = JSON.stringify({
        state: formData.state,
        element: formData.element,
        barCode_Type: formData.barCode_Type,
        partnerType: formData.partnerType,
        partnerId: formData.partnerType === "Distributor" ? formData.distributor : formData.oem
      });
      
      if (lastFetchedParams !== currentParams) {
        const timer = setTimeout(() => {
          fetchAllocatedBarcodes();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isFetchReady, formData.state, formData.element, formData.barCode_Type, 
      formData.distributor, formData.oem, formData.partnerType]);

  // Clear dependent fields when country changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      state: "",
      distributor: "",
      oem: "",
      dealer: "",
      element: "",
    }));
    setApiOptions(prev => ({
      ...prev,
      distributors: [],
      oems: [],
      dealers: [],
    }));
    setAvailableBarcodes([]);
    setSelectedBarcodes([]);
    setLastFetchedParams(null);
  }, [formData.country]);

  // Clear dealer and barcodes when partner changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, dealer: "" }));
    setApiOptions(prev => ({ ...prev, dealers: [] }));
    setAvailableBarcodes([]);
    setSelectedBarcodes([]);
    setLastFetchedParams(null);
  }, [formData.distributor, formData.oem, formData.partnerType]);

  // Clear barcodes when state, element, or barcode type changes
  useEffect(() => {
    setAvailableBarcodes([]);
    setSelectedBarcodes([]);
    setLastFetchedParams(null);
  }, [formData.state, formData.element, formData.barCode_Type]);

  // --- Fetch Element Data ---
  const fetchElementData = useCallback(async () => {
    if (!tkn) return;
    setIsLoadingOptions(true);
    try {
      const response = await axios.post(ELEMENT_DATA_API, {}, { headers: { Authorization: `Bearer ${tkn}` } });
      const rawData = response.data.elementData;
      const uniqueData = { elements: new Set() };
      
      if (Array.isArray(rawData)) {
        rawData.forEach(item => {
          if (item.elementName) uniqueData.elements.add(item.elementName);
        });
      }
      
      setApiOptions(prev => ({
        ...prev,
        elements: Array.from(uniqueData.elements).map(v => ({ value: v, label: v })),
      }));
    } catch (error) {
      toast.error("Failed to load element data.");
      console.error("Fetch element data error:", error.response?.data || error.message);
    } finally {
      setIsLoadingOptions(false);
    }
  }, [tkn]);

  // --- Fetch Distributors ---
  const fetchDistributors = useCallback(async (selectedState) => {
    if (!tkn || !selectedState) {
      setApiOptions(prev => ({ ...prev, distributors: [] }));
      return;
    }

    setIsLoadingPartners(true);
    try {
      const response = await axios.post(
        DISTRIBUTOR_API,
        { state: selectedState },
        { headers: { Authorization: `Bearer ${tkn}` } }
      );
      const rawData = response.data.dist || response.data;

      if (Array.isArray(rawData)) {
        const formattedDistributors = rawData
          .map(d => ({
            value: d._id,
            label: d.business_Name || d.name || d.userName || d._id
          }))
          .filter(d => d.value);

        setApiOptions(prev => ({ ...prev, distributors: formattedDistributors }));
      } else {
        setApiOptions(prev => ({ ...prev, distributors: [] }));
      }
    } catch (error) {
      toast.error("Failed to load distributors.");
      console.error("Fetch distributors error:", error.response?.data || error.message);
      setApiOptions(prev => ({ ...prev, distributors: [] }));
    } finally {
      setIsLoadingPartners(false);
    }
  }, [tkn]);

  // --- Fetch OEMs ---
  const fetchOems = useCallback(async () => {
    if (!tkn) return;
    
    setIsLoadingPartners(true);
    try {
      const response = await axios.post(OEM_API, {}, { 
        headers: { Authorization: `Bearer ${tkn}` } 
      });
      const rawData = response.data.oem || response.data;

      if (Array.isArray(rawData)) {
        const formattedOems = rawData
          .map(o => ({
            value: o._id,
            label: o.business_Name || o.userName || o._id
          }))
          .filter(o => o.value);

        setApiOptions(prev => ({ ...prev, oems: formattedOems }));
      } else {
        setApiOptions(prev => ({ ...prev, oems: [] }));
      }
    } catch (error) {
      toast.error("Failed to load OEMs.");
      console.error("Fetch OEMs error:", error.response?.data || error.message);
    } finally {
      setIsLoadingPartners(false);
    }
  }, [tkn]);

  // --- Fetch Dealers ---
  const fetchDealers = useCallback(async (partnerId, partnerType) => {
    if (!tkn || !partnerId) {
      setApiOptions(prev => ({ ...prev, dealers: [] }));
      return;
    }

    setIsLoadingDealers(true);
    setApiOptions(prev => ({ ...prev, dealers: [] }));

    const api = partnerType === 'Distributor' ? DEALER_UNDER_DISTRIBUTOR_API : DEALER_UNDER_OEM_API;
    const payload = partnerType === 'Distributor'
      ? { distributorIde: partnerId }
      : { oemId: partnerId };

    try {
      const response = await axios.post(api, payload, { 
        headers: { Authorization: `Bearer ${tkn}` } 
      });
      const rawData = response.data.deler || response.data.dealers || response.data.oem || [];

      if (Array.isArray(rawData)) {
        const formattedDealers = rawData
          .map(d => ({
            value: d._id,
            label: d.business_Name || d.userName || d._id
          }))
          .filter(d => d.value);

        setApiOptions(prev => ({ ...prev, dealers: formattedDealers }));
      } else {
        setApiOptions(prev => ({ ...prev, dealers: [] }));
      }
    } catch (error) {
      toast.error(`Failed to load Dealers for ${partnerType}.`);
      console.error(`Fetch dealers error for ${partnerType}:`, error.response?.data || error.message);
      setApiOptions(prev => ({ ...prev, dealers: [] }));
    } finally {
      setIsLoadingDealers(false);
    }
  }, [tkn]);

  // --- Fetch Allocated Barcodes ---
  const fetchAllocatedBarcodes = useCallback(async () => {
    if (!tkn) {
      toast.error("Authentication required.");
      return;
    }

    const partnerId = formData.partnerType === "Distributor" ? formData.distributor : formData.oem;
    
    setIsLoadingBarcodes(true);
    
    // Show loading toast
    const loadingToast = toast.loading("Fetching allocated barcodes...");
    
    try {
      const payload = {
        state: formData.state,
        barcodeType: formData.barCode_Type,
        element: formData.element,
        ...(formData.partnerType === "Distributor" 
          ? { distributorId: partnerId } 
          : { oemId: partnerId })
      };

      const response = await axios.post(FETCH_ALLOCATED_BARCODES_API, payload, {
        headers: { Authorization: `Bearer ${tkn}` }
      });

      // Handle the response structure
      let barcodes = [];
      
      if (response.data.allBarCodeNos && Array.isArray(response.data.allBarCodeNos)) {
        barcodes = response.data.allBarCodeNos.map(barcode => ({
          id: barcode,
          label: barcode
        }));
      }

      // Update last fetched params
      setLastFetchedParams(JSON.stringify({
        state: formData.state,
        element: formData.element,
        barCode_Type: formData.barCode_Type,
        partnerType: formData.partnerType,
        partnerId: partnerId
      }));

      if (barcodes.length === 0) {
        toast.dismiss(loadingToast);
        toast.custom((t) => (
          <div className="bg-yellow-500 text-black p-3 rounded-lg shadow-lg flex items-center gap-2">
            <AlertCircle size={18} />
            No allocated barcodes found for the selected criteria.
          </div>
        ), { duration: 3000 });
      } else {
        toast.success(`✅ Loaded ${barcodes.length} allocated barcodes!`, { id: loadingToast });
      }

      setAvailableBarcodes(barcodes.sort((a, b) => a.id.localeCompare(b.id)));
      setSelectedBarcodes([]);
      setBarcodeSearchTerm("");
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to fetch allocated barcodes.");
      console.error("Fetch barcodes error:", error.response?.data || error.message);
      setAvailableBarcodes([]);
    } finally {
      setIsLoadingBarcodes(false);
    }
  }, [tkn, formData.state, formData.element, formData.barCode_Type, formData.partnerType, formData.distributor, formData.oem]);

  // --- Initial Data Fetch ---
  useEffect(() => {
    if (tkn) {
      fetchElementData();
      fetchOems();
    }
  }, [tkn, fetchElementData, fetchOems]);

  // Trigger distributor fetch when state changes
  useEffect(() => {
    if (formData.state && formData.partnerType === "Distributor") {
      fetchDistributors(formData.state);
    }
  }, [formData.state, formData.partnerType, fetchDistributors]);

  // Trigger dealer fetch when distributor or oem changes
  useEffect(() => {
    const partnerId = formData.partnerType === "Distributor" ? formData.distributor : formData.oem;
    if (partnerId && formData.state) {
      fetchDealers(partnerId, formData.partnerType);
    } else {
      setApiOptions(prev => ({ ...prev, dealers: [] }));
      setFormData(prev => ({ ...prev, dealer: "" }));
    }
  }, [formData.distributor, formData.oem, formData.partnerType, formData.state, fetchDealers]);

  // Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "country") {
      setFormData(prev => ({
        ...prev,
        country: value,
        state: "",
        distributor: "",
        oem: "",
        dealer: "",
        element: "",
      }));
    } else if (name === "state") {
      setFormData(prev => ({
        ...prev,
        state: value,
        distributor: "",
        oem: "",
        dealer: "",
      }));
    } else if (name === "partnerType") {
      setFormData(prev => ({
        ...prev,
        partnerType: value,
        distributor: "",
        oem: "",
        dealer: "",
      }));
    } else if (name === "distributor" || name === "oem") {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        dealer: "",
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  // Toggle individual barcode selection
  const toggleBarcode = (barcodeId) => {
    if (selectedBarcodes.includes(barcodeId)) {
      setSelectedBarcodes(prev => prev.filter(id => id !== barcodeId));
      const barcode = availableBarcodes.find(b => b.id === barcodeId);
      if (barcode) {
        setAvailableBarcodes(prev => [...prev, barcode].sort((a, b) => a.id.localeCompare(b.id)));
      }
    } else {
      setSelectedBarcodes(prev => [...prev, barcodeId]);
      setAvailableBarcodes(prev => prev.filter(b => b.id !== barcodeId));
    }
  };

  // Move all to rollback
  const moveAllForward = () => {
    setSelectedBarcodes(prev => [...prev, ...availableBarcodes.map(b => b.id)]);
    setAvailableBarcodes([]);
    toast.success(`Moved ${availableBarcodes.length} barcodes to rollback list`);
  };

  // Move all back
  const moveAllBack = () => {
    setAvailableBarcodes(prev => [...prev, ...selectedBarcodes.map(id => ({ id, label: id }))].sort((a, b) => a.id.localeCompare(b.id)));
    setSelectedBarcodes([]);
    toast.info("Removed all barcodes from rollback list");
  };

  // Filter available barcodes based on search
  const filteredAvailableBarcodes = useMemo(() => {
    if (!barcodeSearchTerm.trim()) return availableBarcodes;
    return availableBarcodes.filter(barcode => 
      barcode.label.toLowerCase().includes(barcodeSearchTerm.toLowerCase())
    );
  }, [availableBarcodes, barcodeSearchTerm]);

  // Rollback Handler
  const handleRollback = async () => {
    if (selectedBarcodes.length === 0) {
      toast.error("Please select at least one barcode to rollback.");
      return;
    }

    const partnerId = formData.partnerType === "Distributor" ? formData.distributor : formData.oem;

    const payload = {
      state: formData.state,
      barcodeType: formData.barCode_Type,
      elementName: formData.element,
      barcodeList: selectedBarcodes,
      ...(formData.partnerType === "Distributor" 
        ? { distributorId: partnerId } 
        : { oemId: partnerId })
    };

    setIsRollingBack(true);
    const loadingToast = toast.loading(`Rolling back ${selectedBarcodes.length} barcode(s)...`);
    
    try {
      const response = await axios.post(ROLLBACK_API, payload, {
        headers: { Authorization: `Bearer ${tkn}` }
      });

      if (response.data.success) {
        toast.success(`✅ Successfully rolled back ${selectedBarcodes.length} barcode(s)!`, { id: loadingToast });
        
        // Clear selections and refresh
        setSelectedBarcodes([]);
        await fetchAllocatedBarcodes();
      } else {
        toast.error(response.data.message || "Rollback failed.", { id: loadingToast });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "An error occurred during rollback.";
      toast.error(errorMessage, { id: loadingToast });
      console.error("Rollback error:", error.response?.data || error.message);
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white">
      <Toaster position="top-right" reverseOrder={false} />
      <ManufactureNavbar />

      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            🔄 Rollback Allocated Barcodes
          </h1>
          <p className="text-gray-400 mt-2">Select barcodes and roll them back to the available pool</p>
        </div>

        {/* Filter Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-yellow-500/30 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Country */}
            <SelectField
              id="country"
              label="Country"
              value={formData.country}
              onChange={handleChange}
              options={MOCK_OPTIONS.countries}
              required
              error={errors.country}
              
            />

            {/* State */}
            <SelectField
              id="state"
              label="State"
              value={formData.state}
              onChange={handleChange}
              options={filteredStates}
              required
              disabled={!formData.country}
              error={errors.state}
             
            />

            {/* Partner Type Radio */}
            <div className="col-span-1 lg:col-span-2">
              <RadioGroup
                label="Partner Type"
                name="partnerType"
                value={formData.partnerType}
                onChange={handleChange}
                options={[
                  { value: "Distributor", label: "Distributor" },
                  { value: "OEM", label: "OEM" }
                ]}
              />
            </div>

            {/* Distributor or OEM */}
            {formData.partnerType === "Distributor" ? (
              <SelectField
                id="distributor"
                label="Distributor"
                value={formData.distributor}
                onChange={handleChange}
                options={apiOptions.distributors}
                required
                disabled={!formData.state || isLoadingPartners}
                isLoading={isLoadingPartners}
                error={errors.distributor}
               
              />
            ) : (
              <SelectField
                id="oem"
                label="OEM"
                value={formData.oem}
                onChange={handleChange}
                options={apiOptions.oems}
                required
                disabled={!formData.state || isLoadingPartners}
                isLoading={isLoadingPartners}
                error={errors.oem}
                
              />
            )}

            {/* Dealer (Optional) */}
            <SelectField
              id="dealer"
              label="Dealer (Optional)"
              value={formData.dealer}
              onChange={handleChange}
              options={[{ value: "", label: "None" }, ...apiOptions.dealers]}
              disabled={!formData.state || (!formData.distributor && !formData.oem) || isLoadingDealers}
              isLoading={isLoadingDealers}
             
            />

            {/* Element */}
            <SelectField
              id="element"
              label="Element"
              value={formData.element}
              onChange={handleChange}
              options={apiOptions.elements}
              required
              disabled={isLoadingOptions}
              isLoading={isLoadingOptions}
              error={errors.element}
              
            />

            {/* Barcode Type */}
            <SelectField
              id="barCode_Type"
              label="Barcode Type"
              value={formData.barCode_Type}
              onChange={handleChange}
              options={MOCK_OPTIONS.barCodeTypes}
              required
              error={errors.barCode_Type}
              
            />
          </div>

          {/* Auto-fetch Indicator */}
          {isFetchReady && !isLoadingBarcodes && availableBarcodes.length === 0 && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2 text-yellow-400">
              <Loader className="animate-spin" size={16} />
              <span className="text-sm">Auto-fetching barcodes...</span>
            </div>
          )}
        </div>

        {/* Barcode Selection Section */}
        {(availableBarcodes.length > 0 || selectedBarcodes.length > 0) && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-yellow-500/30">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                <Barcode size={24} />
                Barcode Selection
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={fetchAllocatedBarcodes}
                  disabled={isLoadingBarcodes}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition flex items-center gap-2 text-yellow-300"
                >
                  <RefreshCw size={16} className={isLoadingBarcodes ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Available Barcodes Column */}
              <div className="flex-1">
                <div className="bg-gray-900/50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-yellow-300 flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      Allocated Barcodes
                      <span className="text-sm bg-gray-700 px-2 py-0.5 rounded-full">{availableBarcodes.length}</span>
                    </h3>
                    {availableBarcodes.length > 0 && (
                      <button
                        onClick={moveAllForward}
                        className="text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-3 py-1 rounded-lg transition flex items-center gap-1"
                      >
                        Move All <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-yellow-400" />
                    <input
                      type="text"
                      placeholder="Search barcode..."
                      value={barcodeSearchTerm}
                      onChange={(e) => setBarcodeSearchTerm(e.target.value)}
                      className="w-full p-2 pl-9 border border-yellow-500/30 rounded-lg bg-gray-900 text-yellow-200 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                    />
                  </div>
                  
                  {/* Barcode Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto custom-scrollbar">
                    {filteredAvailableBarcodes.map(barcode => (
                      <BarcodeCard
                        key={barcode.id}
                        barcode={barcode}
                        selected={false}
                        onToggle={toggleBarcode}
                      />
                    ))}
                    {filteredAvailableBarcodes.length === 0 && (
                      <div className="col-span-2 text-center py-8 text-gray-500">
                        No barcodes found
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Transfer Controls */}
              <div className="flex lg:flex-col justify-center items-center gap-4 py-4">
                <button
                  onClick={moveAllForward}
                  disabled={availableBarcodes.length === 0}
                  className="p-3 w-12 h-12 rounded-full bg-yellow-500 text-black hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all hover:scale-110"
                  title="Move all to rollback"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <button
                  onClick={moveAllBack}
                  disabled={selectedBarcodes.length === 0}
                  className="p-3 w-12 h-12 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all hover:scale-110"
                  title="Remove all from rollback"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </div>

              {/* Selected Barcodes Column */}
              <div className="flex-1">
                <div className="bg-gray-900/50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-red-400 flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      Selected for Rollback
                      <span className="text-sm bg-gray-700 px-2 py-0.5 rounded-full">{selectedBarcodes.length}</span>
                    </h3>
                    {selectedBarcodes.length > 0 && (
                      <button
                        onClick={moveAllBack}
                        className="text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded-lg transition flex items-center gap-1"
                      >
                        <ArrowLeft size={14} /> Remove All
                      </button>
                    )}
                  </div>
                  
                  {/* Selected Barcodes Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto custom-scrollbar">
                    {selectedBarcodes.map(barcodeId => (
                      <BarcodeCard
                        key={barcodeId}
                        barcode={{ id: barcodeId, label: barcodeId }}
                        selected={true}
                        onToggle={toggleBarcode}
                      />
                    ))}
                    {selectedBarcodes.length === 0 && (
                      <div className="col-span-2 text-center py-8 text-gray-500">
                        No barcodes selected for rollback
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Rollback Button */}
            <div className="mt-6 pt-4 border-t border-yellow-500/30 flex justify-end">
              <button
                onClick={handleRollback}
                disabled={selectedBarcodes.length === 0 || isRollingBack}
                className={`
                  flex items-center justify-center gap-3 px-8 py-3 rounded-xl font-bold text-black transition-all duration-200
                  ${selectedBarcodes.length === 0 || isRollingBack
                    ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-red-500/50 transform hover:scale-105'}
                `}
              >
                {isRollingBack ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Rolling Back {selectedBarcodes.length} Barcode(s)...
                  </>
                ) : (
                  <>
                    <RefreshCw size={20} />
                    Rollback Selected Barcodes ({selectedBarcodes.length})
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoadingBarcodes && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-12 border border-yellow-500/30 text-center">
            <Loader className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-spin" />
            <p className="text-xl font-semibold text-yellow-400">Loading Barcodes...</p>
            <p className="text-gray-400 mt-2">Please wait while we fetch the allocated barcodes.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingBarcodes && isFetchReady && availableBarcodes.length === 0 && selectedBarcodes.length === 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-12 border border-yellow-500/30 text-center">
            <Ban className="w-20 h-20 text-yellow-400 mx-auto mb-4 opacity-50" />
            <p className="text-2xl font-semibold text-yellow-400">No Allocated Barcodes Found</p>
            <p className="text-gray-400 mt-2">Try changing the filters or check back later.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #eab308;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ca8a04;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}

// Missing Barcode icon import
const Barcode = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 7v10M6 7v10M9 7v10M12 7v10M15 7v10M18 7v10M21 7v10"/>
  </svg>
);

export default RollbackBarcode;