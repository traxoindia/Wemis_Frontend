import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { FaTrash, FaEdit, FaEye, FaEyeSlash } from "react-icons/fa";
import { UserAppContext } from "../contexts/UserAppProvider";
import { Link } from "react-router-dom";
import ManufactureNavbar from "./ManufactureNavbar";

// ✅ India data
import { getAllStates, getDistricts } from "india-state-district";

// ✅ Static data for USA & China
const USA_STATES = ["California", "Texas", "New York", "Florida"];
const CHINA_PROVINCES = ["Beijing", "Shanghai", "Guangdong", "Sichuan"];

function OEM() {
    const { token: contextToken } = useContext(UserAppContext);
    const tkn = contextToken || localStorage.getItem("token");

    const [oems, setOems] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showPassword, setShowPassword] = useState({});

    // Edit states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({});
    const [loadingEdit, setLoadingEdit] = useState(false);

    // Create states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createData, setCreateData] = useState({
        business_Name: "",
        contact_Person_Name: "",
        email: "",
        gender: "",
        mobile: "",
        date_of_Birth: "",
        age: "",
        Map_Device_Edit: "",
        pAN_Number: "",
        occupation: "",
        gst_no: "",
        languages_Known: "",
        country: "",
        state: "",
        district: "",
        address: "",
    });

    // ✅ State & District lists
    const [indiaStates, setIndiaStates] = useState([]);
    const [indiaDistricts, setIndiaDistricts] = useState([]);
    const [genericStates, setGenericStates] = useState([]);

    // ✅ Fetch OEMs
    const fetchOEMs = async () => {
        try {
            const response = await axios.post(
                "https://api.websave.in/api/manufactur/fetchOems",
                {},
                { headers: { Authorization: `Bearer ${tkn}` } }
            );

            setOems(response.data.oems || []);
        } catch (err) {
            console.error("Error fetching OEMs:", err.response || err);
            // toast.error("Failed to fetch OEMs");
        }
    };

    useEffect(() => {
        if (tkn) fetchOEMs();
    }, [tkn]);

    // ✅ Delete OEM
    const handleDelete = async (id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "This will permanently delete the OEM!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await axios.post(
                        "https://api.websave.in/api/manufactur/deleteOems",
                        { oemsId: id },   // 🔴 Here is likely the problem
                        { headers: { Authorization: `Bearer ${tkn}` } }
                    );
                    if (response.status === 200) {
                        toast.success("OEM deleted successfully");
                        setOems((prev) => prev.filter((o) => o._id !== id));
                    } else {
                        toast.error("Error deleting OEM");
                    }
                } catch (error) {
                    toast.error("Delete failed");
                    console.error("Delete error:", error);
                }
            }
        });
    };


    // ✅ Toggle Password Visibility
    const togglePassword = (id) => {
        setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // ✅ Handle Edit
    const handleEditClick = async (id) => {
        setLoadingEdit(true);
        try {
            const response = await axios.post(
                "https://api.websave.in/api/manufactur/getOemsById",
                { oemsId: id },
                { headers: { Authorization: `Bearer ${tkn}` } }
            );


            setEditData(response.data.oemsById);
            console.log(response.data)
            setIsEditModalOpen(true);

        } catch (err) {
            console.error("Fetch edit error:", err);
            toast.error("Error loading OEM details");
        } finally {
            setLoadingEdit(false);
        }
    };

    // ✅ Handle Save Edit
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                "https://api.websave.in/api/manufactur/editOemsById",
                { ...editData, oemsId: editData._id },
                { headers: { Authorization: `Bearer ${tkn}` } }
            );

            if (response.status === 200) {
                toast.success("OEM updated successfully");
                setIsEditModalOpen(false);
                fetchOEMs();
            } else {
                toast.error("Update failed");
            }
        } catch (err) {
            console.error("Save error:", err);
            toast.error("Error saving changes");
        }
    };

    // ✅ Handle Create OEM
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                "https://api.websave.in/api/manufactur/createOem",
                createData,
                { headers: { Authorization: `Bearer ${tkn}` } }
            );
            console.log(createData)


            setIsCreateModalOpen(false);
            setCreateData({
                business_Name: "",
                contact_Person_Name: "",
                email: "",
                gender: "",
                mobile: "",
                date_of_Birth: "",
                age: "",
                Map_Device_Edit: "",
                pAN_Number: "",
                occupation: "",
                gst_no: "",
                languages_Known: "",
                country: "",
                state: "",
                district: "",
                address: "",
            });
            toast.success("OEM creating Successfully");


        } catch (err) {
            console.error("Create error:", err);
            toast.error("Error creating OEM");
        }
    };

    const handleChange = (e, isEdit = false) => {
        const { name, value } = e.target;
        if (isEdit) {
            setEditData((prev) => ({ ...prev, [name]: value }));
        } else {
            setCreateData((prev) => ({ ...prev, [name]: value }));
        }
    };

    // ✅ Country → State → District handling
    const handleCountryChange = (e) => {
        const country = e.target.value;
        let nextStates = [];

        if (country === "India") {
            setIndiaStates(getAllStates());
            setGenericStates([]);
        } else if (country === "USA") {
            nextStates = USA_STATES;
            setGenericStates(nextStates);
            setIndiaStates([]);
        } else if (country === "China") {
            nextStates = CHINA_PROVINCES;
            setGenericStates(nextStates);
            setIndiaStates([]);
        } else {
            setIndiaStates([]);
            setGenericStates([]);
        }

        setCreateData((prev) => ({
            ...prev,
            country,
            state: "",
            district: "",
        }));
        setIndiaDistricts([]);
    };

    const handleStateChange = (e) => {
        const stateVal = e.target.value;

        setCreateData((prev) => ({
            ...prev,
            state: stateVal,
            district: "",
        }));

        if (createData.country === "India") {
            const found = indiaStates.find((s) => s.name === stateVal);
            if (found?.code) {
                setIndiaDistricts(getDistricts(found.code));
            }
        }
    };

    // ✅ Filter
    const filteredOEMs = oems.filter((o) =>
        [o.oem_Name, o.email, o.mobile_Number]
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 bg-black min-h-screen text-gray-200">
            <ManufactureNavbar />

            {/* Header */}
            <div className="flex justify-between items-center bg-yellow-600 text-black px-4 py-3 rounded-t-xl mt-10 shadow-lg">
                <h2 className="text-lg font-semibold">OEM Management</h2>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-black border border-yellow-500 px-4 py-2 rounded-lg text-yellow-400 hover:bg-yellow-500 hover:text-black transition"
                >
                    + Create OEM
                </button>
            </div>

            <p className="text-gray-400 text-sm px-4 py-2">
                This table shows the list of all registered OEMs and their details
            </p>

            {/* Search */}
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
                            {["#", "Business Name", "Owner Name", "Email", "Mobile", "Password", "Actions"].map((h, i) => (
                                <th key={i} className="px-4 py-2 border border-gray-700">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOEMs.length > 0 ? (
                            filteredOEMs.map((o, index) => (
                                <tr
                                    key={o._id}
                                    className={`${index % 2 === 0 ? "bg-black" : "bg-gray-800"} border-t border-gray-700`}
                                >
                                    {/* # */}
                                    <td className="px-4 py-2">{index + 1}</td>

                                    {/* Business Name */}
                                    <td className="px-4 py-2 font-medium text-yellow-400">{o.business_Name}</td>

                                    {/* Owner Name */}
                                    <td className="px-4 py-2 text-yellow-300">{o.contact_Person_Name}</td>

                                    {/* Email */}
                                    <td className="px-4 py-2">{o.email}</td>

                                    {/* Mobile */}
                                    <td className="px-4 py-2">{o.mobile}</td>

                                    {/* Password (hidden / toggle) */}
                                    <td className="px-4 py-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="tracking-widest">
                                                {showPassword[o._id]
                                                    ? o.mobile || "N/A"
                                                    : "•".repeat(o.mobile?.length || 6)}
                                            </span>
                                            <button
                                                onClick={() => togglePassword(o._id)}
                                                className="text-yellow-400 hover:text-yellow-300"
                                            >
                                                {showPassword[o._id] ? <FaEye /> : <FaEyeSlash />}
                                            </button>
                                        </div>
                                    </td>


                                    {/* Actions */}
                                    <td className="px-4 py-2">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditClick(o._id)}
                                                className="bg-yellow-500 p-2 rounded text-black hover:bg-yellow-400 transition"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(o._id)}
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
                                <td colSpan="7" className="text-center py-4 text-gray-500">
                                    No OEMs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>


            {/* ✅ Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-6 rounded-xl w-[800px] max-h-[90vh] overflow-y-auto border border-yellow-500">
                        <h2 className="text-xl font-bold text-yellow-400 mb-6">
                            Create OEM
                        </h2>
                        <form
                            onSubmit={handleCreate}
                            className="grid grid-cols-2 gap-4"
                        >
                            {/* Business Name */}
                            <div>
                                <label className="block mb-1">Business Name *</label>
                                <input
                                    type="text"
                                    name="business_Name"
                                    value={createData.business_Name}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded bg-black border border-yellow-500"
                                />
                            </div>

                            {/* Contact Person */}
                            <div>
                                <label className="block mb-1">Contact Person *</label>
                                <input
                                    type="text"
                                    name="contact_Person_Name"
                                    value={createData.contact_Person_Name}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded bg-black border border-yellow-500"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block mb-1">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={createData.email}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded bg-black border border-yellow-500"
                                />
                            </div>

                            {/* Gender */}

                            <div>
                                <label className="block mb-1">Mapped Device *</label>
                                <select
                                    name="Map_Device_Edit"
                                    value={createData.Map_Device_Edit}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded bg-black border border-yellow-500"
                                >
                                    <option value="">Select</option>
                                    <option value="true">True</option>
                                    <option value="false">False</option>

                                </select>
                            </div>
                            <div>
                                <label className="block mb-1">Gender *</label>
                                <select
                                    name="gender"
                                    value={createData.gender}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded bg-black border border-yellow-500"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {/* Mobile */}
                            <div>
                                <label className="block mb-1">Mobile *</label>
                                <input
                                    type="text"
                                    name="mobile"
                                    value={createData.mobile}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded bg-black border border-yellow-500"
                                />
                            </div>

                            {/* Date of Birth */}
                            <div>
                                <label className="block mb-1">Date of Birth *</label>
                                <input
                                    type="date"
                                    name="date_of_Birth"
                                    value={createData.date_of_Birth}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded bg-black border border-yellow-500"
                                />
                            </div>

                            {/* Age */}
                            <div>
                                <label className="block mb-1">Age</label>
                                <input
                                    type="number"
                                    name="age"
                                    value={createData.age}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded bg-black border border-yellow-500"
                                />
                            </div>

                            {/* PAN */}
                            <div>
                                <label className="block mb-1">PAN Number *</label>
                                <input
                                    type="number"
                                    name="pAN_Number"
                                    value={createData.pAN_Number}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded bg-black border border-yellow-500"
                                />
                            </div>

                            {/* Occupation */}
                            <div>
                                <label className="block mb-1">Occupation *</label>
                                <input
                                    type="text"
                                    name="occupation"
                                    value={createData.occupation}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded bg-black border border-yellow-500"
                                />
                            </div>

                            {/* GST */}
                            <div>
                                <label className="block mb-1">GST No</label>
                                <input
                                    type="number"
                                    name="gst_no"
                                    value={createData.gst_no}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded bg-black border border-yellow-500"
                                />
                            </div>

                            {/* Languages */}
                            <div className="col-span-2">
                                <label className="block mb-1">Languages Known *</label>
                                <select
                                    value={createData.languages_Known}
                                    onChange={(e) =>
                                        setCreateData((prev) => ({
                                            ...prev,
                                            languages_Known: e.target.value, // ✅ string
                                        }))
                                    }
                                    className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                >
                                    <option value="">Select Language</option>
                                    {["English", "Hindi", "Odia", "Bengali"].map((lang) => (
                                        <option key={lang} value={lang}>
                                            {lang}
                                        </option>
                                    ))}
                                </select>
                            </div>


                            {/* Country */}
                            <div>
                                <label className="block mb-1">Country *</label>
                                <select
                                    name="country"
                                    value={createData.country}
                                    onChange={handleCountryChange}
                                    className="w-full p-2 rounded bg-black border border-yellow-500"
                                >
                                    <option value="">Select Country</option>
                                    <option value="India">India</option>
                                    <option value="USA">USA</option>
                                    <option value="China">China</option>
                                </select>
                            </div>

                            {/* State */}
                            <div>
                                <label className="block mb-1">State *</label>
                                <select
                                    name="state"
                                    value={createData.state}
                                    onChange={handleStateChange}
                                    className="w-full p-2 rounded bg-black border border-yellow-500"
                                >
                                    <option value="">Select State</option>
                                    {createData.country === "India"
                                        ? indiaStates.map((s) => (
                                            <option key={s.code} value={s.name}>
                                                {s.name}
                                            </option>
                                        ))
                                        : genericStates.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* District (only for India) */}
                            {createData.country === "India" && (
                                <div>
                                    <label className="block mb-1">District *</label>
                                    <select
                                        name="district"
                                        value={createData.district}
                                        onChange={handleChange}
                                        className="w-full p-2 rounded bg-black border border-yellow-500"
                                    >
                                        <option value="">Select District</option>
                                        {indiaDistricts.map((d) => (
                                            <option key={d} value={d}>
                                                {d}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Address */}
                            <div className="col-span-2">
                                <label className="block mb-1">Address *</label>
                                <textarea
                                    name="address"
                                    value={createData.address}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded bg-black border border-yellow-500"
                                />
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
                                    Create OEM
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ✅ Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-6 rounded-xl w-[800px] max-h-[90vh] overflow-y-auto border border-yellow-500">
                        <h2 className="text-xl font-bold text-yellow-400 mb-6">
                            Edit OEM Details
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
                                        onChange={(e) => handleChange(e, true)}
                                        className="w-full p-2 rounded bg-black border border-yellow-500"
                                    />
                                </div>

                                {/* Contact Person */}
                                <div>
                                    <label className="block mb-1">Contact Person *</label>
                                    <input
                                        type="text"
                                        name="contact_Person_Name"
                                        value={editData.contact_Person_Name || ""}
                                        onChange={(e) => handleChange(e, true)}
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
                                        onChange={(e) => handleChange(e, true)}
                                        className="w-full p-2 rounded bg-black border border-yellow-500"
                                    />
                                </div>

                                {/* Mapped Device */}
                                <div>
                                    <label className="block mb-1">Mapped Device *</label>
                                    <select
                                        name="Map_Device_Edit"
                                        value={editData.Map_Device_Edit || ""}
                                        onChange={(e) => handleChange(e, true)}
                                        className="w-full p-2 rounded bg-black border border-yellow-500"
                                    >
                                        <option value="">Select</option>
                                        <option value="true">True</option>
                                        <option value="false">False</option>
                                    </select>
                                </div>

                                {/* Gender */}
                                <div>
                                    <label className="block mb-1">Gender *</label>
                                    <select
                                        name="gender"
                                        value={editData.gender || ""}
                                        onChange={(e) => handleChange(e, true)}
                                        className="w-full p-2 rounded bg-black border border-yellow-500"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {/* Mobile */}
                                <div>
                                    <label className="block mb-1">Mobile *</label>
                                    <input
                                        type="text"
                                        name="mobile"
                                        value={editData.mobile || ""}
                                        onChange={(e) => handleChange(e, true)}
                                        className="w-full p-2 rounded bg-black border border-yellow-500"
                                    />
                                </div>

                                {/* Date of Birth */}
                                <div>
                                    <label className="block mb-1">Date of Birth *</label>
                                    <input
                                        type="date"
                                        name="date_of_Birth"
                                        value={editData.date_of_Birth || ""}
                                        onChange={(e) => handleChange(e, true)}
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
                                        onChange={(e) => handleChange(e, true)}
                                        className="w-full p-2 rounded bg-black border border-yellow-500"
                                    />
                                </div>

                                {/* PAN */}
                                <div>
                                    <label className="block mb-1">PAN Number *</label>
                                    <input
                                        type="number"
                                        name="pAN_Number"
                                        value={editData.pAN_Number || ""}
                                        onChange={(e) => handleChange(e, true)}
                                        className="w-full p-2 rounded bg-black border border-yellow-500"
                                    />
                                </div>

                                {/* Occupation */}
                                <div>
                                    <label className="block mb-1">Occupation *</label>
                                    <input
                                        type="text"
                                        name="occupation"
                                        value={editData.occupation || ""}
                                        onChange={(e) => handleChange(e, true)}
                                        className="w-full p-2 rounded bg-black border border-yellow-500"
                                    />
                                </div>

                                {/* GST */}
                                <div>
                                    <label className="block mb-1">GST No</label>
                                    <input
                                        type="number"
                                        name="gst_no"
                                        value={editData.gst_no || ""}
                                        onChange={(e) => handleChange(e, true)}
                                        className="w-full p-2 rounded bg-black border border-yellow-500"
                                    />
                                </div>

                                {/* Languages */}
                                <div className="col-span-2">
                                    <label className="block mb-1">Languages Known *</label>
                                    <select
                                        value={editData.languages_Known || ""}
                                        onChange={(e) =>
                                            setEditData((prev) => ({
                                                ...prev,
                                                languages_Known: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                    >
                                        <option value="">Select Language</option>
                                        {["English", "Hindi", "Odia", "Bengali"].map((lang) => (
                                            <option key={lang} value={lang}>
                                                {lang}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Country */}
                                <div>
                                    <label className="block mb-1">Country *</label>
                                    <select
                                        name="country"
                                        value={editData.country || ""}
                                        onChange={handleCountryChange}
                                        className="w-full p-2 rounded bg-black border border-yellow-500"
                                    >
                                        <option value="">Select Country</option>
                                        <option value="India">India</option>
                                        <option value="USA">USA</option>
                                        <option value="China">China</option>
                                    </select>
                                </div>

                                {/* State */}
                                <div>
                                    <label className="block mb-1">State *</label>
                                    <select
                                        name="state"
                                        value={editData.state || ""}
                                        onChange={handleStateChange}
                                        className="w-full p-2 rounded bg-black border border-yellow-500"
                                    >
                                        <option value="">Select State</option>
                                        {editData.country === "India"
                                            ? indiaStates.map((s) => (
                                                <option key={s.code} value={s.name}>
                                                    {s.name}
                                                </option>
                                            ))
                                            : genericStates.map((s) => (
                                                <option key={s} value={s}>
                                                    {s}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                {/* District (only for India) */}
                                {editData.country === "India" && (
                                    <div>
                                        <label className="block mb-1">District *</label>
                                        <select
                                            name="district"
                                            value={editData.district || ""}
                                            onChange={(e) => handleChange(e, true)}
                                            className="w-full p-2 rounded bg-black border border-yellow-500"
                                        >
                                            <option value="">Select District</option>
                                            {indiaDistricts.map((d) => (
                                                <option key={d} value={d}>
                                                    {d}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Address */}
                                <div className="col-span-2">
                                    <label className="block mb-1">Address *</label>
                                    <textarea
                                        name="address"
                                        value={editData.address || ""}
                                        onChange={(e) => handleChange(e, true)}
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

export default OEM;
