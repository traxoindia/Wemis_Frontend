// ManufactureDashboard.jsx
import React, { useState, useEffect } from "react";
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
  TrendingUp,
  AlertCircle,
  Activity,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  Search,
  ChevronRight,
} from "lucide-react";
import ManufactureNavbar from "./ManufactureNavbar";
import { useLocation } from "react-router-dom";

const ManufactureDashboard = () => {
  const location = useLocation();
  const [activeRoute, setActiveRoute] = useState("Dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  // Extract route from URL
  useEffect(() => {
    const path = location.pathname;
    console.log('Current path:', path);
    
    // Map URL paths to route names
    const routeMap = {
      '/manufacturer/dashboard': 'Dashboard',
      '/manufacturer/reports': 'Reports',
      '/manufacturer/barcode': 'Barcode',
      '/manufacturer/subscription': 'Subscription',
      '/manufacturer/members': 'Members',
      '/manufacturer/manage-device': 'Manage Device',
    };
    
    // Find matching route or use default
    const matchedRoute = Object.entries(routeMap).find(([pathPattern]) => 
      path.includes(pathPattern.replace('/manufacturer/', ''))
    );
    
    if (matchedRoute) {
      setActiveRoute(matchedRoute[1]);
    } else {
      // Try to extract route name from path
      const routeName = path.split('/').pop();
      if (routeName) {
        // Capitalize first letter of each word
        const formattedName = routeName
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        setActiveRoute(formattedName);
      }
    }
  }, [location.pathname]);

  // Or simpler approach if routes are hardcoded:
  // const getRouteFromPath = (path) => {
  //   if (path.includes('dashboard')) return 'Dashboard';
  //   if (path.includes('reports')) return 'Reports';
  //   if (path.includes('barcode')) return 'Barcode';
  //   if (path.includes('subscription')) return 'Subscription';
  //   if (path.includes('members')) return 'Members';
  //   if (path.includes('manage-device') || path.includes('manage_device')) return 'Manage Device';
  //   return 'Dashboard';
  // };

  // Updated navbar handler
  const handleNavbarRouteChange = (route) => {
    console.log('Navbar changing route to:', route);
    setActiveRoute(route);
    // You might also want to update the URL here
    // navigate(`/manufacturer/${route.toLowerCase().replace(' ', '-')}`);
  };

  // Debug: Log route changes
  useEffect(() => {
    console.log('Active route changed to:', activeRoute);
  }, [activeRoute]);

  // ✅ Enhanced Stat Card Component
  const StatCard = ({ title, value, icon, trend, change, status }) => (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-800 hover:border-yellow-500/50 hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/10 group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 bg-gray-800/50 rounded-lg group-hover:bg-yellow-500/10 transition-colors">
          <div className="text-yellow-400">{icon}</div>
        </div>
        {trend && (
          <div className={`text-xs font-medium px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {change}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {status && (
          <div className={`inline-flex items-center mt-2 text-xs px-2 py-1 rounded-full ${status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
            {status === 'active' ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 mr-1" />
                Inactive
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ✅ Progress Card Component
  const ProgressCard = ({ title, value, maxValue, color }) => (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-800">
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm font-medium text-gray-300">{title}</p>
        <span className="text-xs text-gray-400">{value}/{maxValue}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${(value / maxValue) * 100}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-2">{((value / maxValue) * 100).toFixed(1)}% Utilization</p>
    </div>
  );

  // ✅ Activity Item Component
  const ActivityItem = ({ icon, title, description, time, status }) => (
    <div className="flex items-start p-4 hover:bg-gray-800/30 rounded-xl transition-colors group">
      <div className="p-2 bg-gray-800 rounded-lg mr-4 group-hover:bg-yellow-500/10">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-white">{title}</p>
        <p className="text-sm text-gray-400 mt-1">{description}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-500">{time}</p>
        {status && (
          <span className={`inline-block mt-1 w-2 h-2 rounded-full ${status === 'success' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
        )}
      </div>
    </div>
  );

  // ✅ Device Status Card Component
  const DeviceStatusCard = ({ type, count, color, icon }) => (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        <span className="text-2xl font-bold text-white">{count}</span>
      </div>
      <p className="text-sm text-gray-300">{type}</p>
      <p className="text-xs text-gray-500 mt-1">Devices</p>
    </div>
  );

  // ✅ Enhanced Dashboard Content
  const renderDashboard = () => (
    <div className="p-6 space-y-8">
      {/* Debug Banner - Remove after confirming */}
      

      {/* Header with Search and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Manufacturing Dashboard</h1>
          <p className="text-gray-400 mt-2">Real-time overview of production and device status</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search devices, distributors..."
              className="pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent w-full md:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="px-4 py-2.5 bg-yellow-500 text-black font-medium rounded-xl hover:bg-yellow-600 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="px-4 py-2.5 border border-gray-700 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* KPI Grid - Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Production"
          value="2,847"
          icon={<Package className="w-6 h-6 text-yellow-400" />}
          trend="up"
          change="12.5"
        />
        <StatCard
          title="Active Devices"
          value="1,892"
          icon={<Activity className="w-6 h-6 text-green-400" />}
          trend="up"
          change="8.2"
          status="active"
        />
        <StatCard
          title="Allocation Rate"
          value="94.2%"
          icon={<TrendingUp className="w-6 h-6 text-blue-400" />}
          trend="up"
          change="3.1"
        />
        <StatCard
          title="Issues Detected"
          value="12"
          icon={<AlertCircle className="w-6 h-6 text-red-400" />}
          trend="down"
          change="15.3"
        />
      </div>

      {/* Middle Section - Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Distribution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Distribution Stats */}
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Distribution Overview</h2>
              <button className="text-sm text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Distributors"
                value="24"
                icon={<Users className="w-6 h-6 text-blue-400" />}
              />
              <StatCard
                title="Dealers"
                value="156"
                icon={<UserCheck className="w-6 h-6 text-green-400" />}
              />
              <StatCard
                title="Technicians"
                value="48"
                icon={<Settings className="w-6 h-6 text-purple-400" />}
              />
              <StatCard
                title="Total Devices"
                value="2,847"
                icon={<Package className="w-6 h-6 text-yellow-400" />}
              />
            </div>
          </div>

          {/* Device Status */}
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-6">Device Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DeviceStatusCard
                type="In Stock"
                count="0"
                color="bg-blue-500/20"
                icon={<Layers className="w-6 h-6 text-blue-400" />}
              />
              <DeviceStatusCard
                type="Allocated"
                count="2,432"
                color="bg-green-500/20"
                icon={<ClipboardList className="w-6 h-6 text-green-400" />}
              />
              <DeviceStatusCard
                type="Mapped"
                count="1,892"
                color="bg-yellow-500/20"
                icon={<MapPin className="w-6 h-6 text-yellow-400" />}
              />
              <DeviceStatusCard
                type="Renewal"
                count="N/A"
                color="bg-purple-500/20"
                icon={<RefreshCw className="w-6 h-6 text-purple-400" />}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Progress & Activity */}
        <div className="space-y-6">
          {/* Progress Indicators */}
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-6">Production Progress</h2>
            <div className="space-y-5">
              <ProgressCard
                title="Monthly Allocation"
                value={0}
                maxValue={500}
                color="bg-yellow-500"
              />
              <ProgressCard
                title="Monthly Mapping"
                value={0}
                maxValue={500}
                color="bg-blue-500"
              />
              <ProgressCard
                title="Device Utilization"
                value={1892}
                maxValue={2847}
                color="bg-green-500"
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-1">
              <ActivityItem
                icon={<Package className="w-5 h-5 text-yellow-400" />}
                title="New Device Batch"
                description="50 devices added to inventory"
                time="2 hours ago"
                status="success"
              />
              <ActivityItem
                icon={<MapPin className="w-5 h-5 text-blue-400" />}
                title="Device Mapping"
                description="12 devices mapped to locations"
                time="4 hours ago"
                status="success"
              />
              <ActivityItem
                icon={<AlertCircle className="w-5 h-5 text-red-400" />}
                title="Maintenance Alert"
                description="3 devices require service"
                time="1 day ago"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Detailed Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today Allocated"
          value="0"
          icon={<Calendar className="w-6 h-6 text-purple-400" />}
        />
        <StatCard
          title="This Month Allocated"
          value="0"
          icon={<BarChart3 className="w-6 h-6 text-green-400" />}
        />
        <StatCard
          title="Today Mapped"
          value="0"
          icon={<MapPin className="w-6 h-6 text-blue-400" />}
        />
        <StatCard
          title="Upcoming Renewals"
          value="N/A"
          icon={<Clock className="w-6 h-6 text-yellow-400" />}
        />
      </div>

      {/* Quick Actions Footer */}
      <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-white">Quick Actions</h3>
            <p className="text-gray-400 text-sm">Common tasks and operations</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
            <button className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl transition-colors flex items-center gap-2">
              <Package className="w-4 h-4" />
              Add Device Batch
            </button>
            <button className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ✅ Updated renderContent to handle different route formats
  const renderContent = () => {
    console.log('renderContent called with route:', activeRoute);
    
    // Normalize route name for comparison
    const normalizedRoute = activeRoute.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    switch (true) {
      case normalizedRoute.includes('dashboard'):
        return renderDashboard();

      case normalizedRoute.includes('report'):
        return (
          <div className="p-6">
            <h1 className="text-3xl font-bold text-white mb-6">📊 Reports & Analytics</h1>
            {/* Reports content */}
          </div>
        );

      case normalizedRoute.includes('barcode'):
        return (
          <div className="p-6">
            <h1 className="text-3xl font-bold text-white mb-6">📦 Barcode Management</h1>
            {/* Barcode content */}
          </div>
        );

      case normalizedRoute.includes('subscription'):
        return (
          <div className="p-6">
            <h1 className="text-3xl font-bold text-white mb-6">💳 Subscription Management</h1>
            {/* Subscription content */}
          </div>
        );

      case normalizedRoute.includes('member'):
        return (
          <div className="p-6">
            <h1 className="text-3xl font-bold text-white mb-6">👥 Members Management</h1>
            {/* Members content */}
          </div>
        );

      case normalizedRoute.includes('managedevice') || normalizedRoute.includes('manage-device'):
        return (
          <div className="p-6">
            <h1 className="text-3xl font-bold text-white mb-6">⚙️ Device Management</h1>
            {/* Manage Device content */}
          </div>
        );

      default:
        // Try to parse URL path
        const path = location.pathname;
        if (path.includes('dashboard')) {
          setActiveRoute('Dashboard');
          return renderDashboard();
        }
        
        return (
          <div className="p-6">
            <div className="bg-red-500/20 border border-red-500 rounded-xl p-4">
              <h2 className="text-xl font-bold text-white">⚠️ Route Mapping Issue</h2>
              <p className="text-white">Active Route: "{activeRoute}"</p>
              <p className="text-white">Path: "{location.pathname}"</p>
              <p className="text-gray-300">Normalized: "{normalizedRoute}"</p>
              <button 
                onClick={() => setActiveRoute('Dashboard')}
                className="mt-4 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600"
              >
                Force Load Dashboard
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white flex flex-col">
      <ManufactureNavbar
        activeRoute={activeRoute}
        setActiveRoute={handleNavbarRouteChange}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
        
        {/* Status Bar */}
        <div className="border-t border-gray-800 bg-black/50 backdrop-blur-sm px-6 py-3 shrink-0">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                System Operational
              </span>
              <span>Last updated: Just now</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Devices: 2,847</span>
              <span>Users: 228</span>
              <span>API Status: <span className="text-green-400">✓</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManufactureDashboard;