import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Plus, Search, RefreshCw, X, HardHat, Package, Send, Calendar, Loader2, ChevronRight, ChevronLeft, Battery, FileText, Hash, Barcode, User, Building, Clock, CheckCircle, AlertCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import DistributorNavbar from './DistributorNavbar';



// --- API Endpoints ---
const DEALER_UNDER_DISTRIBUTOR_API = "https://api.websave.in/api/manufactur/fetchDelerUnderDistributor";
const ALLOCATE_BARCODE_API = "https://api.websave.in/api/manufactur/distributorAllocatedBarCode";
const DISTRIBUTOR_ALLOCATED_BARCODE_API = "https://api.websave.in/api/manufactur/fetchDistributorAllocatedBarcode";
const ALLOCATED_LIST_API = "https://api.websave.in/api/manufactur/AllocatedListOfBarCode";

// Enhanced StatusBadge component
const StatusBadge = ({ status, type = 'status' }) => {
  let color = "bg-gray-900/50 text-gray-400";
  if (type === 'status') {
    if (status === "ACTIVE" || status === "active" || status === "ALLOCATED") color = "bg-green-900/50 text-green-400";
    if (status === "INACTIVE" || status === "inactive") color = "bg-red-900/50 text-red-400";
    if (status === "PENDING") color = "bg-yellow-900/50 text-yellow-400";
  } else if (type === 'dealer') {
    color = "bg-blue-900/50 text-blue-300";
  } else if (type === 'renew') {
    color = status === "Yes" ? "bg-green-900/50 text-green-400" : "bg-gray-900/50 text-gray-400";
  }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
      {status === "Yes" ? <CheckCircle size={12} className="mr-1" /> : <AlertCircle size={12} className="mr-1" />}
      {status}
    </span>
  );
};

// SIM Details Card Component
const SimDetailsCard = ({ sim, index }) => {
  return (
    <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold text-yellow-400">SIM {index + 1}</span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          sim.operator === 'Airtel' ? 'bg-red-900/50 text-red-300' : 
          sim.operator === 'Jio' ? 'bg-purple-900/50 text-purple-300' : 
          'bg-blue-900/50 text-blue-300'
        }`}>
          {sim.operator}
        </span>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">SIM No:</span>
          <span className="text-white font-mono">{sim.simNo}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">ICCID:</span>
          <span className="text-white font-mono">{sim.iccidNo}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Valid Until:</span>
          <span className="text-white">{sim.validityDate}</span>
        </div>
      </div>
    </div>
  );
};

// Barcode Details Modal
const BarcodeDetailsModal = ({ isOpen, onClose, barcodeData }) => {
  if (!isOpen || !barcodeData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 border border-yellow-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-700 sticky top-0 bg-gray-800">
          <h2 className="text-2xl font-bold text-yellow-400 flex items-center">
            <Barcode size={24} className="mr-2" />
            Barcode Details - {barcodeData.barCodeNo}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Hash size={16} className="text-yellow-400 mr-2" />
                <span className="text-sm font-semibold text-gray-300">Barcode Info</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Number:</span>
                  <span className="text-white font-mono">{barcodeData.barCodeNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Creation Type:</span>
                  <span className="text-white">{barcodeData.baecodeCreationType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Batch No:</span>
                  <span className="text-white font-mono">{barcodeData.batchNo}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Calendar size={16} className="text-yellow-400 mr-2" />
                <span className="text-sm font-semibold text-gray-300">Element Details</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white">{barcodeData.elementName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Model:</span>
                  <span className="text-white">{barcodeData.elementModelNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white">{barcodeData.elementType}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FileText size={16} className="text-yellow-400 mr-2" />
                <span className="text-sm font-semibold text-gray-300">Technical Details</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">COP No:</span>
                  <span className="text-white">{barcodeData.elementCopNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Part No:</span>
                  <span className="text-white">{barcodeData.elementPartNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">TAC No:</span>
                  <span className="text-white">{barcodeData.elementTacNo}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Device and SIM Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Information */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <Package size={16} className="text-yellow-400 mr-2" />
                <span className="text-sm font-semibold text-gray-300">Device Information</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Serial No:</span>
                  <span className="text-white font-mono">{barcodeData.deviceSerialNo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Voltage:</span>
                  <span className="text-white flex items-center">
                    <Battery size={14} className="mr-1" />
                    {barcodeData.voltage}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">COP Valid Until:</span>
                  <span className="text-white">{barcodeData.copValid}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Renewal:</span>
                  <StatusBadge status={barcodeData.is_Renew} type="renew" />
                </div>
              </div>
            </div>

            {/* SIM Information */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <Plus size={16} className="text-yellow-400 mr-2" />
                <span className="text-sm font-semibold text-gray-300">SIM Details ({barcodeData.simDetails?.length || 0})</span>
              </div>
              <div className="space-y-3">
                {barcodeData.simDetails?.map((sim, index) => (
                  <SimDetailsCard key={sim._id} sim={sim} index={index} />
                ))}
              </div>
            </div>
          </div>

          {/* Status and IDs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Building size={16} className="text-yellow-400 mr-2" />
                <span className="text-sm font-semibold text-gray-300">Manufacturer Information</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Manufacturer ID:</span>
                  <span className="text-white font-mono text-xs">{barcodeData.manufacturId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Barcode ID:</span>
                  <span className="text-white font-mono text-xs">{barcodeData._id}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <CheckCircle size={16} className="text-yellow-400 mr-2" />
                <span className="text-sm font-semibold text-gray-300">Status Information</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status:</span>
                  <StatusBadge status={barcodeData.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Updated:</span>
                  <span className="text-white">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal Component for Allocation Form (same as before)
const AllocateBarcodeModal = ({ isOpen, onClose, handleSubmit, dealerOptions, isSubmitting, fetchAvailableBarcodes }) => {
  const [formData, setFormData] = useState({
    dealerId: "",
    elementModel: "",
  });
  
  const [availableBarcodes, setAvailableBarcodes] = useState([]);
  const [allocatedBarcodes, setAllocatedBarcodes] = useState([]);
  const [selectedAvailable, setSelectedAvailable] = useState([]);
  const [selectedAllocated, setSelectedAllocated] = useState([]);
  const [isBarcodeLoading, setIsBarcodeLoading] = useState(false);
  
  useEffect(() => {
    if (!isOpen) {
        setFormData({ dealerId: "", elementModel: "" });
    }
  }, [isOpen]);

  useEffect(() => {
    setAllocatedBarcodes([]);
    setSelectedAvailable([]);
    setSelectedAllocated([]);
    
    const fetchBarcodes = async () => {
        if (isOpen) {
            setIsBarcodeLoading(true);
            const barcodes = await fetchAvailableBarcodes(); 
            setAvailableBarcodes(barcodes.map(b => ({ id: b, label: b })));
            setIsBarcodeLoading(false);
        } else {
            setAvailableBarcodes([]);
        }
    };
    
    fetchBarcodes();
  }, [isOpen, fetchAvailableBarcodes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (e, setSelectedState) => {
    const values = Array.from(e.target.options)
      .filter((o) => o.selected)
      .map((o) => o.value);
    setSelectedState(values);
  };
  
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

  const onSubmit = (e) => {
    e.preventDefault();
    
    const finalBarcodeNos = allocatedBarcodes.map(b => b.id);
    
    if (!formData.dealerId) {
        toast.error("Please select a Dealer.");
        return;
    }
    
    if (finalBarcodeNos.length === 0) {
        toast.error("Please allocate at least one barcode.");
        return;
    }
    
    handleSubmit({
        dealerId: formData.dealerId,
        barcodeNos: finalBarcodeNos,
        elementModel: formData.elementModel
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 scale-100 border border-yellow-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-yellow-400 flex items-center"><Send size={24} className="mr-2" />Allocate Barcodes</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Select Dealer *</label>
                <div className="relative">
                  <select
                    name="dealerId"
                    value={formData.dealerId}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting || dealerOptions.length === 0}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500 appearance-none pr-10"
                  >
                    <option value="" disabled={formData.dealerId !== ""}>
                        {dealerOptions.length === 0 ? "Loading Dealers..." : "Select a Dealer"}
                    </option>
                    {dealerOptions.map(dealer => (
                      <option key={dealer.value} value={dealer.value}>
                        {dealer.label}
                      </option>
                    ))}
                  </select>
                  <HardHat size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Device Model (Optional)</label>
                <div className="relative">
                  <input
                    type="text"
                    name="elementModel"
                    value={formData.elementModel}
                    onChange={handleChange}
                    placeholder="e.g., GPS Tracker V2"
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500"
                  />
                  <Package size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg border border-yellow-500/30">
             <h3 className="text-lg font-bold text-yellow-400 mb-4 border-b border-gray-600 pb-2">Barcode Selection</h3>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              
              <div className="w-full sm:w-5/12">
                <div className="font-bold text-gray-300 mb-2">
                  Available Barcodes ({availableBarcodes.length})
                </div>
                {isBarcodeLoading ? (
                    <div className="w-full h-56 flex items-center justify-center bg-gray-900 rounded-lg">
                        <Loader2 size={24} className="animate-spin text-yellow-400" />
                    </div>
                ) : (
                    <select
                      multiple
                      className="w-full h-56 p-3 border border-gray-600 rounded-lg bg-gray-900 text-white text-sm shadow-inner overflow-auto focus:border-yellow-500"
                      onChange={(e) => handleSelectChange(e, setSelectedAvailable)}
                      value={selectedAvailable}
                      disabled={isSubmitting || availableBarcodes.length === 0}
                    >
                      {availableBarcodes.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                )}
                {availableBarcodes.length === 0 && !isBarcodeLoading && (
                    <p className="text-xs text-yellow-300 mt-1">No barcodes currently available for allocation.</p>
                )}
              </div>

              <div className="w-full sm:w-2/12 flex sm:flex-col justify-center items-center gap-3">
                <button
                  type="button"
                  onClick={moveForward}
                  disabled={selectedAvailable.length === 0 || isSubmitting || isBarcodeLoading}
                  className="p-3 w-10 h-10 rounded-full bg-yellow-500 text-black hover:bg-yellow-600 disabled:bg-gray-600 transition shadow-md"
                  title="Allocate Selected"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={moveBack}
                  disabled={selectedAllocated.length === 0 || isSubmitting || isBarcodeLoading}
                  className="p-3 w-10 h-10 rounded-full bg-gray-500 text-white hover:bg-gray-600 disabled:bg-gray-600 transition shadow-md"
                  title="Deallocate Selected"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="w-full sm:w-5/12">
                <div className="font-bold text-gray-300 mb-2">
                  Allocated Barcodes (<span className="text-yellow-400">{allocatedBarcodes.length}</span>)
                </div>
                <select
                  multiple
                  className="w-full h-56 p-3 border border-gray-600 rounded-lg bg-gray-900 text-white text-sm shadow-inner overflow-auto focus:border-yellow-500"
                  onChange={(e) => handleSelectChange(e, setSelectedAllocated)}
                  value={selectedAllocated}
                  disabled={isSubmitting || isBarcodeLoading}
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

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || dealerOptions.length === 0 || allocatedBarcodes.length === 0}
              className="w-full flex items-center justify-center px-6 py-3 rounded-lg bg-yellow-500 text-gray-900 font-bold hover:bg-yellow-400 transition duration-150 shadow-lg disabled:bg-gray-600 disabled:text-gray-400"
            >
              {isSubmitting ? (
                <Loader2 size={20} className="mr-2 animate-spin" />
              ) : (
                <Send size={20} className="mr-2" />
              )}
              {isSubmitting ? "Allocating..." : "Confirm Allocation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper function to find dealer name
const findDealerName = (id, options) => {
    const dealer = options.find(d => d.value === id);
    return dealer ? dealer.label : 'N/A';
};

// Main Component
function AllocateBarcodePage() {
  const tkn = localStorage.getItem("token") || "MOCK_TOKEN_12345";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [dealerOptions, setDealerOptions] = useState([]);
  const [selectedBarcode, setSelectedBarcode] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const fetchDealers = useCallback(async () => {
    if (!tkn) return;
    try {
      const response = await axios.get(DEALER_UNDER_DISTRIBUTOR_API, {
        headers: { Authorization: `Bearer ${tkn}` },
      });

      const rawData = response.data.delerList || response.data; 
      
      if (Array.isArray(rawData)) {
        // Exclude _id to adhere to the request of not showing ID in the main list
        const formattedDealers = rawData.map(d => ({
          value: d._id, 
          label: d.dealerName || d.userName || d._id, 
        }));
        setDealerOptions(formattedDealers);
      } else {
        toast.error("Dealer data structure error.");
      }
    } catch (error) {
      toast.error("Failed to load dealer list.");
      console.error("Fetch dealers error:", error.response?.data || error.message);
    }
  }, [tkn]);
  
  const fetchAllocationHistory = useCallback(async () => {
    if (!tkn) return;
    setLoadingHistory(true);
    try {
        const response = await axios.get(ALLOCATED_LIST_API, {
            headers: { Authorization: `Bearer ${tkn}` },
        });
        
        const rawList = response.data.listOfDistrinutorAllocatedBarCode || response.data; 
        console.log("Fetched History Data:", rawList);

        if (Array.isArray(rawList)) {
            setHistoryData(rawList);
        } else {
            console.error("History data structure error: Expected array.", rawList);
            setHistoryData([]);
        }

    } catch (error) {
        toast.error("Failed to load allocation history.");
        console.error("Fetch history error:", error.response?.data || error.message);
        setHistoryData([]);
    } finally {
        setLoadingHistory(false);
    }
  }, [tkn]);

  const fetchAvailableBarcodesForAllocation = useCallback(async () => {
    if (!tkn) return [];
    try {
        const response = await axios.get(DISTRIBUTOR_ALLOCATED_BARCODE_API, { 
            headers: { Authorization: `Bearer ${tkn}` } 
        });
        
        const rawData = response.data.distributor || response.data; 
        if (Array.isArray(rawData)) {
            const allBarcodes = rawData
                .map(item => item.barCodeNo)
                .filter(barCode => barCode);
            const uniqueBarcodes = Array.from(new Set(allBarcodes));
            return uniqueBarcodes;
        }
        toast.error("Barcode pool data is not in an expected array format.");
        return [];
    } catch (error) {
        toast.error("Failed to fetch available barcode pool.");
        console.error("Available Barcode Fetch Error:", error.response?.data || error.message);
        return [];
    }
  }, [tkn]);

  useEffect(() => {
    fetchDealers();
    fetchAllocationHistory();
  }, [fetchDealers, fetchAllocationHistory]);

  const handleAllocateSubmit = async (formData) => {
    const payload = {
      delerId: formData.dealerId,
      barcodeNos: formData.barcodeNos,
    };
    
    console.log("Allocation Payload:", payload);

    setIsSubmitting(true);
    try {
      const response = await axios.post(ALLOCATE_BARCODE_API, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tkn}`
        },
      });
      console.log("Allocation Response:", response.data);

      if (response.data.success) {
        toast.success(response.data.message || `Successfully allocated ${formData.barcodeNos.length} barcode(s).`);
        setIsModalOpen(false);
        fetchAllocationHistory(); 
      } else {
        toast.error(response.data.message || "Allocation failed. Check input values.");
      }

    } catch (error) {
      const message = error.response?.data?.message || error.message || "An unknown network error occurred.";
      toast.error(message);
      console.error("Allocation API Error:", error.response?.data || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = (barcodeData) => {
    setSelectedBarcode(barcodeData);
    setIsDetailsModalOpen(true);
  };

  const filteredHistory = historyData.filter(item => {
    const lowerSearch = searchTerm.toLowerCase();
    
    const allocatedBarcodes = item.allocatedBarcode || []; 
    const primaryBarcode = allocatedBarcodes.length > 0 ? allocatedBarcodes[0].barCodeNo : '';
    
    const dealerMatch = findDealerName(item.allocatedDelerId, dealerOptions).toLowerCase().includes(lowerSearch) ||
                        (item.delerName?.toLowerCase().includes(lowerSearch));
    const barcodeMatch = primaryBarcode.toLowerCase().includes(lowerSearch);
    
    return dealerMatch || barcodeMatch;
  });

  return (
    <div className="bg-gray-900 min-h-screen">
      <DistributorNavbar />
      <Toaster position="top-right" />

      <div className="p-4 sm:p-8 max-w-7xl mx-auto">

        <h1 className="text-3xl sm:text-4xl font-extrabold text-yellow-400 mb-6 border-b border-gray-700 pb-3">
          Barcode Allocation Management
        </h1>

        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 space-y-4 sm:space-y-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-6 py-3 rounded-xl bg-yellow-500 text-gray-900 font-bold hover:bg-yellow-400 transition duration-150 shadow-lg w-full sm:w-auto justify-center"
          >
            <Plus size={20} className="mr-2" /> Allocate New Barcode
          </button>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search by Barcode, Dealer, Status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 w-full sm:w-80 transition duration-150 shadow-inner"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <button
              className="p-3 rounded-xl bg-gray-800 text-yellow-400 border border-gray-700 hover:bg-gray-700 transition duration-150 shadow-md"
              title="Refresh Data"
              onClick={fetchAllocationHistory}
              disabled={loadingHistory}
            >
              {loadingHistory ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
            </button>
          </div>
        </div>

        {/* Allocated Barcodes History */}
        <h2 className="text-2xl font-semibold text-white mb-4">Allocated Barcodes History</h2>

        <div className="bg-gray-800 shadow-2xl rounded-xl overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            {loadingHistory ? (
              <p className="p-10 text-center text-yellow-400 text-lg flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading history...
              </p>
            ) : filteredHistory.length === 0 ? (
              <p className="p-10 text-center text-gray-500 text-lg">No allocation records found.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Dealer</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Device Details</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Barcode Info</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">SIM Details</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Technical Info</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Allocation Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {filteredHistory.map((item, index) => {
                    const allocatedBarcodes = item.allocatedBarcode || [];
                    const primaryBarcodeData = allocatedBarcodes[0] || {};
                    const primaryBarcode = primaryBarcodeData.barCodeNo || 'N/A';
                    // Do not show the Dealer ID
                    const dealerName = item.delerName || findDealerName(item.allocatedDelerId, dealerOptions);
                    
                    return (
                      <tr key={index} className="text-white hover:bg-gray-700/50 transition duration-100">
                        {/* Dealer Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User size={16} className="text-blue-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium">{dealerName}</div>
                              {/* Removed Dealer ID display based on user request ("i don't want id") */}
                            </div>
                          </div>
                        </td>

                        {/* Device Details */}
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-semibold text-white">{primaryBarcodeData.elementName || 'N/A'}</div>
                            <div className="text-gray-300">{primaryBarcodeData.elementModelNo || 'N/A'}</div>
                            <div className="text-xs text-gray-400 flex items-center mt-1">
                              <Calendar size={12} className="mr-1" />
                              {primaryBarcodeData.elementType || 'N/A'}
                            </div>
                          </div>
                        </td>

                        {/* Barcode Info */}
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-mono text-yellow-300">{primaryBarcode}</div>
                            <div className="text-xs text-gray-400">{primaryBarcodeData.baecodeCreationType || 'N/A'}</div>
                            {/* Removed batch number truncation, keeping it brief by default */}
                            <div className="text-xs text-gray-400">Batch: {primaryBarcodeData.batchNo || 'N/A'}</div>
                          </div>
                        </td>

                        {/* SIM Details (SIM number and ICCID fully displayed) */}
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            
                            {primaryBarcodeData.simDetails?.slice(0, 2).map((sim, idx) => (
                              <div key={sim._id} className="text-xs text-gray-400 space-y-1">
                                <div className="font-semibold text-white">{sim.operator}</div>
                                <div><span className="text-gray-400">SIM: </span><span className="font-mono">{sim.simNo}</span></div> 
                                <div><span className="text-gray-400">ICCID: </span><span className="font-mono">{sim.iccidNo}</span></div> 
                              </div>
                            ))}
                            {primaryBarcodeData.simDetails?.length > 2 && (
                              <div className="text-xs text-yellow-400">+{primaryBarcodeData.simDetails.length - 2} more</div>
                            )}
                          </div>
                        </td>

                        {/* Technical Info */}
                        <td className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            <div className="text-xs">
                              <span className="text-gray-400">Serial: </span>
                              <span className="text-white font-mono">{primaryBarcodeData.deviceSerialNo || 'N/A'}</span>
                            </div>
                            <div className="text-xs">
                              <span className="text-gray-400">Voltage: </span>
                              <span className="text-white">{primaryBarcodeData.voltage || 'N/A'}</span>
                            </div>
                            <div className="text-xs">
                              <span className="text-gray-400">COP: </span>
                              <span className="text-white">{primaryBarcodeData.copValid || 'N/A'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Allocation Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-2" />
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={item.status || primaryBarcodeData.status || 'ALLOCATED'} />
                         
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleViewDetails(primaryBarcodeData)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition duration-150 flex items-center"
                          >
                            <FileText size={12} className="mr-1" />
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AllocateBarcodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        handleSubmit={handleAllocateSubmit}
        dealerOptions={dealerOptions}
        isSubmitting={isSubmitting}
        fetchAvailableBarcodes={fetchAvailableBarcodesForAllocation}
      />

      <BarcodeDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        barcodeData={selectedBarcode}
      />
    </div>
  );
}

export default AllocateBarcodePage;