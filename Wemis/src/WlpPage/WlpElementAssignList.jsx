import React, { useEffect, useState, useContext } from "react";
import WlpNavbar from "./WlpNavbar";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "react-toastify";
import { UserAppContext } from "../contexts/UserAppProvider";

function WlpElementAssignList() {
  const [assignedData, setAssignedData] = useState([]);
  const [elements, setElements] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [selectedElements, setSelectedElements] = useState([]);
  const [selectedDealers, setSelectedDealers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [allfetchlist, setallfetchlist] = useState([])

  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  // Fetch assigned elements (Dealer Assignments)
  const fetchAssignedData = async () => {
    try {
      const response = await axios.post(
        "https://api.websave.in/api/wlp/fetchAllDataRelatedtoAssignElements",
        {},
        { headers: { Authorization: `Bearer ${tkn}` } }
      );

      setAssignedData(Array.isArray(response.data?.data) ? response.data.data : []);
      setElements(response.data.adminElementList);
      setDealers(response.data.manufactur);
    } catch (error) {
      toast.error("Error fetching assigned dealer elements");
      console.error(error);
    }
  };

  //Fetch available elements + dealers for assignment
  const fetchElementsAndDealers = async () => {
    try {
      const response = await axios.post(
        "https://api.websave.in/api/wlp/fetchAssignElement",
        {},
        { headers: { Authorization: `Bearer ${tkn}` } }
      );
      console.log(response.data.manufactur)
      setallfetchlist(response.data.manufactur)


    } catch (error) {
      console.error("Error fetching elements and dealers", error);
    }
  };

  // Assign Elements to Dealers
  const handleAssign = async () => {
    if (selectedDealers.length === 0) {
      toast.warning("Please select at least one Dealer");
      return;
    }
    if (selectedElements.length === 0) {
      toast.warning("Please select an element");
      return;
    }

    try {
      await axios.post(
        "https://api.websave.in/api/wlp/AssignElements",
        { manufacturId: selectedDealers, elementNameId: selectedElements },
        { headers: { Authorization: `Bearer ${tkn}` } }
      );
      toast.success("Element assigned successfully!");
      setIsModalOpen(false);
      setSelectedElements([]);
      setSelectedDealers([]);
      fetchAssignedData();
    } catch (error) {
      toast.error("Error assigning element");
      console.error(error);
    }
  };

  // Toggle Dealer selection
  const toggleSelection = (id) => {
    setSelectedDealers((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    fetchAssignedData();
    fetchElementsAndDealers();
  }, []);

  const openModal = () => {

    setIsModalOpen(true);
  };

  const filteredData = assignedData.filter((item) =>
    item?.elementName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black mt-36">
      <WlpNavbar />
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
              Dealer Assigned Elements
            </h2>
            <button
              onClick={openModal}
              className="px-4 py-2 border-2 border-yellow-400 text-yellow-400 rounded-lg hover:bg-yellow-400 hover:text-black transition"
            >
              + Assign Dealer
            </button>
          </div>

          {/* Search */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-400 text-sm italic">
              List of elements assigned to your dealers
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
                  <th className="px-6 py-3 text-left">Name(Manufacturer)</th>
                  <th className="px-6 py-3 text-left">Business Name(Manufacturer)</th>

                </tr>
              </thead>
              <tbody>
                {allfetchlist.length > 0 ? (
                  allfetchlist.map((item, idx) => (
                    <tr
                      key={item._id}
                      className={`${idx % 2 === 0 ? "bg-[#111111]" : "bg-[#1E1E1E]"
                        } hover:bg-yellow-400/10 transition`}
                    >
                      <td className="px-6 py-3 text-yellow-300">{idx + 1}</td>

                      {item.assign_element_list.map((i) => {
                        return (
                          <td className="px-6 py-3 text-gray-300">{i.elementName} </td>
                        )
                      })
                        || "-"}

                      <td className="px-6 py-3 text-gray-300">
                        {item.manufacturer_Name || "-"}
                      </td>
                      <td className="px-6 py-3 text-gray-300">
                        {item.business_Name
                          || "-"}
                      </td>

                    </tr>
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

      {/* Modal */}
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
                Assign Element to Dealer
              </h3>

              {/* Select Dealers */}
              <label className="block mb-3 font-semibold text-gray-300">
                Choose Dealer(s)
              </label>
              <div className="grid grid-cols-2 gap-3 mb-6 max-h-40 overflow-y-auto">
                {dealers.map((dealer) => (
                  <div
                    key={dealer._id}
                    onClick={() => toggleSelection(dealer._id)}
                    className={`p-3 rounded-lg text-center cursor-pointer border transition ${selectedDealers.includes(dealer._id)
                      ? "bg-yellow-500 text-black border-yellow-500 shadow-md"
                      : "bg-black border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black"
                      }`}
                  >
                    {dealer.manufacturer_Name}
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

export default WlpElementAssignList;
