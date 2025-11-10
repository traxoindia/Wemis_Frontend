import React, { useState, useEffect, useCallback } from 'react';
import { X, Menu, MapPin, Package, FileText, User, Smartphone, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import ManufactureDashboard from './ManufactureDashboard';
import DeviceMapreport from './DeviceMapreport';
import ManufactureNavbar from './ManufactureNavbar';

// =========================================================
// 1. PLACEHOLDER COMPONENTS (Required for single-file mandate)
// =========================================================

// Placeholder for ManufactureNavbar
const ManufactureNavbarr = () => (
  <nav className="bg-gray-800 border-b border-gray-700 p-4 text-center text-white">
    <span className="font-bold">WEMIS Manufacturer Portal</span>
  </nav>
);

// Placeholder for DeviceMapreport (Report Section)
const DeviceMapreportt = () => (
  <div className="mt-12 p-8 bg-gray-800/50 rounded-2xl shadow-inner border border-yellow-500/30">
    <h2 className="text-3xl font-bold text-yellow-400 mb-6">Device Mapping History</h2>
    <div className="text-gray-400 text-center py-10 border-2 border-dashed border-gray-600 rounded-lg">
      <p>Data visualization and reporting features would be displayed here.</p>
      <p className="mt-2 text-sm">Example: Recent Mappings Table, Map View, Status Charts.</p>
    </div>
  </div>
);


// =========================================================
// 2. CONFIGURATION & HELPERS
// =========================================================

// --- Custom Toast Component ---
const ToastNotification = ({ message, type, onClose }) => {
  if (!type || !message) return null;

  const styleMap = {
    success: {
      bgColor: 'bg-green-600/95',
      borderColor: 'border-green-400',
      icon: <CheckCircle size={24} />,
      textColor: 'text-white',
    },
    error: {
      bgColor: 'bg-red-600/95',
      borderColor: 'border-red-400',
      icon: <XCircle size={24} />,
      textColor: 'text-white',
    },
  };

  const { bgColor, borderColor, icon, textColor } = styleMap[type];

  return (
    <div className="fixed top-5 right-5 z-[100] p-4">
      <div className={`flex items-center gap-3 p-4 rounded-lg shadow-2xl border ${bgColor} ${borderColor} backdrop-blur-sm transform transition-all duration-300 ease-out animate-slideIn`}>
        <div className={`flex-shrink-0 ${textColor}`}>{icon}</div>
        <div className="flex-grow">
          <p className={`font-semibold ${textColor}`}>{type === 'success' ? 'Success' : 'Error'}</p>
          <p className="text-sm text-gray-100">{message}</p>
        </div>
        <button onClick={onClose} className={`ml-4 ${textColor} hover:text-gray-200 transition-colors`}>
          <X size={20} />
        </button>
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn { animation: slideIn 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

// --- API Configuration (kept the same) ---
const DISTRIBUTOR_API = 'https://api.websave.in/api/manufactur/fetchDistributorOnBasisOfState';
const DEALER_API = 'https://api.websave.in/api/manufactur/fetchdelerOnBasisOfDistributor';
const DEVICE_NO_API = 'https://api.websave.in/api/manufactur/fetchDeviceNoOnBasisOfDeler';
const SUBMIT_API = 'https://api.websave.in/api/manufactur/manuFacturMAPaDevice';
const PACKAGE_API = 'https://api.websave.in/api/manufactur/fetchSubScriptionPackages';

const COUNTRIES = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
];

const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

// Helper Component for Package Details
const PackageDetailItem = ({ label, value }) => (
  <div className="border-b border-yellow-500/20 pb-2">
    <p className="font-semibold text-yellow-300/70 text-xs uppercase tracking-wide">{label}</p>
    <p className="text-yellow-100 break-words mt-1">{value || 'N/A'}</p>
  </div>
);

// =========================================================
// 3. MAIN APP COMPONENT
// =========================================================

const initialFormData = {
  country: 'India',
  state: '',
  distributorName: '', // ID
  delerName: '', // Name/Business Name
  deviceType: '',
  deviceNo: '', // Serial Number
  voltage: '',
  elementType: '',
  batchNo: '',
  simDetails: '', // Summary string only for display
  VechileBirth: '',
  RegistrationNo: '',
  date: '', // Installation Date
  ChassisNumber: '',
  EngineNumber: '',
  VehicleType: '',
  MakeModel: '',
  ModelYear: '',
  InsuranceRenewDate: '',
  PollutionRenewdate: '',
  VehicleKMReading: '',
  DriverLicenseNo: '',
  MappedDate: '',
  NoOfPanicButtons: '',
  fullName: '',
  email: '',
  mobileNo: '',
  GstinNo: '',
  Customercountry: 'India',
  Customerstate: '',
  Customerdistrict: '',
  Rto: '',
  PinCode: '',
  CompliteAddress: '',
  AdharNo: '',
  PanNo: '',
  Packages: '', // ID
  InvoiceNo: '',
  // NOTE: File fields remain in state but MUST be excluded from JSON payload
  Vechile_Doc: null,
  Rc_Doc: null,
  Pan_Card: null,
  Device_Doc: null,
  Adhar_Card: null,
  Invious_Doc: null,
  Signature_Doc: null,
  Panic_Sticker: null,
};

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [formData, setFormData] = useState(initialFormData);
  const [distributors, setDistributors] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [deviceNumbers, setDeviceNumbers] = useState([]);
  const [mappedSims, setMappedSims] = useState([{}]); // Array of SIM objects
  const [packages, setPackages] = useState([]);
  const [selectedPackageDetails, setSelectedPackageDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(false);
  // Renamed from submitStatus to toast for the notification system
  const [toast, setToast] = useState({ message: '', type: null });

  // Helper to reset SIM and device related fields
  const resetDependentFields = () => {
    setMappedSims([]);
    return {
      deviceNo: '',
      simDetails: '',
    };
  }

  // --- API Fetchers (Functionality unchanged) ---
  const fetchPackages = useCallback(async () => {
    setPackagesLoading(true);
    try {
      const token = localStorage.getItem('token') || 'mock-token'; 
      if (!token) throw new Error('Authentication token not found.');

      const response = await fetch(PACKAGE_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) throw new Error('Failed to fetch packages');
      const data = await response.json();
      setPackages(data.SubScriptionPackage || []);

    } catch (error) {
      console.error('Error fetching packages:', error.message);
      setPackages([]);
    } finally {
      setPackagesLoading(false);
    }
  }, []);

  const fetchDistributors = useCallback(async (selectedState) => {
    if (!selectedState) { setDistributors([]); return; }
    setLoading(true);
    setDistributors([]);
    setFormData(prev => ({ ...prev, distributorName: '', delerName: '', ...resetDependentFields() }));

    try {
      const token = localStorage.getItem('token') || 'mock-token';
      const response = await fetch(DISTRIBUTOR_API, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: selectedState })
      });
      const data = await response.json();
      setDistributors(data.distributors || []);
    } catch (error) {
      console.error('Error fetching distributors:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDealers = useCallback(async (selectedDistributorId) => {
    if (!selectedDistributorId) { setDealers([]); return; }
    setLoading(true);
    setDealers([]);
    setFormData(prev => ({ ...prev, delerName: '', ...resetDependentFields() }));

    try {
      const token = localStorage.getItem('token') || 'mock-token';
      const response = await fetch(DEALER_API, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ distributorId: selectedDistributorId })
      });
      const data = await response.json();
      setDealers(data.delers || data.dealers || []);
    } catch (error) {
      console.error('Error fetching dealers:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeviceNumbers = useCallback(async (selectedDelerName) => {
    if (!selectedDelerName) { setDeviceNumbers([]); return; }
    setLoading(true);
    setDeviceNumbers([]);
    setFormData(prev => ({ ...prev, ...resetDependentFields() }));

    try {
      const token = localStorage.getItem('token') || 'mock-token';
      const response = await fetch(DEVICE_NO_API, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ delerName: selectedDelerName })
      });
      const data = await response.json();
      console.log(data)
      setDeviceNumbers(data.devices || []);
    } catch (error) {
      console.error('Error fetching device numbers:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- useEffect Hooks for Data Flow ---
  useEffect(() => { fetchPackages(); }, [fetchPackages]);
  useEffect(() => {
    if (formData.country === 'India' && formData.state) {
      fetchDistributors(formData.state);
    } else {
      setDistributors([]);
    }
  }, [formData.state, formData.country, fetchDistributors]);
  useEffect(() => {
    if (formData.distributorName) {
      fetchDealers(formData.distributorName);
    } else {
      setDealers([]);
    }
  }, [formData.distributorName, fetchDealers]);
  useEffect(() => {
    if (formData.delerName) {
      fetchDeviceNumbers(formData.delerName);
    } else {
      setDeviceNumbers([]);
    }
  }, [formData.delerName, fetchDeviceNumbers]);

  // --- Change Handler (Functionality unchanged) ---
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    let newFormData = { ...formData };

    if (type === 'file') {
      newFormData[name] = files[0];
    } else {
      newFormData[name] = value;
    }

    if (name === 'state') {
      newFormData.distributorName = '';
      newFormData.delerName = '';
      newFormData = { ...newFormData, ...resetDependentFields() };
      setDistributors([]);
      setDealers([]);
      setDeviceNumbers([]);
    }
    if (name === 'distributorName') {
      newFormData.delerName = '';
      newFormData = { ...newFormData, ...resetDependentFields() };
      setDealers([]);
      setDeviceNumbers([]);
    }
    if (name === 'delerName') {
      newFormData = { ...newFormData, ...resetDependentFields() };
      setDeviceNumbers([]);
    }

    if (name === 'deviceNo') {
      if (value) {
        const selectedDevice = deviceNumbers.find(device => device.barCodeNo === value);
        const sims = (selectedDevice && Array.isArray(selectedDevice.simDetails)) ? selectedDevice.simDetails : [];
        setMappedSims(sims);
        const simSummary = sims.map(sim => sim.simNo || sim.iccidNo).filter(Boolean).join(', ');
        newFormData.simDetails = simSummary || 'No SIM details found.';
      } else {
        setMappedSims([]);
        newFormData.simDetails = '';
      }
    }

    if (name === 'Packages') {
      const selectedPkg = packages.find(pkg => pkg._id === value);
      setSelectedPackageDetails(selectedPkg || null);
    }

    setFormData(newFormData);
  };

  // --- Submission Handler (UPDATED for Toast and Modal Close) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast({ message: '', type: null }); // Clear previous toast

    try {
      const payload = {};
      for (const key in formData) {
        const value = formData[key];
        // Skip file fields
        if (value instanceof File || key.endsWith('_Doc') || key.endsWith('_Card') || key.endsWith('_Sticker')) {
          continue;
        }
        payload[key] = value ? String(value).trim() : "";
      }

      // Add actual SIM details array and delete the display summary string
      payload.simDetails = mappedSims || [];
      // delete payload.simDetails;


      const token = localStorage.getItem("token") || 'mock-token';
      if (!token) throw new Error("Authentication token missing");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(SUBMIT_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      let result;
      try {
        result = await response.json();
      } catch (err) {
        result = { success: false, message: "Invalid JSON response from server." };
      }

      console.log("✅ API Response:", result);

      if (!response.ok || result.success === false) {
        const errorMsg = result.message || "Submission failed. Please check the required fields and network.";
        setToast({ message: errorMsg, type: "error" });
        return;
      }

      // Success logic: Show toast and close modal
      setToast({ message: "Device mapped successfully!", type: "success" });
      console.log("mappedSims:",mappedSims)
      console.log("payload.simDetails:",payload.simDetails)
      setIsModalOpen(false); 

      // Reset form
      setFormData(initialFormData);
      setMappedSims([]);
      setSelectedPackageDetails(null);

    } catch (error) {
      const errorMsg = error.name === "AbortError" ? "Request timed out after 60 seconds." : `Submission failed: ${error.message}`;
      console.error("⛔ Submission Error:", error);
      setToast({ message: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // --- Utility Functions (unchanged, just moved closer) ---
  const getLabel = (key) => {
    const labels = {
      deviceType: 'Device Type', voltage: 'Voltage', elementType: 'Element Type', batchNo: 'Batch No',
      VechileBirth: 'Vehicle Birth (Year/Date)', RegistrationNo: 'Registration No', date: 'Installation Date',
      ChassisNumber: 'Chassis Number', EngineNumber: 'Engine Number', VehicleType: 'Vehicle Type', MakeModel: 'Make & Model', ModelYear: 'Model Year',
      InsuranceRenewDate: 'Insurance Renew Date', PollutionRenewdate: 'Pollution Renew Date', VehicleKMReading: 'Vehicle KM Reading', DriverLicenseNo: 'Driver License No',
      MappedDate: 'Mapped Date', NoOfPanicButtons: 'No. Of Panic Buttons',
      fullName: 'Customer Full Name', email: 'Customer Email', mobileNo: 'Customer Mobile No', GstinNo: 'GSTIN No',
      Customerdistrict: 'Customer District', Rto: 'RTO', PinCode: 'Pin Code', CompliteAddress: 'Complete Address',
      AdharNo: 'Adhar No', PanNo: 'Pan No', InvoiceNo: 'Invoice No',
    };
    return labels[key] || key;
  };

  const textNumberInputs = [
    'deviceType', 'voltage', 'elementType', 'batchNo',
    'VechileBirth', 'RegistrationNo', 'date', 'ChassisNumber', 'EngineNumber', 'VehicleType', 'MakeModel', 'ModelYear', 'InsuranceRenewDate',
    'PollutionRenewdate', 'VehicleKMReading', 'DriverLicenseNo',
    'MappedDate', 'NoOfPanicButtons',
    'fullName', 'email', 'mobileNo', 'GstinNo', 'Customerdistrict', 'Rto', 'PinCode',
    'CompliteAddress', 'AdharNo', 'PanNo', 'InvoiceNo',
  ];

  // --- Render Helpers (Updated UI) ---

  const renderSimInputs = () => {
    if (!formData.deviceNo) {
      return (
        <div className="md:col-span-3 text-center py-6 text-gray-500 border-2 border-dashed border-gray-700 rounded-xl bg-black/10">
          <Smartphone size={24} className="mx-auto mb-2" />
          Select a Device Number to view SIM details.
        </div>
      );
    }
    if (mappedSims.length === 0) {
      return (
        <div className="md:col-span-3 text-center py-6 text-yellow-400 border-2 border-dashed border-yellow-500/30 rounded-xl bg-black/20">
          <AlertTriangle size={24} className="mx-auto mb-2" />
          No SIM details found for the selected device.
        </div>
      );
    }

    return mappedSims.map((sim, index) => (
      <div key={index} className="md:col-span-1 border border-yellow-500/50 p-5 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 shadow-lg backdrop-blur-sm">
        <h4 className="font-bold mb-3 text-yellow-400 flex items-center gap-2 text-lg">
          <Smartphone size={18} />
          SIM {index + 1}
        </h4>
        <div className="space-y-3">
          <PackageDetailItem label="Sim No" value={sim.simNo} />
          <PackageDetailItem label="ICCID No" value={sim.iccidNo} />
          <PackageDetailItem label="Operator" value={sim.operator} />
          <PackageDetailItem label="Validity Date" value={sim.validityDate ? new Date(sim.validityDate).toLocaleDateString() : 'N/A'} />
        </div>
      </div>
    ));
  };

  const renderPackageDetailsBox = () => {
    if (!selectedPackageDetails) return null;

    const details = selectedPackageDetails;

    return (
      <div className="md:col-span-3 border border-yellow-500 p-6 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 shadow-xl mt-4 backdrop-blur-sm">
        <h4 className="text-xl font-bold mb-4 text-yellow-400 flex items-center gap-2">
          <Package size={20} />
          Package Details
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
          <PackageDetailItem label="Package Type" value={details.packageType} />
          <PackageDetailItem label="Billing Cycle" value={details.billingCycle} />
          <PackageDetailItem label="Renewal" value={details.renewal} />
          <PackageDetailItem label="Price (₹)" value={details.price} />
        </div>
        <p className="mt-4 text-sm text-yellow-200/80">Description: {details.description}</p>
      </div>
    );
  };

  const renderFormInput = (key, span = 1) => {
    const type = key.toLowerCase().includes('date') ? 'date' : (['mobileNo', 'PinCode', 'AdharNo', 'PanNo', 'VehicleKMReading', 'NoOfPanicButtons', 'voltage'].includes(key)) ? 'text' : 'text';
    const isRequired = ['deviceType', 'voltage', 'RegistrationNo', 'date', 'ChassisNumber', 'EngineNumber', 'VehicleType', 'MakeModel', 'fullName', 'mobileNo', 'AdharNo', 'PanNo', 'CompliteAddress', 'Customerstate'].includes(key);

    return (
      <div key={key} className={`col-span-${span}`}>
        <label className="block mb-2 font-medium text-yellow-300 text-sm">{getLabel(key)} {isRequired ? '*' : ''}</label>
        <input
          type={type}
          name={key}
          value={formData[key] || ''}
          onChange={handleChange}
          required={isRequired}
          className="w-full px-4 py-2.5 border border-yellow-500/30 rounded-lg bg-black/60 text-yellow-100 focus:outline-none focus:border-yellow-500 transition-colors placeholder:text-gray-500"
          placeholder={getLabel(key)}
        />
      </div>
    );
  };

  return (
    <div className="font-sans">
      
     <ManufactureNavbar/>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        
        {/* Navbar - UI unchanged */}
        <nav className="bg-black/90 backdrop-blur-md border-b-2 border-yellow-500 sticky top-0 z-40 shadow-2xl">
          {/* ... Navbar content (omitted for brevity) ... */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center">
                <MapPin className="text-yellow-400" size={32} />
                <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  WEMIS Device Mapping
                </span>
              </div>

              <div className="hidden md:block">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-6 py-3 rounded-lg font-bold hover:from-yellow-400 hover:to-yellow-500 transition-all duration-300 shadow-lg hover:shadow-yellow-500/50 flex items-center gap-2"
                >
                  <MapPin size={20} />
                  Map New Device
                </button>
              </div>

              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-yellow-400 hover:text-yellow-300"
                >
                  <Menu size={28} />
                </button>
              </div>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden bg-black/95 border-t border-yellow-500/30">
              <div className="px-4 py-4">
                <button
                  onClick={() => {
                    setIsModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-4 py-3 rounded-lg font-bold hover:from-yellow-400 hover:to-yellow-500 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <MapPin size={20} />
                  Map New Device
                </button>
              </div>
            </div>
          )}
        </nav>
        
        {/* Main Content (DeviceMapreport) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <DeviceMapreport/>
        </div>

        {/* Modal (Improved UI) */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-500 rounded-2xl shadow-2xl max-w-5xl w-full my-8 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-600 scrollbar-track-gray-800">
              
              {/* Modal Header */}
              <div className="sticky top-0 bg-black/95 backdrop-blur-md border-b-2 border-yellow-500/80 p-6 flex justify-between items-center z-10">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 flex items-center gap-3">
                  <MapPin size={32} />
                  Device Mapping Form
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-yellow-400 hover:text-white transition-colors p-2 rounded-full hover:bg-yellow-500/10 border border-yellow-500/20"
                >
                  <X size={28} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8">
                {/* JSON Submission Warning */}
                <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-xl mb-6 flex items-start gap-3">
                    <AlertTriangle size={24} className="flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium"> **JSON Submission Active:** File uploads (Vehicle/RC/Pan Docs, etc.) are **disabled** as the API uses `application/json` format.</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">

                  {/* ========================================= */}
                  {/* SECTION 1: LOCATION & ALLOCATION */}
                  {/* ========================================= */}
                  <div className="p-6 bg-gray-800/30 rounded-xl border border-yellow-500/10 shadow-lg">
                    <h3 className="text-xl font-semibold text-yellow-400 mb-5 pb-2 border-b border-yellow-500/20 flex items-center gap-2">
                      <MapPin size={22} />
                      Location & Device Allocation
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      
                      {/* Country & State */}
                      <div>
                        <label className="block mb-2 font-medium text-yellow-300 text-sm">Country *</label>
                        <select name="country" value={formData.country} onChange={handleChange} required className="w-full px-4 py-2.5 border border-yellow-500/30 rounded-lg bg-black/60 text-yellow-100 focus:outline-none focus:border-yellow-500 transition-colors">
                          <option value="">Select Country</option>
                          {COUNTRIES.map(c => (<option key={c.code} value={c.name}>{c.name}</option>))}
                        </select>
                      </div>

                      <div>
                        <label className="block mb-2 font-medium text-yellow-300 text-sm">State *</label>
                        {formData.country === 'India' ? (
                          <select name="state" value={formData.state} onChange={handleChange} required className="w-full px-4 py-2.5 border border-yellow-500/30 rounded-lg bg-black/60 text-yellow-100 focus:outline-none focus:border-yellow-500 transition-colors">
                            <option value="">Select State</option>
                            {INDIA_STATES.map(state => (<option key={state} value={state}>{state}</option>))}
                          </select>
                        ) : (
                          <input type="text" name="state" value={formData.state} onChange={handleChange} required className="w-full px-4 py-2.5 border border-yellow-500/30 rounded-lg bg-black/60 text-yellow-100 focus:outline-none focus:border-yellow-500 placeholder:text-gray-500" placeholder="Enter State/Province" />
                        )}
                      </div>

                      {/* Distributor & Dealer */}
                      <div>
                        <label className="block mb-2 font-medium text-yellow-300 text-sm">Distributor Name *</label>
                        <select name="distributorName" value={formData.distributorName} onChange={handleChange} required disabled={!formData.state || loading} className={`w-full px-4 py-2.5 border border-yellow-500/30 rounded-lg bg-black/60 text-yellow-100 focus:outline-none focus:border-yellow-500 transition-colors ${!formData.state || loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <option value="">
                            {loading ? 'Loading...' : formData.state && distributors.length > 0 ? 'Select Distributor' : formData.state ? 'No Distributors Found' : 'Select State First'}
                          </option>
                          {distributors.map(dist => (<option key={dist._id} value={dist._id}>{dist.contact_Person_Name}</option>))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block mb-2 font-medium text-yellow-300 text-sm">Dealer Name *</label>
                        <select name="delerName" value={formData.delerName} onChange={handleChange} required disabled={!formData.distributorName || loading} className={`w-full px-4 py-2.5 border border-yellow-500/30 rounded-lg bg-black/60 text-yellow-100 focus:outline-none focus:border-yellow-500 transition-colors ${!formData.distributorName || loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <option value="">
                            {loading ? 'Loading...' : formData.distributorName && dealers.length > 0 ? 'Select Dealer' : formData.distributorName ? 'No Dealers Found' : 'Select Distributor First'}
                          </option>
                          {dealers.map(dealer => (<option key={dealer._id || dealer.mobile} value={dealer.name || dealer.business_Name}>{dealer.name || dealer.business_Name || 'Unknown Dealer'}</option>))}
                        </select>
                      </div>

                      {/* Device & Package */}
                      <div>
                        <label className="block mb-2 font-medium text-yellow-300 text-sm">Device Serial No *</label>
                        <select name="deviceNo" value={formData.deviceNo} onChange={handleChange} required disabled={!formData.delerName || loading} className={`w-full px-4 py-2.5 border border-yellow-500/30 rounded-lg bg-black/60 text-yellow-100 focus:outline-none focus:border-yellow-500 transition-colors ${!formData.delerName || loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <option value="">
                            {loading ? 'Loading...' : formData.delerName && deviceNumbers.length > 0 ? 'Select Device Number' : formData.delerName ? 'No Devices Found' : 'Select Dealer First'}
                          </option>
                          {deviceNumbers.map(device => (<option key={device.barCodeNo} value={device.barCodeNo}>{device.barCodeNo}</option>))}
                        </select>
                      </div>

                      <div>
                        <label className="block mb-2 font-medium text-yellow-300 text-sm">Package *</label>
                        <select name="Packages" value={formData.Packages} onChange={handleChange} required disabled={packagesLoading} className={`w-full px-4 py-2.5 border border-yellow-500/30 rounded-lg bg-black/60 text-yellow-100 focus:outline-none focus:border-yellow-500 transition-colors ${packagesLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <option value="">
                            {packagesLoading ? 'Loading Packages...' : packages.length > 0 ? 'Select Package' : 'No Packages Found'}
                          </option>
                          {packages.map(pkg => (<option key={pkg._id} value={pkg._id}>{pkg.packageName || pkg._id}</option>))}
                        </select>
                      </div>
                    </div>

                    {renderPackageDetailsBox()}

                  </div>


                  {/* ========================================= */}
                  {/* SECTION 2: SIM DETAILS */}
                  {/* ========================================= */}
                  <div className="p-6 bg-gray-800/30 rounded-xl border border-yellow-500/10 shadow-lg">
                    <h3 className="text-xl font-semibold text-yellow-400 mb-5 pb-2 border-b border-yellow-500/20 flex items-center gap-2">
                      <Smartphone size={22} />
                      SIM Card Details (Read-Only)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {renderSimInputs()}
                    </div>
                  </div>


                  {/* ========================================= */}
                  {/* SECTION 3: DEVICE & VEHICLE INFO */}
                  {/* ========================================= */}
                  <div className="p-6 bg-gray-800/30 rounded-xl border border-yellow-500/10 shadow-lg">
                    <h3 className="text-xl font-semibold text-yellow-400 mb-5 pb-2 border-b border-yellow-500/20 flex items-center gap-2">
                      <FileText size={22} />
                      Device & Vehicle Information
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Device Details (4 fields) */}
                      {textNumberInputs.slice(0, 4).map(key => renderFormInput(key))}

                      {/* Vehicle Details (12 fields) */}
                      {textNumberInputs.slice(4, 16).map(key => renderFormInput(key))}
                    </div>
                  </div>

                  {/* ========================================= */}
                  {/* SECTION 4: CUSTOMER INFO */}
                  {/* ========================================= */}
                  <div className="p-6 bg-gray-800/30 rounded-xl border border-yellow-500/10 shadow-lg">
                    <h3 className="text-xl font-semibold text-yellow-400 mb-5 pb-2 border-b border-yellow-500/20 flex items-center gap-2">
                      <User size={22} />
                      Customer & Billing Details
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Full Name, Email, Mobile, GSTIN */}
                      {textNumberInputs.slice(18, 22).map(key => renderFormInput(key))}
                      
                      {/* Address & RTO */}
                      {renderFormInput('CompliteAddress', 2)}
                      {renderFormInput('Rto')}

                      {/* State, District, Pincode */}
                      {renderFormInput('Customerstate')}
                      {renderFormInput('Customerdistrict')}
                      {renderFormInput('PinCode')}

                      {/* Adhar, Pan, Invoice No */}
                      {renderFormInput('AdharNo')}
                      {renderFormInput('PanNo')}
                      {renderFormInput('InvoiceNo')}
                    </div>
                  </div>


                  {/* Submit Button */}
                  <div className="pt-6 border-t border-yellow-500/20 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading || packagesLoading}
                      className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-8 py-3 rounded-xl font-bold text-lg hover:from-yellow-400 hover:to-yellow-500 transition-all duration-300 shadow-xl hover:shadow-yellow-500/60 disabled:opacity-50 flex items-center gap-2 transform active:scale-95"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={24} className="animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <MapPin size={24} />
                          Finalize Mapping
                        </>
                      )}
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>
        )}

        {/* Global Toast Notification Area */}
        <ToastNotification 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ message: '', type: null })} 
        />
      </div>
    </div>
  );
}

export default App;