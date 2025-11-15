import React, { useState, useEffect } from "react";
import {
  FaTicketAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaFolderOpen,
  FaEye,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

// STATUS BADGE UI
const getStatusBadge = (status) => {
  let color = "";
  let icon = null;

  switch (status) {
    case "Open":
      color = "bg-red-600 text-white";
      icon = <FaFolderOpen className="mr-1" />;
      break;
    case "Pending":
      color = "bg-yellow-400 text-gray-900";
      icon = <FaClock className="mr-1" />;
      break;
    case "Closed":
      color = "bg-green-600 text-white";
      icon = <FaCheckCircle className="mr-1" />;
      break;
    default:
      color = "bg-gray-500 text-white";
  }

  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${color}`}>
      {icon}
      {status}
    </span>
  );
};

const TicketListPage = () => {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Fetch Tickets (Axios GET)
  const fetchTickets = async () => {
    setLoading(true);

    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("No token found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        "https://api.websave.in/api/manufactur/fetchAllDelerTicketIssue",
        {
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API DATA:", response.data);

      const data = response.data;

      if (!data || !data.tickets) {
        toast.error("Unexpected API response format");
        setLoading(false);
        return;
      }

      setTickets(data.tickets.reverse());
      toast.success("Tickets loaded successfully!");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Network error! Unable to fetch tickets."
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter(
    (ticket) => filter === "All" || ticket.issueStatus === filter
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <header className="mb-8 pb-3 border-b border-gray-800 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold flex items-center gap-2">
            <FaTicketAlt className="text-yellow-500" /> My Support{" "}
            <span className="text-yellow-500">Tickets</span>
          </h1>

          <button
            onClick={() => navigate("/distributor/dealer/dashboard")}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-500 shadow-md flex items-center gap-1"
          >
            <FaTicketAlt /> Raise New Ticket
          </button>
        </header>

        {/* FILTERS */}
        <div className="mb-6 flex gap-3 items-center">
          <span className="text-gray-400 text-sm">Filter by Status:</span>
          {["All", "Open", "Pending", "Closed"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                filter === status
                  ? "bg-yellow-500 text-gray-900 shadow-lg"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* TABLE */}
        <div className="bg-gray-800 rounded-xl shadow-xl overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                {[
                  "Ticket No",
                  "Created At",
                  "Vehicle No",
                  "Issue Type",
                  "Address",
                  "Status",
                 
                ].map((title) => (
                  <th
                    key={title}
                    className="px-6 py-3 text-left text-xs text-gray-300 uppercase"
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-400">
                    Loading tickets...
                  </td>
                </tr>
              ) : filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-gray-700/40 transition">
                    <td className="px-6 py-4 text-yellow-400 font-semibold">
                      {ticket.ticketIssueNo}
                    </td>

                    <td className="px-6 py-4 text-gray-300">
                      {new Date(ticket.createdAt).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-white">{ticket.vechileNo}</td>

                    <td className="px-6 py-4 text-gray-300">{ticket.issueType}</td>

                    <td className="px-6 py-4 text-gray-400">{ticket.address}</td>

                    <td className="px-6 py-4">{getStatusBadge(ticket.issueStatus)}</td>

                   
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="py-6 text-center text-gray-400 text-lg"
                  >
                    <FaExclamationCircle className="text-red-500 text-3xl inline-block mb-1" />{" "}
                    No {filter === "All" ? "" : filter} tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* TOTAL COUNT */}
        <div className="mt-6 text-gray-400 text-sm">
          Total Tickets: <span className="text-yellow-400 font-bold">{tickets.length}</span>
        </div>
      </div>
    </div>
  );
};

export default TicketListPage;
