import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import { RefreshCw, Loader, ArrowLeft, MessageCircle, Send, CheckCircle, XCircle, Clock, Truck, FileText, MapPin, User, Tag, ListFilter } from "lucide-react";

// The endpoint for sending the chat message
const CHAT_SEND_API_URL = "https://api.websave.in/api/manufactur/chatBetweenManufacturAndDeler";
// The endpoint for fetching chat messages (NEW API)
const CHAT_FETCH_API_URL = "https://api.websave.in/api/manufactur/getAllMessagesBetweenUsers";
// The base endpoint for fetching tickets (assumed from the original code)
const TICKETS_LIST_API_URL = "https://api.websave.in/api/manufactur/getTicketIssuesListManufactur";

// Helper to replace window.alert
const Notification = ({ message, type, onClose }) => {
    if (!message) return null;

    const baseClasses = "fixed top-4 right-4 z-[100] p-4 rounded-lg shadow-xl text-white flex items-center space-x-3 transition-opacity duration-300";
    const typeClasses = type === 'error' ? 'bg-red-600' : 'bg-green-600';

    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [message, onClose]);

    return (
        <div className={`${baseClasses} ${typeClasses}`}>
            {type === 'error' ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            <span>{message}</span>
            <button onClick={onClose} className="ml-4 font-bold">×</button>
        </div>
    );
};

const App = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Separated filters for better control and UI
    const [statusFilter, setStatusFilter] = useState("All"); // All, Open, Resolved, Closed
    const [typeFilter, setTypeFilter] = useState("All");     // All, Dealer, Customer

    const [notification, setNotification] = useState(null);

    // Modal and Chat State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [chatSending, setChatSending] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);

    // Helper to get the token securely
    const getToken = () => localStorage.getItem("token");

    // --- API & Data Fetching ---

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        setNotification(null); // Clear previous notifications
        const token = getToken();

        try {
            const response = await axios.get(
                TICKETS_LIST_API_URL,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log(response.data)
            // Assuming response.data.ticketIssues is the array of tickets
            setTickets(response.data.ticketIssues.reverse() || []);
            setNotification({ message: "Tickets refreshed successfully.", type: "success" });
        } catch (err) {
            console.error("Error fetching tickets:", err);
            setNotification({ message: "Failed to load tickets. Check console for details.", type: "error" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    // Filter Tickets - Logic now combines status and type filters
    const filteredData = useMemo(() => {
        return tickets.filter((t) => {
            // 1. Status Filter
            if (statusFilter !== "All" && t.issueStatus !== statusFilter) {
                return false;
            }

            // 2. Type Filter (Dealer/Customer)
            if (typeFilter === "Dealer" && !t.delerTicketIssueId) {
                return false;
            }
            if (typeFilter === "Customer" && !t.coustmerTicketIssueId) {
                return false;
            }
            // If typeFilter is 'All', no action is needed
            
            return true;
        });
    }, [tickets, statusFilter, typeFilter]);

    // Helper to calculate count for tabs/segments
    const getCount = useCallback((filterType, value) => {
        if (filterType === 'status') {
            return tickets.filter(t => 
                (value === "All" || t.issueStatus === value) && 
                (typeFilter === "All" || (typeFilter === "Dealer" && !!t.delerTicketIssueId) || (typeFilter === "Customer" && !!t.coustmerTicketIssueId))
            ).length;
        } else if (filterType === 'type') {
             return tickets.filter(t => 
                (statusFilter === "All" || t.issueStatus === statusFilter) && 
                (value === "All" || (value === "Dealer" && !!t.delerTicketIssueId) || (value === "Customer" && !!t.coustmerTicketIssueId))
            ).length;
        }
        return 0; // Should not happen
    }, [tickets, statusFilter, typeFilter]);


    // --- Chat/Modal Handlers ---

    /**
     * @description Fetches the chat history using the new POST API endpoint.
     * @param {Object} ticket The selected ticket object.
     */
    const fetchMessages = useCallback(async (ticket) => {
        setChatLoading(true);
        setMessages([]); // Clear previous messages
        setNotification(null);
        
        const token = getToken();

        // 💡 UPDATED: Manufacturer ID is now taken from the ticket's delerTicketIssueId as requested.
        const currentManufacturerId = ticket.delerTicketIssueId; 

        // Determine the other user's ID (Dealer or Customer) for the chat API payload
        const otherUserId = ticket.delerTicketIssueId 
                            ? ticket.delerTicketIssueId 
                            : ticket.coustmerTicketIssueId
                            ? ticket.coustmerTicketIssueId
                            : null;

        if (!currentManufacturerId) {
            setChatLoading(false);
            return setNotification({ message: "Cannot load chat: Manufacturer ID (from ticket) is missing.", type: "error" });
        }

        if (!otherUserId) {
            setChatLoading(false);
            return setNotification({ message: "Cannot load chat: Other user ID is missing.", type: "error" });
        }

        const payload = {
            otherUserId: otherUserId,
            ticketIssueId: ticket._id,
        };

        try {
            // 🚀 REAL API CALL IMPLEMENTATION (POST request for fetching messages)
            const response = await axios.post(
                CHAT_FETCH_API_URL, 
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            // Assuming response.data.messages is an array of raw message objects.
            const rawMessages = response.data.messages || [];

            const formattedMessages = rawMessages.map(m => {
                // Determine if the message sender ID matches the logged-in Manufacturer ID
                const isManufacturer = m.senderId === currentManufacturerId;
                
                return {
                    id: m._id || Date.now() + Math.random(),
                    sender: isManufacturer ? "Manufacturer (You)" : "Dealer/Customer",
                    text: m.message,
                    // Use the 'timestamp' field from the API response
                    createdAt: m.timestamp || new Date(), 
                    ticketId: ticket._id,
                };
            });

            setMessages(formattedMessages);
            
        } catch (err) {
            console.error("Error fetching messages:", err.response?.data || err.message || err);
            setNotification({ message: `Failed to load chat history. ${err.response?.data?.message || ''}`, type: "error" });
            setMessages([]);
        } finally {
            setChatLoading(false);
        }
    }, []);

    /**
     * @description Sends a message to the chat API endpoint provided by the user.
     * @param {React.FormEvent} e 
     */
    const sendMessage = async (e) => {
        e.preventDefault(); // Prevents the input field from jumping
        if (!newMessage.trim() || !selectedTicket) return;

        setChatSending(true);
        setNotification(null);

        const token = getToken();
        const messageText = newMessage.trim();

        // Determine the receiver ID: prioritize Dealer ID, fall back to Customer ID
        const receiverId = selectedTicket.delerTicketIssueId 
                            ? selectedTicket.delerTicketIssueId 
                            : selectedTicket.coustmerTicketIssueId
                            ? selectedTicket.coustmerTicketIssueId
                            : null;
        
        if (!receiverId) {
            setChatSending(false);
            return setNotification({ message: "Cannot send message: Receiver ID is missing.", type: "error" });
        }

        const messagePayload = {
            receiverId: receiverId, 
            message: messageText,
            ticketIssueId: selectedTicket._id, // The main ticket ID
        };
        
        try {
            // 🚀 REAL API CALL IMPLEMENTATION (POST request for sending message)
            const response = await axios.post(
                CHAT_SEND_API_URL, 
                messagePayload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            // Optimistically add the new message to the chat window
            if (response.status === 200 || response.data.success) {
                 setMessages(prev => [...prev, {
                    id: Date.now(),
                    sender: "Manufacturer (You)", 
                    text: messageText,
                    createdAt: new Date(),
                    ticketId: selectedTicket._id
                }]);
                setNewMessage(""); // Clears input without causing focus loss
                setNotification({ message: "Message sent successfully.", type: "success" });
            } else {
                 throw new Error(response.data.message || "Failed to send message from API");
            }
        } catch (err) {
            console.error("Error sending message:", err.response?.data || err.message || err);
            setNotification({ message: `Failed to send message. ${err.response?.data?.message || ''}`, type: "error" });
        } finally {
            setChatSending(false);
        }
    };

    const updateTicketStatus = async (newStatus) => {
        if (!selectedTicket) return;

        setStatusUpdating(true);
        setNotification(null);

        const statusPayload = {
            ticketId: selectedTicket._id,
            newStatus: newStatus, // e.g., 'Resolved' or 'Closed'
        };

        try {
            // *** MOCK API CALL for STATUS UPDATE: REPLACE WITH YOUR ACTUAL STATUS UPDATE API ***
            await new Promise(resolve => setTimeout(resolve, 800));

            // Optimistically update local state and refresh the main list
            setSelectedTicket(prev => ({ ...prev, issueStatus: newStatus }));
            setTickets(prev => prev.map(t =>
                t._id === selectedTicket._id ? { ...t, issueStatus: newStatus } : t
            ));
            
            setNotification({ message: `Ticket #${selectedTicket.ticketIssueNo} marked as ${newStatus}.`, type: "success" });
            // *** END MOCK ***
        } catch (err) {
            console.error("Error updating status:", err);
            setNotification({ message: "Failed to update ticket status.", type: "error" });
        } finally {
            setStatusUpdating(false);
            fetchTickets();
        }
    };

    const openModal = (ticket) => {
        setSelectedTicket(ticket);
        setIsModalOpen(true);
        fetchMessages(ticket); // Pass the full ticket object
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedTicket(null);
        setMessages([]);
        setNewMessage("");
    };

    // --- Components ---

    const TicketModal = () => {
        if (!isModalOpen || !selectedTicket) return null;

        const isResolved = selectedTicket.issueStatus === "Resolved";
        const isOpen = selectedTicket.issueStatus === "Open";
        
        // Ref for managing chat scroll
        const messagesEndRef = useRef(null);

        // Effect to scroll to bottom on message update/load
        useEffect(() => {
            // Only scroll if the message list is populated and not currently loading chat history
            if (messagesEndRef.current && messages.length > 0 && !chatLoading) {
                // Smooth scroll to the latest message
                messagesEndRef.current.scrollTo({
                    top: messagesEndRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }
        // FIX: The scroll effect now depends only on messages.length and chatLoading status.
        // This prevents the scroll function from running repeatedly while the user types, 
        // as typing only changes the 'newMessage' state, not the 'messages' array length.
        }, [messages.length, chatLoading]);


        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40 p-4" onClick={closeModal}>
                <div
                    className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 scale-100"
                    onClick={(e) => e.stopPropagation()} // Prevent modal closing when clicking inside
                >
                    {/* Modal Header */}
                    <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-900">
                        <h2 className="text-xl font-bold text-indigo-400 flex items-center space-x-2">
                            <MessageCircle className="w-6 h-6" />
                            <span>Ticket Chat: #{selectedTicket.ticketIssueNo}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ml-4 ${
                                isOpen ? "bg-yellow-600/30 text-yellow-400" : (isResolved || selectedTicket.issueStatus === "Closed") ? "bg-green-600/30 text-green-400" : "bg-gray-600/30 text-gray-400"
                            }`}>
                                {selectedTicket.issueStatus}
                            </span>
                        </h2>
                        <button onClick={closeModal} className="text-gray-400 hover:text-white transition">
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Modal Body: Details + Chat Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                        {/* Details Card */}
                        <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <p className="flex items-center space-x-2"><Truck className="w-4 h-4 text-indigo-300"/><strong>Vehicle No:</strong> <span className="font-mono">{selectedTicket.vechileNo}</span></p>
                            <p className="flex items-center space-x-2"><Tag className="w-4 h-4 text-indigo-300"/><strong>Issue Type:</strong> {selectedTicket.issueType}</p>
                            <p className="flex items-center space-x-2"><Clock className="w-4 h-4 text-indigo-300"/><strong>Created:</strong> {new Date(selectedTicket.createdAt).toLocaleDateString()}</p>
                            <p className="md:col-span-3 flex items-start space-x-2"><FileText className="w-4 h-4 text-indigo-300 mt-1"/><strong>Description:</strong> {selectedTicket.issueDescription}</p>
                            <p className="md:col-span-3 flex items-start space-x-2"><MapPin className="w-4 h-4 text-indigo-300 mt-1"/><strong>Address:</strong> {selectedTicket.address}</p>
                            
                            {selectedTicket.delerTicketIssueId && 
                                <p className="col-span-1 text-sm flex items-center space-x-2 text-indigo-300">
                                    <User className="w-4 h-4"/><strong>Dealer ID:</strong> <span className="truncate">{selectedTicket.delerTicketIssueId}</span>
                                </p>
                            }
                            {selectedTicket.coustmerTicketIssueId && 
                                <p className="col-span-1 text-sm flex items-center space-x-2 text-indigo-300">
                                    <User className="w-4 h-4"/><strong>Customer ID:</strong> <span className="truncate">{selectedTicket.coustmerTicketIssueId}</span>
                                </p>
                            }
                        </div>

                        {/* Chat Window Container */}
                        <div className="flex flex-col h-[50vh] bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                            <h3 className="text-lg font-semibold mb-3 text-indigo-300">Conversation</h3>
                            
                            {/* Chat Messages Area */}
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-2" ref={messagesEndRef}>
                                {chatLoading ? (
                                    <div className="flex justify-center items-center h-full">
                                        <Loader className="w-6 h-6 text-indigo-400 animate-spin" />
                                    </div>
                                ) : (
                                    messages.length > 0 ? (
                                        messages.map((msg, index) => (
                                            // 1. REVERSED ALIGNMENT: Manufacturer (You) -> LEFT, Dealer/Customer -> RIGHT
                                            <div key={index} className={`flex ${msg.sender.includes("Manufacturer") ? 'justify-start' : 'justify-end'}`}>
                                                <div className={`max-w-xs md:max-w-md p-3 rounded-xl shadow-md ${
                                                    // 2. REVERSED COLOR/SHAPE:
                                                    msg.sender.includes("Manufacturer")
                                                        ? 'bg-gray-700 text-gray-100 rounded-tl-none' // Manufacturer (You) sends -> LEFT (Gray)
                                                        : 'bg-indigo-600 text-white rounded-br-none' // Dealer/Customer sends -> RIGHT (Indigo)
                                                }`}>
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
                                    )
                                )}
                            </div>

                            {/* Message Input Form (Stable position) */}
                            <form onSubmit={sendMessage} className="pt-4 flex space-x-3 border-t border-gray-700 mt-4 flex-shrink-0">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={isOpen ? "Type your message..." : "Ticket is closed, cannot send messages."}
                                    className="flex-1 p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-none"
                                    disabled={chatSending || !isOpen}
                                    autoFocus // Attempt to keep focus when modal opens
                                />
                                <button
                                    type="submit"
                                    className="bg-indigo-600 px-4 py-3 rounded-lg text-white hover:bg-indigo-700 transition disabled:bg-indigo-400 flex items-center justify-center"
                                    disabled={chatSending || !newMessage.trim() || !isOpen}
                                >
                                    {chatSending ? (
                                        <Loader className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            </form>
                            {!isOpen && (
                                <p className="text-center text-sm text-red-400 mt-2">
                                    This ticket is not open. You cannot send new messages or update the status.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Modal Footer: Action Buttons */}
                    <div className="p-5 border-t border-gray-700 flex justify-end space-x-3 bg-gray-900">
                        {isOpen && (
                            <>
                                <button
                                    onClick={() => updateTicketStatus("Resolved")}
                                    className="flex items-center space-x-2 bg-green-600 px-4 py-2 rounded-lg text-white hover:bg-green-700 transition disabled:opacity-50"
                                    disabled={statusUpdating}
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>{statusUpdating ? 'Updating...' : 'Mark as Resolved'}</span>
                                </button>
                                <button
                                    onClick={() => updateTicketStatus("Closed")}
                                    className="flex items-center space-x-2 bg-red-600 px-4 py-2 rounded-lg text-white hover:bg-red-700 transition disabled:opacity-50"
                                    disabled={statusUpdating}
                                >
                                    <XCircle className="w-4 h-4" />
                                    <span>{statusUpdating ? 'Updating...' : 'Mark as Closed'}</span>
                                </button>
                            </>
                        )}
                        <button onClick={closeModal} className="bg-gray-700 px-4 py-2 rounded-lg text-white hover:bg-gray-600 transition">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Card Component for the Grid View (unchanged)
    const TicketCard = ({ ticket, openModal }) => {
        const getStatusClasses = (status) => {
            switch (status) {
                case "Open":
                    return "bg-yellow-600/30 text-yellow-400";
                case "Resolved":
                    return "bg-green-600/30 text-green-400";
                case "Closed":
                    return "bg-red-600/30 text-red-400";
                default:
                    return "bg-gray-600/30 text-gray-400";
            }
        };

        return (
            <div className="bg-gray-800 p-6 rounded-xl shadow-xl flex flex-col border border-gray-700 hover:shadow-indigo-500/30 transition duration-300">
                
                {/* Header (Ticket No & Status) */}
                <div className="flex justify-between items-start mb-4 border-b border-gray-700/50 pb-3">
                    <h3 className="text-xl font-bold text-indigo-400">
                        Ticket #{ticket.ticketIssueNo}
                    </h3>
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusClasses(ticket.issueStatus)}`}
                    >
                        {ticket.issueStatus}
                    </span>
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm flex-1">
                    <p className="flex items-center space-x-2 text-gray-300">
                        <Truck className="w-4 h-4 text-indigo-300"/> 
                        <strong className="text-gray-400">Vehicle:</strong> {ticket.vechileNo}
                    </p>
                    <p className="flex items-center space-x-2 text-gray-300">
                        <Tag className="w-4 h-4 text-indigo-300"/> 
                        <strong className="text-gray-400">Type:</strong> {ticket.issueType}
                    </p>
                    <p className="flex items-center space-x-2 text-gray-300">
                        <Clock className="w-4 h-4 text-indigo-300"/> 
                        <strong className="text-gray-400">Date:</strong> {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-gray-300 pt-2">
                        <strong className="text-gray-400 block mb-1">Description:</strong>
                        <span className="line-clamp-2 text-xs">{ticket.issueDescription}</span>
                    </p>
                    <p className="text-gray-300">
                        <strong className="text-gray-400 block mb-1">Address:</strong>
                        <span className="line-clamp-1 text-xs">{ticket.address}</span>
                    </p>
                </div>

                {/* Action Button */}
                <div className="mt-5 pt-4 border-t border-gray-700/50">
                    <button
                        onClick={() => openModal(ticket)}
                        className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition font-medium shadow-md shadow-indigo-600/40"
                        title="View Details and Chat"
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span>View Chat & Details</span>
                    </button>
                </div>
            </div>
        );
    };


    return (
        <div className="min-h-screen bg-gray-900 p-6 text-white font-inter">
            {/* Notification System */}
            <Notification
                message={notification?.message}
                type={notification?.type}
                onClose={() => setNotification(null)}
            />

            {/* Loader Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <Loader className="w-10 h-10 text-indigo-400 animate-spin" />
                </div>
            )}

            {/* Header and Controls */}
            <div className="mb-8 p-4 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0 mb-4">
                    <h1 className="text-3xl font-extrabold text-indigo-400">Ticket Issues Dashboard</h1>
                    
                    <div className="flex space-x-3">
                        <button
                            onClick={fetchTickets}
                            className="flex items-center space-x-2 bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-medium shadow-md"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Refresh Tickets</span>
                        </button>
                        
                         <a
                            href="/manufacturer/dashboard"
                            className="bg-gray-700 text-indigo-300 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 flex items-center space-x-2 border border-gray-600"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Dashboard</span>
                        </a>
                    </div>
                </div>

                {/* --- Main Status Tabs --- */}
                <div className="flex border-b border-gray-700 space-x-2 overflow-x-auto pb-1 mb-4">
                    {["All", "Open", "Resolved", "Closed"].map((st) => {
                        const count = getCount('status', st);
                        return (
                            <button
                                key={st}
                                onClick={() => setStatusFilter(st)}
                                className={`flex-shrink-0 px-4 py-2 text-sm font-semibold transition border-b-2 ${
                                    statusFilter === st
                                        ? "text-indigo-400 border-indigo-500"
                                        : "text-gray-400 border-transparent hover:text-white hover:border-gray-500"
                                }`}
                            >
                                {st} <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                                     count > 0 ? "bg-indigo-700/50 text-indigo-200" : "bg-gray-700 text-gray-400"
                                }`}>{count}</span>
                            </button>
                        );
                    })}
                </div>

                {/* --- Secondary Type Filter (Segmented Control) --- */}
                <div className="flex items-center space-x-4 pt-3">
                    <ListFilter className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-400 hidden sm:inline">Filter By Origin:</span>
                    <div className="flex bg-gray-700/50 p-1 rounded-lg space-x-1">
                        {["All", "Dealer", "Customer"].map((type) => {
                            const count = getCount('type', type);
                            return (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                                        typeFilter === type
                                            ? "bg-indigo-600 text-white shadow-md"
                                            : "text-gray-300 hover:bg-gray-700"
                                    }`}
                                >
                                    {type} ({count})
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Ticket List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading && tickets.length === 0 ? (
                    <p className="text-indigo-400 text-center col-span-full">Loading tickets...</p>
                ) : filteredData.length === 0 ? (
                    <p className="text-gray-400 text-center col-span-full p-8 bg-gray-800 rounded-xl">
                        No tickets match the current filters.
                    </p>
                ) : (
                    filteredData.map((ticket) => (
                        <TicketCard key={ticket._id} ticket={ticket} openModal={openModal} />
                    ))
                )}
            </div>

            {/* Chat Modal */}
            <TicketModal />
        </div>
    );
};
export default App;