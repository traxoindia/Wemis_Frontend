import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Save, Loader2, AlertTriangle, CheckCircle, X } from 'lucide-react';
import DealerListComponent from './DealerListComponent';
import DistributorNavbar from './DistributorNavbar';

// ===============================================
// 1. MOCK DATA FOR DEPENDENT DROPDOWNS (REPLACE WITH REAL API FETCH IF AVAILABLE)
// ===============================================

const countries = [
  { id: '1', name: 'India', code: 'IN' },
  { id: '2', name: 'United States of America', code: 'US' },
];

const statesAndDistricts = {

  // 🇮🇳 INDIA (IN)
  'IN': {
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore'],
    'Arunachal Pradesh': ['Tawang', 'Itanagar', 'Ziro'],
    'Assam': ['Guwahati', 'Silchar', 'Dibrugarh'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur'],
    'Chhattisgarh': ['Raipur', 'Bilaspur', 'Durg'],
    'Delhi': ['New Delhi', 'North Delhi', 'South Delhi'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
    'Haryana': ['Gurgaon', 'Faridabad', 'Panipat'],
    'Himachal Pradesh': ['Shimla', 'Manali', 'Dharamshala'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad'],
    'Karnataka': [
      'Bagalkot',
      'Ballari',
      'Belagavi',
      'Bengaluru Urban',
      'Bengaluru Rural',
      'Bidar',
      'Chamarajanagar',
      'Chikballapur',
      'Chikkamagaluru',
      'Chitradurga',
      'Dakshina Kannada',
      'Davanagere',
      'Dharwad',
      'Gadag',
      'Hassan',
      'Haveri',
      'Kalaburagi',
      'Kodagu',
      'Kolar',
      'Koppal',
      'Mandya',
      'Mysuru',
      'Raichur',
      'Ramanagara',
      'Shivamogga',
      'Tumakuru',
      'Udupi',
      'Uttara Kannada',
      'Vijayapura',
      'Yadgir'
    ],
    'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik'],
    'Odisha': [
      'Angul',
      'Boudh',
      'Balangir',
      'Bargarh',
      'Balasore',
      'Bhadrak',
      'Cuttack',
      'Deogarh',
      'Dhenkanal',
      'Ganjam',
      'Gajapati',
      'Jharsuguda',
      'Jajpur',
      'Jagatsinghapur',
      'Khordha',
      'Keonjhar',
      'Kalahandi',
      'Kandhamal',
      'Koraput',
      'Kendrapara',
      'Malkangiri',
      'Mayurbhanj',
      'Nabarangpur',
      'Nuapada',
      'Nayagarh',
      'Puri',
      'Rayagada',
      'Sambalpur',
      'Subarnapur',
      'Sundargarh'
    ],
    'Punjab': ['Amritsar', 'Ludhiana', 'Jalandhar'],
    'Rajasthan': ['Jaipur', 'Udaipur', 'Jodhpur'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Nainital'],
    'West Bengal': ['Kolkata', 'Howrah', 'Siliguri'],
  },

  // 🇺🇸 USA (US)
  'US': {
    'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento'],
    'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio'],
    'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville'],
    'New York': ['New York City', 'Buffalo', 'Rochester', 'Albany'],
    'Illinois': ['Chicago', 'Springfield', 'Naperville'],
    'Georgia': ['Atlanta', 'Savannah', 'Augusta'],
    'Washington': ['Seattle', 'Spokane', 'Tacoma'],
    'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown'],
    'Ohio': ['Columbus', 'Cleveland', 'Cincinnati'],
    'Arizona': ['Phoenix', 'Tucson', 'Mesa'],
  }
};


// ===============================================
// 2. FORM & API CONFIGURATION
// ===============================================

// API Endpoint
const API_URL = "https://api.websave.in/api/manufactur/DistributorCreateDeler";

// Initial Form State
const initialFormData = {
  business_Name: '',
  name: '',
  email: '',
  gender: '',
  mobile: '',
  date_of_birth: '',
  age: '',
  Is_Map_Device_Edit: false,
  pan_Number: '',
  occupation: '',
  Advance_Payment: 0,
  languages_Known: '',
  country: '',
  state: '',
  district: '',
  RTO_Division: '',
  Pin_Code: '',
  area: '',
  address: '',
};

// ===============================================
// 3. MODAL COMPONENT
// ===============================================

/**
 * Renders the Dealer Creation Form inside a Modal.
 * @param {boolean} isOpen - Controls visibility of the modal.
 * @param {function} onClose - Function to close the modal.
 */
function DealerPage({ isOpen, onClose }) {
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [availableStates, setAvailableStates] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);

  // **IMPORTANT: Replace this with your actual Bearer Token**
   const authToken = localStorage.getItem('token'); 
    
    if (!authToken) {
        setError("Authentication token not found. Please log in.");
        setLoading(false);
        return;
    }

  // --- Modal & Dependent Dropdown Effects ---

  // Effect to handle dependent dropdown logic
  useEffect(() => {
    const selectedCountryCode = countries.find(c => c.name === formData.country)?.code;

    // 1. Populate States based on Country selection
    if (selectedCountryCode && statesAndDistricts[selectedCountryCode]) {
      setAvailableStates(Object.keys(statesAndDistricts[selectedCountryCode]));
    } else {
      setAvailableStates([]);
    }

    // 2. Populate Districts based on State selection (only if Country is known)
    if (selectedCountryCode && formData.state) {
      setAvailableDistricts(statesAndDistricts[selectedCountryCode][formData.state] || []);
    } else {
      setAvailableDistricts([]);
    }

  }, [formData.country, formData.state]);

  // Close modal if Esc key is pressed
  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isOpen, onClose]);

  // --- Form Handlers ---

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prevData => {
      let newData = {
        ...prevData,
        [name]: type === 'checkbox' ? checked : value
      };

      // Reset state/district if country changes
      if (name === 'country' && value !== prevData.country) {
        newData.state = '';
        newData.district = '';
      }
      // Reset district if state changes
      if (name === 'state' && value !== prevData.state) {
        newData.district = '';
      }
      return newData;
    });
  };

  const handleAgeChange = (e) => {
    const { name, value } = e.target;
    if (value === '' || /^[0-9\b]+$/.test(value)) {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload = {
      ...formData,
      age: parseInt(formData.age, 10) || 0,
      Advance_Payment: parseFloat(formData.Advance_Payment) || 0,
      Is_Map_Device_Edit: formData.Is_Map_Device_Edit,
    };

    // Simple validation check
    if (!payload.name || !payload.mobile || !payload.business_Name) {
      setMessage({ type: 'error', text: 'Name, Mobile, and Business Name are required fields.' });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(API_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
      });

      console.log('API Response:', response.data);
      setMessage({ type: 'success', text: 'Dealer created successfully!' });
      setFormData(initialFormData);
      setTimeout(onClose, 2000);

    } catch (error) {
      console.error('API Error:', error.response ? error.response.data : error.message);

      const errorMessage = error.response && error.response.data
        ? (error.response.data.message || JSON.stringify(error.response.data))
        : 'An unknown error occurred during dealer creation.';

      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    // Modal Overlay
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4">

      {/* Modal Content */}
      <div
        className="relative bg-neutral-900 border border-yellow-400/30 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="p-6 sm:p-8">

          {/* Header and Close Button */}
          <div className="flex justify-between items-center border-b border-yellow-400/50 pb-3 mb-6 sticky top-0 bg-neutral-900 z-20">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-yellow-400">
              <UserPlus size={24} /> Create New Dealer
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-yellow-400 hover:bg-yellow-400 hover:text-black transition"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`p-4 mb-6 rounded-lg flex items-center gap-3 text-sm ${message.type === 'success'
              ? 'bg-green-600/20 text-green-400 border border-green-400'
              : 'bg-red-600/20 text-red-400 border border-red-400'
              }`}>
              {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* --- Section 1: Basic Information --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="business_Name" className="block text-sm font-medium text-yellow-400 mb-1">Business Name <span className="text-red-500">*</span></label>
                <input type="text" name="business_Name" id="business_Name" value={formData.business_Name} onChange={handleChange} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:border-yellow-400 focus:ring-yellow-400" required />
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-yellow-400 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:border-yellow-400 focus:ring-yellow-400" required />
              </div>
            </div>

            {/* --- Section 2: Contact and Personal --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-yellow-400 mb-1">Mobile Number <span className="text-red-500">*</span></label>
                <input type="tel" name="mobile" id="mobile" value={formData.mobile} onChange={handleChange} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:border-yellow-400 focus:ring-yellow-400" required />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-yellow-400 mb-1">Email</label>
                <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:border-yellow-400 focus:ring-yellow-400" />
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-yellow-400 mb-1">Gender</label>
                <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:border-yellow-400 focus:ring-yellow-400 appearance-none">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* --- Section 3: Age & Occupation --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-yellow-400 mb-1">Date of Birth</label>
                <input type="date" name="date_of_birth" id="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:border-yellow-400 focus:ring-yellow-400" />
              </div>
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-yellow-400 mb-1">Age</label>
                <input type="text" name="age" id="age" value={formData.age} onChange={handleAgeChange} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:border-yellow-400 focus:ring-yellow-400" />
              </div>
              <div>
                <label htmlFor="occupation" className="block text-sm font-medium text-yellow-400 mb-1">Occupation</label>
                <input type="text" name="occupation" id="occupation" value={formData.occupation} onChange={handleChange} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:border-yellow-400 focus:ring-yellow-400" />
              </div>
            </div>

            {/* --- Section 4: Financial & Settings --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="pan_Number" className="block text-sm font-medium text-yellow-400 mb-1">PAN Number</label>
                <input type="text" name="pan_Number" id="pan_Number" value={formData.pan_Number} onChange={handleChange} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:border-yellow-400 focus:ring-yellow-400" />
              </div>
              <div>
                <label htmlFor="Advance_Payment" className="block text-sm font-medium text-yellow-400 mb-1">Advance Payment (₹)</label>
                <input type="number" name="Advance_Payment" id="Advance_Payment" value={formData.Advance_Payment} onChange={handleChange} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:border-yellow-400 focus:ring-yellow-400" min="0" />
              </div>
              <div className="flex items-end">
                <div className="flex items-center h-10">
                  <input type="checkbox" name="Is_Map_Device_Edit" id="Is_Map_Device_Edit" checked={formData.Is_Map_Device_Edit} onChange={handleChange} className="w-4 h-4 text-yellow-400 bg-neutral-800 border-neutral-700 rounded focus:ring-yellow-400 focus:ring-2" />
                  <label htmlFor="Is_Map_Device_Edit" className="ml-2 text-sm font-medium text-yellow-400">Allow Map Device Edit</label>
                </div>
              </div>
            </div>

            {/* --- Section 5: Address Details (Dependent Dropdowns) --- */}
            <h3 className="text-xl font-semibold mt-8 mb-4 text-yellow-400/80 border-t pt-4 border-yellow-400/20">Address & Location</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Country Dropdown */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-yellow-400 mb-1">Country</label>
                <select name="country" id="country" value={formData.country} onChange={handleChange} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:border-yellow-400 focus:ring-yellow-400 appearance-none">
                  <option value="">Select Country</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* State Dropdown (Conditional) */}
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-yellow-400 mb-1">State</label>
                <select name="state" id="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:border-yellow-400 focus:ring-yellow-400 appearance-none" disabled={!formData.country || availableStates.length === 0}>
                  <option value="">Select State</option>
                  {availableStates.map(stateName => (
                    <option key={stateName} value={stateName}>{stateName}</option>
                  ))}
                </select>
              </div>

              {/* District Dropdown (Conditional) */}
              <div>
                <label htmlFor="district" className="block text-sm font-medium text-yellow-400 mb-1">District</label>
                <select name="district" id="district" value={formData.district} onChange={handleChange} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:border-yellow-400 focus:ring-yellow-400 appearance-none" disabled={!formData.state || availableDistricts.length === 0}>
                  <option value="">Select District</option>
                  {availableDistricts.map(districtName => (
                    <option key={districtName} value={districtName}>{districtName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="Pin_Code" className="block text-sm font-medium text-yellow-400 mb-1">Pin Code</label>
                <input type="text" name="Pin_Code" id="Pin_Code" value={formData.Pin_Code} onChange={handleChange} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:border-yellow-400 focus:ring-yellow-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="RTO_Division" className="block text-sm font-medium text-yellow-400 mb-1">RTO Division</label>
                <input type="text" name="RTO_Division" id="RTO_Division" value={formData.RTO_Division} onChange={handleChange} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:border-yellow-400 focus:ring-yellow-400" />
              </div>
              <div>
                <label htmlFor="area" className="block text-sm font-medium text-yellow-400 mb-1">Area</label>
                <input type="text" name="area" id="area" value={formData.area} onChange={handleChange} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:border-yellow-400 focus:ring-yellow-400" />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-yellow-400 mb-1">Full Address</label>
              <textarea name="address" id="address" rows="3" value={formData.address} onChange={handleChange} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:border-yellow-400 focus:ring-yellow-400"></textarea>
            </div>

            <div>
              <label htmlFor="languages_Known" className="block text-sm font-medium text-yellow-400 mb-1">Languages Known (e.g., English, Hindi)</label>
              <input type="text" name="languages_Known" id="languages_Known" value={formData.languages_Known} onChange={handleChange} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:border-yellow-400 focus:ring-yellow-400" />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 mt-8 flex items-center justify-center gap-2 font-semibold rounded-lg transition sticky bottom-0 z-10 ${loading
                ? 'bg-yellow-600/50 text-neutral-300 cursor-not-allowed'
                : 'bg-yellow-400 text-black hover:bg-yellow-300'
                }`}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Save size={20} /> Create Dealer
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ===============================================
// 4. WRAPPER COMPONENT (To show the button and manage modal state)
// ===============================================

export default function DealerPageWrapper() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <DistributorNavbar/>

    <div className="min-h-screen bg-black text-white p-6 md:p-10">
     
      <h1 className="text-2xl font-bold text-yellow-400 mb-6 border-b border-yellow-400/50 pb-2">Dealer Management</h1>
      <p className="text-neutral-400 mb-6">Click the button below to open the modal for creating a new dealer.</p>

      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 transition shadow-lg"
      >
        <UserPlus size={20} /> Open Create Dealer Form
      </button>

      {/* The Modal Component (DealerPage) */}
      <DealerPage
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <div className="mt-12 p-4 bg-neutral-900 border border-yellow-400/30 rounded-lg">
        <DealerListComponent/>
      </div>
    </div>
     </>
  );
}