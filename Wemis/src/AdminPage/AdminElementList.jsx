import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import { UserAppContext } from "../contexts/UserAppProvider";
import AdminNavbar from "./AdminNavbar";

function AdminElementList() {
  const [elements, setElements] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  // Fetch Elements
  const fetchElements = async () => {
    try {
      const response = await axios.post(
        "https://api.websave.in/api/admin/fetchAdminElementsList",
        {},
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );
      setElements(response.data?.elements || []);
    } catch (error) {
      console.error("Error fetching admin elements:", error);
    }
  };

  useEffect(() => {
    fetchElements();
  }, [tkn]);

  // Filter elements based on search
  const filteredData = elements.filter((item) =>
    item.elementName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 min-h-screen bg-black text-gray-200">
    <AdminNavbar/>
      <h2 className="text-3xl font-bold text-center text-yellow-400 mb-6 mt-40">
        Admin Element List
      </h2>

      {/* Search Box */}
      <div className="mb-6 flex justify-center">
        <div className="relative w-96">
          <input
            type="text"
            placeholder="Search element..."
            className="w-full px-4 py-2 pl-10 rounded-lg bg-gray-800 text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl shadow-2xl backdrop-blur-md bg-white/5 border border-gray-700">
        <table className="min-w-full text-gray-200">
          <thead>
            <tr className="bg-yellow-400 text-black text-sm uppercase tracking-wide">
              <th className="py-3 px-6 text-left">Sl. No</th>
              <th className="py-3 px-6 text-left">Element Name</th>
              <th className="py-3 px-6 text-left">VLTD Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <tr
                  key={item._id}
                  className={`${
                    index % 2 === 0 ? "bg-black" : "bg-gray-800"
                  } border-b border-gray-700 hover:bg-gray-700/50`}
                >
                  <td className="py-4 px-6">{index + 1}</td>
                  <td className="py-4 px-6 font-medium text-yellow-300">
                    {item.elementName}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.is_Vltd
                          ? "bg-green-500 text-black"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {item.is_Vltd ? "Yes" : "No"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="3"
                  className="py-6 text-center text-gray-400 text-lg"
                >
                  No elements found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminElementList;
