import React, { useState, useEffect, useCallback } from "react";
// Lucide Icons
import {
  X,
  Menu,
  MapPin,
  Package,
  FileText,
  User,
  Smartphone,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  SquareCheckBig,
  SquarePen,
  FileTextIcon,
  Eye,
} from "lucide-react";
// 🎯 NEW: Import navigation tools from react-router-dom
import { useNavigate, useLocation } from "react-router-dom";
import DealerNavbar from "./DealerNavbar";
import MappedDeviceList from "./MappedDeviceList";

// =========================================================
// 1. PLACEHOLDER COMPONENTS & UTILITIES
// =========================================================

const ToastNotification = ({ message, type, onClose }) => {
  if (!type || !message) return null;

  const styleMap = {
    success: {
      bgColor: "bg-green-600/95",
      borderColor: "border-green-400",
      icon: <CheckCircle size={24} />,
      textColor: "text-white",
    },
    error: {
      bgColor: "bg-red-600/95",
      borderColor: "border-red-400",
      icon: <XCircle size={24} />,
      textColor: "text-white",
    },
  };

  const { bgColor, borderColor, icon, textColor } = styleMap[type];

  return (
    <div className="fixed top-5 right-5 z-[100] p-4">
      <div
        className={`flex items-center gap-3 p-4 rounded-lg shadow-2xl border ${bgColor} ${borderColor} backdrop-blur-sm transform transition-all duration-300 ease-out animate-slideIn`}
      >
        <div className={`flex-shrink-0 ${textColor}`}>{icon}</div>
        <div className="flex-grow">
          <p className={`font-semibold ${textColor}`}>
            {type === "success" ? "Success" : "Error"}
          </p>
          <p className="text-sm text-gray-100">{message}</p>
        </div>
        <button
          onClick={onClose}
          className={`ml-4 ${textColor} hover:text-gray-200 transition-colors`}
        >
          <X size={20} />
        </button>
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn { animation: slideIn 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

// Helper Component for Package Details
const PackageDetailItem = ({ label, value }) => (
  <div className="border-b border-yellow-500/20 pb-2">
    <p className="font-semibold text-yellow-300/70 text-xs uppercase tracking-wide">
      {label}
    </p>
    <p className="text-yellow-100 break-words mt-1">{value || "N/A"}</p>
  </div>
);

// --- API Configuration (Included for completeness, values are mock/placeholders) ---
const FETCH_PLANS_API =
  "https://api.websave.in/api/manufactur/fetchDistributorOrOemReceivedActivationWallets";
const SUBMIT_API = "https://api.websave.in/api/manufactur/delerMapDevice";
const FETCH_MAPPED_DEVICES_API =
  "https://api.websave.in/api/manufactur/fetchDelerMapDevices";
const API_URL_BARCODE_LIST =
  "https://api.websave.in/api/manufactur/getAllBarcodeListByCurrentDeler";

const COUNTRIES = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
];

const INDIA_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];
// --- End of Utilities ---

// =========================================================
// 2. MAPPED DEVICES TABLE COMPONENT (Updated for Navigation)
// =========================================================

const DelerMapDevicesTable = ({ openEditModal, openViewModal }) => {
  // 🎯 NEW: Initialize navigate hook
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "descending",
  });
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedDevices, setSelectedDevices] = useState([]);

  const fetchMappedDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") || "mock-token";
      if (!token || token === "mock-token")
        throw new Error("Authentication token not found or is mock.");

      // MOCK DATA for consistent display as per the screenshot example
      const mockData = {
        delMapDevice: [
          {
            _id: "6563728f323a7e0d37e3d120",
            vechileNo: "OD01KK3232",
            deviceNo: "862567077024912",
            fullName: "ASHOK KUMAR DE",
            mobileNo: "9876543210",
            RegistrationNo: "OD-01",
            date: "2025-11-26T12:00:00.000Z",
            ChassisNumber: "CHASSIS12345",
            EngineNumber: "ENGINE54321",
            Packages: "Package-A",
            Customerstate: "Odisha",
            AdharNo: "999988887777",
            PanNo: "ABCDE1234F",
            InvoiceNo: "INV001",
            CompliteAddress: "Balasore, Odisha, India",
            simDetails: [
              { simNo: "75415130011", operator: "Airtel" },
              { simNo: "975415130011", operator: "Airtel" },
            ],
          },
          {
            _id: "6563728f323a7e0d37e3d121",
            vechileNo: "HR51AA0001",
            deviceNo: "123456789012345",
            fullName: "VIJAY SINGH",
            mobileNo: "9988776655",
            RegistrationNo: "HR-51",
            date: "2025-11-20T12:00:00.000Z",
            ChassisNumber: "CHASSIS00001",
            EngineNumber: "ENGINE00001",
            Packages: "Package-B",
            Customerstate: "Haryana",
            AdharNo: "111122223333",
            PanNo: "FGHIJ5678K",
            InvoiceNo: "INV002",
            CompliteAddress: "Gurgaon, Haryana, India",
            simDetails: [{ simNo: "888899990000", operator: "Jio" }],
          },
        ],
      };

      setDevices(mockData.delMapDevice || []);
    } catch (err) {
      console.error("Error fetching mapped devices:", err);
      setError(`Failed to fetch mapped devices: ${err.message}`);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMappedDevices();
  }, [fetchMappedDevices]);

  const handleSelectDevice = (deviceId) => {
    setSelectedDevices((prevSelected) => {
      if (prevSelected.includes(deviceId)) {
        return prevSelected.filter((id) => id !== deviceId);
      } else {
        return [...prevSelected, deviceId];
      }
    });
  };

  const handleSelectAllDevices = () => {
    if (selectedDevices.length === devices.length) {
      setSelectedDevices([]); // Deselect all
    } else {
      setSelectedDevices(devices.map((device) => device._id)); // Select all
    }
  };

  // 🎯 UPDATED: Handler for Live Tracking to use navigate and pass device numbers
  const handleLiveTracking = () => {
    if (selectedDevices.length === 0) return;

    // 1. Get the device numbers (deviceNo) for all selected devices
    const selectedDeviceNos = devices
      .filter((d) => selectedDevices.includes(d._id))
      .map((d) => d.deviceNo);

    // 2. Format them as a comma-separated string for the URL
    const deviceNosString = selectedDeviceNos.join(",");

    // 3. Navigate to the Live Tracking route, passing the device numbers as a query parameter
    navigate(`/dealer/map-device/livetracking?deviceNos=${deviceNosString}`);
  };

  const handleViewDetails = () => {
    if (selectedDevices.length === 1 && openViewModal) {
      const selectedDevice = devices.find((d) => d._id === selectedDevices[0]);
      openViewModal(selectedDevice);
    } else {
      alert("Please select exactly ONE device to view details.");
    }
  };

  const handleEditDevice = () => {
    if (selectedDevices.length === 1 && openEditModal) {
      const selectedDevice = devices.find((d) => d._id === selectedDevices[0]);
      openEditModal(selectedDevice);
    } else {
      alert("Please select exactly ONE device to edit.");
    }
  };

  const handleCertificates = () => {
    if (selectedDevices.length === 0) return;
    const selected = devices
      .filter((d) => selectedDevices.includes(d._id))
      .map((d) => d.deviceNo);
    alert(`Generating PDF Certificates for devices: ${selected.join(", ")}`);
  };

  const sortedDevices = React.useMemo(() => {
    let sortableItems = [...devices];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";
        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [devices, sortConfig]);

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "ascending" ? (
      <ChevronUp size={16} className="ml-1" />
    ) : (
      <ChevronDown size={16} className="ml-1" />
    );
  };

  if (loading) {
    return (
      <div className="mt-12 p-8 bg-gray-800/50 rounded-2xl shadow-inner border border-yellow-500/30 text-center text-yellow-400">
        <Loader2 size={32} className="mx-auto animate-spin mb-3" />
        <p className="text-xl">Loading Mapped Devices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-12 p-8 bg-red-800/30 rounded-2xl shadow-inner border border-red-500/50 text-center text-red-400">
        <AlertTriangle size={32} className="mx-auto mb-3" />
        <p className="text-xl font-bold">Error Loading Data</p>
        <p className="text-sm mt-2">{error}</p>
        <p className="text-xs mt-1">
          Check your API token and network connection.
        </p>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="mt-12 p-8 bg-gray-800/50 rounded-2xl shadow-inner border border-yellow-500/30 text-center text-gray-400">
        <MapPin size={32} className="mx-auto mb-3" />
        <p className="text-xl">No Devices Mapped Yet</p>
        <p className="mt-2 text-sm">
          Use the "Map New Device" button to get started.
        </p>
      </div>
    );
  }

  const headers = [
    { key: "vechileNo", label: "Vehicle No." },
    { key: "deviceNo", label: "Device Serial No." },
    { key: "fullName", label: "Customer Name" },
    { key: "mobileNo", label: "Mobile No." },
    { key: "RegistrationNo", label: "Reg. No." },
    { key: "date", label: "Inst. Date" },
  ];

  const hasSelectedDevices = selectedDevices.length > 0;
  const isSingleDeviceSelected = selectedDevices.length === 1;

  return (
    <div className="mt-12 p-6 bg-gray-800/50 rounded-2xl shadow-2xl border border-yellow-500/30">
      <h2 className="text-3xl font-bold text-yellow-400 mb-6 flex items-center gap-3">
        <MapPin size={32} />
        Mapped Devices Dashboard
      </h2>
      <MappedDeviceList />

      {/* Search Bar (Placeholder) */}
    </div>
  );
};

// =========================================================
// 3. MAIN APP COMPONENT & INITIAL STATE (Device Mapping Form)
// =========================================================

// 🐛 FIX: initialFormData definition is placed here to ensure global scope before its first usage in the App component.
const initialFormData = {
  // REMOVED: country, state, distributorName, delerName (These are now implicit for the current dealer)
  vechileNo: "",
  deviceType: "", // Manual entry
  deviceNo: "", // Serial Number (Barcode)
  voltage: "", // Manual entry
  elementType: "", // Auto-fetched
  batchNo: "", // Auto-fetched
  simDetails: "", // Read-only summary from selected barcode

  VechileBirth: "",
  RegistrationNo: "",
  date: "",
  ChassisNumber: "",
  EngineNumber: "",
  VehicleType: "",
  MakeModel: "",
  ModelYear: "",
  InsuranceRenewDate: "",
  PollutionRenewdate: "",
  VehicleKMReading: "",
  DriverLicenseNo: "",
  MappedDate: "",
  NoOfPanicButtons: "",
  fullName: "",
  email: "",
  mobileNo: "",
  GstinNo: "",
  Customercountry: "India",
  Customerstate: "",
  Customerdistrict: "",
  Rto: "",
  PinCode: "",
  CompliteAddress: "",
  AdharNo: "",
  PanNo: "",
  Packages: "",
  InvoiceNo: "",
  // NOTE: File fields excluded from JSON payload
  Vechile_Doc: null,
  Rc_Doc: null,
  Pan_Card: null,
  Device_Doc: null,
  Adhar_Card: null,
  Invious_Doc: null,
  Signature_Doc: null,
  Panic_Sticker: null,
};

// 4. NEW: LiveTracking Component (To receive the data)
const LiveTracking = () => {
  // 🎯 NEW: Use useLocation to read query parameters
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const deviceNosString = queryParams.get("deviceNos");
  const deviceNos = deviceNosString ? deviceNosString.split(",") : [];

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-green-400 mb-6 flex items-center gap-3">
          <SquareCheckBig size={36} />
          Live Tracking Dashboard
        </h1>
        <div className="bg-gray-800 p-6 rounded-xl border border-green-500/50">
          <p className="text-lg font-semibold mb-3">
            Devices selected for Live Tracking:
          </p>
          {deviceNos.length > 0 ? (
            <div className="space-y-2">
              <p className="text-green-300">
                Total Devices:{" "}
                <span className="font-bold">{deviceNos.length}</span>
              </p>
              <ul className="list-disc list-inside ml-4 text-sm text-gray-300">
                {deviceNos.map((no) => (
                  <li key={no}>**Device Serial No:** {no.trim()}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-red-400">No devices were passed for tracking.</p>
          )}

          <div className="mt-8 p-4 bg-black/50 rounded-lg h-96 flex items-center justify-center">
            <p className="text-gray-500 text-xl">
              [Placeholder for Map and Real-time Data Feed]
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. Device Details/Edit Modal Component
const DeviceDetailModal = ({
  isOpen,
  onClose,
  device,
  isEditMode,
  packages,
}) => {
  if (!isOpen || !device) return null;

  const [modalData, setModalData] = useState(device);
  const [loading, setLoading] = useState(false);
  const isView = !isEditMode;

  useEffect(() => {
    setModalData(device);
  }, [device]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setModalData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Placeholder for Edit Logic
    console.log("Submitting updated device data:", modalData);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
    setLoading(false);
    alert("Device updated successfully! (Mock Action)");
    onClose();
  };

  const getLabel = (key) => {
    const labels = {
      vechileNo: "Vehicle No",
      deviceNo: "Device Serial No",
      mobileNo: "Mobile No",
      RegistrationNo: "Registration No",
      date: "Installation Date",
      ChassisNumber: "Chassis Number",
      EngineNumber: "Engine Number",
      Packages: "Package ID",
      Customerstate: "Customer State",
      AdharNo: "Aadhar No",
      PanNo: "PAN No",
      InvoiceNo: "Invoice No",
      CompliteAddress: "Complete Address",
      fullName: "Customer Name",
    };
    return labels[key] || key;
  };

  const renderInput = (
    key,
    disabled = isView,
    isRequired = false,
    isSelect = false,
    options = [],
  ) => {
    const isDateField =
      key.toLowerCase().includes("date") || key === "VechileBirth";
    const type = isDateField ? "date" : "text";

    return (
      <div key={key} className="col-span-1">
        <label className="block mb-2 font-medium text-yellow-300 text-sm">
          {getLabel(key)} {isRequired ? "*" : ""}
        </label>
        {isSelect ? (
          <select
            name={key}
            value={modalData[key] || ""}
            onChange={handleChange}
            disabled={disabled}
            className={`w-full px-4 py-2.5 border border-yellow-500/30 rounded-lg bg-black/60 text-yellow-100 focus:outline-none focus:border-yellow-500 transition-colors ${disabled ? "opacity-70 cursor-not-allowed bg-gray-900/50" : ""}`}
          >
            <option value="">Select Option</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            name={key}
            value={modalData[key] || ""}
            onChange={handleChange}
            disabled={disabled}
            className={`w-full px-4 py-2.5 border border-yellow-500/30 rounded-lg bg-black/60 text-yellow-100 focus:outline-none focus:border-yellow-500 transition-colors placeholder:text-gray-500 ${disabled ? "opacity-70 cursor-not-allowed bg-gray-900/50" : ""}`}
            placeholder={getLabel(key)}
          />
        )}
      </div>
    );
  };

  const fields = [
    "vechileNo",
    "deviceNo",
    "RegistrationNo",
    "ChassisNumber",
    "EngineNumber",
    "fullName",
    "mobileNo",
    "AdharNo",
    "PanNo",
    "InvoiceNo",
    "date",
    "Customerstate",
    "Packages",
    "CompliteAddress",
  ];

  const packageOptions = packages.map((pkg) => ({
    value: pkg._id,
    label: pkg.packageName,
  }));
  const stateOptions = INDIA_STATES.map((state) => ({
    value: state,
    label: state,
  }));
  const isPackageField = (key) => key === "Packages";
  const isStateField = (key) => key === "Customerstate";

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-500 rounded-2xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-600 scrollbar-track-gray-800">
        <div className="sticky top-0 bg-black/95 backdrop-blur-md border-b-2 border-yellow-500/80 p-6 flex justify-between items-center z-10">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 flex items-center gap-3">
            {isEditMode ? <SquarePen size={32} /> : <Eye size={32} />}
            {isEditMode ? "Edit Device Details" : "Device Details"}
          </h2>
          <button
            onClick={onClose}
            className="text-yellow-400 hover:text-white transition-colors p-2 rounded-full hover:bg-yellow-500/10 border border-yellow-500/20"
          >
            <X size={28} />
          </button>
        </div>
        <div className="p-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {fields.map((key) =>
                isPackageField(key)
                  ? renderInput(key, isView, false, true, packageOptions)
                  : isStateField(key)
                    ? renderInput(key, isView, false, true, stateOptions)
                    : renderInput(key),
              )}
            </div>

            <div className="p-4 bg-gray-800/50 rounded-lg mb-6">
              <h3 className="font-bold text-yellow-400 mb-2">
                SIM Details (Read Only)
              </h3>
              {device.simDetails && device.simDetails.length > 0 ? (
                <ul className="list-disc list-inside text-gray-300">
                  {device.simDetails.map((sim, index) => (
                    <li key={index} className="text-sm">
                      Operator: **{sim.operator}**, SIM No: **
                      {sim.simNo || sim.iccidNo}**
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">
                  No SIM details available.
                </p>
              )}
            </div>

            {isEditMode && (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-bold text-lg hover:from-orange-400 hover:to-red-400 transition-all duration-300 shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <SquarePen size={24} />
                    Save Changes
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`w-full mt-3 px-6 py-3 rounded-xl font-bold text-lg transition-all duration-300 border ${isEditMode ? "bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200" : "bg-yellow-600 hover:bg-yellow-700 border-yellow-600 text-black"}`}
            >
              Close
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDeviceForModal, setSelectedDeviceForModal] = useState(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 🎯 FIX: Using initialFormData defined globally above.
  const [formData, setFormData] = useState(initialFormData);
  const [deviceBarcodes, setDeviceBarcodes] = useState([]);
  const [mappedSims, setMappedSims] = useState([]);
  const [packages, setPackages] = useState([]);
  const [selectedPackageDetails, setSelectedPackageDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [barcodesLoading, setBarcodesLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: null });

  const openEditModal = (device) => {
    setSelectedDeviceForModal(device);
    setIsEditModalOpen(true);
  };

  const openViewModal = (device) => {
    setSelectedDeviceForModal(device);
    setIsDetailModalOpen(true);
  };

  const closeModals = () => {
    setIsEditModalOpen(false);
    setIsDetailModalOpen(false);
    setSelectedDeviceForModal(null);
  };

  const resetDeviceFields = () => {
    setMappedSims([]);
    return {
      deviceNo: "",
      simDetails: "",
      elementType: "",
      batchNo: "",
    };
  };

  const fetchPackages = useCallback(async () => {
    setPackagesLoading(true);
    try {
      const token = localStorage.getItem("token") || "mock-token";
      if (!token) throw new Error("Authentication token not found.");

      const response = await fetch(FETCH_PLANS_API, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch packages");
      const data = await response.json();
      console.log(data);

      setPackages(data.Packages || data.data || []);
    } catch (error) {
      console.error("Error fetching packages:", error.message);
      setPackages([]);
    } finally {
      setPackagesLoading(false);
    }
  }, []);

  const fetchBarcodesForDealer = useCallback(async () => {
    setBarcodesLoading(true);
    setDeviceBarcodes([]);
    setFormData((prev) => ({
      ...prev,
      ...resetDeviceFields(),
    }));

    try {
      const token = localStorage.getItem("token") || "mock-token";
      const response = await fetch(API_URL_BARCODE_LIST, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      setDeviceBarcodes(data.barcodes || data.data || []);
    } catch (error) {
      console.error("Error fetching device barcodes:", error.message);
    } finally {
      setBarcodesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
    fetchBarcodesForDealer();
  }, [fetchPackages, fetchBarcodesForDealer]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    let newFormData = { ...formData };

    if (type === "file") {
      newFormData[name] = files[0];
    } else {
      newFormData[name] = value;
    }

    if (name === "deviceNo") {
      if (value) {
        const selectedDevice = deviceBarcodes.find(
          (device) => device.barCodeNo === value,
        );
        const sims =
          selectedDevice && Array.isArray(selectedDevice.simDetails)
            ? selectedDevice.simDetails
            : [];
        setMappedSims(sims);
        const simSummary = sims
          .map((sim) => sim.simNo || sim.iccidNo)
          .filter(Boolean)
          .join(", ");
        newFormData.simDetails = simSummary || "No SIM details found.";

        newFormData.elementType = selectedDevice?.elementType || "";
        newFormData.batchNo = selectedDevice?.batchNo || "";
      } else {
        setMappedSims([]);
        newFormData.simDetails = "";
        newFormData.elementType = "";
        newFormData.batchNo = "";
      }
    }

    if (name === "Packages") {
      const selectedPkg = packages.find((pkg) => pkg._id === value);
      setSelectedPackageDetails(selectedPkg || null);
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitting(true);
    setToast({ message: "", type: null });

    try {
      const payload = {};
      for (const key in formData) {
        const value = formData[key];
        if (
          value instanceof File ||
          key.endsWith("_Doc") ||
          key.endsWith("_Card") ||
          key.endsWith("_Sticker")
        ) {
          continue;
        }
        if (
          ["country", "state", "distributorName", "delerName"].includes(key)
        ) {
          continue;
        }
        payload[key] = value ? String(value).trim() : "";
      }

      payload.simDetails = mappedSims || [];

      const token = localStorage.getItem("token") || "mock-token";
      if (!token) throw new Error("Authentication token missing");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(SUBMIT_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      let result;
      try {
        result = await response.json();
      } catch (err) {
        result = {
          success: false,
          message: "Invalid JSON response from server.",
        };
      }

      if (!response.ok || result.success === false) {
        const errorMsg =
          result.message ||
          "Submission failed. Please check the required fields and network.";
        setToast({ message: errorMsg, type: "error" });
        setSubmitting(false);
        return;
      }

      setToast({
        message: "Device mapped successfully! Reloading portal...",
        type: "success",
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      const errorMsg =
        error.name === "AbortError"
          ? "Request timed out after 60 seconds."
          : `Submission failed: ${error.message}`;
      console.error("⛔ Submission Error:", error);
      setToast({ message: errorMsg, type: "error" });
      setSubmitting(false);
    } finally {
      setLoading(false);
    }
  };

  const getLabel = (key) => {
    const labels = {
      vechileNo: "Vehicle No",
      deviceType: "Device Type",
      voltage: "Voltage",
      elementType: "Element Type",
      batchNo: "Batch No",
      VechileBirth: "Vehicle Birth (Year/Date)",
      RegistrationNo: "Registration No",
      date: "Installation Date",
      ChassisNumber: "Chassis Number",
      EngineNumber: "Engine Number",
      VehicleType: "Vehicle Type",
      MakeModel: "Make & Model",
      ModelYear: "Model Year",
      InsuranceRenewDate: "Insurance Renew Date",
      PollutionRenewdate: "Pollution Renew Date",
      VehicleKMReading: "Vehicle KM Reading",
      DriverLicenseNo: "Driver License No",
      MappedDate: "Mapped Date",
      NoOfPanicButtons: "No. Of Panic Buttons",
      fullName: "Customer Full Name",
      email: "Customer Email",
      mobileNo: "Customer Mobile No",
      GstinNo: "GSTIN No",
      Customerdistrict: "Customer District",
      Rto: "RTO",
      PinCode: "Pin Code",
      CompliteAddress: "Complete Address",
      AdharNo: "Aadhar No",
      PanNo: "PAN No",
      InvoiceNo: "Invoice No",
      Vechile_Doc: "Vehicle Document",
      Rc_Doc: "RC Document",
      Pan_Card: "PAN Card",
      Device_Doc: "Device Document",
      Adhar_Card: "Aadhar Card",
      Invious_Doc: "Invoice Document",
      Signature_Doc: "Signature Document",
      Panic_Sticker: "Panic Sticker Document",
    };
    return labels[key] || key;
  };

  const renderSimInputs = () => {
    if (!formData.deviceNo) {
      return (
        <div className="md:col-span-3 text-center py-6 text-gray-500 border-2 border-dashed border-gray-700 rounded-xl bg-black/10">
          <Smartphone size={24} className="mx-auto mb-2" />
          Select a **Device Serial No** to view SIM details.
        </div>
      );
    }
    if (
      mappedSims.length === 0 ||
      mappedSims.every((sim) => !sim.simNo && !sim.iccidNo)
    ) {
      return (
        <div className="md:col-span-3 text-center py-6 text-yellow-400 border-2 border-dashed border-yellow-500/30 rounded-xl bg-black/20">
          <AlertTriangle size={24} className="mx-auto mb-2" />
          No SIM details found for the selected device.
        </div>
      );
    }

    return mappedSims.map((sim, index) => (
      <div
        key={index}
        className="md:col-span-1 border border-yellow-500/50 p-5 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 shadow-lg backdrop-blur-sm"
      >
        <h4 className="font-bold mb-3 text-yellow-400 flex items-center gap-2 text-lg">
          <Smartphone size={18} />
          SIM {index + 1}
        </h4>
        <div className="space-y-3">
          <PackageDetailItem label="Sim No" value={sim.simNo} />
          <PackageDetailItem label="ICCID No" value={sim.iccidNo} />
          <PackageDetailItem label="Operator" value={sim.operator} />
          <PackageDetailItem
            label="Validity Date"
            value={
              sim.validityDate && !isNaN(new Date(sim.validityDate))
                ? new Date(sim.validityDate).toLocaleDateString()
                : "N/A"
            }
          />
        </div>
      </div>
    ));
  };
 

  const renderPackageDetailsBox = () => {
    if (!selectedPackageDetails) return null;

    const details = selectedPackageDetails;

    return (
      <div className="md:col-span-3 border border-yellow-500 p-6 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 shadow-xl mt-4 backdrop-blur-sm">
        <h4 className="text-xl font-bold mb-4 text-yellow-400 flex items-center gap-2">
          <Package size={20} />
          Package Details
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
          <PackageDetailItem label="Package Name" value={details.packageName} />
          <PackageDetailItem
            label="Billing Cycle"
            value={details.billingCycle}
          />
          <PackageDetailItem label="Renewal" value={details.renewal} />
          <PackageDetailItem label="Price (₹)" value={details.price} />
        </div>
        <p className="mt-4 text-sm text-yellow-200/80">
          Description: {details.description}
        </p>
      </div>
    );
  };

  const renderFormInput = (key, span = 1) => {
    const isDateField =
      key.toLowerCase().includes("date") || key === "VechileBirth";
    const type = isDateField ? "date" : "text";

    const isRequired = [
      "vechileNo",
      "deviceType",
      "voltage",
      "RegistrationNo",
      "date",
      "ChassisNumber",
      "EngineNumber",
      "VehicleType",
      "MakeModel",
      "fullName",
      "mobileNo",
      "AdharNo",
      "PanNo",
      "CompliteAddress",
      "Customerstate",
    ].includes(key);

    const isAutoFilled = ["elementType", "batchNo"].includes(key);
    const isDisabled = isAutoFilled && !!formData.deviceNo;

    return (
      <div key={key} className={`col-span-${span}`}>
        <label className="block mb-2 font-medium text-yellow-300 text-sm">
          {getLabel(key)} {isRequired ? "*" : ""}
        </label>
        <input
          type={type}
          name={key}
          value={formData[key] || ""}
          onChange={handleChange}
          required={isRequired}
          disabled={isDisabled}
          className={`w-full px-4 py-2.5 border border-yellow-500/30 rounded-lg bg-black/60 text-yellow-100 focus:outline-none focus:border-yellow-500 transition-colors placeholder:text-gray-500 ${
            isDisabled ? "opacity-70 cursor-not-allowed bg-gray-900/50" : ""
          }`}
          placeholder={getLabel(key)}
        />
      </div>
    );
  };

  const renderFileInput = (key) => {
    return (
      <div key={key} className="col-span-1">
        <label className="block mb-2 font-medium text-gray-500 text-sm">
          {getLabel(key)} (Disabled)
        </label>
        <div className="w-full px-4 py-2.5 border border-gray-700 rounded-lg bg-black/60 text-gray-500 flex items-center justify-between opacity-50 cursor-not-allowed">
          <span className="truncate">
            {formData[key]?.name || "File upload disabled"}
          </span>
          <FileText size={18} />
        </div>
      </div>
    );
  };

  if (submitting) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[999] flex items-center justify-center">
        <div className="text-center text-yellow-400 p-10 bg-gray-900/80 rounded-xl shadow-2xl border border-yellow-500/30">
          <Loader2 size={64} className="mx-auto animate-spin mb-4" />
          <h1 className="text-3xl font-bold">Processing Submission...</h1>
          <p className="mt-2 text-lg">
            Please wait while the device is mapped and the portal reloads.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans">
      <DealerNavbar />

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {/* Navbar */}
        <nav className="bg-black/90 backdrop-blur-md border-b-2 border-yellow-500 sticky top-0 z-40 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center">
                <MapPin className="text-yellow-400" size={32} />
                <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  WEMIS Device Mapping
                </span>
              </div>

              <div className="hidden md:block">
                <button
                  onClick={() => setIsMapModalOpen(true)}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-6 py-3 rounded-lg font-bold hover:from-yellow-400 hover:to-yellow-500 transition-all duration-300 shadow-lg hover:shadow-yellow-500/50 flex items-center gap-2"
                >
                  <MapPin size={20} />
                  Map New Device
                </button>
              </div>

              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-yellow-400 hover:text-yellow-300"
                >
                  <Menu size={28} />
                </button>
              </div>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden bg-black/95 border-t border-yellow-500/30">
              <div className="px-4 py-4">
                <button
                  onClick={() => {
                    setIsMapModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-4 py-3 rounded-lg font-bold hover:from-yellow-400 hover:to-yellow-500 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <MapPin size={20} />
                  Map New Device
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Main Content (Mapped Devices Table) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* PASS NEW FUNCTIONS TO TABLE */}
          <DelerMapDevicesTable
            openEditModal={openEditModal}
            openViewModal={openViewModal}
          />
        </div>

        {/* Toast Notification Renderer */}
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: null })}
        />

        {/* Modal (Mapping Form) */}
        {isMapModalOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-500 rounded-2xl shadow-2xl max-w-5xl w-full my-8 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-600 scrollbar-track-gray-800">
              {/* Modal Header */}
              <div className="sticky top-0 bg-black/95 backdrop-blur-md border-b-2 border-yellow-500/80 p-6 flex justify-between items-center z-10">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 flex items-center gap-3">
                  <MapPin size={32} />
                  Device Mapping Form
                </h2>
                <button
                  onClick={() => setIsMapModalOpen(false)}
                  className="text-yellow-400 hover:text-white transition-colors p-2 rounded-full hover:bg-yellow-500/10 border border-yellow-500/20"
                >
                  <X size={28} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8">
                {/* JSON Submission Warning */}
                <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-xl mb-6 flex items-start gap-3">
                  <AlertTriangle size={24} className="flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">
                    {" "}
                    **JSON Submission Active:** File uploads are **disabled**.
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* ========================================= */}
                  {/* SECTION 1: DEVICE ALLOCATION (Simplified) */}
                  {/* ========================================= */}
                  <div className="p-6 bg-gray-800/30 rounded-xl border border-yellow-500/10 shadow-lg">
                    <h3 className="text-xl font-semibold text-yellow-400 mb-5 pb-2 border-b border-yellow-500/20 flex items-center gap-2">
                      <Package size={22} />
                      Device & Package Selection
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Device Serial No. (Barcode List) */}
                      <div>
                        <label className="block mb-2 font-medium text-yellow-300 text-sm">
                          Device Serial No (Barcode) *
                        </label>
                        <select
                          name="deviceNo"
                          value={formData.deviceNo}
                          onChange={handleChange}
                          required
                          disabled={barcodesLoading}
                          className={`w-full px-4 py-2.5 border border-yellow-500/30 rounded-lg bg-black/60 text-yellow-100 focus:outline-none focus:border-yellow-500 transition-colors ${
                            barcodesLoading
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <option value="">
                            {barcodesLoading
                              ? "Loading Devices..."
                              : deviceBarcodes.length > 0
                                ? "Select Device Number"
                                : "No Devices Available"}
                          </option>
                          {deviceBarcodes.map((device) => (
                            <option
                              key={device.barCodeNo}
                              value={device.barCodeNo}
                            >
                              {device.barCodeNo}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Package */}
                      <div>
                        <label className="block mb-2 font-medium text-yellow-300 text-sm">
                          Package *
                        </label>
                        <select
                          name="Packages"
                          value={formData.Packages}
                          onChange={handleChange}
                          required
                          disabled={packagesLoading}
                          className={`w-full px-4 py-2.5 border border-yellow-500/30 rounded-lg bg-black/60 text-yellow-100 focus:outline-none focus:border-yellow-500 transition-colors ${
                            packagesLoading
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <option value="">
                            {packagesLoading
                              ? "Loading Packages..."
                              : packages.length > 0
                                ? "Select Package"
                                : "No Packages Found"}
                          </option>
                          {/* Use _id for value, packageName for display. This ensures the _id is passed. */}
                          {packages.map((pkg) => (
                            <option key={pkg._id} value={pkg._id}>
                              {pkg.packageName || pkg._id}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {renderPackageDetailsBox()}
                  </div>

                  {/* ========================================= */}
                  {/* SECTION 2: SIM DETAILS */}
                  {/* ========================================= */}
                  <div className="p-6 bg-gray-800/30 rounded-xl border border-yellow-500/10 shadow-lg">
                    <h3 className="text-xl font-semibold text-yellow-400 mb-5 pb-2 border-b border-yellow-500/20 flex items-center gap-2">
                      <Smartphone size={22} />
                      SIM Card Details (Read-Only)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {renderSimInputs()}
                    </div>
                  </div>

                  {/* ========================================= */}
                  {/* SECTION 3: DEVICE & VEHICLE DETAILS */}
                  {/* ========================================= */}
                  <div className="p-6 bg-gray-800/30 rounded-xl border border-yellow-500/10 shadow-lg">
                    <h3 className="text-xl font-semibold text-yellow-400 mb-5 pb-2 border-b border-yellow-500/20 flex items-center gap-2">
                      <Package size={22} />
                      Vehicle & Device Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {renderFormInput("vechileNo")}
                      {/* Manual Entry Fields */}
                      {renderFormInput("deviceType")}
                      {renderFormInput("voltage")}
                      {/* Auto-fetched/Disabled Fields (FIXED) */}
                      {renderFormInput("elementType")}
                      {renderFormInput("batchNo")}

                      {renderFormInput("VechileBirth")}
                      {renderFormInput("RegistrationNo")}
                      {renderFormInput("date")}
                      {renderFormInput("ChassisNumber")}
                      {renderFormInput("EngineNumber")}
                      {renderFormInput("VehicleType")}
                      {renderFormInput("MakeModel")}
                      {renderFormInput("ModelYear")}
                      {renderFormInput("InsuranceRenewDate")}
                      {renderFormInput("PollutionRenewdate")}
                      {renderFormInput("VehicleKMReading")}
                      {renderFormInput("DriverLicenseNo")}
                      {renderFormInput("MappedDate")}
                      {renderFormInput("NoOfPanicButtons")}
                    </div>
                  </div>

                  {/* ========================================= */}
                  {/* SECTION 4: CUSTOMER DETAILS */}
                  {/* ========================================= */}
                  <div className="p-6 bg-gray-800/30 rounded-xl border border-yellow-500/10 shadow-lg">
                    <h3 className="text-xl font-semibold text-yellow-400 mb-5 pb-2 border-b border-yellow-500/20 flex items-center gap-2">
                      <User size={22} />
                      Customer Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {renderFormInput("fullName")}
                      {renderFormInput("email")}
                      {renderFormInput("mobileNo")}
                      {renderFormInput("GstinNo")}

                      {/* Customer Location */}
                      <div>
                        <label className="block mb-2 font-medium text-yellow-300 text-sm">
                          Customer Country *
                        </label>
                        <select
                          name="Customercountry"
                          value={formData.Customercountry}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2.5 border border-yellow-500/30 rounded-lg bg-black/60 text-yellow-100 focus:outline-none focus:border-yellow-500 transition-colors"
                        >
                          <option value="">Select Country</option>
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block mb-2 font-medium text-yellow-300 text-sm">
                          Customer State *
                        </label>
                        {formData.Customercountry === "India" ? (
                          <select
                            name="Customerstate"
                            value={formData.Customerstate}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 border border-yellow-500/30 rounded-lg bg-black/60 text-yellow-100 focus:outline-none focus:border-yellow-500 transition-colors"
                          >
                            <option value="">Select State</option>
                            {INDIA_STATES.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            name="Customerstate"
                            value={formData.Customerstate}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 border border-yellow-500/30 rounded-lg bg-black/60 text-yellow-100 focus:outline-none focus:border-yellow-500 placeholder:text-gray-500"
                            placeholder="Enter State/Province"
                          />
                        )}
                      </div>

                      {renderFormInput("Customerdistrict")}
                      {renderFormInput("Rto")}
                      {renderFormInput("PinCode")}
                      {renderFormInput("AdharNo")}
                      {renderFormInput("PanNo")}
                      {renderFormInput("InvoiceNo")}
                      {renderFormInput("CompliteAddress", 3)}
                    </div>
                  </div>

                  {/* ========================================= */}
                  {/* SECTION 5: DOCUMENT UPLOADS (Disabled) */}
                  {/* ========================================= */}
                  <div className="p-6 bg-gray-800/30 rounded-xl border border-red-500/30 shadow-lg opacity-60 pointer-events-none">
                    <h3 className="text-xl font-semibold text-red-400 mb-5 pb-2 border-b border-red-500/20 flex items-center gap-2">
                      <FileText size={22} />
                      Document Uploads (Disabled)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* File Inputs (Disabled) */}
                      {renderFileInput("Vechile_Doc")}
                      {renderFileInput("Rc_Doc")}
                      {renderFileInput("Pan_Card")}
                      {renderFileInput("Device_Doc")}
                      {renderFileInput("Adhar_Card")}
                      {renderFileInput("Invious_Doc")}
                      {renderFileInput("Signature_Doc")}
                      {renderFileInput("Panic_Sticker")}
                    </div>
                    <p className="mt-4 text-sm text-red-300/80">
                      These fields are disabled because the submission is
                      currently configured to use **JSON format**.
                    </p>
                  </div>

                  {/* ========================================= */}
                  {/* SUBMIT BUTTON */}
                  {/* ========================================= */}
                  <div className="pt-4 border-t border-yellow-500/20">
                    <button
                      type="submit"
                      disabled={loading || submitting}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-3 rounded-xl font-bold text-lg hover:from-yellow-400 hover:to-orange-400 transition-all duration-300 shadow-xl hover:shadow-yellow-500/50 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading || submitting ? (
                        <>
                          <Loader2 size={24} className="animate-spin" />
                          Submitting & Reloading...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={24} />
                          Map Device Now
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* NEW: Device Details Modal */}
        <DeviceDetailModal
          isOpen={isDetailModalOpen}
          onClose={closeModals}
          device={selectedDeviceForModal}
          isEditMode={false}
          packages={packages}
        />

        {/* NEW: Device Edit Modal */}
        <DeviceDetailModal
          isOpen={isEditModalOpen}
          onClose={closeModals}
          device={selectedDeviceForModal}
          isEditMode={true}
          packages={packages}
        />
      </div>
    </div>
  );
}

// Export both App and the new LiveTracking component
export default App;
export { LiveTracking };
