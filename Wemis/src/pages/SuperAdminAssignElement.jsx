import React, { useEffect, useState, useContext } from "react";
import Navbar from "./Navbar";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { UserAppContext } from "../contexts/UserAppProvider";
import { toast } from "react-toastify";

function SuperAdminAssignElement() {
    const [elements, setElements] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [assignedElements, setAssignedElements] = useState([]);
    const [selectedElements, setSelectedElements] = useState([]);
    const [selectedAdmin, setSelectedAdmin] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const { token: contextToken } = useContext(UserAppContext);
    const tkn = contextToken || localStorage.getItem("token");

    // Fetch Admins
    const fetchData = async () => {
        try {
            const response = await axios.post(
                "https://api.websave.in/api/superadmin/fetchAllAdmins",
                {},
                {
                    headers: {
                        Authorization: `Bearer ${tkn}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            setAdmins(
                Array.isArray(response.data.admins)
                    ? response.data.admins.filter((ad) => ad?.adminId)
                    : []
            );
        } catch (error) {
            toast.error("Error fetching admins:", error);
        }
    };

    // Fetch Elements
    const fetchCopData = async () => {
        try {
            const response = await axios.post(
                "https://api.websave.in/api/superadmin/fetchAllCopNo",
                {},
                {
                    headers: {
                        Authorization: `Bearer ${tkn}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            setElements(
                Array.isArray(response.data.copNo) ? response.data.copNo : []
            );
        } catch (error) {
            console.error("Error fetching elements:", error);
        }
    };

    // Fetch Assigned Elements
    const fetchAssignedElements = async () => {
        try {
            const response = await axios.post(
                "https://api.websave.in/api/superadmin/fetchSuperAdminAssignElement",
                {},
                {
                    headers: {
                        Authorization: `Bearer ${tkn}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            setAssignedElements(
                Array.isArray(response.data.assignadmins)
                    ? response.data.assignadmins
                    : []
            );
            // console.log(response.data.assignadmins);
        } catch (error) {
            console.error("Error fetching assigned elements:", error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchCopData();
        fetchAssignedElements();
    }, [admins]);

    // Select Element
    const handleSelectElement = (id) => {
        if (!selectedElements.includes(id)) {
            setSelectedElements((prev) => [...prev, id]);
        }
    };

    // Remove Element
    const handleRemoveElement = (id) => {
        setSelectedElements((prev) => prev.filter((elId) => elId !== id));
    };

    // Assign Elements to Admin
    const handleAssign = async () => {
        if (!selectedAdmin || selectedElements.length === 0) {
            alert("Please select admin and at least one element");
            return;
        }

        try {
            await axios.post(
                "https://api.websave.in/api/superadmin/assignElement",
                { elementNameId: selectedElements, adminId: selectedAdmin },
                { headers: { Authorization: `Bearer ${tkn}` } }
            );

            toast.success("Elements assigned successfully");
            setIsModalOpen(false);
            setSelectedAdmin("");
            setSelectedElements([]);
            fetchAssignedElements(); // Refresh table
        } catch (err) {
            toast.error("Assign error:", err);
        }
    };

    // Search filter
    const filteredAssignedElements = assignedElements.filter((item) =>
        item?.elementNameId?.elementName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-black mt-36">
            <Navbar />

            <div className="p-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#1A1A1A] p-6 rounded-xl shadow-lg border border-yellow-400/30"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-yellow-400">
                            Assign Elements
                        </h2>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 border-2 border-yellow-400 text-yellow-400 rounded-lg hover:bg-yellow-400 hover:text-black transition"
                        >
                            + Assign Elements
                        </button>
                    </div>

                    {/* Search */}
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-gray-400 text-sm italic">
                            List of assigned elements to admins
                        </p>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="px-3 py-2 rounded-lg border border-yellow-400/50 bg-black text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-lg">
                        <table className="min-w-full text-sm">
                            <thead className="bg-yellow-400 text-black">
                                <tr>
                                    <th className="px-6 py-3 text-left">Si No</th>
                                    <th className="px-6 py-3 text-left">Element Name</th>
                                    <th className="px-6 py-3 text-left">Owner Name (Admin)</th>
                                    <th className="px-6 py-3 text-left">Business Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignedElements.map((item, idx) =>
                                    item.assign_element_list?.map((element, subIdx) => (
                                        <tr
                                            key={`${item._id}-${subIdx}`}
                                            className={`${(idx + subIdx) % 2 === 0 ? "bg-[#111111]" : "bg-[#1E1E1E]"
                                                } hover:bg-yellow-400/10 transition`}
                                        >
                                            <td className="px-6 py-3 text-yellow-300">
                                                {idx + 1}.{subIdx + 1}
                                            </td>
                                            <td className="px-6 py-3 text-gray-300">
                                                {element.elementName || "-"}
                                            </td>
                                            <td className="px-6 py-3 text-gray-300">
                                                {item?.Name_of_Business_owner || "-"}
                                            </td>
                                            <td className="px-6 py-3 text-gray-300">
                                                {item?.name_of_business || "-"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                    </div>

                    {/* Footer Info */}
                    <p className="text-gray-400 text-sm mt-4">
                        Showing {filteredAssignedElements.length} of{" "}
                        {assignedElements.length} entries
                    </p>
                </motion.div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-[#1A1A1A] text-white p-6 rounded-xl shadow-lg w-96"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                        >
                            <h3 className="text-lg font-bold text-yellow-400 mb-4">
                                Assign Elements
                            </h3>

                            {/* Select Admin */}
                            <label className="block mb-2">Select Admin</label>
                            <select
                                value={selectedAdmin}
                                onChange={(e) => setSelectedAdmin(e.target.value)}
                                className="w-full mb-4 p-2 rounded bg-black border border-yellow-400 text-yellow-300"
                            >
                                <option value="">-- Select Admin --</option>
                                {admins.map((ad, index) => (
                                    <option
                                        key={ad?.adminId?._id || index}
                                        value={ad?.adminId?._id || ""}
                                    >
                                        {ad?.adminId?.name_of_business || "Unnamed"}
                                    </option>
                                ))}
                            </select>

                            {/* Select Elements */}
                            <label className="block mb-2">Select Elements</label>
                            <div className="flex flex-col gap-2 mb-4 max-h-40 overflow-y-auto">
                                {elements.map((el) => (
                                    <button
                                        key={el._id}
                                        onClick={() => handleSelectElement(el._id)}
                                        disabled={selectedElements.includes(el._id)}
                                        className={`p-2 rounded border ${selectedElements.includes(el._id)
                                                ? "bg-yellow-600 text-black cursor-not-allowed"
                                                : "bg-black border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black"
                                            }`}
                                    >
                                        {el?.elementName || "Unnamed"}
                                    </button>
                                ))}
                            </div>

                            {/* Selected Elements */}
                            {selectedElements.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm text-gray-300 mb-1">Selected:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedElements.map((id) => {
                                            const el = elements.find((e) => e._id === id);
                                            return (
                                                <span
                                                    key={id}
                                                    className="px-2 py-1 bg-yellow-400 text-black rounded text-xs flex items-center gap-1"
                                                >
                                                    {el?.elementName || "Unnamed"}
                                                    <button
                                                        onClick={() => handleRemoveElement(id)}
                                                        className="ml-1 text-xs"
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssign}
                                    className="px-3 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500"
                                >
                                    Assign
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default SuperAdminAssignElement;
