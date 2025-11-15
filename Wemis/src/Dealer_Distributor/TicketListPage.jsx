import React, { useState } from 'react';
import { FaTicketAlt, FaClock, FaCheckCircle, FaExclamationCircle, FaFolderOpen, FaEye } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';


// Mock Data for Tickets
const mockTickets = [
  { id: 'TKT-001', subject: 'Device Mapped, but location not updating', category: 'DeviceMapping', status: 'Open', priority: 'High', date: '2025-11-14' },
  { id: 'TKT-002', subject: 'Recharge amount deducted but not credited', category: 'WalletIssue', status: 'Pending', priority: 'High', date: '2025-11-13' },
  { id: 'TKT-003', subject: 'Technician access login issue', category: 'Technical', status: 'Closed', priority: 'Medium', date: '2025-11-10' },
  { id: 'TKT-004', subject: 'Renewal due date inquiry for VIN 12345', category: 'Renewal', status: 'Open', priority: 'Low', date: '2025-11-08' },
  { id: 'TKT-005', subject: 'Inaccurate stock count reported', category: 'Other', status: 'Closed', priority: 'Medium', date: '2025-11-05' },
  { id: 'TKT-006', subject: 'Cannot assign device to technician', category: 'DeviceMapping', status: 'Pending', priority: 'High', date: '2025-11-01' },
];


// Helper function to get status badge styling
const getStatusBadge = (status) => {
  let colorClass = '';
  let icon = null;
  switch (status) {
    case 'Open':
      colorClass = 'bg-red-600 text-white';
      icon = <FaFolderOpen className="mr-1" />;
      break;
    case 'Pending':
      colorClass = 'bg-yellow-500 text-gray-900';
      icon = <FaClock className="mr-1" />;
      break;
    case 'Closed':
      colorClass = 'bg-green-600 text-white';
      icon = <FaCheckCircle className="mr-1" />;
      break;
    default:
      colorClass = 'bg-gray-500 text-white';
  }
  return <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${colorClass}`}>{icon}{status}</span>;
};

// Helper function to get priority badge styling
const getPriorityBadge = (priority) => {
    let colorClass = '';
    switch (priority) {
        case 'High':
            colorClass = 'text-red-400 font-bold';
            break;
        case 'Medium':
            colorClass = 'text-yellow-400 font-semibold';
            break;
        case 'Low':
            colorClass = 'text-green-400 font-normal';
            break;
        default:
            colorClass = 'text-gray-400';
    }
    return <span className={`text-xs ${colorClass}`}>{priority}</span>;
};


const TicketListPage = () => {
  const [tickets, setTickets] = useState(mockTickets);
  const [filter, setFilter] = useState('All');

  const filteredTickets = tickets.filter(ticket => 
    filter === 'All' || ticket.status === filter
  );


   const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="mb-8 pb-3 border-b border-gray-800 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <FaTicketAlt className="text-yellow-500" /> My Support <span className="text-yellow-500">Tickets</span>
          </h1>
          {/* Note: This button assumes you have a way to open the RaiseTicketModal 
             from this page, likely passed as a prop from the main App component 
             or via global state. For simplicity, this example just logs a message. */}
           <button
      onClick={() => navigate("/distributor/dealer/dashboard")}
      className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-green-500 transition-colors shadow-md"
    >
      <FaTicketAlt /> Raise New Ticket
    </button>
        </header>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3 items-center">
          <span className="text-sm font-medium text-gray-400 mr-2">Filter by Status:</span>
          {['All', 'Open', 'Pending', 'Closed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors duration-200 ${
                filter === status 
                ? 'bg-yellow-500 text-gray-900 shadow-lg' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Ticket Table */}
        <div className="bg-gray-800 rounded-xl shadow-2xl overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                {['Ticket ID', 'Date Raised', 'Subject', 'Category', 'Priority', 'Status', 'Actions'].map(header => (
                  <th
                    key={header}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((ticket, index) => (
                  <tr key={ticket.id} className="bg-gray-800 hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-yellow-400">
                      {ticket.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {ticket.date}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-sm text-white">
                      {ticket.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {ticket.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(ticket.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {/* Placeholder for viewing details - change 'view-ticket' path as needed */}
                      <Link 
                        to={`/dealer/tickets/${ticket.id}`} 
                        className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1"
                      >
                        <FaEye /> Details
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-6 text-center text-base text-gray-400">
                    <FaExclamationCircle className="inline-block mr-2 text-2xl text-red-500" />
                    No **{filter === 'All' ? '' : filter}** tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TicketListPage;