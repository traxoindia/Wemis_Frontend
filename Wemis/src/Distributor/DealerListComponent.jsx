import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  List, Loader2, AlertTriangle, Users, Phone, Mail, MapPin, Briefcase, 
  ChevronDown, ChevronUp, DollarSign, Map, Clock, User 
} from 'lucide-react';

// API Endpoint for fetching the dealer list
const API_URL_LIST = "https://api.websave.in/api/manufactur/fetchAllDistributorDelerList";

// ===============================================
// 1. EXPANDABLE ROW DETAIL COMPONENT
// ===============================================

/**
 * Component displayed when a table row is expanded.
 */
const DealerDetailRow = ({ dealer }) => (
  <td colSpan="6" className="p-0 border-t border-yellow-400/30">
    <div className="p-6 bg-neutral-950/70 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
      
      {/* Location Details */}
      <div className="border-l-4 border-yellow-500 pl-4">
        <h4 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2">
          <MapPin size={16} /> Location & RTO
        </h4>
        <p className="text-neutral-300">
          **Address:** {dealer.address || 'N/A'}
        </p>
        <p className="text-neutral-400">
          **Area/Pincode:** {dealer.area || 'N/A'} / {dealer.Pin_Code || 'N/A'}
        </p>
        <p className="text-neutral-400">
          **RTO Division:** <span className="text-white">{dealer.RTO_Division || 'N/A'}</span>
        </p>
      </div>

      {/* Profile Details */}
      <div className="border-l-4 border-yellow-500 pl-4">
        <h4 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2">
          <User size={16} /> Profile & Personal
        </h4>
        <p className="text-neutral-300">
          **DOB/Age:** {dealer.date_of_birth ? new Date(dealer.date_of_birth).toLocaleDateString() : 'N/A'} / {dealer.age || 'N/A'}
        </p>
        <p className="text-neutral-400">
          **Occupation:** {dealer.occupation || 'N/A'} ({dealer.gender || 'N/A'})
        </p>
        <p className="text-neutral-400">
          **Languages:** {dealer.languages_Known || 'N/A'}
        </p>
      </div>

      {/* Financial & Status */}
      <div className="border-l-4 border-yellow-500 pl-4">
        <h4 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2">
          <DollarSign size={16} /> Financial & Settings
        </h4>
        <p className="text-neutral-300">
          **Advance Payment:** <span className='font-semibold text-white'>₹{dealer.Advance_Payment || 0}</span>
        </p>
        <p className="text-neutral-400">
          **PAN:** {dealer.pan_Number || 'N/A'}
        </p>
        <p className="text-neutral-400">
          **Map Edit:** <span className={`font-semibold ml-1 ${dealer.Is_Map_Device_Edit ? 'text-green-500' : 'text-red-500'}`}>
            {dealer.Is_Map_Device_Edit ? 'Allowed' : 'Restricted'}
          </span>
        </p>
      </div>
    </div>
  </td>
);


// ===============================================
// 2. MAIN LIST COMPONENT
// ===============================================

function DealerListComponent() {
  const [dealerList, setDealerList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null); // State to track the expanded row ID

  useEffect(() => {
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    setLoading(true);
    setError(null);

    const authToken = localStorage.getItem('token'); 
    
    if (!authToken) {
        setError("Authentication token not found. Please log in.");
        setLoading(false);
        return;
    }

    try {
      const response = await axios.get(API_URL_LIST, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
      });

      // Using 'realDistributor' array based on your provided JSON structure
      const fetchedList = response.data.realDistributor || [];
      setDealerList(fetchedList);
      
    } catch (err) {
      console.error('Error fetching dealer list:', err);
      
      let errorMessage = 'Failed to load dealer list. Check your token or network connection.';

      if (err.response) {
          if (err.response.status === 401 || err.response.status === 403) {
              errorMessage = "Authentication failed. Token might be invalid or expired.";
          } else if (err.response.data && err.response.data.message) {
              errorMessage = err.response.data.message;
          }
      }
      
      setError(errorMessage);
      setDealerList([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle handler for expandable rows
  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // --- Render Functions (Loading, Error, Empty State) ---

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 bg-neutral-900 rounded-xl">
        <Loader2 size={36} className="animate-spin text-yellow-400" />
        <p className="ml-3 text-lg text-yellow-400">Loading Dealer List...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-800/20 border border-red-400 rounded-xl flex items-center gap-3">
        <AlertTriangle size={24} className="text-red-400" />
        <p className="text-red-400 font-medium">{error}</p>
        <button 
          onClick={fetchDealers} 
          className="ml-auto px-4 py-2 bg-yellow-400 text-black font-semibold rounded-md hover:bg-yellow-300 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (dealerList.length === 0) {
    return (
      <div className="p-8 bg-yellow-800/20 border border-yellow-400 rounded-xl flex flex-col items-center gap-4">
        <Users size={40} className="text-yellow-400" />
        <p className="text-lg text-yellow-400 font-medium">No dealer records found.</p>
        <button 
          onClick={fetchDealers} 
          className="mt-2 px-6 py-2 bg-yellow-400 text-black font-semibold rounded-md hover:bg-yellow-300 transition"
        >
          Reload Dealer Data
        </button>
      </div>
    );
  }

  // --- Main Table Render ---
  return (
    <div className="bg-neutral-900 border border-yellow-400/30 rounded-xl p-6 shadow-2xl">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-yellow-400 border-b border-yellow-400/50 pb-3">
        <List size={24} /> Dealer Directory
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-yellow-400/30">
          <thead className="bg-neutral-800">
            <tr>
             
              <th className="px-4 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">Dealer / Business</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">Contact & Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">State / Country</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-yellow-400 uppercase tracking-wider">Devices</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-yellow-400 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-700">
            {dealerList.map((dealer, index) => {
              const dealerId = dealer._id || `row-${index}`;
              const isExpanded = expandedRow === dealerId;
              const allocatedCount = dealer.allocateBarcodes?.length || 0;

              return (
                <React.Fragment key={dealerId}>
                  <tr className={`transition duration-200 ${isExpanded ? 'bg-neutral-800/80' : 'hover:bg-neutral-800'}`}>
                    
                    {/* Dealer ID */}
                    
                    
                    {/* Dealer / Business */}
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-white">{dealer.name || 'N/A'}</div>
                      <div className="text-xs text-yellow-300">{dealer.business_Name || 'No Business Name'}</div>
                    </td>
                    
                    {/* Contact Details */}
                    <td className="px-4 py-4">
                      <p className="flex items-center gap-1 text-sm text-neutral-300">
                        <Phone size={14} className="text-yellow-500" /> {dealer.mobile || 'N/A'}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-neutral-500">
                        <Mail size={14} className="text-neutral-600" /> {dealer.email || 'No Email'}
                      </p>
                    </td>
                    
                    {/* Location */}
                    <td className="px-4 py-4 text-sm text-neutral-300">
                      <p>{dealer.state || 'N/A'}</p>
                      <p className="text-xs text-neutral-500">{dealer.country || 'N/A'}</p>
                    </td>
                    
                    {/* Devices */}
                    <td className="px-4 py-4 text-center">
                        <span className={`font-semibold ${allocatedCount > 0 ? 'text-green-500' : 'text-neutral-500'}`}>
                            {allocatedCount}
                        </span>
                        <p className="text-xs text-neutral-500">Allocated</p>
                    </td>

                    {/* Expand/Collapse Action */}
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button 
                        onClick={() => toggleRow(dealerId)} 
                        className={`text-yellow-400 hover:text-white transition p-2 rounded-full ${isExpanded ? 'bg-yellow-700/30' : 'bg-neutral-800'}`}
                        title={isExpanded ? "Hide Details" : "Show Details"}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Detail Row */}
                  {isExpanded && <DealerDetailRow dealer={dealer} />}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DealerListComponent;