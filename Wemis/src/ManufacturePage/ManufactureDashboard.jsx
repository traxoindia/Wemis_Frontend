// ManufactureDashboard.jsx
import React, { useState } from "react";
import {
  Users,
  UserCheck,
  Settings,
  Package,
  MapPin,
  Calendar,
  BarChart3,
  RefreshCw,
  ClipboardList,
  Layers,
  Clock,
} from "lucide-react";
import ManufactureNavbar from "./ManufactureNavbar";

const ManufactureDashboard = () => {
  const [activeRoute, setActiveRoute] = useState("Dashboard");

  // ✅ Stat Card Component
  const StatCard = ({ title, value, icon }) => (
    <div className="bg-black rounded-xl p-6 flex items-center justify-between min-h-[120px] border border-yellow-500/40 hover:shadow-lg hover:shadow-yellow-500/20 transition">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-300 mb-3">{title}</h3>
        <p className="text-2xl font-bold text-yellow-400">{value}</p>
      </div>
      <div className="ml-4">{icon}</div>
    </div>
  );

  // ✅ Render Content based on route
  const renderContent = () => {
    switch (activeRoute) {
      case "Dashboard":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-medium text-yellow-400 mb-8">
              Status Dashboard
            </h1>

            {/* ✅ Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard
                title="Total Distributor"
                value="2"
                icon={<Users className="w-10 h-10 text-yellow-400" />}
              />
              <StatCard
                title="Total Dealer"
                value="N/A"
                icon={<UserCheck className="w-10 h-10 text-yellow-400" />}
              />
              <StatCard
                title="Total Technician"
                value="4"
                icon={<Settings className="w-10 h-10 text-yellow-400" />}
              />
              <StatCard
                title="Total Device"
                value="21"
                icon={<Package className="w-10 h-10 text-yellow-400" />}
              />
              <StatCard
                title="Total Device in Stock"
                value="0"
                icon={<Layers className="w-10 h-10 text-yellow-400" />}
              />
              <StatCard
                title="Total Allocated Devices"
                value="0"
                icon={<ClipboardList className="w-10 h-10 text-yellow-400" />}
              />
              <StatCard
                title="Today Allocated Devices"
                value="0"
                icon={<Calendar className="w-10 h-10 text-yellow-400" />}
              />
              <StatCard
                title="This Month Allocated Devices"
                value="0"
                icon={<BarChart3 className="w-10 h-10 text-yellow-400" />}
              />
              <StatCard
                title="Total Map Devices"
                value="2"
                icon={<MapPin className="w-10 h-10 text-yellow-400" />}
              />
              <StatCard
                title="Today Map Devices"
                value="0"
                icon={<Calendar className="w-10 h-10 text-yellow-400" />}
              />
              <StatCard
                title="This Month Map Devices"
                value="0"
                icon={<BarChart3 className="w-10 h-10 text-yellow-400" />}
              />
              <StatCard
                title="Total Renewal Devices"
                value="N/A"
                icon={<RefreshCw className="w-10 h-10 text-yellow-400" />}
              />
              <StatCard
                title="Total Renewed Devices"
                value="N/A"
                icon={<RefreshCw className="w-10 h-10 text-yellow-400" />}
              />
              <StatCard
                title="Upcoming Renew Devices"
                value="N/A"
                icon={<Clock className="w-10 h-10 text-yellow-400" />}
              />
            </div>
          </div>
        );

      case "Reports":
        return <div className="p-6 text-yellow-400">📊 Reports Section</div>;
      case "Barcode":
        return <div className="p-6 text-yellow-400">📦 Barcode Section</div>;
      case "Subscription":
        return <div className="p-6 text-yellow-400">💳 Subscription Section</div>;
      case "Members":
        return <div className="p-6 text-yellow-400">👥 Members Section</div>;
      case "Manage Device":
        return <div className="p-6 text-yellow-400">⚙️ Manage Device Section</div>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <ManufactureNavbar
        activeRoute={activeRoute}
        setActiveRoute={setActiveRoute}
      />
      <main className="flex-1">{renderContent()}</main>
    </div>
  );
};

export default ManufactureDashboard;
