import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { FaTrash, FaEdit, FaEye, FaEyeSlash } from "react-icons/fa";
import { UserAppContext } from "../contexts/UserAppProvider";
import ManufactureNavbar from "./ManufactureNavbar";

// ✅ India data (states + ALL districts) via maintained package
import { getAllStates, getDistricts } from "india-state-district";

/* -------------------------- USA & China states -------------------------- */
const USA_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "District of Columbia",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

const CHINA_PROVINCES = [
  // Provinces (23)
  "Anhui",
  "Fujian",
  "Gansu",
  "Guangdong",
  "Guizhou",
  "Hainan",
  "Hebei",
  "Heilongjiang",
  "Henan",
  "Hubei",
  "Hunan",
  "Jiangsu",
  "Jiangxi",
  "Jilin",
  "Liaoning",
  "Qinghai",
  "Shaanxi",
  "Shandong",
  "Shanxi",
  "Sichuan",
  "Yunnan",
  "Zhejiang",
  "Taiwan",
  // Autonomous Regions (5)
  "Guangxi Zhuang",
  "Inner Mongolia",
  "Ningxia Hui",
  "Tibet (Xizang)",
  "Xinjiang Uyghur",
  // Municipalities (4)
  "Beijing",
  "Chongqing",
  "Shanghai",
  "Tianjin",
  // Special Administrative Regions (2)
  "Hong Kong SAR",
  "Macau SAR",
];

/* ---------------------- Countries supported in UI ---------------------- */
const COUNTRIES = ["India", "China", "USA"];

function Distributors() {
  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  const [distributors, setDistributors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [data, setdata] = useState([]);

  // New: country/state/district aware distributor payload
  const [newDistributor, setNewDistributor] = useState({
    business_Name: "",
    contact_Person_Name: "", // Fixed: was contact_Person_Name
    email: "",
    gender: "",
    mobile: "", // Fixed: was mobile
    date_of_Birth: "", // Fixed: was date_of_Birth
    age: "",
    Map_Device_Edit: "",
    pAN_Number: "", // Fixed: was pAN_Number
    occupation: "",
    advance_Payment: "", // Fixed: was advance_Payment
    languages_Known: "", // Fixed: was languages_Known
    country: "",
    state: "",
    district: "",
    address: "",
  });

  // Derived lists for selects
  const [indiaStates, setIndiaStates] = useState([]); // [{code, name}]
  const [indiaDistricts, setIndiaDistricts] = useState([]); // ["Mumbai City", ...]
  const [genericStates, setGenericStates] = useState([]); // For China/USA

  // ✅ Fetch Distributors
  const fetchDistributors = async () => {
    try {
      const response = await axios.post(
        "https://api.websave.in/api/manufactur/fetchDistributor",
        {},
        { headers: { Authorization: `Bearer ${tkn}` } } // Fixed template literal
      );
      setdata(response.data.distributor);
      console.log(response.data);
    } catch (err) {
      console.error("Error fetching distributors:", err.response || err);
      toast.error("Failed to fetch Distributors");
    }
  };

  useEffect(() => {
    fetchDistributors();
  }, [tkn]);

  // ——————————————————— Linked Selects: Country → State → District ———————————————————
  // Load India state list once (codes + names)
  useEffect(() => {
    // Package provides codes like "MH", "UP" etc with display names
    const states = getAllStates(); // [{code:'MH', name:'Maharashtra'}, ...]
    setIndiaStates(states);
  }, []);

  // When country changes, reset state/district and set available state list
  const handleCountryChange = (e) => {
    const country = e.target.value;
    let nextGenericStates = [];

    if (country === "USA") nextGenericStates = USA_STATES;
    if (country === "China") nextGenericStates = CHINA_PROVINCES;

    setNewDistributor((prev) => ({
      ...prev,
      country,
      state: "",
      district: "",
    }));
    setIndiaDistricts([]);
    setGenericStates(nextGenericStates);
  };

  // When state changes
  const handleStateChange = (e) => {
    const stateVal = e.target.value;

    setNewDistributor((prev) => ({
      ...prev,
      state: stateVal,
      district: "",
    }));

    // If India: stateVal is the name; we need its code to fetch districts
    if (newDistributor.country === "India") {
      const found = indiaStates.find(
        (s) => s.name.toLowerCase() === stateVal.toLowerCase()
      );
      if (found?.code) {
        const dists = getDistricts(found.code); // array of district names
        setIndiaDistricts(dists || []);
      } else {
        setIndiaDistricts([]);
      }
    }
  };

  const handleDistrictChange = (e) => {
    const district = e.target.value;
    setNewDistributor((prev) => ({ ...prev, district }));
  };

  // ✅ Edit Modal: Country Change
  const handleEditCountryChange = (e) => {
    const country = e.target.value;
    let nextGenericStates = [];

    if (country === "USA") nextGenericStates = USA_STATES;
    if (country === "China") nextGenericStates = CHINA_PROVINCES;

    setEditData((prev) => ({
      ...prev,
      country,
      state: "",
      district: "",
    }));
    setIndiaDistricts([]);
    setGenericStates(nextGenericStates);
  };

  // ✅ Edit Modal: State Change
  const handleEditStateChange = (e) => {
    const stateVal = e.target.value;

    setEditData((prev) => ({
      ...prev,
      state: stateVal,
      district: "",
    }));

    if (editData.country === "India") {
      const found = indiaStates.find(
        (s) => s.name.toLowerCase() === stateVal.toLowerCase()
      );
      if (found?.code) {
        const dists = getDistricts(found.code);
        setIndiaDistricts(dists || []);
      } else {
        setIndiaDistricts([]);
      }
    }
  };

  // ✅ Edit Modal: District Change
  const handleEditDistrictChange = (e) => {
    const district = e.target.value;
    setEditData((prev) => ({ ...prev, district }));
  };

  // ✅ Delete
  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the Distributor!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.post(
            "https://api.websave.in/api/manufactur/deleteDistributor",
            { id: id },
            { headers: { Authorization: `Bearer ${tkn}` } } // Fixed template literal
          );

          toast.success("Distributor deleted successfully");
          setDistributors((prev) => prev.filter((d) => d._id !== id));

        } catch (error) {
          toast.error("Delete failed");
        }
      }
    });
  };

  // ✅ Toggle Password Visibility
  const togglePassword = (id) => {
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ✅ Edit
  const handleEditClick = async (id) => {
    setLoadingEdit(true);
    try {
      const response = await axios.post(
        "https://api.websave.in/api/manufactur/fetchDistributorById",
        { distributorId: id },
        { headers: { Authorization: `Bearer ${tkn}` } }
      );

      console.log("Edit API response:", response.data);

      // Some APIs return {distributor: {...}}, some return {...} directly
      const distributorData = response.data.single || response.data;

      setEditData(distributorData);
      setIsEditModalOpen(true);
    } catch (err) {
      toast.error("Error loading Distributor details");
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value, files } = e.target;
    if (files && files.length > 0) {
      setEditData((prev) => ({
        ...prev,
        [name]: URL.createObjectURL(files[0]),
      }));
    } else {
      setEditData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ✅ Save Changes
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "https://api.websave.in/api/manufactur/editDistributor",
        { ...editData, distributorId: editData._id },
        { headers: { Authorization: `Bearer ${tkn}` } }
      );

      if (response.status === 200) {
        toast.success("Distributor updated successfully");
        setIsEditModalOpen(false);
        fetchDistributors();
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
      toast.error("Error saving changes");
    }
  };

  // ✅ Handle Create Distributor
  const handleCreateChange = (e) => {
    const { name, value, files } = e.target;
    if (files && files.length > 0) {
      setNewDistributor((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setNewDistributor((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(newDistributor).forEach((key) => {
        formData.append(key, newDistributor[key]);
      });

      const response = await axios.post(
        "https://api.websave.in/api/manufactur/createDistributor",
        formData,
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "multipart/form-data",
          },
        } // Fixed template literal
      );

      if (response.status === 200) {
        toast.success("Distributor created successfully");
        setIsCreateModalOpen(false);
        fetchDistributors();
        setNewDistributor({
          business_Name: "",
          contact_Person_Name: "", // Fixed: was contact_Person_Name
          email: "",
          gender: "",
          mobile: "", // Fixed: was mobile
          date_of_Birth: "", // Fixed: was date_of_Birth
          age: "",
          Map_Device_Edit: "",
          pAN_Number: "", // Fixed: was pAN_Number
          occupation: "",
          advance_Payment: "", // Fixed: was advance_Payment
          languages_Known: "", // Fixed: was languages_Known
          country: "",
          state: "",
          district: "",
          address: "",
        });
        setIndiaDistricts([]);
        setGenericStates([]);
      } else {
        toast.error("Failed to create Distributor");
      }
    } catch (err) {
      toast.error("Error creating Distributor");
    }
  };

  // ✅ Search Filter
  const filteredDistributors = distributors.filter((d) =>
    [d.distributor_Name, d.email, d.mobile_Number]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-black min-h-screen text-gray-200">
      <ManufactureNavbar />

      {/* Header */}
      <div className="flex justify-between items-center bg-yellow-600 text-black px-4 py-3 rounded-t-xl mt-10 shadow-lg">
        <h2 className="text-lg font-semibold">Distributor Management</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-black border border-yellow-500 px-4 py-2 rounded-lg text-yellow-400 hover:bg-yellow-500 hover:text-black transition"
        >
          + Create Distributor
        </button>
      </div>

      {/* Table + Search */}
      <p className="text-gray-400 text-sm px-4 py-2">
        This table shows the list of all registered Distributors and their
        details
      </p>
      <div className="flex justify-between items-center p-4">
        <input
          type="text"
          placeholder="Search by name, email or mobile..."
          className="border border-yellow-500 bg-black text-yellow-400 rounded px-3 py-1 text-sm"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-gray-900 shadow rounded-b-xl border border-yellow-500">
        <table className="min-w-full text-left border-collapse">
          <thead className="bg-yellow-600 text-black">
            <tr>
              {[
                "#",
                "Name",
                "Owner Name",
                "Email",
                "Mobile",
                "Password",
                "Actions",
              ].map((h, i) => (
                <th key={i} className="px-4 py-2 border border-gray-700">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((d, index) => (
                <tr
                  key={d._id}
                  className={`${index % 2 === 0 ? "bg-black" : "bg-gray-800"
                    } border-t border-gray-700`} // Fixed template literal
                >
                  <td className="px-4 py-2">{index + 1}</td>

                  <td className="px-4 py-2 font-medium text-yellow-400">
                    {d.business_Name}
                  </td>
                  <td className="px-4 py-2">{d.contact_Person_Name}</td>
                  <td className="px-4 py-2 text-yellow-300">{d.email}</td>

                  <td className="px-4 py-2">{d.mobile}</td>
                  <td className="px-4 py-2 flex items-center gap-2">
                    <span>
                      {showPassword[d._id]
                        ? d.mobile || "N/A"
                        : "•".repeat(d.mobile?.length || 6)}
                    </span>
                    <button
                      onClick={() => togglePassword(d._id)}
                      className="text-yellow-400 hover:text-yellow-300"
                    >
                      {showPassword[d._id] ? <FaEye /> : <FaEyeSlash />}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(d._id)}
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
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-4 text-gray-500">
                  No Distributors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Create Distributor Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-[900px] max-h-[90vh] overflow-y-auto border border-yellow-500">
            <h2 className="text-xl font-bold text-yellow-400 mb-6">
              Create New Distributor
            </h2>

            <form
              onSubmit={handleCreateSubmit}
              className="grid grid-cols-2 gap-4"
            >
              {/* Business Details */}
              <div>
                <label className="block mb-1">Business Name *</label>
                <input
                  type="text"
                  name="business_Name"
                  value={newDistributor.business_Name}
                  onChange={handleCreateChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Distributor Name *</label>
                <input
                  type="text"
                  name="contact_Person_Name" // Fixed field name
                  value={newDistributor.contact_Person_Name}
                  onChange={handleCreateChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={newDistributor.email}
                  onChange={handleCreateChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Gender *</label>
                <select
                  name="gender"
                  value={newDistributor.gender}
                  onChange={handleCreateChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                  required
                >
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Mobile *</label>
                <input
                  type="text"
                  name="mobile" // Fixed field name
                  value={newDistributor.mobile}
                  onChange={handleCreateChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Date of Birth *</label>
                <input
                  type="date"
                  name="date_of_Birth" // Fixed field name
                  value={newDistributor.date_of_Birth}
                  onChange={handleCreateChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Age</label>
                <input
                  type="number"
                  name="age"
                  value={newDistributor.age}
                  onChange={handleCreateChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                />
              </div>
              <div>
                <label className="block mb-1">Mapped Device</label>
                <select
                  name="Map_Device_Edit"
                  value={newDistributor.Map_Device_Edit}
                  onChange={handleCreateChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                >
                  <option value="">Select Option</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">PAN Number *</label>
                <input
                  type="text"
                  name="pAN_Number" // Fixed field name
                  value={newDistributor.pAN_Number}
                  onChange={handleCreateChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Occupation *</label>
                <input
                  type="text"
                  name="occupation"
                  value={newDistributor.occupation}
                  onChange={handleCreateChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Advance Payment *</label>
                <input
                  type="number"
                  name="advance_Payment" // Fixed field name
                  value={newDistributor.advance_Payment}
                  onChange={handleCreateChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Languages Known *</label>
                <input
                  type="text"
                  name="languages_Known" // Fixed field name
                  value={newDistributor.languages_Known}
                  onChange={handleCreateChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                  required
                />
              </div>

              {/* ——— New Location Section: Country → State → District ——— */}
              <div>
                <label className="block mb-1">Country *</label>
                <select
                  name="country"
                  value={newDistributor.country}
                  onChange={handleCountryChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                  required
                >
                  <option value="">Select Country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1">State / Province *</label>
                <select
                  name="state"
                  value={newDistributor.state}
                  onChange={handleStateChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                  required
                  disabled={!newDistributor.country}
                >
                  <option value="">
                    {newDistributor.country
                      ? "Select State/Province"
                      : "Choose Country first"}
                  </option>

                  {/* India: show all states/UT from package */}
                  {newDistributor.country === "India" &&
                    indiaStates.map((s) => (
                      <option key={s.code} value={s.name}>
                        {s.name}
                      </option>
                    ))}

                  {/* China/USA: show fixed arrays */}
                  {newDistributor.country === "USA" &&
                    USA_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  {newDistributor.country === "China" &&
                    CHINA_PROVINCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block mb-1">
                  {newDistributor.country === "India"
                    ? "District *"
                    : "District (N/A for this country)"}
                </label>
                <select
                  name="district"
                  value={newDistributor.district}
                  onChange={handleDistrictChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                  required={newDistributor.country === "India"}
                  disabled={
                    !newDistributor.country ||
                    !newDistributor.state ||
                    newDistributor.country !== "India"
                  }
                >
                  <option value="">
                    {newDistributor.country === "India"
                      ? newDistributor.state
                        ? "Select District"
                        : "Choose State first"
                      : "Disabled"}
                  </option>
                  {newDistributor.country === "India" &&
                    indiaDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block mb-1">Address *</label>
                <textarea
                  name="address"
                  value={newDistributor.address}
                  onChange={handleCreateChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                  rows="3"
                  required
                ></textarea>
              </div>

              {/* Buttons */}
              <div className="col-span-2 flex justify-end gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition"
                >
                  Create Distributor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-[900px] max-h-[90vh] overflow-y-auto border border-yellow-500">
            <h2 className="text-xl font-bold text-yellow-400 mb-6">
              Edit Distributor Details
            </h2>
            {loadingEdit ? (
              <p className="text-gray-300">Loading...</p>
            ) : (
              <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
                {/* Business Name */}
                <div>
                  <label className="block mb-1">Business Name *</label>
                  <input
                    type="text"
                    name="business_Name"
                    value={editData.business_Name || ""}
                    onChange={handleEditChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                    required
                  />
                </div>

                {/* Distributor Name */}
                <div>
                  <label className="block mb-1">
                    Distributor / Owner Name *
                  </label>
                  <input
                    type="text"
                    name="contact_Person_Name"
                    value={editData.contact_Person_Name || ""}
                    onChange={handleEditChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={editData.email || ""}
                    onChange={handleEditChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                    required
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block mb-1">Gender *</label>
                  <select
                    name="gender"
                    value={editData.gender || ""}
                    onChange={handleEditChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* Mobile */}
                <div>
                  <label className="block mb-1">Mobile *</label>
                  <input
                    type="text"
                    name="mobile"
                    value={editData.mobile || ""}
                    onChange={handleEditChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                    required
                  />
                </div>

                {/* DOB */}
                <div>
                  <label className="block mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    name="date_of_Birth"
                    value={editData.date_of_Birth || ""}
                    onChange={handleEditChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                    required
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block mb-1">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={editData.age || ""}
                    onChange={handleEditChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                  />
                </div>

                {/* Mapped Device */}
                <div>
                  <label className="block mb-1">Mapped Device</label>
                  <select
                    name="Map_Device_Edit"
                    value={editData.Map_Device_Edit || ""}
                    onChange={handleEditChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                  >
                    <option value="">Select Option</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>

                {/* PAN */}
                <div>
                  <label className="block mb-1">PAN Number *</label>
                  <input
                    type="text"
                    name="pAN_Number"
                    value={editData.pAN_Number || ""}
                    onChange={handleEditChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                    required
                  />
                </div>

                {/* Occupation */}
                <div>
                  <label className="block mb-1">Occupation *</label>
                  <input
                    type="text"
                    name="occupation"
                    value={editData.occupation || ""}
                    onChange={handleEditChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                    required
                  />
                </div>

                {/* Advance Payment */}
                <div>
                  <label className="block mb-1">Advance Payment *</label>
                  <input
                    type="number"
                    name="advance_Payment"
                    value={editData.advance_Payment || ""}
                    onChange={handleEditChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                    required
                  />
                </div>

                {/* Languages */}
                <div>
                  <label className="block mb-1">Languages Known *</label>
                  <input
                    type="text"
                    name="languages_Known"
                    value={editData.languages_Known || ""}
                    onChange={handleEditChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                    required
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block mb-1">Country *</label>
                  <select
                    name="country"
                    value={editData.country || ""}
                    onChange={handleEditCountryChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                    required
                  >
                    <option value="">Select Country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* State */}
                <div>
                  <label className="block mb-1">State / Province *</label>
                  <select
                    name="state"
                    value={editData.state || ""}
                    onChange={handleEditStateChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                    required
                    disabled={!editData.country}
                  >
                    <option value="">
                      {editData.country
                        ? "Select State/Province"
                        : "Choose Country first"}
                    </option>

                    {editData.country === "India" &&
                      indiaStates.map((s) => (
                        <option key={s.code} value={s.name}>
                          {s.name}
                        </option>
                      ))}

                    {editData.country === "USA" &&
                      USA_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    {editData.country === "China" &&
                      CHINA_PROVINCES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="block mb-1">
                    {editData.country === "India"
                      ? "District *"
                      : "District (N/A)"}
                  </label>
                  <input
                    name="district"
                    value={editData.district || ""}
                    onChange={handleEditDistrictChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                    required={editData.country === "India"}
                    disabled={
                      !editData.country ||
                      !editData.state ||
                      editData.country !== "India"
                    }
                  />


                </div>

                {/* Address */}
                <div className="col-span-2">
                  <label className="block mb-1">Address *</label>
                  <textarea
                    name="address"
                    value={editData.address || ""}
                    onChange={handleEditChange}
                    className="w-full p-2 rounded bg-black border border-yellow-500"
                    rows="3"
                    required
                  ></textarea>
                </div>

                {/* Logo */}


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

export default Distributors;
