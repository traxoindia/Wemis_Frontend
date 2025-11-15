import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { RefreshCw, Loader, ArrowLeft } from "lucide-react";

const App = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("All");

    const fetchTickets = async () => {
        setLoading(true);

        const token = localStorage.getItem("token");

        try {
            const response = await axios.get(
                "https://api.websave.in/api/manufactur/getTicketIssuesListManufactur",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
console.log(response.data)
            setTickets(response.data.ticketIssues.reverse() || []);
        } catch (err) {
            console.log(err);
            alert("Failed to load tickets");
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    // Filter Tickets
    const filteredData = useMemo(() => {
        return tickets.filter((t) => filter === "All" || t.issueStatus === filter);
    }, [tickets, filter]);

    return (
        <div className="min-h-screen bg-gray-900 p-6 text-white">
            {/* Loader Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <Loader className="w-10 h-10 text-indigo-400 animate-spin" />
                </div>
            )}

            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center">
                <h1 className="text-3xl font-bold text-indigo-400">Ticket Issues Table</h1>

                <button
                    onClick={fetchTickets}
                    className="mt-4 md:mt-0 flex items-center space-x-2 bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                </button>

                 <a
                    href="/manufacturer/dashboard"
                    className="bg-gray-800 text-indigo-400 hover:bg-indigo-600 hover:text-white px-5 py-3 rounded-xl text-sm font-medium transition duration-200 flex items-center space-x-2 border border-gray-700"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Dashboard</span>
                </a>
            </div>

            {/* Filter Buttons */}
            <div className="flex space-x-3 mb-6">
                {["All", "Open", "Resolved"].map((st) => (
                    <button
                        key={st}
                        onClick={() => setFilter(st)}
                        className={`px-4 py-2 rounded-lg border ${
                            filter === st
                                ? "bg-indigo-600 text-white border-indigo-500"
                                : "bg-gray-800 text-gray-300 border-gray-700"
                        }`}
                    >
                        {st}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto shadow-xl rounded-xl border border-gray-700">
                <table className="w-full text-sm text-gray-300">
                    <thead className="bg-gray-800 text-gray-200">
                        <tr>
                            <th className="p-4 text-left">Ticket No</th>
                            <th className="p-4 text-left">Vehicle No</th>
                            <th className="p-4 text-left">Issue Type</th>
                            <th className="p-4 text-left">Description</th>
                             <th className="p-4 text-left">Address</th>
                            <th className="p-4 text-left">Status</th>
                            <th className="p-4 text-left">Created At</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredData.map((ticket) => (
                            <tr key={ticket._id} className="border-b border-gray-700 hover:bg-gray-800/60">
                                <td className="p-4 font-semibold text-indigo-400">
                                    #{ticket.ticketIssueNo}
                                </td>
                                <td className="p-4">{ticket.vechileNo}</td>
                                <td className="p-4">{ticket.issueType}</td>
                                <td className="p-4 max-w-xs truncate">{ticket.issueDescription}</td>

                                 <td className="p-4 max-w-xs truncate">{ticket.address}</td>
                                <td className="p-4">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            ticket.issueStatus === "Open"
                                                ? "bg-yellow-600/30 text-yellow-400"
                                                : "bg-green-600/30 text-green-400"
                                        }`}
                                    >
                                        {ticket.issueStatus}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {new Date(ticket.createdAt).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredData.length === 0 && (
                <p className="text-center text-gray-400 mt-6">No tickets found.</p>
            )}
        </div>
    );
};

export default App;
