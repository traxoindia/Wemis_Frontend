import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Save, Loader2, AlertTriangle, CheckCircle, X, Wrench } from 'lucide-react';
// Assuming DealerNavbar is imported from './DealerNavbar'
import DealerNavbar from './DealerNavbar'; 
import TechnicianList from './TechnicianList';

// API Endpoint
const API_URL = "https://api.websave.in/api/manufactur/technicianCreateByDeler";

// --- Form Initial State ---
const initialFormData = {
  name: '',
  gender: '',
  email: '',
  mobile: '',
  adhar: '', 
  dateOfBirth: '',
  qualification: '',
};

/**
 * Component featuring a modal to create a new Technician under the current Dealer, 
 * with an elegant UI design.
 */
function TechnicianDealer() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); 

  // --- Modal Logic ---
  const openModal = () => {
    setFormData(initialFormData);
    setMessage(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Close modal if Esc key is pressed
  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isModalOpen]);

  // --- Form Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const authToken = localStorage.getItem('token'); 
    
    if (!authToken) {
        setMessage({ type: 'error', text: 'Authentication token not found. Please log in.' });
        setLoading(false);
        return;
    }

    if (!formData.name || !formData.mobile || !formData.adhar) {
        setMessage({ type: 'error', text: 'Name, Mobile, and Aadhaar are required fields.' });
        setLoading(false);
        return;
    }

    try {
      const response = await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
      });

      console.log('API Response:', response.data);
      setMessage({ type: 'success', text: 'Technician created successfully!' });
      
      setTimeout(closeModal, 2000);

    } catch (error) {
      console.error('API Error:', error.response ? error.response.data : error.message);
      
      const errorMessage = error.response && error.response.data 
        ? (error.response.data.message || 'Error: Could not register technician.') 
        : 'An unknown error occurred.';

      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
        {/* Navbar is kept here */}
        <DealerNavbar setIsModalOpen={openModal} /> 
    
        <div className="p-6 md:p-10 bg-black min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Main Header */}
                <h1 className="text-4xl font-extrabold text-yellow-400 mb-8 border-b-4 border-yellow-400/50 pb-3 tracking-wider">
                    <Wrench className="inline mr-3 h-8 w-8" /> Technician Directory
                </h1>
                
                {/* Action Button Section */}
                <div className="flex justify-between items-center mb-10 p-6 bg-neutral-900 border border-yellow-400/30 rounded-lg shadow-xl">
                    <h2 className="text-xl font-semibold text-white">Manage Team Members</h2>
                    <button
                        onClick={openModal}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-full text-base shadow-green-700/50 hover:bg-green-500 transition-all duration-300 transform hover:scale-[1.02]"
                    >
                        <UserPlus size={20} />  New Technician
                    </button>
                </div>

                {/* Placeholder for Technician List Table */}
                <div className="mt-8 p-6 bg-neutral-900 border border-yellow-400/30 rounded-xl shadow-xl">
                    <h3 className="text-2xl font-semibold text-yellow-400/80 mb-4">Existing Technicians</h3>
                    <TechnicianList/>
                   
                </div>
            </div>
        </div>

        {/* --- Technician Creation Modal --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeModal}>
            
            {/* Modal Content */}
            <div 
              className="relative bg-neutral-950 border border-yellow-400 rounded-2xl shadow-[0_0_40px_rgba(250,204,21,0.5)] w-full max-w-xl max-h-[90vh] overflow-y-auto transform transition-all duration-300"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8">
                
                {/* Header and Close Button */}
                <div className="flex justify-between items-start border-b border-yellow-400/50 pb-4 mb-6 sticky top-0 bg-neutral-950 z-20">
                    <h2 className="text-3xl font-bold flex items-center gap-3 text-yellow-400">
                        <Wrench size={28} /> New Technician Registration
                    </h2>
                    <button 
                        onClick={closeModal} 
                        className="p-2 rounded-full text-yellow-400 bg-neutral-800 hover:bg-yellow-400 hover:text-black transition duration-200"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                {/* Status Message */}
                {message && (
                    <div className={`p-4 mb-6 rounded-xl flex items-center gap-3 font-semibold text-sm ${
                        message.type === 'success' 
                        ? 'bg-green-700/30 text-green-400 border border-green-500' 
                        : 'bg-red-700/30 text-red-400 border border-red-500'
                    }`}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        <span>{message.text}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-yellow-400 mb-1">Full Name <span className="text-red-500">*</span></label>
                      <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition" required />
                    </div>

                    {/* Mobile and Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label htmlFor="mobile" className="block text-sm font-semibold text-yellow-400 mb-1">Mobile <span className="text-red-500">*</span></label>
                          <input type="tel" name="mobile" id="mobile" value={formData.mobile} onChange={handleChange} className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition" required />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-semibold text-yellow-400 mb-1">Email</label>
                          <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition" />
                        </div>
                    </div>

                    {/* Gender and Date of Birth */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label htmlFor="gender" className="block text-sm font-semibold text-yellow-400 mb-1">Gender</label>
                          <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 appearance-none transition">
                            <option value="" className='text-neutral-500'>Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-yellow-400 mb-1">Date of Birth</label>
                          <input type="date" name="dateOfBirth" id="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition" />
                        </div>
                    </div>

                    {/* Aadhaar and Qualification */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label htmlFor="adhar" className="block text-sm font-semibold text-yellow-400 mb-1">Aadhaar No. <span className="text-red-500">*</span></label>
                          <input type="text" name="adhar" id="adhar" value={formData.adhar} onChange={handleChange} className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition" required />
                        </div>
                        <div>
                          <label htmlFor="qualification" className="block text-sm font-semibold text-yellow-400 mb-1">Qualification</label>
                          <input type="text" name="qualification" id="qualification" value={formData.qualification} onChange={handleChange} className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition" />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 mt-8 flex items-center justify-center gap-2 font-bold text-lg rounded-lg transition duration-300 shadow-lg ${
                        loading 
                            ? 'bg-green-700/50 text-neutral-300 cursor-not-allowed' 
                            : 'bg-green-600 text-white hover:bg-green-500 hover:shadow-xl'
                        }`}
                    >
                        {loading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" /> Registering...
                        </>
                        ) : (
                        <>
                            <Save size={20} /> Register Technician
                        </>
                        )}
                    </button>
                </form>
              </div>
            </div>
          </div>
        )}
    </>
  );
}

export default TechnicianDealer;