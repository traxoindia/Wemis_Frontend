import React, { useEffect, useState, useContext, useCallback } from "react";
import axios from "axios";
import { Plus, X, Search, RefreshCw, Loader2 } from "lucide-react"; 
import toast, { Toaster } from "react-hot-toast";

// Assuming UserAppContext is correctly defined and imported
import { UserAppContext } from "../contexts/UserAppProvider"; // IMPORTANT: Use your actual path
import DistributorNavbar from "./DistributorNavbar";


// --- API Endpoints ---
const DISTRIBUTOR_ALLOCATED_BARCODE_API = "https://api.websave.in/api/manufactur/fetchDistributorAllocatedBarcode";


// Helper function for date formatting
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (e) {
    return dateString;
  }
};

// Helper function to render status badge
const StatusBadge = ({ status }) => {
    let color = "bg-yellow-900/50 text-yellow-400"; // Default/Pending
    if (status === "Active" || status === "active") {
        color = "bg-green-900/50 text-green-400";
    } else if (status === "Inactive" || status === "inactive") {
        color = "bg-red-900/50 text-red-400";
    }
    return (
        <span className={`inline-block px-3 py-1 leading-none rounded-full text-xs font-semibold ${color}`}>
            {status || 'Pending'}
        </span>
    );
};

// Helper function to render barcode type badge
const TypeBadge = ({ type }) => {
    let color = "bg-blue-900/50 text-blue-400"; // Manual/Automatic
    return (
        <span className={`inline-block px-3 py-1 leading-none rounded-full text-xs font-semibold ${color}`}>
            {type || 'N/A'}
        </span>
    );
};


function BarcodePage() {
  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [barcodeData, setBarcodeData] = useState([]); // State to store fetched barcode list
  const [searchTerm, setSearchTerm] = useState("");


  // Function to fetch distributor-allocated barcode data
  const fetchDistributorAllocatedBarcodes = useCallback(async () => {
    if (!tkn) {
      toast.error("No token found. Please login again.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(
        DISTRIBUTOR_ALLOCATED_BARCODE_API,
        { headers: { Authorization: `Bearer ${tkn}` } }
      );
      
      console.log("API Response:", res.data);
      // Adjusted list lookup based on common API patterns, preferring 'distributor' if available
      const rawData = res.data.distributor || res.data.allBarCods || res.data; 

      if (Array.isArray(rawData)) {
        setBarcodeData(rawData);
        if (rawData.length === 0) {
             toast("No barcodes allocated to this distributor yet.", { icon: 'ℹ️' });
        }
      } else {
        console.error("Allocated barcodes API did not return a valid array:", res.data);
        setBarcodeData([]);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      if (err.response?.status === 401 || err.response?.status === 403) {
          toast.error("Access Denied: Check token or permissions.");
      } else {
          toast.error(`Failed to fetch allocated barcodes. ${errMsg}`);
      }
      console.error("Fetch distributor allocated barcodes error:", err.response?.data || err.message);
      setBarcodeData([]);
    } finally {
      setLoading(false);
    }
  }, [tkn]);


  useEffect(() => {
    fetchDistributorAllocatedBarcodes();
  }, [fetchDistributorAllocatedBarcodes]);


  // Placeholder Filtered Data
  const filteredBarcodeData = barcodeData.filter(item => {
    const lowerCaseSearch = searchTerm.toLowerCase();

    const matchesMain = (
        item.deviceSerialNo?.toLowerCase().includes(lowerCaseSearch) ||
        item.barCodeNo?.toLowerCase().includes(lowerCaseSearch) ||
        item.elementName?.toLowerCase().includes(lowerCaseSearch) ||
        item.elementType?.toLowerCase().includes(lowerCaseSearch)
    );

    // Search nested SIM ICCID
    const matchesSim = item.simDetails?.some(sim => 
        sim.iccidNo?.toLowerCase().includes(lowerCaseSearch) ||
        sim.simNo?.toLowerCase().includes(lowerCaseSearch) ||
        sim.operator?.toLowerCase().includes(lowerCaseSearch)
    );
    
    return matchesMain || matchesSim;
  });
  
  // Handler for the "Add Device" button
  const handleAddDevice = () => {
      // Placeholder action
      toast('', {
          icon: '⚙️',
          duration: 3000,
      });
  };


  // --- Render Component ---

  return (
    <div className="bg-gray-900 min-h-screen">
      <DistributorNavbar />

      <div className="p-8 max-w-7xl mx-auto">

        <Toaster position="top-right" />
        <h1 className="text-4xl font-extrabold text-yellow-400 mb-8 border-b border-gray-700 pb-3">
          Allocated Barcode Inventory
        </h1>
        
        {/* Top Control Bar (Search, Refresh, Add Device) */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search Device No, Barcode, or SIM details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 w-96 transition duration-150"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            
            {/* Refresh Button */}
            <button
                className="p-3 rounded-lg bg-gray-800 text-yellow-400 border border-gray-700 hover:bg-gray-700 transition duration-150"
                title="Refresh Data"
                onClick={fetchDistributorAllocatedBarcodes} 
                disabled={loading}
            >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
            </button>
          </div>
          
          {/* Add Device Button */}
         
         
        </div>
        
        {/* Barcode List Table */}
        <div className="bg-gray-800 shadow-2xl rounded-xl overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            {loading ? (
              <p className="p-10 text-center text-yellow-400 text-lg flex items-center justify-center">
                 <Loader2 className="w-6 h-6 animate-spin mr-3" /> Fetching allocated inventory...
              </p>
            ) : filteredBarcodeData.length === 0 ? (
              <p className="p-10 text-center text-gray-500 text-lg">No allocated barcodes match your search criteria. Try removing filters.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Device/Barcode IDs</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Product Info</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">SIM Card Details</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Metadata</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Status & Date</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {filteredBarcodeData.map((item, index) => (
                    <tr key={item._id || index} className="text-white hover:bg-gray-700/50 transition duration-100">
                      
                      {/* Column 1: Device/Barcode IDs */}
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                          <p className="text-gray-300 font-semibold mb-1">Serial No: <span className="text-white font-mono">{item.deviceSerialNo || 'N/A'}</span></p>
                          <p className="text-gray-400 text-xs">Barcode No: <span className="font-mono text-yellow-300">{item.barCodeNo || 'N/A'}</span></p>
                          <p className="text-gray-400 text-xs mt-1">Batch No: {item.batchNo || 'N/A'}</p>
                      </td>

                      {/* Column 2: Product Info */}
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                          <p className="text-gray-300 font-semibold mb-1">{item.elementName || 'N/A'}</p>
                          <p className="text-gray-400 text-xs">Type: {item.elementType || 'N/A'}</p>
                          <p className="text-gray-400 text-xs">Model: {item.elementModelNo || 'N/A'}</p>
                          <p className="text-gray-400 text-xs">Part No: {item.elementPartNo || 'N/A'}</p>
                      </td>
                      
                      {/* Column 3: SIM Card Details */}
                      <td className="px-6 py-4 text-xs">
                          {item.simDetails && item.simDetails.length > 0 ? (
                              <ul className="space-y-2 list-none p-0 m-0">
                                  {item.simDetails.map((sim, simIndex) => (
                                      <li key={simIndex} className="p-2 border border-gray-700 rounded-md bg-gray-700/50">
                                          <p className="font-semibold text-yellow-300">SIM {simIndex + 1} ({sim.operator || 'Unknown'})</p>
                                          <p className="text-gray-400 font-mono text-xs break-all">ICCID: {sim.iccidNo || 'N/A'}</p>
                                          <p className="text-gray-400 text-xs">Valid Till: {formatDate(sim.validityDate)}</p>
                                      </li>
                                  ))}
                              </ul>
                          ) : (
                              <span className="text-gray-500 italic">No SIM Card</span>
                          )}
                      </td>

                      {/* Column 4: Metadata (TAC/COP/Voltage) */}
                      <td className="px-6 py-4 text-xs whitespace-nowrap">
                          <p className="text-gray-400">TAC No: {item.elementTacNo || 'N/A'}</p>
                          <p className="text-gray-400">COP No: {item.elementCopNo || 'N/A'}</p>
                          <p className="text-gray-400">Voltage: {item.voltage || 'N/A'}</p>
                          <p className="text-gray-400 mt-2">Renewable: <span className="font-semibold">{item.is_Renew || 'No'}</span></p>
                      </td>

                      {/* Column 5: Status & Date */}
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                          <div className="space-y-2">
                              {/* Assuming status is 'Active' or 'Pending' based on context */}
                              <StatusBadge status={item.status || 'Active'} /> 
                              <TypeBadge type={item.baecodeCreationType} />
                              
                          </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BarcodePage;