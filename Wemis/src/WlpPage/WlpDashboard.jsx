import React, { useContext, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaUsers, FaBoxOpen } from "react-icons/fa";
import { UserAppContext } from "../contexts/UserAppProvider";
import axios from "axios";
import WlpNavbar from "./WlpNavbar";

function WlpDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.post(
        "https://api.websave.in/api/wlp/fetchDashBoardData",
        {},
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );
      setData(response.data || {});
      console.log(response.data)
    } catch (err) {
      console.error("Error fetching WLP data:", err.message);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString();
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-black mt-36">
      <WlpNavbar />
      <main className="p-8">
        {/* Dashboard Overview */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#111111] rounded-xl shadow-lg p-6 mb-6 border border-yellow-400/30"
        >
          <h2 className="text-xl font-semibold text-yellow-400">
            WLP Dashboard Overview
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Welcome! Here’s the latest insight into your reseller activities.
          </p>
        </motion.section>

        {/* Loading / Error */}
        {loading && (
          <p className="text-gray-400 text-center py-10">Loading data...</p>
        )}
        {error && (
          <p className="text-red-500 text-center py-10">{error}</p>
        )}

        {!loading && !error && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {[
                {
                  title: "Total Clients",
                  value: data?.totalManufactur || 0,
                  icon: <FaUsers className="text-yellow-400 text-3xl" />,
                },
                {
                  title: "Assigned Elements",
                  value: data?.assignedElementsCount || 1,
                  icon: <FaBoxOpen className="text-yellow-400 text-3xl" />,
                },
              ].map((card, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-[#141414] rounded-xl p-6 border border-yellow-400/30 
                             hover:border-yellow-400/60 hover:shadow-yellow-500/20 
                             hover:shadow-xl transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-gray-200 font-medium">{card.title}</h3>
                      <p className="text-3xl font-bold mt-2 text-yellow-400">
                        {card.value}
                      </p>
                    </div>
                    {card.icon}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Data Table */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-[#111111] p-6 rounded-xl shadow-lg border border-yellow-400/30"
            >
              <h3 className="text-lg font-semibold text-yellow-400 mb-4">
                Client Records
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-gray-300">
                  <thead className="bg-[#1F1F1F] text-yellow-400">
                    <tr>
                      <th className="px-6 py-3 text-left">SL No</th>
                      <th className="px-6 py-3 text-left">Client Name</th>
                   
                      <th className="px-6 py-3 text-left">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.Manufactur && data.Manufactur.length > 0 ? (
                      data.Manufactur.map((client, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-700 hover:bg-[#1A1A1A] transition"
                        >
                          <td className="px-6 py-3">{idx + 1}</td>
                          <td className="px-6 py-3">{client?.
manufacturer_Name || "N/A"}</td>
                         
                          <td className="px-6 py-3">
                            {formatDate(client?.createdAt)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center text-gray-500 py-6"
                        >
                          No client records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}

export default WlpDashboard;
