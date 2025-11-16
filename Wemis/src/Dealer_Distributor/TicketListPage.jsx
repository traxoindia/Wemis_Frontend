import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Tag,
  Clock,
  CheckCircle,
  AlertCircle,
  FolderOpen,
  Eye,
  Send,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

// STATUS BADGE UI (Unchanged)
const getStatusBadge = (status) => {
  let color = "";
  let icon = null;

  switch (status) {
    case "Open":
      color = "bg-red-600 text-white";
      icon = <FolderOpen size={14} className="mr-1" />;
      break;
    case "Pending":
    case "Awaiting": 
      color = "bg-yellow-400 text-gray-900";
      icon = <Clock size={14} className="mr-1" />;
      break;
    case "Resolved":
    case "Closed":
      color = "bg-green-600 text-white";
      icon = <CheckCircle size={14} className="mr-1" />;
      break;
    default:
      color = "bg-gray-500 text-white";
      icon = <Tag size={14} className="mr-1" />;
  }

  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${color}`}
    >
      {icon}
      {status}
    </span>
  );
};

// --- FIX: ISOLATED STATEFUL CHAT INPUT COMPONENT ---
// This component now manages its own message state and sending logic,
// completely decoupling typing from the parent modal's re-renders.
const ChatInput = ({ ticket, token, setMessages, isOpen }) => {
  const [localMessage, setLocalMessage] = useState("");
  const [chatSending, setChatSending] = useState(false);

  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();

      const messageText = localMessage.trim();
      if (!messageText || !ticket || !token) return;

      const receiverId = ticket.issuseAssignTo;
      const ticketIssueId = ticket._id;

      if (!receiverId || !ticketIssueId) {
        toast.error("Error: Required IDs are missing. Cannot send message.");
        return;
      }

      setChatSending(true);

      const messagePayload = {
        receiverId: receiverId,
        message: messageText,
        ticketIssueId: ticketIssueId,
      };

      try {
        await axios.post(
          "https://api.websave.in/api/manufactur/chatBetweenManufacturAndDeler",
          messagePayload,
          {
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
          }
        );

        // Update parent state (messages)
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: "Manufacturer (You)",
            text: messageText,
            createdAt: new Date(),
            ticketId: ticket._id,
          },
        ]);
        setLocalMessage(""); // Clear local input state
        toast.success("Message sent successfully!");
      } catch (err) {
        console.error("Error sending message:", err);
        toast.error(
          err.response?.data?.message || "Failed to send message via API."
        );
      } finally {
        setChatSending(false);
      }
    },
    [localMessage, ticket, token, setMessages]
  ); // Only re-create if message, ticket, or token changes

  return (
    <div className="pt-4 border-t border-gray-700 mt-4 flex-shrink-0">
      <form onSubmit={handleSendMessage} className="flex space-x-3">
        <input
          type="text"
          // FIX: The value is now controlled by the local state (localMessage)
          value={localMessage}
          // FIX: The onChange only updates the local state
          onChange={(e) => setLocalMessage(e.target.value)}
          placeholder={
            isOpen ? "Type your message..." : "Ticket is closed or resolved."
          }
          className="flex-1 p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 border-none outline-none"
          disabled={chatSending || !isOpen}
        />
        <button
          type="submit"
          className="bg-yellow-600 px-4 py-3 rounded-lg text-gray-900 hover:bg-yellow-500 transition disabled:bg-gray-600 flex items-center justify-center"
          disabled={chatSending || !localMessage.trim() || !isOpen}
        >
          {chatSending ? (
            <Clock className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
      {!isOpen && (
        <p className="text-center text-sm text-red-400 mt-2">
          This ticket is not open/pending. You cannot send new messages.
        </p>
      )}
    </div>
  );
};


// --- TicketListPage Component ---

const TicketListPage = () => {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  // Modal and Chat State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const navigate = useNavigate();

  // Load token from localStorage
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // --- API & Data Fetching ---

  const fetchTickets = useCallback(async () => {
    setLoading(true);

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

      const data = response.data;

      if (!data || !data.tickets) {
        toast.error("Unexpected API response format");
        setLoading(false);
        return;
      }

      setTickets(data.tickets.reverse());
      // toast.success("Tickets loaded successfully!");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Network error! Unable to fetch tickets."
      );
    }

    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(
      (ticket) => filter === "All" || ticket.issueStatus === filter
    );
  }, [tickets, filter]);

  // --- Chat/Modal Handlers ---

  // Function to fetch messages (Unchanged)
  const fetchMessages = useCallback(
    async (ticketId, otherId, manufacturerId) => {
      setChatLoading(true);
      setMessages([]);

      if (!token || !ticketId || !otherId) {
        toast.error("Missing IDs for chat history.");
        setChatLoading(false);
        return;
      }

      try {
        const response = await axios.post(
          "https://api.websave.in/api/manufactur/getAllMessagesBetweenUsers",
          {
            otherUserId: otherId, // Dealer ID (issuseAssignTo)
            ticketIssueId: ticketId, // Ticket ID (_id)
          },
          {
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
          }
        );

        const chatData = response.data.messages || [];

        const formattedMessages = chatData.map((msg) => ({
          id: msg._id || Date.now() + Math.random(),
          sender:
            msg.senderId === manufacturerId ? "Manufacturer (You)" : "Dealer",
          text: msg.message,
          createdAt: new Date(msg.createdAt),
        }));

        setMessages(formattedMessages);
      } catch (err) {
        console.error("Error fetching messages:", err);
        toast.error(
          err.response?.data?.message || "Failed to load chat history from API."
        );
      } finally {
        setChatLoading(false);
      }
    },
    [token, setMessages]
  );
  
  const updateTicketStatus = async (newStatus) => {
    if (!selectedTicket || !token) return;

    setStatusUpdating(true);

    const statusPayload = {
      ticketId: selectedTicket._id,
      newStatus: newStatus, // e.g., 'Resolved' or 'Closed'
    };

    try {
      // NOTE: Replace this mock delay with your actual status update API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Optimistically update local state
      setSelectedTicket((prev) => ({ ...prev, issueStatus: newStatus }));

      toast.success(
        `Ticket #${selectedTicket.ticketIssueNo} marked as ${newStatus}.`
      );
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update ticket status.");
    } finally {
      setStatusUpdating(false);
      fetchTickets(); // Re-fetch list to show updated status
    }
  };

  const openModal = (ticket) => {
    const otherId = ticket.issuseAssignTo; // Dealer ID
    const currentUserManufacturId = ticket.delerTicketIssueId; // Assuming this is the current user's ID for sender comparison

    setSelectedTicket(ticket);
    setIsModalOpen(true);
    fetchMessages(ticket._id, otherId, currentUserManufacturId);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
    setMessages([]);
  };

  // --- Components ---

  const TicketModal = () => {
    if (!isModalOpen || !selectedTicket) return null;

    const chatContainerRef = useRef(null);

    // Auto-scroll to the bottom of the chat when new messages arrive
    useEffect(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
    }, [messages]); // Dependency on messages array

    const isOpen =
      selectedTicket.issueStatus === "Open" ||
      selectedTicket.issueStatus === "Pending";
    // const isClosed = selectedTicket.issueStatus === "Closed" || selectedTicket.issueStatus === "Resolved";

    return (
      <div
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-40 p-4"
        onClick={closeModal}
      >
        <div
          className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 scale-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-900 flex-shrink-0">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Eye className="text-yellow-500 w-5 h-5" />
              <span className="text-white">
                Ticket #{selectedTicket.ticketIssueNo}
              </span>
              <span className="ml-4">
                {getStatusBadge(selectedTicket.issueStatus)}
              </span>
            </h2>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-red-500 transition p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body: Details + Chat Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 flex flex-col min-h-0">
            {/* Details Card */}
            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm flex-shrink-0">
              <p>
                <strong>Vehicle No:</strong>{" "}
                <span className="text-yellow-400">
                  {selectedTicket.vechileNo}
                </span>
              </p>
              <p>
                <strong>Issue Type:</strong> {selectedTicket.issueType}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(selectedTicket.createdAt).toLocaleDateString()}
              </p>
              <p className="md:col-span-3">
                <strong>Description:</strong> {selectedTicket.issueDescription}
              </p>
              <p className="md:col-span-3">
                <strong>Address:</strong> {selectedTicket.address}
              </p>
            </div>

            {/* Chat Window */}
            <div className="flex flex-col flex-1 bg-gray-900 rounded-lg p-4 border border-gray-700 min-h-0">
              <h3 className="text-lg font-semibold mb-3 text-yellow-300 flex-shrink-0">
                Conversation
              </h3>
              {/* Chat History Container */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 min-h-0 pb-2"
              >
                {chatLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <Clock className="w-6 h-6 text-yellow-400 animate-spin" />
                    <span className="ml-2">Loading Chat...</span>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        msg.sender.includes("Manufacturer")
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs md:max-w-md p-3 rounded-xl shadow-md break-words ${
                          msg.sender.includes("Manufacturer")
                            ? "bg-yellow-600 text-gray-900 rounded-br-none"
                            : "bg-gray-700 text-gray-100 rounded-tl-none"
                        }`}
                      >
                        <p className="text-xs font-bold mb-1 opacity-80">
                          {msg.sender}
                        </p>
                        <p>{msg.text}</p>
                        <span className="block text-right text-[10px] opacity-60 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 mt-10">
                    No messages yet. Start the conversation!
                  </p>
                )}
              </div>

              {/* Message Input Form (Isolated Stateful Component) */}
              <ChatInput
                ticket={selectedTicket}
                token={token}
                setMessages={setMessages}
                isOpen={isOpen}
              />
            </div>
          </div>

          {/* Modal Footer: Action Buttons */}
          <div className="p-5 border-t border-gray-700 flex justify-end space-x-3 bg-gray-900 flex-shrink-0">
            {isOpen && (
              <>
                <button
                  onClick={() => updateTicketStatus("Resolved")}
                  className="flex items-center space-x-2 bg-green-600 px-4 py-2 rounded-lg text-white font-semibold hover:bg-green-700 transition disabled:opacity-50"
                  disabled={statusUpdating}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {statusUpdating ? "Resolving..." : "Mark as Resolved"}
                  </span>
                </button>
                <button
                  onClick={() => updateTicketStatus("Closed")}
                  className="flex items-center space-x-2 bg-red-600 px-4 py-2 rounded-lg text-white font-semibold hover:bg-red-700 transition disabled:opacity-50"
                  disabled={statusUpdating}
                >
                  <X className="w-4 h-4" />
                  <span>
                    {statusUpdating ? "Closing..." : "Mark as Closed"}
                  </span>
                </button>
              </>
            )}
            <button
              onClick={closeModal}
              className="bg-gray-700 px-4 py-2 rounded-lg text-white font-semibold hover:bg-gray-600 transition"
            >
              Close View
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- Main Render (Unchanged) ---

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <header className="mb-8 pb-3 border-b border-gray-800 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold flex items-center gap-2">
            <Tag className="text-yellow-500" /> Manufacturer Support{" "}
            <span className="text-yellow-500">Tickets</span>
          </h1>

          <button
            onClick={() => navigate("/distributor/dealer/dashboard")}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-500 shadow-md flex items-center gap-1 transition"
          >
            <Tag /> Raise New Ticket (Demo Link)
          </button>
        </header>

        {/* FILTERS */}
        <div className="mb-6 flex gap-3 items-center flex-wrap">
          <span className="text-gray-400 text-sm">Filter by Status:</span>
          {["All", "Open", "Pending", "Resolved", "Closed"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
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
                  "Action",
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
                    <Clock className="inline-block animate-spin mr-2" />
                    Loading tickets...
                  </td>
                </tr>
              ) : filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => (
                  <tr
                    key={ticket._id}
                    className="hover:bg-gray-700/40 transition"
                  >
                    <td className="px-6 py-4 text-yellow-400 font-semibold">
                      {ticket.ticketIssueNo}
                    </td>

                    <td className="px-6 py-4 text-gray-300 whitespace-nowrap">
                      {new Date(ticket.createdAt).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-white">{ticket.vechileNo}</td>

                    <td className="px-6 py-4 text-gray-300">
                      {ticket.issueType}
                    </td>

                    <td className="px-6 py-4 text-gray-400 max-w-[200px] truncate">
                      {ticket.address}
                    </td>

                    <td className="px-6 py-4">
                      {getStatusBadge(ticket.issueStatus)}
                    </td>

                    {/* Action Button */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openModal(ticket)}
                        className="bg-yellow-600 text-gray-900 p-2 rounded-full hover:bg-yellow-500 transition shadow-lg"
                        title="View Details and Chat"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="py-6 text-center text-gray-400 text-lg"
                  >
                    <AlertCircle className="text-red-500 text-3xl inline-block mb-1" />{" "}
                    No {filter === "All" ? "" : filter} tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* TOTAL COUNT */}
        <div className="mt-6 text-gray-400 text-sm">
          Total Tickets:{" "}
          <span className="text-yellow-400 font-bold">{tickets.length}</span>
        </div>
      </div>

      {/* Render the Modal */}
      <TicketModal />

      {/* React Toastify Container */}
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default TicketListPage;