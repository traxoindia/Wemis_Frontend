import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { FaTrash, FaEdit, FaEye, FaEyeSlash } from "react-icons/fa";
import { UserAppContext } from "../contexts/UserAppProvider";
import { Link } from "react-router-dom";
import WlpNavbar from "./WlpNavbar";

function ManufactureList() {
    const { token: contextToken } = useContext(UserAppContext);
    const tkn = contextToken || localStorage.getItem("token");

    const [manufacturers, setManufacturers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showPassword, setShowPassword] = useState({});
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({});
    const [loadingEdit, setLoadingEdit] = useState(false);

    // Fetch Manufacturers
    const fetchManufacturers = async () => {
        try {
            const response = await axios.post(
                "https://api.websave.in/api/wlp/fetchManuFactur",
                {},
                { headers: { Authorization: `Bearer ${tkn}` } }
            );
            setManufacturers(response.data.manufactur || []);
            console.log(response.data)
        } catch (err) {
            console.error("Error fetching manufacturers:", err.response || err);
            toast.error("Failed to fetch Manufacturers");
        }
    };

    useEffect(() => {
        if (tkn) fetchManufacturers();
    }, [tkn]);

    // Delete Handler
    const handleDelete = async (id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "This action will delete the Manufacturer permanently!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await axios.post(
                        "https://api.websave.in/api/wlp/deleteManuFactur",
                        { manufacturId: id },
                        {
                            headers: {
                                Authorization: `Bearer ${tkn}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                    if (response.status === 200) {
                        toast.success("Manufacturer deleted successfully");
                        setManufacturers((prev) =>
                            prev.filter((m) => m._id !== id)
                        );
                    } else {
                        toast.error("Error deleting Manufacturer");
                    }
                } catch (error) {
                    toast.error("Delete failed");
                    console.error("Delete error:", error);
                }
            }
        });
    };

    // Toggle Password Visibility
    const togglePassword = (id) => {
        setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // Handle Edit Click
    const handleEditClick = async (id) => {
        setLoadingEdit(true);
        try {
            const response = await axios.post(
                "https://api.websave.in/api/wlp/findManuFacturById",
                { manufacturId: id },
                { headers: { Authorization: `Bearer ${tkn}` } }
            );

            if (response.data?.manufactur) {
                setEditData(response.data.manufactur);
                setIsEditModalOpen(true);
            } else {
                toast.error("Failed to fetch Manufacturer details");
            }
        } catch (err) {
            console.error("Fetch edit error:", err);
            toast.error("Error loading Manufacturer details");
        } finally {
            setLoadingEdit(false);
        }
    };

    // Handle Input Change
    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (files && files.length > 0) {
            setEditData((prev) => ({ ...prev, [name]: URL.createObjectURL(files[0]) }));
        } else {
            setEditData((prev) => ({ ...prev, [name]: value }));
        }
    };

    // Handle Save
    // Handle Save
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                "https://api.websave.in/api/wlp/editManuFactur",  // ✅ updated endpoint
                { ...editData, manufacturId: editData._id },              // use correct key
                { headers: { Authorization: `Bearer ${tkn}` } }
            );

            if (response.status === 200) {
                toast.success("Manufacturer updated successfully");
                setIsEditModalOpen(false);
                fetchManufacturers();
            } else {
                toast.error("Update failed");
            }
        } catch (err) {
            console.error("Save error:", err);
            toast.error("Error saving changes");
        }
    };


    // Filter Manufacturers
    const filteredManufacturers = manufacturers.filter((m) =>
        [m.manufacturer_Name, m.email, m.mobile_Number]
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 bg-black min-h-screen text-gray-200">
            <WlpNavbar />

            {/* Header */}
            <div className="flex justify-between items-center bg-yellow-600 text-black px-4 py-3 rounded-t-xl mt-36 shadow-lg">
                <h2 className="text-lg font-semibold">Manufacturer Management</h2>
                <Link to={"/wlp/createmanufacture"}>
                    <button className="bg-black border border-yellow-500 px-4 py-2 rounded-lg text-yellow-400 hover:bg-yellow-500 hover:text-black transition">
                        + Create Manufacturer
                    </button>
                </Link>
            </div>

            <p className="text-gray-400 text-sm px-4 py-2">
                This table shows the list of all registered Manufacturers and their details
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
                            {["#", "Logo", "Name", "Email", "Mobile", "Business", "Password", "Actions"].map((h, i) => (
                                <th key={i} className="px-4 py-2 border border-gray-700">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredManufacturers.length > 0 ? (
                            filteredManufacturers.map((m, index) => (
                                <tr key={m._id} className={`${index % 2 === 0 ? "bg-black" : "bg-gray-800"} border-t border-gray-700`}>
                                    <td className="px-4 py-2">{index + 1}</td>
                                    <td className="px-4 py-2">
                                        <img
                                            src={m.logo || "https://via.placeholder.com/40"}
                                            alt="Logo"
                                            className="w-10 h-10 rounded border border-yellow-500"
                                        />
                                    </td>
                                    <td className="px-4 py-2 font-medium text-yellow-400">{m.manufacturer_Name}</td>
                                    <td className="px-4 py-2 text-yellow-300">{m.email}</td>
                                    <td className="px-4 py-2">{m.mobile_Number}</td>
                                    <td className="px-4 py-2">{m.business_Name}</td>
                                    <td className="px-4 py-2 flex items-center gap-2">
                                        <span>
                                            {showPassword[m._id]
                                                ? m.mobile_Number || "N/A"
                                                : "•".repeat(m.mobile_Number?.length || 6)}
                                        </span>
                                        <button
                                            onClick={() => togglePassword(m._id)}
                                            className="text-yellow-400 hover:text-yellow-300"
                                        >
                                            {showPassword[m._id] ? <FaEye /> : <FaEyeSlash />}
                                        </button>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditClick(m._id)}
                                                className="bg-yellow-500 p-2 rounded text-black hover:bg-yellow-400 transition"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(m._id)}
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
                                    No Manufacturers found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-6 rounded-xl w-[700px] max-h-[90vh] overflow-y-auto border border-yellow-500">
                        <h2 className="text-xl font-bold text-yellow-400 mb-6">
                            Edit Manufacturer Details
                        </h2>

                        {loadingEdit ? (
                            <p className="text-gray-300">Loading...</p>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-8">
                                {/* Basic Information */}
                                <div>
                                    <h3 className="text-lg font-semibold border-b border-yellow-500 pb-2 mb-4">
                                        Basic Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block mb-1">Country *</label>
                                            <select
                                                name="country"
                                                value={editData.country || ""}
                                                onChange={handleChange}
                                                className="w-full p-2 rounded bg-black border border-yellow-500"
                                            >
                                                <option value="">Choose Country</option>
                                                <option value="India">India</option>
                                                <option value="USA">USA</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block mb-1">City *</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={editData.city || ""}
                                                onChange={handleChange}
                                                placeholder="Enter city"
                                                className="w-full p-2 rounded bg-black border border-yellow-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-1">Manufacturer Code *</label>
                                            <input
                                                type="text"
                                                name="manufactur_code"
                                                value={editData.manufactur_code || ""}
                                                onChange={handleChange}
                                                className="w-full p-2 rounded bg-black border border-yellow-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Business Details */}
                                <div>
                                    <h3 className="text-lg font-semibold border-b border-yellow-500 pb-2 mb-4">
                                        Business Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block mb-1">Business Name *</label>
                                            <input
                                                type="text"
                                                name="business_Name"
                                                value={editData.business_Name || ""}
                                                onChange={handleChange}
                                                className="w-full p-2 rounded bg-black border border-yellow-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-1">GST Number *</label>
                                            <input
                                                type="text"
                                                name="gst_Number"
                                                value={editData.gst_Number || ""}
                                                onChange={handleChange}
                                                className="w-full p-2 rounded bg-black border border-yellow-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-1">Parent WLP *</label>
                                            <input
                                                type="text"
                                                name="Parent_WLP"
                                                value={editData.Parent_WLP || ""}
                                                readOnly
                                                className="w-full p-2 rounded bg-gray-800 border border-yellow-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div>
                                    <h3 className="text-lg font-semibold border-b border-yellow-500 pb-2 mb-4">
                                        Contact Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block mb-1">Manufacturer Name *</label>
                                            <input
                                                type="text"
                                                name="manufacturer_Name"
                                                value={editData.manufacturer_Name || ""}
                                                onChange={handleChange}
                                                className="w-full p-2 rounded bg-black border border-yellow-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-1">Mobile Number *</label>
                                            <input
                                                type="text"
                                                name="mobile_Number"
                                                value={editData.mobile_Number || ""}
                                                onChange={handleChange}
                                                className="w-full p-2 rounded bg-black border border-yellow-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-1">Email *</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={editData.email || ""}
                                                onChange={handleChange}
                                                className="w-full p-2 rounded bg-black border border-yellow-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-1">Toll Free Number</label>
                                            <input
                                                type="text"
                                                name="toll_Free_Number"
                                                value={editData.toll_Free_Number || ""}
                                                onChange={handleChange}
                                                className="w-full p-2 rounded bg-black border border-yellow-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-1">Website</label>
                                            <input
                                                type="text"
                                                name="website"
                                                value={editData.website || ""}
                                                onChange={handleChange}
                                                className="w-full p-2 rounded bg-black border border-yellow-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Address & Logo */}
                                <div>
                                    <h3 className="text-lg font-semibold border-b border-yellow-500 pb-2 mb-4">
                                        Address & Logo
                                    </h3>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block mb-1">Address *</label>
                                            <textarea
                                                name="address"
                                                rows="3"
                                                value={editData.address || ""}
                                                onChange={handleChange}
                                                className="w-full p-2 rounded bg-black border border-yellow-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-1">Logo *</label>
                                            <input
                                                type="file"
                                                name="logo"
                                                onChange={handleChange}
                                                className="w-full p-2 rounded bg-black border border-yellow-500"
                                            />
                                            {editData.logo && (
                                                <img
                                                    src={editData.logo}
                                                    alt="Logo"
                                                    className="mt-2 w-24 h-24 rounded object-cover border border-yellow-500"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-4">
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

export default ManufactureList;
