import React, { useEffect, useState, useContext } from "react";
import AdminNavbar from "./AdminNavbar";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "react-toastify";
import { UserAppContext } from "../contexts/UserAppProvider";

function AdminElementAsignList() {
  const [assignedData, setAssignedData] = useState([]);
  const [elements, setElements] = useState([]);
  const [wlps, setWlps] = useState([]);
  const [selectedElements, setSelectedElements] = useState([]);
  const [selectedWlps, setSelectedWlps] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [fetchwlp, setfetchwlp] = useState([]);

  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  // Fetch Assigned Elements
  const fetchAssignedData = async () => {
    try {
      const response = await axios.post(
        "https://api.websave.in/api/admin/fetchAllDaterelatedToassignAdminElement",
        {},
        { headers: { Authorization: `Bearer ${tkn}` } }
      );

      setAssignedData(
        Array.isArray(response.data?.data) ? response.data.data : []
      );
      setWlps(Array.isArray(response.data?.wlps) ? response.data.wlps : []);
      setElements(response.data.adminElementList || []);
    } catch (error) {
      toast.error("Error fetching assigned elements");
      console.error(error);
    }
  };

  // Fetch Elements + WLPs
  const fetchElementsAndWlps = async () => {
    try {
      const response = await axios.post(
        "https://api.websave.in/api/admin/fetchAllAvailableElementsAndWlps",
        {},
        { headers: { Authorization: `Bearer ${tkn}` } }
      );
      setElements(response.data?.adminElementList || []);
      setWlps(response.data?.wlps || []);
    } catch (error) {
      console.error("Error fetching elements and wlps", error);
    }
  };

  // Assign Elements to WLPs
  const handleAssign = async () => {
    if (selectedWlps.length === 0) {
      toast.warning("Please select at least one WLP");
      return;
    }
    if (selectedElements.length === 0) {
      toast.warning("Please select an element");
      return;
    }

    try {
      await axios.post(
        "https://api.websave.in/api/admin/adminAssignElement",
        { wlpId: selectedWlps, elementNameId: selectedElements },
        { headers: { Authorization: `Bearer ${tkn}` } }
      );
      toast.success("Element assigned successfully!");
      setIsModalOpen(false);
      setSelectedElements([]);
      setSelectedWlps([]);
      fetchAssignedData();
    } catch (error) {
      toast.error("Error assigning element");
      console.error(error);
    }
  };

  // Toggle selection for WLPs
  const toggleSelection = (id) => {
    setSelectedWlps((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    fetchAssignedData();
  }, []);

  const openModal = () => {
    fetchElementsAndWlps();
    setIsModalOpen(true);
  };

  const filteredData = assignedData.filter((item) =>
    item?.elementName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch All Wlp List
  const fetchWlpAssignElementList = async () => {
    try {
      const response = await axios.post(
        "https://api.websave.in/api/admin/fetchWlpAssignElementList",
        {},
        { headers: { Authorization: `Bearer ${tkn}` } }
      );


      setfetchwlp(response.data)
      console.log(response.data)
    } catch (error) {
      toast.error("Error fetching WLP assigned elements");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchWlpAssignElementList();
  }, [assignedData]);





  return (
    <div className="min-h-screen bg-black mt-36">
      <AdminNavbar />
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
              Assigned Elements List
            </h2>
            <button
              onClick={openModal}
              className="px-4 py-2 border-2 border-yellow-400 text-yellow-400 rounded-lg hover:bg-yellow-400 hover:text-black transition"
            >
              + Assign Elements
            </button>
          </div>

          {/* Search */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-400 text-sm italic">
              List of elements assigned to you
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
        <th className="px-6 py-3 text-left">Element</th>
        <th className="px-6 py-3 text-left">WLP</th>
        <th className="px-6 py-3 text-left">Mobile No</th>
        <th className="px-6 py-3 text-left">Created Date</th>
      </tr>
    </thead>
    <tbody>
      {fetchwlp?.wlps?.length > 0 ? (
        fetchwlp.wlps.map((wlp, idx) => (
          wlp.assign_element_list.map((element, eIdx) => (
            <tr
              key={`${wlp._id}-${eIdx}`}
              className={`${(idx + eIdx) % 2 === 0 ? "bg-[#111111]" : "bg-[#1E1E1E]"
                } hover:bg-yellow-400/10 transition`}
            >
              <td className="px-6 py-3 text-yellow-300">{idx + 1}</td>
              <td className="px-6 py-3 text-gray-300">
                {element.elementName || "-"}
              </td>
              <td className="px-6 py-3 text-gray-300">
                {wlp.organizationName || "-"}
              </td>
              <td className="px-6 py-3 text-gray-300">
                {wlp.mobileNumber || "-"}
              </td>
              <td className="px-6 py-3 text-gray-300">
                {wlp.createdAt ? new Date(wlp.createdAt).toLocaleDateString() : "-"}
              </td>
            </tr>
          ))
        ))
      ) : (
        <tr>
          <td colSpan={5} className="text-center text-gray-400 py-4">
            No data found.
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>


          <p className="text-gray-400 text-sm mt-4">
            Showing {filteredData.length} of {assignedData.length} entries
          </p>
        </motion.div>
      </div>

      {/* Modernized Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#121212] text-white p-6 rounded-2xl shadow-2xl w-[520px] border border-yellow-400/30"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
            >
              <h3 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
                Assign Element
              </h3>

              {/* Select WLPs */}
              <label className="block mb-3 font-semibold text-gray-300">
                Choose WLP(s)
              </label>
              <div className="grid grid-cols-2 gap-3 mb-6 max-h-40 overflow-y-auto">
                {wlps.map((wlp) => (
                  <div
                    key={wlp._id}
                    onClick={() => toggleSelection(wlp._id)}
                    className={`p-3 rounded-lg text-center cursor-pointer border transition ${selectedWlps.includes(wlp._id)
                      ? "bg-yellow-500 text-black border-yellow-500 shadow-md"
                      : "bg-black border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black"
                      }`}
                  >
                    {wlp.organizationName}
                  </div>
                ))}
              </div>

              {/* Select Element */}
              <label className="block mb-3 font-semibold text-gray-300">
                Choose Element
              </label>
              <select
                value={selectedElements[0] || ""}
                onChange={(e) => setSelectedElements([e.target.value])}
                className="w-full p-3 rounded-lg border border-yellow-400 text-yellow-300 bg-black mb-6 focus:ring-2 focus:ring-yellow-400"
              >
                <option value="">-- Select Element --</option>
                {elements.map((el) => (
                  <option key={el._id} value={el._id}>
                    {el.elementName}
                  </option>
                ))}
              </select>

              {/* Buttons */}
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  className="px-4 py-2 rounded-lg bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition"
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

export default AdminElementAsignList;
