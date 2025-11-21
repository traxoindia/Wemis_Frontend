import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { List, Loader2, AlertTriangle, Users, Phone, Mail, Calendar, Briefcase, Trash2, Edit } from 'lucide-react';

// API Endpoint for fetching all technicians
const API_URL_TECHNICIANS = "https://api.websave.in/api/manufactur/fetchAllDelerTechenicien";

/**
 * Component to fetch and display the list of technicians associated with the current dealer.
 */
function TechnicianList() {
  const [technicianList, setTechnicianList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
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
      const response = await axios.get(API_URL_TECHNICIANS, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
      });

      // 🚨 UPDATED: Accessing data using response.data.allTec based on the sample JSON
      setTechnicianList(response.data.allTec || []);
      
    } catch (err) {
      console.error('Error fetching technician list:', err);
      
      let errorMessage = 'Failed to load technician list. Check your token or network connection.';

      if (err.response) {
          if (err.response.status === 401 || err.response.status === 403) {
              errorMessage = "Authentication failed. Token might be invalid or expired.";
          } else if (err.response.data && err.response.data.message) {
              errorMessage = err.response.data.message;
          }
      }
      
      setError(errorMessage);
      setTechnicianList([]);
    } finally {
      setLoading(false);
    }
  };

  // --- Render Functions (Loading, Error, Empty State) ---

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 bg-neutral-900 rounded-xl">
        <Loader2 size={36} className="animate-spin text-yellow-400" />
        <p className="ml-3 text-lg text-yellow-400">Loading Technician List...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-800/20 border border-red-400 rounded-xl flex items-center gap-3">
        <AlertTriangle size={24} className="text-red-400" />
        <p className="text-red-400 font-medium">{error}</p>
        <button 
          onClick={fetchTechnicians} 
          className="ml-auto px-4 py-2 bg-yellow-400 text-black font-semibold rounded-md hover:bg-yellow-300 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (technicianList.length === 0) {
    return (
      <div className="p-8 bg-yellow-800/20 border border-yellow-400 rounded-xl flex flex-col items-center gap-4">
        <Users size={40} className="text-yellow-400" />
        <p className="text-lg text-yellow-400 font-medium">No technicians found under your account.</p>
        <button 
          onClick={fetchTechnicians} 
          className="mt-2 px-6 py-2 bg-yellow-400 text-black font-semibold rounded-md hover:bg-yellow-300 transition"
        >
          Reload List
        </button>
      </div>
    );
  }

  // --- Main Table Render ---
  return (
    <div className="mt-8 p-6 bg-neutral-900 border border-yellow-400/30 rounded-xl shadow-xl">
      <h3 className="text-2xl font-semibold text-yellow-400/80 mb-4 flex items-center gap-2">
        <List size={22} /> Registered Technicians ({technicianList.length})
      </h3>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-yellow-400/30">
          <thead className="bg-neutral-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">Name / Gender</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">Contact Details</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">ID / Aadhaar No.</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">DOB / Qualification</th>
              
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-700">
            {technicianList.map((tech, index) => (
              <tr key={tech._id || index} className="hover:bg-neutral-800 transition">
                
                {/* Name / Gender */}
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-white">{tech.name || 'N/A'}</div>
                  <div className="text-xs text-yellow-300">{tech.gender || 'N/A'}</div>
                </td>
                
                {/* Contact Details */}
                <td className="px-4 py-4">
                  <p className="flex items-center gap-1 text-sm text-neutral-300">
                    <Phone size={14} className="text-yellow-500" /> {tech.mobile || 'N/A'}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-neutral-500">
                    <Mail size={14} className="text-neutral-600" /> {tech.email || 'No Email'}
                  </p>
                </td>
                
                {/* ID / Aadhaar No. */}
                <td className="px-4 py-4 text-sm font-mono">
                    {/* Formatting Aadhaar (assuming 12 digits, showing last 4) */}
                    <p className='text-neutral-400'>Aadhaar: {tech.adhar || 'N/A'}</p>
                    <p className='text-xs text-neutral-500'>ID: {tech._id ? tech._id.slice(-8) : 'N/A'}</p>
                </td>

                {/* DOB / Qualification */}
                <td className="px-4 py-4 text-xs text-neutral-300">
                    <p className="flex items-center gap-1">
                        <Calendar size={14} className="text-yellow-500" /> 
                        {tech.dateOfBirth ? new Date(tech.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="flex items-center gap-1 text-neutral-500 mt-1">
                        <Briefcase size={14} className="text-neutral-600" /> 
                        {tech.qualification || 'N/A'}
                    </p>
                </td>

                {/* Actions */}
              
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TechnicianList;