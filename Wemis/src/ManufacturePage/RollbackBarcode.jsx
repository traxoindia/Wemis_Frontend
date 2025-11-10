import React, { useState, useMemo, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { RefreshCw, AlertCircle } from 'lucide-react';

// --- MOCK Context for Token Retrieval (Essential for compilation) ---
const UserAppContext = React.createContext({
  token: localStorage.getItem("token") || null,
  // This token is used for all authenticated API calls
});

// --- Mock/Basic Navbar Component for compilation ---
const ManufactureNavbar = () => (
    <nav className="bg-gray-800 p-4 shadow-xl border-b border-yellow-600">
        <div className="container mx-auto">
            <h1 className="text-2xl font-bold text-yellow-400">WEMIS Manufacturer Portal</h1>
        </div>
    </nav>
);

// --- API Endpoints ---
const DISTRIBUTOR_API = "https://api.websave.in/api/manufactur/findDistributorUnderManufactur";
const ROLLBACK_API = "https://api.websave.in/api/manufactur/rollBackAllocatedBarCode";
const ELEMENT_API = "https://api.websave.in/api/manufactur/fetchElementData"; // New API for elements

// --- Mock/Static Options ---
const MOCK_OPTIONS = {
  states: [
    { value: 'KA', label: 'Karnataka' },
    { value: 'OD', label: 'Odisha' },
    { value: 'MH', label: 'Maharashtra' },
    { value: 'DL', label: 'Delhi' },
    { value: 'TN', label: 'Tamil Nadu' },
    { value: 'CA', label: 'California' },
  ],
  barCodeTypes: [ // Renamed to match API field barCode_Type
    { value: 'All_Barcodes', label: 'All Barcodes' },
    { value: 'RFID', label: 'RFID Tag' },
    { value: 'QR', label: 'QR Code' }
  ],
  // 'elements' will be fetched dynamically
  organizationalUnits: [{ value: 'N/A', label: 'Not Applicable' }],
};

// --- Reusable Form Elements (Black & Yellow) ---
const SelectField = ({ label, name, value, onChange, options, placeholder, disabled = false, error = null }) => (
  <div className="flex flex-col">
    {label && (
      <label htmlFor={name} className="text-sm font-semibold text-yellow-400 mb-1">
        {label}
      </label>
    )}
    <select
      className={`
        mt-1 block w-full pl-3 pr-10 py-2 text-base rounded-md shadow-md transition
        focus:outline-none focus:ring-2 focus:ring-yellow-500 sm:text-sm
        ${disabled
          ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
          : `bg-black text-yellow-300 border ${error ? 'border-red-500' : 'border-yellow-600'} hover:border-yellow-400`}
      `}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && (
      <p className="text-red-500 text-xs mt-1 flex items-center">
        <AlertCircle size={12} className="mr-1" />
        {error}
      </p>
    )}
  </div>
);

const TextField = ({ label, name, value, onChange, placeholder, type = 'text', error = null }) => (
  <div className="flex flex-col">
    {label && (
      <label htmlFor={name} className="text-sm font-semibold text-yellow-400 mb-1">
        {label}
      </label>
    )}
    <input
      type={type}
      className={`
        mt-1 block w-full rounded-md shadow-md py-2 px-3
        bg-black text-yellow-300 placeholder-gray-500 transition
        focus:outline-none focus:ring-2 focus:ring-yellow-500 sm:text-sm
        border ${error ? 'border-red-500' : 'border-yellow-600'}
      `}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
    {error && (
      <p className="text-red-500 text-xs mt-1 flex items-center">
        <AlertCircle size={12} className="mr-1" />
        {error}
      </p>
    )}
  </div>
);

// --- Main Component ---
const RollbackBarcode = () => {
  // Authentication Context
  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  const [formData, setFormData] = useState({
    state: '',
    distributor: '',
    division: '',
    dealer: '',
    deviceNoFrom: '',
    deviceNoTo: '',
    barCode_Type: 'All_Barcodes',
    element: 'All Element',
    // subElement removed
  });

  const [options, setOptions] = useState({
    ...MOCK_OPTIONS,
    distributors: [],
    elements: [{ value: 'All Element', label: 'All Element' }], // Default initial option
    // subElements removed
  });

  const [isLoadingDistributors, setIsLoadingDistributors] = useState(false);
  const [isLoadingElements, setIsLoadingElements] = useState(false); // New state for element loading
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [errors, setErrors] = useState({});

  // 1. Fetch Distributors Function (No change, kept for completeness)
  const fetchDistributors = useCallback(async () => {
    if (!tkn) return;
    
    setIsLoadingDistributors(true);
    try {
      const response = await axios.post(DISTRIBUTOR_API, {}, { headers: { Authorization: `Bearer ${tkn}` } });
      const rawData = response.data.dist || response.data.dealers || response.data;

      if (Array.isArray(rawData)) {
        const formattedDistributors = rawData
          .map(d => ({
            value: d._id,
            label: d.business_Name || d.userName || d._id
          }))
          .filter(d => d.value);

        setOptions(prev => ({ ...prev, distributors: formattedDistributors }));
      } else {
        setOptions(prev => ({ ...prev, distributors: [] }));
      }
    } catch (error) {
      toast.error("Failed to load distributors.");
      console.error("Fetch distributors error:", error.response?.data || error.message);
    } finally {
      setIsLoadingDistributors(false);
    }
  }, [tkn]);

  // 2. Fetch Elements Function (NEW)
  const fetchElements = useCallback(async () => {
    if (!tkn) return;

    setIsLoadingElements(true);
    try {
        const response = await axios.post(ELEMENT_API, {}, { headers: { Authorization: `Bearer ${tkn}` } });
        // Assuming API response data structure: { success: true, element: [{ elementName: "X" }, ...] } or similar
        const rawElements = response.data.elementData || []; 

        const defaultOption = { value: 'All Element', label: 'All Element' };
        
        // Map raw elements to the required { value, label } format
        const formattedElements = [
            defaultOption,
            ...rawElements.map(e => ({
                value: e.elementName || e, // Handle both object and string array response
                label: e.elementName || e,
            })).filter(e => e.value)
        ];

        setOptions(prev => ({ 
            ...prev, 
            elements: formattedElements,
        }));
        
    } catch (error) {
        toast.error("Failed to load elements data.");
        console.error("Fetch elements error:", error.response?.data || error.message);
    } finally {
        setIsLoadingElements(false);
    }
  }, [tkn]);


  // 3. Load Data on Mount
  useEffect(() => {
    fetchDistributors();
    fetchElements(); // Execute new element fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchDistributors, fetchElements]);


  // 4. Form Change Handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: '' }));
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 5. Rollback Logic
  const handleRollback = async () => {
    let newErrors = {};

    // Validation
    if (!formData.state) newErrors.state = "State is required.";
    if (!formData.distributor) newErrors.distributor = "Distributor is required.";
    if (!formData.deviceNoFrom) newErrors.deviceNoFrom = "Start Device No is required.";
    if (!formData.deviceNoTo) newErrors.deviceNoTo = "End Device No is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill all required fields.");
      return;
    }

    // Construct Payload
    const payload = {
      state: formData.state,
      distributor: formData.distributor, // Distributor ID
      element: formData.element,
      barCode_Type: formData.barCode_Type,
      deviceNoFrom: formData.deviceNoFrom,
      deviceNoTo: formData.deviceNoTo,
    };

    console.log('Rollback Payload:', payload);

    setIsRollingBack(true);
    try {
      const response = await axios.post(ROLLBACK_API, payload, {
        headers: { Authorization: `Bearer ${tkn}` },
      });

      if (response.data.success) {
        toast.success(response.data.message || "Barcode rollback successful!");
        // Optionally reset form after success
        setFormData(prev => ({
          ...prev,
          deviceNoFrom: '',
          deviceNoTo: '',
        }));
      } else {
        toast.error(response.data.message || "Rollback failed. Please check the data.");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "An error occurred during rollback.";
      toast.error(errorMessage);
      console.error("Rollback error:", error.response?.data || error.message);
    } finally {
      setIsRollingBack(false);
    }
  };

  const isRollbackDisabled = !formData.deviceNoFrom || !formData.deviceNoTo || isRollingBack;


  return (
    <div className="bg-gray-950 min-h-screen font-inter text-yellow-300">
      <ManufactureNavbar />
      <Toaster position="top-right" />

      <div className="container max-w-5xl mx-auto p-6 md:p-10">
        {/* Header */}
        <header className="mb-6 pb-4 border-b border-yellow-600">
          <h1 className="text-3xl font-extrabold text-yellow-400">🔄 RollBack Allocated Devices</h1>
          <p className="text-sm text-gray-400">Revert allocated devices and barcodes back to the available pool by specifying a range and associated filters.</p>
        </header>

        {/* Filter Form */}
        <div className="p-8 border border-yellow-700 rounded-xl bg-gray-900 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

            {/* Row 1: Location and Partner */}
            <SelectField
              label="State" name="state" value={formData.state}
              onChange={handleChange} options={options.states}
              placeholder="Select State"
              error={errors.state}
            />
            <SelectField
              label={`Distributor ${isLoadingDistributors ? "(Loading...)" : ""}`} 
              name="distributor" 
              value={formData.distributor}
              onChange={handleChange} 
              options={options.distributors}
              placeholder="Select Distributor" 
              disabled={isLoadingDistributors || !formData.state} 
              error={errors.distributor}
            />
            <SelectField
              label="Division" name="division" value={formData.division}
              onChange={handleChange} options={options.organizationalUnits}
              placeholder="Select Division (Optional)"
            />
            <SelectField
              label="Dealer" name="dealer" value={formData.dealer}
              onChange={handleChange} options={options.organizationalUnits}
              placeholder="Select Dealer (Optional)"
            />

            {/* Row 2: Device Range and Barcode/Element Types */}
            <TextField
              label="Device No (From)" name="deviceNoFrom" value={formData.deviceNoFrom}
              onChange={handleChange} placeholder="Start Barcode No."
              error={errors.deviceNoFrom}
            />
            <TextField
              label="Device No (To)" name="deviceNoTo" value={formData.deviceNoTo}
              onChange={handleChange} placeholder="End Barcode No."
              error={errors.deviceNoTo}
            />
            <SelectField
              label="Barcode Type" name="barCode_Type" value={formData.barCode_Type}
              onChange={handleChange} options={options.barCodeTypes}
              placeholder="All Barcodes"
            />
            <SelectField
              label={`Element ${isLoadingElements ? "(Loading...)" : ""}`} 
              name="element" 
              value={formData.element}
              onChange={handleChange} 
              options={options.elements} // Now using dynamic state
              placeholder="All Element"
              disabled={isLoadingElements}
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-10 flex justify-end">
          <button
            onClick={handleRollback}
            disabled={isRollbackDisabled}
            className={`
              flex items-center justify-center px-8 py-3 rounded-xl font-bold text-black
              transition duration-200 ease-in-out shadow-lg transform active:scale-98
              ${isRollbackDisabled
                ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                : 'bg-yellow-400 hover:bg-yellow-500 hover:shadow-yellow-700/50'}
            `}
          >
            {isRollingBack ? (
              <>
                <RefreshCw className="animate-spin mr-2" size={20} /> Processing Rollback...
              </>
            ) : (
              <>
                RollBack Devices <span className="ml-2">🔄</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RollbackBarcode;