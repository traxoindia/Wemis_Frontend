import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Plus, X, Search, SlidersHorizontal } from "lucide-react"; // Imported SlidersHorizontal for filters
import toast, { Toaster } from "react-hot-toast";
import { UserAppContext } from "../contexts/UserAppProvider";
import ManufactureNavbar from "../ManufacturePage/ManufactureNavbar";
import DistributorNavbar from "./DistributorNavbar";


// Define the expected structure for the SIM data in formData
const initialSimState = {
  simNo: "",
  iccidNo: "",
  validityDate: "", // date string (YYYY-MM-DD)
  operator: "",
};

// Function to generate a semi-random batch number (based on current timestamp)
const generateBatchNo = () => {
  const now = new Date();
  // Format: YYYYMMDDHHmmss + 3 random digits
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
};

// Hardcoded data for SIM Operators (Used if not dynamic from metadata)
const HARDCODED_OPERATORS = [
  { value: "Airtel", label: "Airtel" },
  { value: "Jio", label: "Jio" },
  { value: "BSNL", label: "BSNL" },
  { value: "VI", label: "VI" },
];

// Helper function for date formatting (optional but good practice)
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (e) {
    return dateString;
  }
};


function BarcodePage() {
  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [barcodeData, setBarcodeData] = useState([]); // State to store fetched barcode list

  // State for search/filter (placeholder implementation)
  const [searchTerm, setSearchTerm] = useState("");


  const [formData, setFormData] = useState({
    elementName: "",
    elementType: "",
    elementModelNo: "",
    elementPartNo: "",
    elementTacNo: "",
    elementCopNo: "",
    copValid: "",
    voltage: "",
    batchNo: generateBatchNo(),
    baecodeCreationType: "",
    barCodeNo: "",
    is_Renew: "No",
    deviceSerialNo: "",
    simDetails: [], // Array to hold SIM objects
  });

  const [metaData, setMetaData] = useState(null);
  const [simCount, setSimCount] = useState(0);

  // --- API Functions ---

  // Fetch metadata from API with token
  const fetchMetaData = async () => {
    try {
      const res = await axios.post(
        "https://wemis-backend.onrender.com/manufactur/fetchAllAssignElementDataRelatedToCreateBarCode",
        {},
        { headers: { Authorization: `Bearer ${tkn}` } }
      );
      setMetaData(res.data.assignelements);
    } catch (err) {
      toast.error("Failed to fetch metadata");
      console.error("Fetch metadata error:", err);
    }
  };

  // ✅ Updated function to fetch all barcode data
  const fetchBarcodeData = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        "https://wemis-backend.onrender.com/manufactur/fetchAllBarCode",
        {},
        { headers: { Authorization: `Bearer ${tkn}` } }
      );
      console.log(res.data)
      if (res.data && res.data.allBarCods) {
        setBarcodeData(res.data.allBarCods);
      } else {
        setBarcodeData([]);
      }
    } catch (err) {
      toast.error("Failed to fetch barcode data");
      console.error("Fetch barcode data error:", err);
      setBarcodeData([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (tkn) {
      fetchMetaData();
      fetchBarcodeData();
    } else {
      toast.error("No token found. Please login again.");
    }
  }, [tkn]);

  // --- Utility Functions ---

  // Handle input change for non-SIM fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle SIM change for dynamic SIM fields
  const handleSimChange = (i, field, value) => {
    const updatedSims = [...(formData.simDetails || [])];

    if (!updatedSims[i]) {
      updatedSims[i] = { ...initialSimState };
    }

    updatedSims[i] = { ...updatedSims[i], [field]: value };
    setFormData((prev) => ({ ...prev, simDetails: updatedSims }));
  };

  // On type change → set SIM count dynamically and reset SIM data
  const handleTypeChange = (e) => {
    const selectedType = e.target.value;
    handleChange(e); // Update the 'elementType' field in formData

    const selectedElement = metaData?.find(
      (el) => el.elementType === selectedType
    );

    let count = 0;
    if (selectedElement) {
      count = selectedElement.sim || 0;
    }

    setSimCount(count);
    // Reset SIM card data to match the new count
    setFormData((prev) => ({
      ...prev,
      simDetails: Array.from({ length: count }).map(() => ({ ...initialSimState })),
    }));
  };

  // Helper to get unique options for dropdowns based on the metadata structure
  const getUniqueOptions = (key) => {
    if (!metaData) return [];

    const uniqueValues = new Set();
    const options = [];

    metaData.forEach((current) => {
      const valueOrArray = current[key];

      if (Array.isArray(valueOrArray)) {
        valueOrArray.forEach((value) => {
          if (value && !uniqueValues.has(value)) {
            uniqueValues.add(value);
            options.push({ _id: current._id + value + key, value: value, label: value });
          }
        });
      } else {
        if (valueOrArray && !uniqueValues.has(valueOrArray)) {
          uniqueValues.add(valueOrArray);
          options.push({ _id: current._id + valueOrArray + key, value: valueOrArray, label: valueOrArray });
        }
      }
    });

    return options;
  };

  // Function to open the modal and reset form data
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    setFormData({
      elementName: "",
      elementType: "",
      elementModelNo: "",
      elementPartNo: "",
      elementTacNo: "",
      elementCopNo: "",
      copValid: "",
      voltage: "",
      batchNo: generateBatchNo(), // Auto-generate new batch number
      baecodeCreationType: "",
      barCodeNo: "",
      is_Renew: "No",
      deviceSerialNo: "",
      simDetails: [],
    });
    setSimCount(0);
  };

  // ✅ Submit form with token and POST method
  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    if (simCount > 0 && (!formData.simDetails || formData.simDetails.length !== simCount || formData.simDetails.some(sim => !sim.simNo || !sim.iccidNo || !sim.validityDate || !sim.operator))) {
      return toast.error("SIM card details are incomplete or missing.");
    }

    // Check if mandatory fields are filled
    if (!formData.elementName || !formData.elementType || !formData.elementModelNo || !formData.barCodeNo || !formData.deviceSerialNo) {
      return toast.error("Please fill all mandatory fields (*).");
    }

    try {
      const response = await axios.post(
        "https://wemis-backend.onrender.com/manufactur/createBarCode",
        formData,
        { headers: { Authorization: `Bearer ${tkn}` } }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success("Barcode created successfully");
        setIsCreateModalOpen(false);
        // Refresh the barcode list after successful creation
        fetchBarcodeData();
        // Reset form data and state
        setFormData({});
        setSimCount(0);
      } else {
        toast.error(`Creation failed: ${response.data?.message || 'Server returned an error.'}`);
      }

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to create barcode due to an unknown error.";
      toast.error(errorMessage);
      console.error("Create barcode error:", err);
    }
  };

  // Placeholder Filtered Data (Basic search on Device Serial No, Barcode No, ICCID)
  const filteredBarcodeData = barcodeData.filter(item => {
    const lowerCaseSearch = searchTerm.toLowerCase();

    // Search main fields
    const matchesMain = (item.deviceSerialNo?.toLowerCase().includes(lowerCaseSearch) ||
                         item.barCodeNo?.toLowerCase().includes(lowerCaseSearch));

    // Search nested SIM ICCID
    const matchesSim = item.simDetails?.some(sim => sim.iccidNo?.toLowerCase().includes(lowerCaseSearch));
    
    return matchesMain || matchesSim;
  });


  // --- Render Component ---

  return (
    <div className="bg-gray-900 min-h-screen">
      <DistributorNavbar />

      <div className="p-6">

        <Toaster position="top-right" />
        <h1 className="text-3xl font-extrabold text-yellow-400 mb-6 border-b border-gray-700 pb-3">
          Manage Barcodes
        </h1>
        
        {/* Top Control Bar (Search, Filter, Create) */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search Serial No, ICCID, or Barcode No"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 w-80 transition duration-150"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            
            {/* Filter Icon (Placeholder) */}
            <button
                className="p-2 rounded-lg bg-gray-800 text-yellow-400 border border-gray-700 hover:bg-gray-700 transition duration-150"
                title="Open Advanced Filters"
                // onClick={() => alert("Advanced Filter Modal Placeholder")}
            >
                <SlidersHorizontal size={20} />
            </button>
          </div>
          
          {/* Create Button */}
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-6 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition duration-150 shadow-lg"
          >
            <Plus size={20} /> Create Barcode
          </button>
        </div>
        
        {/* Barcode List Table */}
        <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            {loading ? (
              <p className="p-6 text-center text-yellow-400">Loading barcode data...</p>
            ) : filteredBarcodeData.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No barcodes match your search criteria.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">Device Serial No</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">ICCID No</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">SIM Details (Manuf/Validity)</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">Model No</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">Part No</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">Barcode Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">Created At</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {filteredBarcodeData.map((item, index) => (
                    <React.Fragment key={item._id || index}>
                      {/* Check if simDetails exists and is an array with content */}
                      {item.simDetails && item.simDetails.length > 0 ? (
                        // If multiple SIMs, render one row per SIM for clear ICCID separation
                        item.simDetails.map((sim, simIndex) => (
                          <tr key={`${item._id}-${sim._id || simIndex}`} className="text-white hover:bg-gray-700/50 transition duration-100">
                            {/* Device Info (only show once per logical device, use rowspan if possible in a production app) */}
                            {simIndex === 0 && (
                                <>
                                  <td 
                                    className="px-6 py-4 whitespace-nowrap text-sm font-medium border-r border-gray-700" 
                                    // Rowspan is ideal here for UI, but complex in React mapping. Keeping it simple:
                                  >
                                    {item.deviceSerialNo || 'N/A'}
                                  </td>
                                </>
                            )}
                            {simIndex > 0 && <td className="border-r border-gray-700"></td>}


                            {/* SIM 1 (ICCID) */}
                            <td className="px-6 py-4 text-xs font-mono text-yellow-300 border-r border-gray-700">
                              {sim.iccidNo || 'N/A'}
                            </td>

                            {/* SIM 1 (Details) */}
                            <td className="px-6 py-4 whitespace-normal text-xs text-gray-400 border-r border-gray-700">
                              <span className="text-white">{sim.operator || 'Unknown'}</span> 
                              <br/> (Valid: {formatDate(sim.validityDate)})
                            </td>
                            
                            {/* Device Info (Only show once per logical device) */}
                            {simIndex === 0 && (
                                <>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {item.elementType || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {item.elementModelNo || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {item.elementPartNo || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {item.baecodeCreationType || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                                        <span className="inline-block px-3 py-1 leading-none rounded-full font-semibold bg-green-900/50 text-green-400">
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.createdAt ? formatDate(item.createdAt) : 'N/A'}
                                    </td>
                                </>
                            )}
                            {simIndex > 0 && (
                                <>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </>
                            )}
                          </tr>
                        ))
                      ) : (
                        // If No SIMs, show one device row with N/A for SIM fields
                        <tr key={item._id || index} className="text-white hover:bg-gray-700/50 transition duration-100">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium border-r border-gray-700">
                            {item.deviceSerialNo || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-gray-500 border-r border-gray-700">N/A</td>
                          <td className="px-6 py-4 whitespace-normal text-xs text-gray-500 border-r border-gray-700">No SIM Details</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {item.elementType || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {item.elementModelNo || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {item.elementPartNo || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {item.baecodeCreationType || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs">
                            <span className="inline-block px-3 py-1 leading-none rounded-full font-semibold bg-yellow-900/50 text-yellow-400">
                                Pending
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.createdAt ? formatDate(item.createdAt) : 'N/A'}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>


        {/* -------------------------------------------------------------------------------- */}
        {/* Create Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 p-8 rounded-xl w-[950px] max-h-[95vh] overflow-y-auto border border-yellow-500 shadow-2xl">
              <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-3">
                <h2 className="text-2xl font-bold text-yellow-400">
                  Create New Barcode
                </h2>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 rounded-full text-yellow-400 hover:bg-gray-800 transition duration-150"
                >
                  <X size={24} />
                </button>
              </div>
              <form
                onSubmit={handleCreateSubmit}
                className="grid grid-cols-2 gap-6 text-white"
              >
                {/* Device/Element Details */}
                {[
                    { name: "elementName", label: "Select Element *", options: getUniqueOptions("elementName"), type: "select", required: true },
                    { name: "elementType", label: "Select Type *", options: getUniqueOptions("elementType"), type: "select", required: true, onChange: handleTypeChange },
                    { name: "elementModelNo", label: "Select Model No *", options: getUniqueOptions("model_No"), type: "select", required: true },
                    { name: "elementPartNo", label: "Device Part No *", options: getUniqueOptions("device_Part_No"), type: "select", required: true },
                    { name: "elementTacNo", label: "TAC No", options: getUniqueOptions("tac_No"), type: "select" },
                    { name: "elementCopNo", label: "COP No", options: getUniqueOptions("cop_No"), type: "select" },
                    { name: "copValid", label: "COP Valid Till", type: "date" },
                    { name: "voltage", label: "Voltage", type: "text" },
                ].map((field) => (
                    <div key={field.name}>
                        <label className="block mb-1 text-gray-300 font-medium">{field.label}</label>
                        {field.type === "select" ? (
                            <select
                                name={field.name}
                                value={formData[field.name] || ""}
                                onChange={field.onChange || handleChange}
                                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                                required={field.required}
                            >
                                <option value="">{field.label.replace(' *', '')}</option>
                                {field.options.map((opt) => (
                                    <option key={opt._id} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type={field.type}
                                name={field.name}
                                value={formData[field.name] || ""}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                                required={field.required}
                            />
                        )}
                    </div>
                ))}
                
                {/* Barcode/Serial Details */}
                <div>
                  <label className="block mb-1 text-gray-300 font-medium">Batch No</label>
                  <input
                    type="text"
                    name="batchNo"
                    value={formData.batchNo}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-yellow-400 font-mono"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300 font-medium">Barcode Creation Type *</label>
                  <select
                    name="baecodeCreationType"
                    value={formData.baecodeCreationType || ""}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-gray-300 font-medium">Barcode No *</label>
                  <input
                    type="text"
                    name="barCodeNo"
                    value={formData.barCodeNo || ""}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300 font-medium">Device Serial No *</label>
                  <input
                    type="text"
                    name="deviceSerialNo"
                    value={formData.deviceSerialNo || ""}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300 font-medium">Is Renew</label>
                  <select
                    name="is_Renew"
                    value={formData.is_Renew || "No"}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                {/* Spacer */}
                <div></div>


                {/* -------------------------------------------------------------------------------- */}
                {/* Dynamic SIM Section based on simCount */}
                {Array.from({ length: simCount }).map((_, i) => (
                  <div
                    key={i}
                    className="col-span-2 border border-yellow-500/50 bg-gray-800 p-5 rounded-lg mt-4 shadow-inner"
                  >
                    <h3 className="text-yellow-400 font-bold mb-4 border-b border-gray-700 pb-2">
                      SIM Card Configuration ({i + 1})
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block mb-1 text-gray-300 text-sm">SIM Number *</label>
                        <input
                          type="text"
                          value={formData.simDetails?.[i]?.simNo || ""}
                          onChange={(e) =>
                            handleSimChange(i, "simNo", e.target.value)
                          }
                          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-gray-300 text-sm">ICCID Number *</label>
                        <input
                          type="text"
                          value={formData.simDetails?.[i]?.iccidNo || ""}
                          onChange={(e) =>
                            handleSimChange(i, "iccidNo", e.target.value)
                          }
                          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm"
                          maxLength={25}
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-gray-300 text-sm">Validity Date *</label>
                        <input
                          type="date"
                          value={formData.simDetails?.[i]?.validityDate || ""}
                          onChange={(e) =>
                            handleSimChange(i, "validityDate", e.target.value)
                          }
                          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-gray-300 text-sm">Operator *</label>
                        <select
                          value={formData.simDetails?.[i]?.operator || ""}
                          onChange={(e) =>
                            handleSimChange(i, "operator", e.target.value)
                          }
                          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm"
                          required
                        >
                          <option value="">Select Operator</option>
                          {HARDCODED_OPERATORS.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                {/* -------------------------------------------------------------------------------- */}

                {/* Buttons */}
                <div className="col-span-2 flex justify-end gap-4 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-6 py-3 rounded-lg bg-gray-600 text-white hover:bg-gray-500 transition duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition duration-150"
                  >
                    Create Barcode
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BarcodePage;