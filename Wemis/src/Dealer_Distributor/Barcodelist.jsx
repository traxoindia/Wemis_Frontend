import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  List, Loader2, AlertTriangle, QrCode, Map, Clock, Phone, Mail, RotateCcw 
} from 'lucide-react';
import DealerNavbar from './DealerNavbar';

// API Endpoint for fetching the dealer's barcode list
const API_URL_BARCODE_LIST = "https://api.websave.in/api/manufactur/getAllBarcodeListByCurrentDeler";

/**
 * Component to fetch and display the list of barcodes allocated to the current dealer.
 */
function Barcodelist() {
  const [barcodeList, setBarcodeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBarcodes();
  }, []);

  const fetchBarcodes = async () => {
    setLoading(true);
    setError(null);

    // 1. Retrieve Token from Local Storage
    const authToken = localStorage.getItem('token'); 
    
    if (!authToken) {
        setError("Authentication token not found in Local Storage. Please log in.");
        setLoading(false);
        return;
    }

    try {
      const response = await axios.get(API_URL_BARCODE_LIST, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
      });

      // Assuming the API returns the list directly or inside a 'data' property
      setBarcodeList(response.data.data || response.data || []);
      
    } catch (err) {
      console.error('Error fetching barcode list:', err);
      
      let errorMessage = 'Failed to load barcode list. Check your token or network connection.';

      if (err.response) {
          if (err.response.status === 401 || err.response.status === 403) {
              errorMessage = "Authentication failed. Token might be invalid or expired.";
          } else if (err.response.data && err.response.data.message) {
              errorMessage = err.response.data.message;
          }
      }
      
      setError(errorMessage);
      setBarcodeList([]);
    } finally {
      setLoading(false);
    }
  };

  // --- Render Functions (Loading, Error, Empty State) ---

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 bg-black min-h-screen">
        <Loader2 size={36} className="animate-spin text-yellow-400" />
        <p className="ml-3 text-lg text-yellow-400">Loading Barcode List...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 m-6 bg-red-800/20 border border-red-400 rounded-xl flex items-center gap-3 text-white">
        <AlertTriangle size={24} className="text-red-400" />
        <p className="text-red-400 font-medium">{error}</p>
        <button 
          onClick={fetchBarcodes} 
          className="ml-auto px-4 py-2 bg-yellow-400 text-black font-semibold rounded-md hover:bg-yellow-300 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (barcodeList.length === 0) {
    return (
      <div className="p-8 m-6 bg-yellow-800/20 border border-yellow-400 rounded-xl flex flex-col items-center gap-4 text-white">
        <QrCode size={40} className="text-yellow-400" />
        <p className="text-lg text-yellow-400 font-medium">No allocated barcodes found for your account.</p>
        <button 
          onClick={fetchBarcodes} 
          className="mt-2 px-6 py-2 bg-yellow-400 text-black font-semibold rounded-md hover:bg-yellow-300 transition"
        >
          Reload List
        </button>
      </div>
    );
  }

  // --- Main Table Render ---
  return (
    <>
        <DealerNavbar/>
    
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      
      <div className="bg-neutral-900 border border-yellow-400/30 rounded-xl p-6 shadow-2xl">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-yellow-400 border-b border-yellow-400/50 pb-3">
          <QrCode size={28} /> Dealer Barcode Inventory ({barcodeList.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-yellow-400/30">
            <thead className="bg-neutral-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">Barcode No.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">Device Model / Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">Serial No. / Batch No.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">SIM Info</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-yellow-400 uppercase tracking-wider">Validity & Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-yellow-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700">
              {barcodeList.map((barcode, index) => {
                // Safely accessing nested SIM details
                const sim = (barcode.simDetails && barcode.simDetails.length > 0) ? barcode.simDetails[0] : {};
                
                return (
                  <tr key={barcode._id || index} className="hover:bg-neutral-800 transition">
                    
                    {/* Barcode Number */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-white">
                      {barcode.barCodeNo || 'N/A'}
                      <p className='text-xs text-neutral-500'>{barcode.manufacturId ? barcode.manufacturId.slice(-4) : 'N/A'}</p>
                    </td>
                    
                    {/* Device Model / Type */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-yellow-300">{barcode.elementName || 'N/A'}</div>
                      <div className="text-xs text-neutral-400">Model: {barcode.elementModelNo || 'N/A'}</div>
                      <div className="text-xs text-neutral-500">Type: {barcode.elementType || 'N/A'}</div>
                    </td>
                    
                    {/* Serial No. / Batch No. */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-300">
                      <p>{barcode.deviceSerialNo || 'N/A'}</p>
                      <p className="text-xs text-neutral-500">Batch: {barcode.batchNo ? barcode.batchNo.slice(-10) : 'N/A'}</p>
                    </td>
                    
                    {/* SIM Info */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-300">
                        {sim.simNo ? (
                            <>
                                <p className='font-semibold'>{sim.simNo}</p>
                                <p className="text-xs text-neutral-500">{sim.operator || 'N/A'} (ICCID: {sim.iccidNo ? sim.iccidNo.slice(-4) : 'N/A'})</p>
                            </>
                        ) : (
                            <span className="text-red-500 text-xs">No SIM Data</span>
                        )}
                    </td>

                    {/* Validity & Status */}
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                      <p className='text-neutral-300'>COP Valid: {barcode.copValid ? new Date(barcode.copValid).toLocaleDateString() : 'N/A'}</p>
                      <span className={`font-semibold text-xs ${barcode.is_Renew === 'Yes' ? 'text-blue-400' : 'text-green-500'}`}>
                          {barcode.is_Renew === 'Yes' ? 'Renewed' : 'Active'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button 
                        onClick={() => console.log('Action for barcode:', barcode.barCodeNo)} 
                        className="text-yellow-400 hover:text-white transition p-2 rounded-full bg-neutral-800"
                        title="Rollback / Renew"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
}

export default Barcodelist;