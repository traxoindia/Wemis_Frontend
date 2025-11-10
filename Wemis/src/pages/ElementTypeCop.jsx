import axios from "axios";
import React, { useEffect, useState, useContext } from "react";
import { UserAppContext } from "../contexts/UserAppProvider";
import { FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";

function ElementTypeCop() {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  const fetchData = async () => {
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
      setData(response.data.copNo);
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [data]);

  const handleEdit = (id) => {
    console.log("Edit element:", id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.post(
        "https://api.websave.in/api/superadmin/deleteElement",
        { id },
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Element deleted successfully");
      fetchData();
    } catch (error) {
      console.log(error);
    }
  };

  // Filter elements based on search term
  const filteredData = data.filter((item) =>
    item.elementName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 min-h-screen bg-black">
      <h2 className="text-4xl font-extrabold text-center text-yellow-400 drop-shadow-lg mb-8">
        Element Management
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

      <div className="overflow-x-auto rounded-xl shadow-2xl backdrop-blur-md bg-white/5 border border-gray-700">
        <table className="min-w-full text-gray-200">
          <thead>
            <tr className="bg-yellow-400 text-black text-sm uppercase tracking-wide">
              <th className="py-3 px-6 text-left">#</th>
              <th className="py-3 px-6 text-left">Element </th>
              <th className="py-3 px-6 text-left">Type</th>
              <th className="py-3 px-6 text-left">Model No</th>
              <th className="py-3 px-6 text-left">Part No</th>
              <th className="py-3 px-6 text-center">Tac No</th>
              <th className="py-3 px-6 text-center">Cop No</th>
              <th className="py-3 px-6 text-center">Cop Valid Till</th>
              <th className="py-3 px-6 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <tr
                  key={item._id}
                  className="border-b border-gray-700 hover:bg-gray-800/50 transition duration-200"
                >
                  <td className="py-4 px-6 text-lg font-medium">{index + 1}</td>
                  <td className="py-4 px-6 text-lg">
                    {item.elementName || "N/A"}
                  </td>

                  <td className="py-4 px-6 text-lg">
                    {item.elementType || "N/A"}
                  </td>
                  <td className="py-4 px-6 text-lg">{item.model_No}</td>
                  <td className="py-4 px-6 text-lg">{item.device_Part_No}</td>
                  <td className="py-4 px-6 text-lg">{item.tac_No}</td>
                  <td className="py-4 px-6 text-lg">{item.cop_No}</td>
                  {item.cop_No.map((i) => {
                    <td className="py-4 px-6 text-lg">{i}</td>;
                  })}
                  {item.date.map((i, index) => (
                    <td key={index} className="py-4 px-6 text-lg">
                      {new Date(i).toLocaleDateString("en-GB")}
                      {/* "en-GB" gives DD/MM/YYYY, "en-US" gives MM/DD/YYYY */}
                    </td>
                  ))}

                  <td className="py-4 px-6 text-center flex justify-center gap-3">
                    <button
                      onClick={() => handleEdit(item._id)}
                      className="p-3 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 shadow-lg hover:scale-105 transition transform"
                      title="Edit Element"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-lg hover:scale-105 transition transform"
                      title="Delete Element"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="py-6 text-center text-gray-400 text-lg font-medium"
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

export default ElementTypeCop;
