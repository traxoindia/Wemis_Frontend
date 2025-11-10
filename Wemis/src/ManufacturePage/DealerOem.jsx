import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { UserAppContext } from "../contexts/UserAppProvider";
import ManufactureNavbar from "./ManufactureNavbar";
import { getAllStates, getDistricts } from "india-state-district";
import { FaEdit, FaTrash } from "react-icons/fa";

/* ---------------- Constants ---------------- */
const USA_STATES = ["California", "Texas", "New York", "Florida"];
const CHINA_PROVINCES = ["Beijing", "Shanghai", "Guangdong", "Zhejiang"];
const COUNTRIES = ["India", "USA", "China"];
const GENDERS = ["Male", "Female", "Other"];
const OCCUPATIONS = ["Business", "Engineer", "Technician", "Other"];
const LANGUAGES = ["English", "Hindi", "Odia", "Chinese"];
const RTO_DIVISIONS = ["Bhubaneswar", "Cuttack", "Balasore", "Sambalpur"];

function DealerOem() {
  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [dealers, setDealers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [indiaStates, setIndiaStates] = useState([]);
  const [indiaDistricts, setIndiaDistricts] = useState([]);
  const [genericStates, setGenericStates] = useState([]);

  const [distributors, setDistributors] = useState([]);

  const [newDealer, setNewDealer] = useState({
    oemsId: "",
    select_Oems_Name: "",
    business_Name: "",
    name: "",
    email: "",
    gender: "",
    mobile: "",
    date_of_birth: "",
    age: "",
    Is_Map_Device_Edit: "",
    pan_Number: "",
    occupation: "",
    Advance_Payment: "",
    languages_Known: "",
    country: "India",
    state: "",
    district: "",
    RTO_Division: "",
    Pin_Code: "",
    area: "",
    address: "",
  });

  /* ---------------- Fetch Distributors ---------------- */
  const fetchDistributors = async () => {
    try {
      const res = await axios.post(
        "https://api.websave.in/api/manufactur/fetchOems",
        {},
        { headers: { Authorization: `Bearer ${tkn}` } }
      );
      setDistributors(res.data.oems || []);
    } catch {
      toast.error("Failed to fetch Distributors");
    }
  };

  /* ---------------- Fetch Dealers ---------------- */
  const fetchDealers = async () => {
    try {
      const res = await axios.post(
        "https://api.websave.in/api/manufactur/fetchDelerUnderOems",
        {},
        { headers: { Authorization: `Bearer ${tkn}` } }
      );
      setDealers(res.data.delerOems);


    } catch {
      toast.error("Failed to fetch Dealers");
    }
  };

  useEffect(() => {
    fetchDealers();
    fetchDistributors();
    setIndiaStates(getAllStates());
  }, [tkn]);

  /* ---------------- Country → State → District ---------------- */
  const handleCountryChange = (e) => {
    const country = e.target.value;
    let nextStates = [];
    if (country === "USA") nextStates = USA_STATES;
    if (country === "China") nextStates = CHINA_PROVINCES;

    setNewDealer({
      ...newDealer,
      country,
      state: "",
      district: "",
    });
    setIndiaDistricts([]);
    setGenericStates(nextStates);
  };

  const handleStateChange = (e) => {
    const stateVal = e.target.value;
    setNewDealer({ ...newDealer, state: stateVal, district: "" });
    if (newDealer.country === "India") {
      const found = indiaStates.find((s) => s.name === stateVal);
      if (found?.code) setIndiaDistricts(getDistricts(found.code));
    }
  };

  /* ---------------- Input Change ---------------- */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDealer((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ---------------- Distributor Select ---------------- */
  const handleDistributorChange = (e) => {
    const distId = e.target.value;
    const dist = distributors.find((d) => d._id === distId);
    setNewDealer((prev) => ({
      ...prev,
      distributorId: distId,
      select_Distributor_Name: dist ? dist.business_Name : "",
    }));
  };

  /* ---------------- Submit Create Dealer ---------------- */
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "https://api.websave.in/api/manufactur/createDelerUnderOems",
        newDealer,
        { headers: { Authorization: `Bearer ${tkn}` } }
      );
      toast.success("Dealer created successfully");
      setIsCreateModalOpen(false);
      fetchDealers();
    } catch {
      toast.error("Failed to create Dealer");
    }
  };

  /* ---------------- Filter Dealers ---------------- */
  const filteredDealers = dealers.filter((d) =>
    [d.business_Name, d.email, d.mobile]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  /* ---------------- OEM Select ---------------- */
  const handleOemChange = (e) => {
    const oemId = e.target.value;
    const oem = distributors.find((d) => d._id === oemId);

    setNewDealer((prev) => ({
      ...prev,
      oemsId: oemId,
      select_Oems_Name: oem ? oem.business_Name : "",
    }));
  };


  /* ---------------- Delete Dealer ---------------- */
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This dealer will be deleted permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        console.log("Deleting dealer:", id);

        await axios.post(
          "https://api.websave.in/api/manufactur/deleteDelerUnderOems",
          { oemsId: id }, // ✅ try dealerId
          { headers: { Authorization: `Bearer ${tkn}` } }
        );

        toast.success("Dealer deleted successfully");
        fetchDealers();
      } catch (err) {
        console.error("Delete failed:", err.response?.data || err.message);
        toast.error("Failed to delete Dealer");
      }
    }
  };


  /* ---------------- Edit Dealer ---------------- */
  const handleEditClick = (dealer) => {
    // Prefill modal with dealer details
    setNewDealer(dealer);
    setIsCreateModalOpen(true); // open same modal in edit mode
  };




  /* ---------------- Fetch Dealer By Id ---------------- */
const fetchDealerById = async (id) => {
  try {
    setLoadingEdit(true);
    const res = await axios.post(
      "https://api.websave.in/api/manufactur/getDelerUnderOemsById",
      { oemsId: id },
      { headers: { Authorization: `Bearer ${tkn}` } }
    );

    const dealer = res.data.findByIdInOems;

    // ✅ Ensure oemsId is part of editData
    setEditData({
      ...dealer,
      oemsId: dealer._id || id, 
    });

    setIsEditModalOpen(true);
  } catch (err) {
    toast.error("Failed to fetch dealer details");
    console.error(err);
  } finally {
    setLoadingEdit(false);
  }
};


  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const handleSaveEdit = async (e) => {
  e.preventDefault();
  try {
    await axios.post(
      "https://api.websave.in/api/manufactur/editDelerOem",
      {
        ...editData,
        oemsId: editData.oemsId, // ✅ Pass oemsId explicitly
      },
      { headers: { Authorization: `Bearer ${tkn}` } }
    );

    toast.success("Dealer updated successfully");
    setIsEditModalOpen(false);
    fetchDealers();
  } catch (err) {
    toast.error("Failed to update dealer");
    console.error(err);
  }
};



  return (
    <div className="p-6 bg-black min-h-screen text-gray-200">
      <ManufactureNavbar />

      <div className="flex justify-between items-center bg-yellow-600 text-black px-4 py-3 rounded-t-xl mt-10 shadow-lg">
        <h2 className="text-lg font-semibold">Dealer Management</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-black border border-yellow-500 px-4 py-2 rounded-lg text-yellow-400"
        >
          + Create Dealer
        </button>
      </div>

      {/* Search + Table */}
      <div className="flex justify-between items-center p-4">
        <input
          type="text"
          placeholder="Search dealers..."
          className="border border-yellow-500 bg-black text-yellow-400 rounded px-3 py-1 text-sm"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto bg-gray-900 shadow rounded-b-xl border border-yellow-500">
        <table className="min-w-full text-left border-collapse">
          <thead className="bg-yellow-600 text-black">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Distributor Name</th>
              <th className="px-4 py-2">Business Name</th>

              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Mobile</th>
              <th className="px-4 py-2">Password</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDealers.length > 0 ? (
              filteredDealers.map((d, i) => (
                <tr key={d._id} className={i % 2 ? "bg-gray-800" : "bg-black"}>
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2">{d.name}</td>
                  <td className="px-4 py-2">{d.business_Name}</td>

                  <td className="px-4 py-2">{d.email}</td>
                  <td className="px-4 py-2">{d.mobile}</td>
                  <td className="px-4 py-2">{d.mobile}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => fetchDealerById(d._id)} // fetch by ID
                      className="bg-yellow-500 p-2 rounded text-black hover:bg-yellow-400 transition"
                    >
                      <FaEdit />
                    </button>


                    <button
                      onClick={() => handleDelete(d._id)}
                      className="bg-red-500 p-2 rounded text-white hover:bg-red-400 transition"
                    >
                      <FaTrash />
                    </button>

                  </td>
                </tr>

              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-4">
                  No Dealers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


      {/* Create Dealer Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-[900px] border border-yellow-500 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold text-yellow-400 mb-6">
              Create Dealer
            </h2>
            <form onSubmit={handleCreateSubmit} className="grid grid-cols-2 gap-4">
              {/* Distributor Selection */}
              <div>
                <label className="block text-sm mb-1">Select OEM</label>
                <select
                  name="oemsId"
                  value={newDealer.oemsId}
                  onChange={handleOemChange}
                  className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                >
                  <option value="">Select OEMs</option>
                  {distributors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.business_Name}
                    </option>
                  ))}
                </select>

              </div>

              <div>
                <label className="block text-sm mb-1">Business Name*</label>
                <input
                  name="business_Name"
                  value={newDealer.business_Name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Name*</label>
                <input
                  name="name"
                  value={newDealer.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Email*</label>
                <input
                  type="email"
                  name="email"
                  value={newDealer.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Gender*</label>
                <select
                  name="gender"
                  value={newDealer.gender}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                >
                  <option value="">Select Gender</option>
                  {GENDERS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Mobile*</label>
                <input
                  name="mobile"
                  value={newDealer.mobile}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Date of Birth*</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={newDealer.date_of_birth}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Age*</label>
                <input
                  name="age"
                  value={newDealer.age}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Is Map Device Edit*</label>
                <select
                  name="Is_Map_Device_Edit"
                  value={newDealer.Is_Map_Device_Edit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                >
                  <option value="">Select Option</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">PAN Number*</label>
                <input
                  name="pan_Number"
                  value={newDealer.pan_Number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Occupation*</label>
                <select
                  name="occupation"
                  value={newDealer.occupation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                >
                  <option value="">Select Occupation</option>
                  {OCCUPATIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Advance Payment*</label>
                <input
                  name="Advance_Payment"
                  value={newDealer.Advance_Payment}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Languages Known*</label>
                <select
                  name="languages_Known"
                  value={newDealer.languages_Known}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                >
                  <option value="">Select Language</option>
                  {LANGUAGES.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Country*</label>
                <select
                  name="country"
                  value={newDealer.country}
                  onChange={handleCountryChange}
                  className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">State*</label>
                <select
                  name="state"
                  value={newDealer.state}
                  onChange={handleStateChange}
                  className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                >
                  <option value="">Select State</option>
                  {newDealer.country === "India"
                    ? indiaStates.map((s) => <option key={s.name}>{s.name}</option>)
                    : genericStates.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">District*</label>
                <select
                  name="district"
                  value={newDealer.district}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                >
                  <option value="">Select District</option>
                  {indiaDistricts.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">RTO Division*</label>
                <select
                  name="RTO_Division"
                  value={newDealer.RTO_Division}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                >
                  <option value="">Select RTO</option>
                  {RTO_DIVISIONS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Pin Code*</label>
                <input
                  name="Pin_Code"
                  value={newDealer.Pin_Code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Area*</label>
                <input
                  name="area"
                  value={newDealer.area}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm mb-1">Address*</label>
                <textarea
                  name="address"
                  value={newDealer.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                />
              </div>

              <div className="col-span-2 flex justify-end gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-700 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-yellow-500 text-black rounded-lg"
                >
                  Save Dealer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ---------------- Edit Dealer Modal ---------------- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-[800px] max-h-[90vh] overflow-y-auto border border-yellow-500">
            <h2 className="text-xl font-bold text-yellow-400 mb-6">
              Edit Dealer Details
            </h2>
            {loadingEdit ? (
              <p className="text-gray-300">Loading...</p>
            ) : (
              <form onSubmit={handleSaveEdit} className="grid grid-cols-2 gap-4">
                {/* Business Name */}
                <div>
                  <label className="block mb-1">Business Name *</label>
                  <input
                    type="text"
                    name="business_Name"
                    value={editData.business_Name || ""}
                    onChange={handleEditInputChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={editData.name || ""}
                    onChange={handleEditInputChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={editData.email || ""}
                    onChange={handleEditInputChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block mb-1">Gender *</label>
                  <select
                    name="gender"
                    value={editData.gender || ""}
                    onChange={handleEditInputChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                  >
                    <option value="">Select Gender</option>
                    {GENDERS.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Mobile */}
                <div>
                  <label className="block mb-1">Mobile *</label>
                  <input
                    type="text"
                    name="mobile"
                    value={editData.mobile || ""}
                    onChange={handleEditInputChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={editData.date_of_birth || ""}
                    onChange={handleEditInputChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block mb-1">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={editData.age || ""}
                    onChange={handleEditInputChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                  />
                </div>

                {/* PAN Number */}
                <div>
                  <label className="block mb-1">PAN Number *</label>
                  <input
                    type="text"
                    name="pan_Number"
                    value={editData.pan_Number || ""}
                    onChange={handleEditInputChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                  />
                </div>

                {/* Occupation */}
                <div>
                  <label className="block mb-1">Occupation *</label>
                  <select
                    name="occupation"
                    value={editData.occupation || ""}
                    onChange={handleEditInputChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                  >
                    <option value="">Select Occupation</option>
                    {OCCUPATIONS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>

                {/* Languages Known */}
                <div>
                  <label className="block mb-1">Languages Known *</label>
                  <select
                    name="languages_Known"
                    value={editData.languages_Known || ""}
                    onChange={handleEditInputChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                  >
                    <option value="">Select Language</option>
                    {LANGUAGES.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </div>

                {/* Country */}
                <div>
                  <label className="block mb-1">Country *</label>
                  <select
                    name="country"
                    value={editData.country || ""}
                    onChange={handleEditInputChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* State */}
                <div>
                  <label className="block mb-1">State *</label>
                  <select
                    name="state"
                    value={editData.state || ""}
                    onChange={handleEditInputChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                  >
                    <option value="">Select State</option>
                    {editData.country === "India"
                      ? indiaStates.map((s) => <option key={s.name}>{s.name}</option>)
                      : genericStates.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>

                {/* District (India only) */}
                {editData.country === "India" && (
                  <div>
                    <label className="block mb-1">District *</label>
                    <select
                      name="district"
                      value={editData.district || ""}
                      onChange={handleEditInputChange}
                      className="w-full p-2 rounded bg-black border border-yellow-500"
                    >
                      <option value="">Select District</option>
                      {indiaDistricts.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* RTO Division */}
                <div>
                  <label className="block mb-1">RTO Division *</label>
                  <select
                    name="RTO_Division"
                    value={editData.RTO_Division || ""}
                    onChange={handleEditInputChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                  >
                    <option value="">Select RTO</option>
                    {RTO_DIVISIONS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Address */}
                <div className="col-span-2">
                  <label className="block mb-1">Address *</label>
                  <textarea
                    name="address"
                    value={editData.address || ""}
                    onChange={handleEditInputChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                  />
                </div>

                {/* Buttons */}
                <div className="col-span-2 flex justify-end gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}




    </div>
  );
}

export default DealerOem;
