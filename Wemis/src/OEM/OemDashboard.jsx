import React from 'react';
import OemNavbar from './OemNavbar';
import { MoreVertical, ExternalLink } from 'lucide-react';

function OemDashboard() {
  // Simple flat stats data
  const stats = [
    { label: "Active Barcodes", value: "1,250" },
    { label: "Sub-Dealers", value: "24" },
    { label: "Monthly Revenue", value: "₹45,000" },
    { label: "Pending Requests", value: "12" },
  ];

  // Dummy table data
  const recentActivities = [
    { id: "TXN-9021", dealer: "Apex Solutions", type: "Barcode Allocation", status: "Completed", date: "2024-05-20" },
    { id: "TXN-9022", dealer: "Global Tech", type: "Warranty Claim", status: "Pending", date: "2024-05-19" },
    { id: "TXN-9023", dealer: "Sri Sai Enterprises", type: "Activation", status: "Completed", date: "2024-05-18" },
    { id: "TXN-9024", dealer: "Modern Traders", type: "Rollback", status: "Rejected", date: "2024-05-18" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <OemNavbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Simplified Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">OEM Overview</h1>
          <p className="text-sm text-gray-500">Monitor your inventory and dealer network activities.</p>
        </div>

        {/* Minimalist Stat Bar (No colors, white background) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white border border-gray-200 p-5 rounded-md shadow-sm">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Activity Table (Clean White Design) */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">Recent Transactions</h2>
            <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View All <ExternalLink size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium border-b border-gray-100">ID</th>
                  <th className="px-6 py-3 font-medium border-b border-gray-100">Dealer Name</th>
                  <th className="px-6 py-3 font-medium border-b border-gray-100">Type</th>
                  <th className="px-6 py-3 font-medium border-b border-gray-100">Status</th>
                  <th className="px-6 py-3 font-medium border-b border-gray-100">Date</th>
                  <th className="px-6 py-3 font-medium border-b border-gray-100">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                {recentActivities.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-500">{row.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{row.dealer}</td>
                    <td className="px-6 py-4">{row.type}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[11px] font-bold uppercase ${
                        row.status === 'Completed' ? 'bg-green-50 text-green-600' : 
                        row.status === 'Pending' ? 'bg-yellow-50 text-yellow-600' : 
                        'bg-red-50 text-red-600'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{row.date}</td>
                    <td className="px-6 py-4">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OemDashboard;