import React, { useState } from 'react';
import Navbar from './Navbar';
import CustomerDashboard from './CustomerDashboard';

// Adjust path as needed

function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Integrated Navbar */}
      <Navbar setIsModalOpen={setIsModalOpen} />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Customer Overview</h1>
          <p className="text-sm text-gray-500">Welcome back to your sentinel tracking panel.</p>
        </header>

        {/* Dashboard Grid Placeholder */}
        <div className="">
        
          <CustomerDashboard/>
        </div>

        {/* Raise Ticket Modal Placeholder */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl w-96 shadow-2xl">
              <h2 className="text-xl font-bold mb-4">Raise Support Ticket</h2>
              <textarea className="w-full border p-2 rounded-lg mb-4" rows="4" placeholder="Describe your issue..."></textarea>
              <div className="flex gap-2">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold">Cancel</button>
                <button className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold">Submit</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;