import React, { useState, useMemo, useEffect, useCallback, useContext } from "react";
import { ChevronRight, ChevronLeft, AlertCircle, RefreshCw, Loader, Ban, Briefcase, User, Calendar, Tag, Barcode } from "lucide-react";
import axios from 'axios';
import ManufactureNavbar from "./ManufactureNavbar";
import toast, { Toaster } from "react-hot-toast";

// --- MOCK Context for Token Retrieval (Essential for compilation) ---
const UserAppContext = React.createContext({
  token: localStorage.getItem("token") || "MOCK_TOKEN_12345", // Mock fallback
});
// If you are sure you have the correct context file, uncomment this and remove the mock:
// import { UserAppContext } from "../contexts/UserAppProvider"; 


// --- API Endpoints (Updated) ---
const ELEMENT_DATA_API = "https://api.websave.in/api/manufactur/fetchElementData";
const AVAILABLE_BARCODES_API = "https://api.websave.in/api/manufactur/fetchAllBarCode";
const DISTRIBUTOR_API = "https://api.websave.in/api/manufactur/findDistributorUnderManufactur";
const OEM_API = "https://api.websave.in/api/manufactur/findOemUnderManufactur";
const DEALER_UNDER_DISTRIBUTOR_API = "https://api.websave.in/api/manufactur/findDelerUnderDistributor";
const DEALER_UNDER_OEM_API = "https://api.websave.in/api/manufactur/findDelerUnderOem";
const ALLOCATE_API = "https://api.websave.in/api/manufactur/AllocateBarCode";
const ALLOCATED_DATA_API = "https://api.websave.in/api/manufactur/fetchAllAllocatedBarcode";


// --- Utility: Date Formatter ---
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateString.substring(0, 10); // Fallback to YYYY-MM-DD
  }
};


// --- Reusable Modal Component (Kept as is) ---
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 text-yellow-400 rounded-xl shadow-2xl max-h-[95vh] overflow-y-auto w-full max-w-5xl transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-gray-900 p-6 border-b border-yellow-500 rounded-t-xl z-10 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-yellow-400">{title}</h3>
          <button
            onClick={onClose}
            className="text-yellow-300 hover:text-red-500 transition p-1 rounded-full hover:bg-gray-800"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// --- Mock/Static Data (Kept as is) ---
const MOCK_OPTIONS = {
  countries: [
    { value: "US", label: "United States" },
    { value: "IN", label: "India" },
    { value: "UK", label: "United Kingdom" },
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
};

const INITIAL_API_OPTIONS = {
  elements: [],
  elementTypes: [],
  modelNos: [],
  partNos: [],
  distributors: [],
  oems: [],
  dealers: [],
  voltages: [
    { value: "12V", label: "12V" },
    { value: "24V", label: "24V" },
    { value: "48V", label: "48V" },
    { value: "110V", label: "110V" },
    { value: "230V", label: "230V" },
  ],
  types: [
    { value: "NEW", label: "NEW" },
    { value: "USED", label: "USED" },
  ],
};

// --- Main Component ---
function AllocateBarcode() {
  // 1. Token Retrieval
  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  const [showModal, setShowModal] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isLoadingBarcodes, setIsLoadingBarcodes] = useState(false);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [isLoadingDealers, setIsLoadingDealers] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocatedData, setAllocatedData] = useState([]);
  const [isLoadingAllocatedData, setIsLoadingAllocatedData] = useState(false);
  const [apiOptions, setApiOptions] = useState(INITIAL_API_OPTIONS);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");


  const [formData, setFormData] = useState({
    country: "",
    state: "",
    selectionType: "Distributor",
    distributor: "",
    oem: "",
    dealer: "", // Dealer ID
    element: "",
    elementType: "",
    modelNo: "",
    voltage: "",
    partNo: "",
    type: "NEW",
  });

  const [availableBarcodes, setAvailableBarcodes] = useState([]);
  const [allocatedBarcodes, setAllocatedBarcodes] = useState([]);
  const [errors, setErrors] = useState({});
  const [selectedAvailable, setSelectedAvailable] = useState([]);
  const [selectedAllocated, setSelectedAllocated] = useState([]);

  // Filter states based on selected country
  const filteredStates = useMemo(() => {
    return MOCK_OPTIONS.statesByCountry[formData.country] || [];
  }, [formData.country]);

  // Clear state and partners when country changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      state: "",
      distributor: "", // Clear distributor/OEM selection
      oem: "",
      dealer: "",
    }));
    setApiOptions((prev) => ({
      ...prev,
      distributors: [], // Clear distributor options
      dealers: [],
    }));
  }, [formData.country]);

  // Clear dealer when distributor or oem changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, dealer: "" }));
    setApiOptions((prev) => ({ ...prev, dealers: [] }));
  }, [formData.distributor, formData.oem]);


  // Helper to find the partner name by ID for table rendering
  const getPartnerName = useCallback((id, type) => {
    if (!id) return 'N/A';

    let options = [];
    if (type === 'Distributor') options = apiOptions.distributors;
    else if (type === 'OEM') options = apiOptions.oems;
    else if (type === 'Dealer') options = apiOptions.dealers;

    // Look up the name from the currently loaded options
    const partner = options.find(p => p.value === id);
    return partner ? partner.label : id;
  }, [apiOptions.distributors, apiOptions.oems, apiOptions.dealers]);

  // --- API Fetch Allocated Barcode Data ---
  const fetchAllAllocatedData = useCallback(async () => {
    if (!tkn) {
      return;
    }
    setIsLoadingAllocatedData(true);
    try {
      const response = await axios.post(
        ALLOCATED_DATA_API,
        {},
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
          },
        }

      );

      const rawData = response.data.allAllocatedBarcodes || [];
      console.log("Allocated Data:", rawData)

      if (Array.isArray(rawData)) {
        setAllocatedData(rawData);
      } else {
        console.error("Allocated barcodes API did not return a valid array:", response.data);
        setAllocatedData([]);
      }

    } catch (error) {
      toast.error("Failed to load allocated barcode data.");
      console.error("Fetch allocated data error:", error.response?.data || error.message);
      setAllocatedData([]);
    } finally {
      setIsLoadingAllocatedData(false);
    }
  }, [tkn]);

  // --- API Fetch Element Data, Available Barcodes (Kept as is) ---
  const fetchElementData = useCallback(async () => {
    if (!tkn) {
      return;
    }
    setIsLoadingOptions(true);
    try {
      const response = await axios.post(ELEMENT_DATA_API, {}, { headers: { Authorization: `Bearer ${tkn}` } });
      const rawData = response.data.elementData;
      const uniqueData = { elements: new Set(), elementTypes: new Set(), modelNos: new Set(), partNos: new Set() };
      if (Array.isArray(rawData)) {
        rawData.forEach(item => {
          if (item.elementName) uniqueData.elements.add(item.elementName);
          if (item.elementType) uniqueData.elementTypes.add(item.elementType);
          if (item.model_No) uniqueData.modelNos.add(item.model_No);
          if (item.device_Part_No) uniqueData.partNos.add(item.device_Part_No);
        });
      }
      setApiOptions(prev => ({
        ...prev,
        elements: Array.from(uniqueData.elements).map(v => ({ value: v, label: v })),
        elementTypes: Array.from(uniqueData.elementTypes).map(v => ({ value: v, label: v })),
        modelNos: Array.from(uniqueData.modelNos).map(v => ({ value: v, label: v })),
        partNos: Array.from(uniqueData.partNos).map(v => ({ value: v, label: v })),
      }));
    } catch (error) {
      toast.error("Failed to load product specification data.");
      console.error("Fetch element data error:", error.response?.data || error.message);
    } finally {
      setIsLoadingOptions(false);
    }
  }, [tkn]);

  const fetchAvailableBarcodes = useCallback(async () => {
    if (!tkn) {
      return;
    }
    setIsLoadingBarcodes(true);
    try {
      const response = await axios.post(
        AVAILABLE_BARCODES_API,
        {},
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
          },
        }
      );
      const rawBarcodes = response.data.allBarCods;
      if (Array.isArray(rawBarcodes)) {
        const formattedBarcodes = rawBarcodes
          .map(item => ({
            id: item.barCodeNo,
            label: item.barCodeNo,
          }))
          .filter(b => b.id)
          .sort((a, b) => a.id.localeCompare(b.id));

        setAvailableBarcodes(formattedBarcodes);
      } else {
        console.error("Available barcodes API did not return a valid array:", rawBarcodes);
        setAvailableBarcodes([]);
      }
    } catch (error) {
      toast.error("Failed to load available barcodes.");
      console.error("Fetch barcodes error:", error.response?.data || error.message);
      setAvailableBarcodes([]);
    } finally {
      setIsLoadingBarcodes(false);
    }
  }, [tkn]);

  // 💡 UPDATED: Fetch Distributors based on selected state
  const fetchDistributors = useCallback(async (selectedState) => {
    if (!tkn || !selectedState) {
      setApiOptions(prev => ({ ...prev, distributors: [] }));
      setFormData(prev => ({ ...prev, distributor: "" }));
      return;
    }

    setIsLoadingPartners(true);
    try {
      const response = await axios.post(
        DISTRIBUTOR_API,
        { state: selectedState }, // 💡 Pass state in request body
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

  const fetchOems = useCallback(async () => {
    if (!tkn) return;
    setIsLoadingPartners(true);
    try {
      const response = await axios.post(OEM_API, {}, { headers: { Authorization: `Bearer ${tkn}` } });
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

  const fetchDealers = useCallback(async (partnerId, partnerType) => {
    if (!tkn || !partnerId) {
      setApiOptions(prev => ({ ...prev, dealers: [] }));
      setFormData(prev => ({ ...prev, dealer: "" }));
      return;
    }

    setIsLoadingDealers(true);
    setApiOptions(prev => ({ ...prev, dealers: [] }));
    setFormData(prev => ({ ...prev, dealer: "" })); // Clear selected dealer

    const api = partnerType === 'Distributor' ? DEALER_UNDER_DISTRIBUTOR_API : DEALER_UNDER_OEM_API;
    const payload = partnerType === 'Distributor'
      ? { distributorIde: partnerId }
      : { oemId: partnerId };

    try {
      const response = await axios.post(api, payload, { headers: { Authorization: `Bearer ${tkn}` } });
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
        console.error(`Dealers API for ${partnerType} did not return a valid array:`, rawData);
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


  // --- Initial Data Fetch Effect (Modified to remove fetchDistributors) ---
  useEffect(() => {
    if (tkn) {
      fetchElementData();
      fetchAvailableBarcodes();
      fetchOems(); // OEMs are not state-dependent, so fetch here
      fetchAllAllocatedData();
    }
  }, [tkn, fetchElementData, fetchAvailableBarcodes, fetchOems, fetchAllAllocatedData]);


  // 💡 NEW useEffect: Trigger distributor fetch when state changes
  useEffect(() => {
    if (formData.state) {
      fetchDistributors(formData.state);
    } else {
      // Clear distributors if state is cleared
      setApiOptions(prev => ({ ...prev, distributors: [] }));
      setFormData(prev => ({ ...prev, distributor: "" }));
    }
  }, [formData.state, fetchDistributors]);


  // Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "selectionType") {
      setFormData((prev) => ({
        ...prev,
        distributor: "",
        oem: "",
        dealer: "",
        selectionType: newValue,
      }));
      setApiOptions((prev) => ({ ...prev, dealers: [] }));
      setErrors((prev) => ({ ...prev, distributor: "", oem: "", dealer: "" }));
      return;
    }

    // Clear partner/dealer/dealer options if country/state changes
    if (name === "country") {
      setFormData((prev) => ({
        ...prev,
        country: newValue,
        state: "",
        distributor: "",
        oem: "",
        dealer: "",
      }));
      setApiOptions((prev) => ({ ...prev, distributors: [], dealers: [] }));
      setErrors((prev) => ({ ...prev, country: "", state: "", distributor: "", oem: "", dealer: "" }));
      return;
    }

    if (name === "state") {
      setFormData((prev) => ({
        ...prev,
        state: newValue,
        distributor: "",
        dealer: "",
      }));
      setApiOptions((prev) => ({ ...prev, distributors: [], dealers: [] }));
      setErrors((prev) => ({ ...prev, state: "", distributor: "", oem: "", dealer: "" }));
      return;
    }

    if (name === "distributor" || name === "oem") {
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
        dealer: ""
      }));
      setApiOptions((prev) => ({ ...prev, dealers: [] }));
      setErrors((prev) => ({ ...prev, [name]: "", dealer: "" }));
      return;
    }

    setErrors((prev) => ({ ...prev, [name]: "" }));
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  // Effect to trigger dealer fetch when distributor or oem changes
  useEffect(() => {
    const partnerId = formData.selectionType === "Distributor" ? formData.distributor : formData.oem;
    const partnerType = formData.selectionType;

    if (partnerId) {
      fetchDealers(partnerId, partnerType);
    } else {
      setApiOptions(prev => ({ ...prev, dealers: [] }));
      setFormData(prev => ({ ...prev, dealer: "" }));
    }
  }, [formData.distributor, formData.oem, formData.selectionType, fetchDealers]);


  // Define required fields for validation
  const requiredFields = useMemo(
    () => [
      "element", "elementType", "modelNo", "voltage", "partNo", "type",
    ],
    []
  );

  // Select multiple handler
  const handleSelectChange = (e, setSelectedState) => {
    const values = Array.from(e.target.options)
      .filter((o) => o.selected)
      .map((o) => o.value);
    setSelectedState(values);
  };

  // Move forward/back (barcode transfer)
  const moveForward = () => {
    const selectedCodes = new Set(selectedAvailable);
    const itemsToMove = availableBarcodes.filter((bc) => selectedCodes.has(bc.id));
    setAvailableBarcodes((prev) => prev.filter((bc) => !selectedCodes.has(bc.id)));
    setAllocatedBarcodes((prev) => [...prev, ...itemsToMove].sort((a, b) => a.id.localeCompare(b.id)));
    setSelectedAvailable([]);
  };

  const moveBack = () => {
    const selectedCodes = new Set(selectedAllocated);
    const itemsToMove = allocatedBarcodes.filter((bc) => selectedCodes.has(bc.id));
    setAllocatedBarcodes((prev) => prev.filter((bc) => !selectedCodes.has(bc.id)));
    setAvailableBarcodes((prev) => [...prev, ...itemsToMove].sort((a, b) => a.id.localeCompare(b.id)));
    setSelectedAllocated([]);
  };

  // --- ALLOCATE FUNCTION (Kept as is) ---
  const handleAllocate = async () => {
    let newErrors = {};

    requiredFields.forEach((field) => {
      if (!formData[field]) newErrors[field] = "This field is required.";
    });

    if (!formData.country) newErrors.country = "Country is required.";
    if (!formData.state) newErrors.state = "State is required.";
    if (!formData.dealer) newErrors.dealer = "Dealer is required.";

    let distributorId = "";
    let oemId = "";

    if (formData.selectionType === "Distributor") {
      if (!formData.distributor) {
        newErrors.distributor = "Distributor is required.";
      } else {
        distributorId = formData.distributor;
      }
    } else if (formData.selectionType === "OEM") {
      if (!formData.oem) {
        newErrors.oem = "OEM is required.";
      } else {
        oemId = formData.oem;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill all required fields.");
      return;
    }

    const selectedBarcodesArray = allocatedBarcodes.map((o) => o.id);

    if (selectedBarcodesArray.length === 0) {
      toast.error("Please allocate at least one barcode.");
      return;
    }

    const payload = {
      country: formData.country,
      state: formData.state,
      checkBoxValue: formData.selectionType,
      distributor: formData.selectionType === "Distributor" ? distributorId : "",
      oem: formData.selectionType === "OEM" ? oemId : "",
      deler: formData.dealer,
      element: formData.element,
      elementType: formData.elementType,
      modelNo: formData.modelNo,
      Voltege: formData.voltage,
      partNo: formData.partNo,
      type: formData.type,
      barcodes: selectedBarcodesArray,
    };

    setIsAllocating(true);
    try {
      const response = await axios.post(ALLOCATE_API, payload, {
        headers: { Authorization: `Bearer ${tkn}` },
      });

      if (response.data.success) {
        toast.success(response.data.message || `Allocation successful for ${selectedBarcodesArray.length} barcodes!`);
        setShowModal(false);

        // Reset state after successful allocation
        setAllocatedBarcodes([]);
        setFormData((prev) => ({
          ...prev,
          distributor: "",
          oem: "",
          dealer: "",
          country: "",
          state: "",
        }));
        setApiOptions((prev) => ({ ...prev, distributors: [], dealers: [] }));
        fetchAvailableBarcodes();
        fetchAllAllocatedData();
      } else {
        toast.error(response.data.message || "Allocation failed. Please check server logs.");
      }

    } catch (error) {
      const errorMessage = error.response?.data?.message || "An error occurred during allocation.";
      toast.error(errorMessage);
      console.error("Allocation error:", error.response?.data || error.message);
    } finally {
      setIsAllocating(false);
    }
  };

  const SelectField = ({ id, label, options, required = false, disabled = false, isPartner = false, isDealer = false }) => {
    const isError = !!errors[id];
    // Special handling for partner loading state
    const isLoading = isPartner ? (id === 'distributor' && formData.selectionType === 'Distributor' ? isLoadingPartners : (id === 'oem' && formData.selectionType === 'OEM' ? isLoadingPartners : false)) : (isDealer ? isLoadingDealers : isLoadingOptions);

    return (
      <div className="flex-grow min-w-[200px]">
        <label
          htmlFor={id}
          className="block font-semibold text-sm text-yellow-300 mb-1"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          id={id}
          name={id}
          value={formData[id]}
          onChange={handleChange}
          disabled={disabled || isLoading}
          className={`w-full p-2 border rounded-lg bg-gray-800 text-yellow-200 focus:ring-2 focus:ring-yellow-500 transition duration-150 ${isError ? "border-red-500" : "border-yellow-500"
            } ${disabled || isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <option value="">
            {isLoading
              ? "Loading..."
              : `Select ${label}`
            }
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {isError && (
          <p className="text-red-500 text-xs mt-1 flex items-center">
            <AlertCircle size={12} className="mr-1" />
            {errors[id]}
          </p>
        )}
      </div>
    );
  };

  const AllocationFormContent = (
    <div className="space-y-6">
      {/* Country and State Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <SelectField id="country" label="Country" options={MOCK_OPTIONS.countries} required />
        <SelectField id="state" label="State" options={filteredStates} required disabled={!formData.country} />
      </div>

      {/* Selection Type Radio Group */}
      <div className="bg-gray-800 p-4 border border-yellow-500 rounded-lg flex flex-wrap gap-6">
        <span className="text-yellow-300 font-semibold w-full block">Select Partner Type:</span>
        <label className="flex items-center space-x-3">
          <input type="radio" name="selectionType" value="Distributor" checked={formData.selectionType === "Distributor"} onChange={handleChange} className="form-radio h-5 w-5 text-yellow-500 bg-gray-900 border-yellow-500 rounded-full focus:ring-yellow-400" />
          <span className="text-yellow-300">Distributor</span>
        </label>
        <label className="flex items-center space-x-3">
          <input type="radio" name="selectionType" value="OEM" checked={formData.selectionType === "OEM"} onChange={handleChange} className="form-radio h-5 w-5 text-yellow-500 bg-gray-900 border-yellow-500 rounded-full focus:ring-yellow-400" />
          <span className="text-yellow-300">OEM</span>
        </label>
      </div>

      {/* Partner/Dealer Fields */}
      <h4 className="text-xl font-bold text-yellow-400 border-b border-yellow-600 pb-2 mt-6">Partner Details {isLoadingPartners && "(Loading Partners...)"}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {formData.selectionType === "Distributor" ? (
          // 💡 Distributor is disabled until state is selected
          <SelectField id="distributor" label="Distributor" options={apiOptions.distributors} required isPartner disabled={!formData.state} />
        ) : (
          <SelectField id="oem" label="OEM" options={apiOptions.oems} required isPartner disabled={!formData.country || !formData.state} />
        )}

        <SelectField
          id="dealer"
          label={`Dealer (Under ${formData.selectionType})`}
          options={apiOptions.dealers}
          required
          isDealer
          disabled={!formData.country || !formData.state || (formData.selectionType === "Distributor" && !formData.distributor) || (formData.selectionType === "OEM" && !formData.oem)}
        />
      </div>

      {/* Specs */}
      <h4 className="text-xl font-bold text-yellow-400 border-b border-yellow-600 pb-2 mt-6">Product Specifications {isLoadingOptions && "(Loading Data...)"}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SelectField id="element" label="Element" options={apiOptions.elements} required />
        <SelectField id="elementType" label="Element Type" options={apiOptions.elementTypes} required />
        <SelectField id="modelNo" label="Model No" options={apiOptions.modelNos} required />
        <SelectField id="voltage" label="Voltage" options={apiOptions.voltages} required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SelectField id="partNo" label="Part No" options={apiOptions.partNos} required />
        <SelectField id="type" label="Type" options={apiOptions.types} required />
      </div>

      {/* Barcode Allocation */}
      <h4 className="text-xl font-bold text-yellow-400 border-b border-yellow-600 pb-2 mt-6">Barcode Selection</h4>
      <div className="bg-gray-800 p-4 border border-yellow-500 rounded-lg shadow-inner">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-5/12">
            <div className="font-bold text-yellow-300 mb-2">
              Available Barcodes ({availableBarcodes.length})
              {isLoadingBarcodes && <span className="ml-2 text-sm text-gray-500">Loading...</span>}
            </div>
            <select
              multiple
              className="w-full h-48 p-3 border border-yellow-400 rounded-lg bg-gray-900 text-yellow-200 text-sm shadow-md"
              onChange={(e) => handleSelectChange(e, setSelectedAvailable)}
              value={selectedAvailable}
              disabled={isLoadingBarcodes}
            >
              {availableBarcodes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-2/12 flex md:flex-col justify-center items-center gap-4">
            <button
              onClick={moveForward}
              disabled={selectedAvailable.length === 0}
              className="p-3 w-12 h-12 rounded-full bg-yellow-500 text-black hover:bg-yellow-600 disabled:bg-gray-600"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <button
              onClick={moveBack}
              disabled={selectedAllocated.length === 0}
              className="p-3 w-12 h-12 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-600"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          <div className="w-full md:w-5/12">
            <div className="font-bold text-yellow-300 mb-2">
              Allocated Barcodes (
              <span className="text-yellow-500">{allocatedBarcodes.length}</span>)
            </div>
            <select
              multiple
              className="w-full h-48 p-3 border border-yellow-400 rounded-lg bg-gray-900 text-yellow-200 text-sm shadow-md"
              onChange={(e) => handleSelectChange(e, setSelectedAllocated)}
              value={selectedAllocated}
            >
              {allocatedBarcodes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Confirm */}
      <div className="mt-6 pt-4 border-t border-yellow-500 text-right">
        <button
          onClick={handleAllocate}
          disabled={isAllocating}
          className="px-8 py-3 bg-yellow-500 text-black font-bold rounded-xl shadow-lg hover:bg-yellow-600 transition disabled:bg-gray-600 disabled:text-gray-400"
        >
          {isAllocating ? "Allocating..." : "Confirm Allocation"}
        </button>
      </div>
    </div>
  );

  // --- Table Filtering and Pagination ---
  const filteredAllocatedData = useMemo(() => {
    return allocatedData.filter(item => {
      // Safely access nested array
      const barcodeList = item.allocatedBarCode || [];
      const primaryBarcode = barcodeList[0]?.barCodeNo || '';

      return primaryBarcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contact_Person_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.status?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [allocatedData, searchTerm]);

  const totalPages = Math.ceil(filteredAllocatedData.length / rowsPerPage);
  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * rowsPerPage;
    const lastPageIndex = firstPageIndex + rowsPerPage;
    return filteredAllocatedData.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, rowsPerPage, filteredAllocatedData]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Toaster position="top-right" reverseOrder={false} />
      <ManufactureNavbar />

      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-extrabold text-yellow-400 mb-8 border-b-2 border-yellow-500 pb-2">
          Barcode Allocation Management
        </h1>

        {/* Action Buttons and Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg hover:bg-yellow-600 transition shadow-lg w-full sm:w-auto justify-center"
          >
            Allocate New Barcode
            <Barcode size={20} className="ml-2" />
          </button>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by Barcode, Contact, or Status..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="p-2 border border-yellow-500 rounded-lg bg-gray-800 text-yellow-200 focus:ring-2 focus:ring-yellow-500 w-full"
            />
            <button
              onClick={fetchAllAllocatedData}
              disabled={isLoadingAllocatedData}
              className="p-2 bg-gray-800 border border-yellow-500 rounded-lg text-yellow-400 hover:bg-gray-700 disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw size={20} className={isLoadingAllocatedData ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* --- Allocated Barcodes Table --- */}
        <h2 className="text-2xl font-bold text-yellow-300 mb-4 mt-8">Allocated Barcodes History</h2>
        <div className="bg-gray-800 p-4 rounded-xl shadow-2xl overflow-x-auto">
          {isLoadingAllocatedData ? (
            <div className="flex justify-center items-center py-10 text-yellow-400">
              <Loader className="w-8 h-8 animate-spin mr-3" />
              Loading Allocated Data...
            </div>
          ) : allocatedData.length === 0 ? (
            <div className="flex justify-center items-center py-10 text-yellow-400">
              <Ban className="w-6 h-6 mr-2" />
              No allocated barcodes found.
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-yellow-600">
                <thead className="bg-gray-700 sticky top-0">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-yellow-300 uppercase tracking-wider">
                      <Briefcase size={14} className="inline mr-1" /> Distributor & OEM
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-yellow-300 uppercase tracking-wider">
                      <User size={14} className="inline mr-1" />Dealer
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-yellow-300 uppercase tracking-wider">
                      <Barcode size={14} className="inline mr-1" /> Barcode(s)
                    </th>


                    <th className="py-3 px-4 text-left text-xs font-medium text-yellow-300 uppercase tracking-wider">
                      <Calendar size={14} className="inline mr-1" /> Allocated Date
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-yellow-300 uppercase tracking-wider">
                      <Tag size={14} className="inline mr-1" /> Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-700">
                  {currentTableData.map((item, index) => {
                  const barcodeCount = item.allocatedBarCode?.length || 0;
const primaryBarcode = item.allocatedBarCode?.[0]?.barCodeNo || "N/A";
const partnerName = item.allocatedDistributorId?.contact_Person_Name
  ? `${item.allocatedDistributorId.contact_Person_Name} (Distributor)`
  : item.allocatedOemId?.contact_Person_Name
  ? `${item.allocatedOemId.contact_Person_Name} (OEM)`
  : "NA";




                    const partnerType = item.delerName || 'N/A'; // Using contact_Person_Name as requested

                    return (
                      <tr key={item._id} className="hover:bg-gray-700 transition duration-150">
                        <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-yellow-200">
                          {partnerName}
                        </td>


                        <td className="py-4 px-4 whitespace-nowrap text-xs text-yellow-200">
                          <span className={`px-2 py-0.5 rounded-full text-black font-semibold text-xs ${partnerType === 'Distributor' ? 'bg-blue-400' : (partnerType === 'OEM' ? 'bg-green-400' : 'bg-red-400')}`}>
                            {partnerType}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm text-yellow-100">
                          {primaryBarcode} {barcodeCount > 1 ? `(+${barcodeCount - 1} more)` : ''}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-sm text-yellow-200">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          {item.allocatedBarCode.map((i, index) => (
                            <span
                              key={index}
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${i.status === "used" ? "bg-red-500 text-white" : "bg-green-500 text-white"
                                }`}
                            >
                              {i.status.toUpperCase()}
                            </span>
                          ))}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-yellow-700">
                <span className="text-sm text-yellow-300">
                  Showing {currentTableData.length} of {filteredAllocatedData.length} results
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-yellow-500 rounded-lg text-yellow-400 hover:bg-gray-700 disabled:opacity-50"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-yellow-400 font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 border border-yellow-500 rounded-lg text-yellow-400 hover:bg-gray-700 disabled:opacity-50"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Allocation Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Allocate New Barcode"
      >
        {AllocationFormContent}
      </Modal>
    </div>
  );
}

export default AllocateBarcode;