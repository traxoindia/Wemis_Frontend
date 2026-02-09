import React from 'react'

export default function DealerDashboardOem() {
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar Navbar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6 text-xl font-bold border-b">OEM Dealer</div>
        <nav className="p-4 space-y-3">
          <NavItem label="Dashboard" />
          <NavItem label="Reports" />
          <NavItem label="Settings" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold mb-6">Dealer Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Dealers" value="128" />
          <StatCard title="Active Orders" value="42" />
          <StatCard title="Pending Requests" value="9" />
        </div>
      </main>
    </div>
  )
}

function NavItem({ label }) {
  return (
    <div className="px-4 py-2 rounded-lg cursor-pointer text-gray-600 hover:bg-gray-100 hover:text-black">
      {label}
    </div>
  )
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  )
}
