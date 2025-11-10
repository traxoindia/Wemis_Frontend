import React, { useState, useCallback, useEffect } from "react";
import { PlusCircle, User, Phone, Mail, Wrench, Trash2, Edit, X, Loader2, Key } from "lucide-react"; // Added Key icon for Password/Contact
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import ManufactureNavbar from "./ManufactureNavbar";

// =======================================================================
// === API & TOKEN CONFIGURATION =========================================
// =======================================================================

// API Endpoints
const CREATE_TECHNICIAN_API = "https://api.websave.in/api/manufactur/createTechnician";
const FETCH_DISTRIBUTORS_API = "https://api.websave.in/api/manufactur/fetchAllDistributors";
const FETCH_DEALERS_API = "https://api.websave.in/api/manufactur/fetchAlldelersUnderDistributor"; 
const FETCH_TECHNICIANS_API = "https://api.websave.in/api/manufactur/fetchAllTechnicien";

// NOTE: Use a secure method (e.g., React Context or Redux) to retrieve the token.
const getAuthToken = () => {
  return localStorage.getItem("token") || "YOUR_MANUFACTURER_AUTH_TOKEN_HERE";
};

// =======================================================================

const TechnicianPage = () => {
  const [technicians, setTechnicians] = useState([]); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetchingTechnicians, setIsFetchingTechnicians] = useState(false); 
  const [isFetchingDistributors, setIsFetchingDistributors] = useState(false);
  const [isFetchingDealers, setIsFetchingDealers] = useState(false);
  
  // State for fetched data
  const [distributors, setDistributors] = useState([]);
  const [dealers, setDealers] = useState([]);

  const [formData, setFormData] = useState({
    distributorId: "", 
    dealer: "", 
    name: "",
    gender: "",
    email: "",
    phone: "", // Maps to 'mobile' on backend
    aadhar: "", // Maps to 'adhar' on backend
    dob: "", // Maps to 'dateOfBirth' on backend
    qualification: "",
  });

  // --- Technician Fetch Logic ---
  const fetchAllTechnicians = useCallback(async () => {
    const token = getAuthToken();
    if (!token || token === "YOUR_MANUFACTURER_AUTH_TOKEN_HERE") {
      toast.error("Authentication token not found. Cannot fetch technicians.");
      return;
    }

    setIsFetchingTechnicians(true);
    try {
      const response = await axios.post(FETCH_TECHNICIANS_API, {}, { 
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const fetchedTechnicians = response.data.technicien || response.data;
      
      if (Array.isArray(fetchedTechnicians)) {
        setTechnicians(fetchedTechnicians);
      } else {
        console.error("Technician API returned non-array data:", fetchedTechnicians);
        setTechnicians([]);
      }
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to fetch technicians.";
      toast.error(errorMessage);
      console.error("Technician API Error:", error.response?.data || error.message);
    } finally {
      setIsFetchingTechnicians(false);
    }
  }, []);

  // Run the technician fetch on component mount
  useEffect(() => {
    fetchAllTechnicians();
  }, [fetchAllTechnicians]);
  // ------------------------------------------------

  // --- Dealer Fetch Logic ---
  const fetchDealersByDistributor = useCallback(async (distributorId) => {
    if (!distributorId) {
      setDealers([]);
      return;
    }

    const token = getAuthToken();
    if (!token || token === "YOUR_MANUFACTURER_AUTH_TOKEN_HERE") {
      return;
    }

    setIsFetchingDealers(true);
    setDealers([]); 
    setFormData(prev => ({ ...prev, dealer: "" })); 

    try {
      const response = await axios.post(FETCH_DEALERS_API, { distributorId }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const fetchedDealers = response.data.delers; 
      if (Array.isArray(fetchedDealers)) {
        setDealers(fetchedDealers);
      } else {
        console.error("Dealer API returned non-array data or missing 'delers' key:", fetchedDealers);
        setDealers([]);
      }
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to fetch dealers.";
      toast.error(errorMessage);
      console.error("Dealer API Error:", error.response?.data || error.message);
    } finally {
      setIsFetchingDealers(false);
    }
  }, []);
  // --------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'distributorId') {
      fetchDealersByDistributor(value);
    }
  };

  // --- Distributor Fetch Logic ---
  const fetchAllDistributors = useCallback(async () => {
    const token = getAuthToken();
    if (!token || token === "YOUR_MANUFACTURER_AUTH_TOKEN_HERE") {
      toast.error("Authentication token not found or is placeholder. Please log in.");
      setIsFetchingDistributors(false);
      return;
    }

    setIsFetchingDistributors(true);
    try {
      const response = await axios.post(FETCH_DISTRIBUTORS_API, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const fetchedDistributors = response.data.allDistributors || response.data;
      if (Array.isArray(fetchedDistributors)) {
        setDistributors(fetchedDistributors);
      } else {
        console.error("Distributor API returned non-array data:", fetchedDistributors);
        setDistributors([]);
      }

    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to fetch distributors. Check network/token validity.";
      toast.error(errorMessage);
      console.error("Distributor API Error:", error.response?.data || error.message);
    } finally {
      setIsFetchingDistributors(false);
    }
  }, []);

  // Function to open the modal and trigger distributor fetch
  const openModal = () => {
    setIsModalOpen(true);
    if (distributors.length === 0) {
      fetchAllDistributors();
    }
    if (formData.distributorId) {
        fetchDealersByDistributor(formData.distributorId);
    }
  };

  const handleSave = useCallback(async () => {
    // 1. Basic Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.gender || !formData.qualification || !formData.distributorId || !formData.dealer) {
      toast.error("Please fill all required fields!");
      return;
    }
    
    // 2. Find selected objects for names
    const selectedDistributor = distributors.find(d => d._id === formData.distributorId);
    const selectedDealer = dealers.find(d => d._id === formData.dealer); 

    if (!selectedDistributor || !selectedDealer) {
        toast.error("Invalid Distributor or Dealer selected.");
        return;
    }

    // 3. Map Frontend state names to Backend API fields (req.body)
    const payload = {
      // Distributor data mapping
      distributorName: selectedDistributor.contact_Person_Name, 
      distributorId: formData.distributorId,                    
      
      // Dealer data mapping: Using the business_Name for delerName and _id for delerId
      delerName: selectedDealer.business_Name || selectedDealer.name, 
      delerId: formData.dealer, 
      
      // Technician data mapping
      name: formData.name,
      gender: formData.gender,
      email: formData.email,
      mobile: formData.phone,         
      adhar: formData.aadhar,         
      dateOfBirth: formData.dob,      
      qualification: formData.qualification,
    };

    const token = getAuthToken();
    if (!token || token === "YOUR_MANUFACTURER_AUTH_TOKEN_HERE") {
        toast.error("Authentication token not available. Cannot save.");
        return;
    }

    try {
      const response = await axios.post(CREATE_TECHNICIAN_API, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      toast.success(response.data.message || "Technician added successfully!");
      fetchAllTechnicians(); // Refresh the list
      
      // Reset State
      setIsModalOpen(false);
      setFormData({
        distributorId: "", dealer: "", name: "", gender: "", email: "", phone: "",
        aadhar: "", dob: "", qualification: "",
      });
      setDealers([]); 

    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to add technician due to an API error.";
      toast.error(errorMessage);
      console.error("API Error:", error.response?.data || error.message);
    }
  }, [formData, distributors, dealers, fetchAllTechnicians]);


  return (
    <>
      <Toaster position="top-right" />
      <ManufactureNavbar />

      <div className="min-h-screen bg-black text-yellow-400 px-4 py-8 md:px-8 -mt-[5px]">
        {/* Header and Add Button */}
        <div className="flex flex-col md:flex-row justify-between items-center border-b border-yellow-400/30 pb-4 mb-8 gap-4">
          <h1 className="text-3xl font-extrabold tracking-tight uppercase flex items-center gap-3 text-yellow-300">
            <Wrench className="text-yellow-400" size={28} /> Technician Management
          </h1>
          <button
            className="flex items-center gap-2 bg-yellow-400 text-black px-5 py-2.5 rounded-lg font-bold hover:bg-yellow-300 transition-all shadow-lg hover:shadow-yellow-400/50"
            onClick={openModal}
          >
            <PlusCircle size={20} /> Add New Technician
          </button>
        </div>

        <div className="mb-6 text-yellow-300 text-sm italic border-l-4 border-yellow-500 pl-3 py-1 bg-neutral-900/50 rounded-md">
          Displays the list of technicians, their assigned distributor/dealer, and their login credentials (Contact No serves as the initial password).
        </div>

        {/* Technician Table */}
        <div className="overflow-x-auto bg-neutral-900 border border-yellow-400/20 rounded-xl shadow-2xl">
          {isFetchingTechnicians ? (
            <div className="flex justify-center items-center py-12 text-yellow-400">
                <Loader2 size={32} className="animate-spin mr-3" /> Fetching Technician Data...
            </div>
          ) : (
            <table className="w-full text-sm text-left text-yellow-300">
              {/* Table Header (Enhanced) */}
              <thead className="bg-yellow-400 text-black uppercase text-xs font-extrabold border-b-4 border-yellow-600/50">
                <tr>
                  <th className="px-6 py-3 w-[5%] rounded-tl-xl">#</th>
                  <th className="px-6 py-3 w-[18%]">Technician Name</th>
                  <th className="px-6 py-3 w-[20%]">Email</th>
                  <th className="px-6 py-3 w-[15%]">Dealer</th>
                  <th className="px-6 py-3 w-[15%]">Distributor</th>
                  <th className="px-6 py-3 w-[15%] flex items-center gap-1">
                    <Key size={14} className="text-black"/> Contact No / Password
                  </th> 
                  <th className="px-6 py-3 w-[12%] text-center rounded-tr-xl">Action</th>
                </tr>
              </thead>
              <tbody>
                {technicians.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-yellow-500 text-lg font-semibold">
                      No technicians found. Please add a new technician.
                    </td>
                  </tr>
                ) : (
                  technicians.map((tech, idx) => (
                    <tr 
                      key={tech._id || idx} 
                      className="border-b border-yellow-400/10 hover:bg-yellow-400/10 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-yellow-400">{idx + 1}</td>
                      
                      {/* Technician Name */}
                      <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                        <User size={16} className="text-yellow-400"/> {tech.name}
                      </td>
                      
                      {/* Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-yellow-300">
                          <Mail size={16} />
                          <span className="truncate">{tech.email}</span>
                        </div>
                      </td>
                      
                      {/* Dealer Name */}
                      <td className="px-6 py-4 text-yellow-200">{tech.delerName || 'N/A'}</td>
                      
                      {/* Distributor Name */}
                      <td className="px-6 py-4 text-yellow-200">{tech.distributorName || 'N/A'}</td>
                      
                      {/* Contact No / Password (Highlighted) */}
                      <td className="px-6 py-4 text-green-400 font-extrabold text-base tracking-wider">
                         {tech.mobile} 
                      </td>
                      
                      {/* Action Buttons */}
                      <td className="px-6 py-4 flex items-center justify-center gap-3">
                        <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition shadow-md" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition shadow-md" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer/Pagination */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between text-yellow-300 text-sm">
          <div>Showing **{technicians.length}** entries</div>
          <div className="flex gap-2 items-center mt-2 md:mt-0">
            <button className="px-4 py-2 rounded-lg border border-yellow-400/40 bg-neutral-800 text-yellow-400 font-semibold disabled:opacity-50 hover:bg-neutral-700 transition" disabled>Previous</button>
            <span className="px-4 py-2 rounded-lg bg-yellow-400 text-black font-bold">1</span>
            <button className="px-4 py-2 rounded-lg border border-yellow-400/40 bg-neutral-800 text-yellow-400 font-semibold disabled:opacity-50 hover:bg-neutral-700 transition" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* Modal (No changes needed, already looks good) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-neutral-900 text-yellow-400 rounded-xl border border-yellow-400/30 shadow-2xl p-6 w-full max-w-lg relative animate-fadeIn">
            <button
              className="absolute top-3 right-3 text-yellow-400 hover:text-yellow-300 rounded-full focus:outline-none"
              onClick={() => setIsModalOpen(false)}
            >
              <X size={24} />
            </button>
            <h2 className="text-center text-2xl font-bold mb-2 tracking-wide">Add New Technician</h2>
            <p className="mb-6 text-yellow-300 text-center">Fill all required fields <span className="text-yellow-400">*</span>.</p>
            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              onSubmit={(e) => { e.preventDefault(); handleSave(); }}
            >
              {/* 1. Distributor Dropdown */}
              <div>
                <label className="block text-yellow-300 mb-1 font-medium">Distributor *</label>
                <div className="relative">
                  <select
                    name="distributorId"
                    value={formData.distributorId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 appearance-none rounded-lg bg-black text-yellow-400 border border-yellow-400/50 focus:outline-none focus:ring focus:ring-yellow-400 transition"
                    required
                    disabled={isFetchingDistributors}
                  >
                    <option value="">
                      {isFetchingDistributors ? "Loading..." : "Select Distributor"}
                    </option>
                    {distributors.map((distributor) => (
                      <option key={distributor._id} value={distributor._id}>
                        {distributor.contact_Person_Name}
                      </option>
                    ))}
                  </select>
                  {isFetchingDistributors && (
                    <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400 animate-spin" />
                  )}
                </div>
              </div>

              {/* 2. Dealer Dropdown (Uses business_Name for display) */}
              <div>
                <label className="block text-yellow-300 mb-1 font-medium">Dealer *</label>
                <div className="relative">
                  <select
                    name="dealer" // Stores the dealer's _id
                    value={formData.dealer}
                    onChange={handleChange}
                    className="w-full px-3 py-2 appearance-none rounded-lg bg-black text-yellow-400 border border-yellow-400/50 focus:outline-none focus:ring focus:ring-yellow-400 transition"
                    required
                    disabled={!formData.distributorId || isFetchingDealers}
                  >
                    <option value="">
                      {!formData.distributorId ? "Select Distributor First" : 
                       isFetchingDealers ? "Loading Dealers..." : 
                       dealers.length === 0 ? "No Dealers Found" : "Select Dealer"}
                    </option>
                    {dealers.map((dealer) => (
                      <option key={dealer._id} value={dealer._id}>
                        {/* Displaying business_Name */}
                        {dealer.business_Name || `ID: ${dealer._id}`} 
                      </option>
                    ))}
                  </select>
                  {isFetchingDealers && (
                    <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400 animate-spin" />
                  )}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-yellow-300 mb-1 font-medium">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg bg-black text-yellow-400 border border-yellow-400/50 focus:outline-none focus:ring focus:ring-yellow-400 transition"
                  required
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-yellow-300 mb-1 font-medium">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg bg-black text-yellow-400 border border-yellow-400/50 focus:outline-none focus:ring focus:ring-yellow-400 transition"
                  required
                >
                  <option value="">Select Option</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Email Id */}
              <div>
                <label className="block text-yellow-300 mb-1 font-medium">Email Id *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg bg-black text-yellow-400 border border-yellow-400/50 focus:outline-none focus:ring focus:ring-yellow-400 transition"
                  required
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-yellow-300 mb-1 font-medium">Mobile Number *</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg bg-black text-yellow-400 border border-yellow-400/50 focus:outline-none focus:ring focus:ring-yellow-400 transition"
                  required
                />
              </div>

              {/* Aadhar */}
              <div>
                <label className="block text-yellow-300 mb-1 font-medium">Aadhar</label>
                <input
                  type="text"
                  name="aadhar"
                  value={formData.aadhar}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg bg-black text-yellow-400 border border-yellow-400/50 focus:outline-none focus:ring focus:ring-yellow-400 transition"
                />
              </div>

              {/* DOB */}
              <div>
                <label className="block text-yellow-300 mb-1 font-medium">DOB</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg bg-black text-yellow-400 border border-yellow-400/50 focus:outline-none focus:ring focus:ring-yellow-400 transition"
                />
              </div>

              {/* Qualification */}
              <div className="md:col-span-2">
                <label className="block text-yellow-300 mb-1 font-medium">Qualification *</label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg bg-black text-yellow-400 border border-yellow-400/50 focus:outline-none focus:ring focus:ring-yellow-400 transition"
                  required
                />
              </div>

              {/* Submission Button (part of form) */}
              <div className="md:col-span-2 mt-6 flex flex-row-reverse justify-between gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-300 transition shadow"
                  disabled={isFetchingDistributors || isFetchingDealers}
                >
                  Save
                </button>
                <button
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-500 transition shadow"
                  onClick={() => setIsModalOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TechnicianPage;