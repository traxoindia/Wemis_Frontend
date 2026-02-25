import React, { useState, useEffect } from "react";
import {
    FileText, Search, Filter, MapPin, Clock, Gauge,
    Navigation, AlertTriangle, Printer, Loader2, Power,
    Activity, ParkingCircle, AlertOctagon, Map, ChevronDown,
    ChevronUp, Download, Calendar, RefreshCw
} from "lucide-react";
import Navbar from "./Navbar";

// --- CONFIG ---
const API_BASE_URL = "https://api.websave.in";

// --- HELPER: Format Duration ---
const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
};

// --- HELPER: Format DateTime ---
const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "N/A";
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
};

// --- HELPER: Format Time Only ---
const formatTime = (dateTimeStr) => {
    if (!dateTimeStr) return "N/A";
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
};

// --- HELPER: Format Location with Map Link ---
const formatLocation = (location) => {
    if (!location) return { display: "N/A", lat: null, lng: null };
    
    if (typeof location === 'object') {
        const lat = location.latitude || location.lat;
        const lng = location.longitude || location.lng;
        return {
            display: `${lat?.toFixed(6)}, ${lng?.toFixed(6)}`,
            lat: lat,
            lng: lng,
            hasCoordinates: !!(lat && lng)
        };
    }
    return { display: location, lat: null, lng: null, hasCoordinates: false };
};

const ReportStatCard = ({ icon, label, value, subValue, color, bg, trend }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${bg} ${color}`}>
                {icon}
            </div>
            <div className="flex-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-black text-slate-800">{value}</h3>
                    {subValue && (
                        <span className="text-sm font-medium text-slate-500">{subValue}</span>
                    )}
                </div>
                {trend && (
                    <p className="text-xs font-medium text-emerald-600 mt-1">{trend}</p>
                )}
            </div>
        </div>
    </div>
);

const LocationBadge = ({ location }) => {
    const { display, lat, lng, hasCoordinates } = formatLocation(location);
    
    if (!hasCoordinates) {
        return (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg">
                <MapPin size={12} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-600">{display}</span>
            </div>
        );
    }

    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    
    return (
        <a 
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
        >
            <MapPin size={12} className="text-blue-500 group-hover:text-blue-600" />
            <span className="text-xs font-medium text-blue-600 group-hover:text-blue-700">
                {lat?.toFixed(4)}, {lng?.toFixed(4)}
            </span>
            <Map size={10} className="text-blue-400 group-hover:text-blue-500" />
        </a>
    );
};

const StatusBadge = ({ status, type }) => {
    const getStatusConfig = () => {
        if (type === 'ignition') {
            return status === 'Still ON' 
                ? { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'ON' }
                : { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500', label: 'OFF' };
        }
        if (type === 'sos') {
            return { bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-500', label: 'SOS' };
        }
        return { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: status };
    };

    const config = getStatusConfig();

    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
            <span className={`text-xs font-bold ${config.text}`}>{config.label}</span>
        </div>
    );
};

function Reports() {
    const [devices, setDevices] = useState([]);
    const [reportLoading, setReportLoading] = useState(false);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [lastRefreshed, setLastRefreshed] = useState(new Date());

    // Filters
    const [selectedDeviceNo, setSelectedDeviceNo] = useState("");
    const [selectedVehicleNo, setSelectedVehicleNo] = useState("");
    const [reportType, setReportType] = useState("stoppage");
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState("00:00");
    const [endTime, setEndTime] = useState("23:59");

    // Data
    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState({ 
        totalDist: 0, 
        totalDuration: 0, 
        count: 0,
        totalEvents: 0,
        totalTime: { minutes: 0, seconds: 0 }
    });

    // Report Metadata
    const [reportMetadata, setReportMetadata] = useState({
        deviceNo: "",
        imei: "",
        reportDate: "",
        reportPeriod: { startTime: "", endTime: "" }
    });

    // --- FETCH DEVICES ---
    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${API_BASE_URL}/api/manufactur/liveTrackingAllDevices`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const data = await res.json();

                if (data.success && data.devices) {
                    setDevices(data.devices);
                    if (data.devices.length > 0) {
                        setSelectedDeviceNo(data.devices[0].dev.deviceNo);
                        setSelectedVehicleNo(data.devices[0].dev.vechileNo || data.devices[0].dev.deviceNo);
                    }
                }
            } catch (err) {
                console.error("Failed to load devices", err);
            }
        };
        fetchDevices();
    }, []);

    const handleGenerateReport = async () => {
        if (!selectedDeviceNo || !startDate) return alert("Please select device and date.");

        setReportLoading(true);
        const token = localStorage.getItem("token");

        const reportConfigs = {
            distance: { url: "/api/manufactur/fetchVehicleDistanceReport" },
            stoppage: { url: "/api/manufactur/fetchStoppageReport" },
            ignition: { url: "/api/manufactur/fetchIgnitionReport" },
            moving: { url: "/api/manufactur/fetchMovingTimeReport" },
            idle: { url: "/api/manufactur/fetchIdleTimeReport" },
            parking: { url: "/api/manufactur/fetchParkingTimeReport" },
            sos: { url: "/api/manufactur/fetchSOSReport" }
        };

        const config = reportConfigs[reportType];
        
        const payload = {
            deviceNo: selectedDeviceNo,
            date: startDate,
            startTime: `${startTime}:00`,
            endTime: `${endTime}:00`
        };

        try {
            const response = await fetch(`${API_BASE_URL}${config.url}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const resData = await response.json();

            if (resData.success) {
                // Set metadata
                setReportMetadata({
                    deviceNo: resData.deviceNo || selectedDeviceNo,
                    imei: resData.imei || "",
                    reportDate: resData.reportDate || startDate,
                    reportPeriod: resData.reportPeriod || { startTime: "", endTime: "" }
                });
                
                processReportData(resData);
                setLastRefreshed(new Date());
            } else {
                setReportData([]);
                setSummary({ totalDist: 0, totalDuration: 0, count: 0, totalEvents: 0, totalTime: { minutes: 0, seconds: 0 } });
                alert(resData.message || "No data found for this period.");
            }
        } catch (error) {
            console.error("Report Fetch Error:", error);
            alert("Error fetching report from server.");
        } finally {
            setReportLoading(false);
        }
    };

    const processReportData = (data) => {
        let processedData = [];
        let summaryData = {
            totalDist: 0,
            totalDuration: 0,
            count: 0,
            totalEvents: 0,
            totalTime: { minutes: 0, seconds: 0 }
        };

        switch (reportType) {
            case 'stoppage':
                processedData = (data.stoppages || []).map(item => ({
                    ...item,
                    id: `stoppage-${item.startTime}`,
                    type: 'stoppage'
                }));
                summaryData.totalEvents = data.totalStoppages || 0;
                summaryData.count = processedData.length;
                processedData.forEach(item => {
                    if (item.duration) {
                        summaryData.totalDuration += item.duration.seconds || 0;
                    }
                });
                break;

            case 'ignition':
                processedData = (data.ignitionSessions || []).map(item => ({
                    ...item,
                    id: `ignition-${item.ignitionOnTime}`,
                    type: 'ignition'
                }));
                summaryData.totalEvents = data.totalIgnitionCycles || 0;
                summaryData.count = processedData.length;
                processedData.forEach(item => {
                    if (item.duration) {
                        summaryData.totalDuration += item.duration.seconds || 0;
                    }
                });
                break;

            case 'moving':
                if (data.movingTime) {
                    processedData = [{
                        ...data.movingTime,
                        id: 'moving',
                        type: 'moving'
                    }];
                    summaryData.totalDuration = data.movingTime.seconds || 0;
                    summaryData.totalTime = data.movingTime;
                }
                summaryData.count = 1;
                break;

            case 'idle':
                processedData = (data.idleSessions || []).map(item => ({
                    ...item,
                    id: `idle-${item.startTime}`,
                    type: 'idle'
                }));
                summaryData.totalEvents = processedData.length;
                summaryData.totalTime = data.totalIdleTime || { minutes: 0, seconds: 0 };
                summaryData.totalDuration = data.totalIdleTime?.seconds || 0;
                summaryData.count = processedData.length;
                break;

            case 'parking':
                processedData = (data.parkingLocations || []).map(item => ({
                    ...item,
                    id: `parking-${item.startTime}`,
                    type: 'parking'
                }));
                summaryData.totalEvents = processedData.length;
                summaryData.totalTime = data.totalParkingTime || { minutes: 0, seconds: 0 };
                summaryData.totalDuration = data.totalParkingTime?.seconds || 0;
                summaryData.count = processedData.length;
                break;

            case 'sos':
                processedData = (data.sosSessions || []).map(item => ({
                    ...item,
                    id: `sos-${item.eventTime || item.startTime}`,
                    type: 'sos'
                }));
                summaryData.totalEvents = data.totalSOSEvents || 0;
                summaryData.count = processedData.length;
                break;

            case 'distance':
            default:
                processedData = (data.data || data.report || []).map(item => ({
                    ...item,
                    id: `distance-${item.date || Math.random()}`,
                    type: 'distance'
                }));
                summaryData.totalDist = processedData.reduce((acc, item) => acc + (parseFloat(item.distance) || 0), 0);
                summaryData.count = processedData.length;
                break;
        }

        setReportData(processedData);
        setSummary(summaryData);
    };

    const toggleRowExpand = (id) => {
        const newExpanded = new Set(expandedRows);
        if (expandedRows.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const exportToCSV = () => {
        // CSV export functionality
        console.log("Exporting to CSV...");
    };

    const getReportIcon = () => {
        switch (reportType) {
            case 'ignition': return <Power size={18} className="text-orange-500" />;
            case 'moving': return <Activity size={18} className="text-emerald-500" />;
            case 'idle': return <Clock size={18} className="text-amber-500" />;
            case 'parking': return <ParkingCircle size={18} className="text-blue-500" />;
            case 'sos': return <AlertTriangle size={18} className="text-rose-500" />;
            case 'distance': return <Gauge size={18} className="text-purple-500" />;
            default: return <FileText size={18} className="text-indigo-500" />;
        }
    };

    const getReportTitle = () => {
        const titles = {
            stoppage: 'Stoppage Analysis',
            ignition: 'Ignition Cycle Report',
            moving: 'Vehicle Movement Summary',
            idle: 'Idle Time Analysis',
            parking: 'Parking Location Report',
            distance: 'Distance Traveled Report',
            sos: 'Emergency SOS Events'
        };
        return titles[reportType] || 'Report Data';
    };

    const renderTableHeader = () => {
        switch (reportType) {
            case 'stoppage':
                return ["#", "Start Time", "End Time", "Duration", "Location", ""];
            
            case 'ignition':
                return ["#", "Ignition ON", "Ignition OFF", "Duration", "Status", "Location", ""];
            
            case 'moving':
                return ["Moving Time Summary", "Details"];
            
            case 'idle':
            case 'parking':
                return ["#", "Start Time", "End Time", "Duration", "Location", ""];
            
            case 'sos':
                return ["#", "Event Time", "Location", "Status", ""];
            
            case 'distance':
                return ["#", "Date", "Distance (KM)", "Location", ""];
            
            default:
                return ["#", "Start Time", "End Time", "Duration", "Location", ""];
        }
    };

    const renderTableBody = (row, idx) => {
        const isExpanded = expandedRows.has(row.id);
        const cellClass = "p-4 text-sm font-medium text-slate-700";

        switch (reportType) {
            case 'stoppage':
                return (
                    <>
                        <td className={cellClass}>{idx + 1}</td>
                        <td className={cellClass}>{formatTime(row.startTime)}</td>
                        <td className={cellClass}>{formatTime(row.endTime)}</td>
                        <td className="p-4">
                            <span className="font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg text-sm">
                                {row.duration ? formatDuration(row.duration.seconds) : 'N/A'}
                            </span>
                        </td>
                        <td className="p-4">
                            <LocationBadge location={row.location} />
                        </td>
                        <td className="p-4">
                            <button 
                                onClick={() => toggleRowExpand(row.id)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </td>
                    </>
                );

            case 'ignition':
                return (
                    <>
                        <td className={cellClass}>{idx + 1}</td>
                        <td className={cellClass}>{formatTime(row.ignitionOnTime)}</td>
                        <td className={cellClass}>{formatTime(row.ignitionOffTime)}</td>
                        <td className="p-4">
                            <span className="font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg text-sm">
                                {row.duration ? formatDuration(row.duration.seconds) : 'N/A'}
                            </span>
                        </td>
                        <td className="p-4">
                            <StatusBadge status={row.status} type="ignition" />
                        </td>
                        <td className="p-4">
                            <LocationBadge location={row.startLocation} />
                        </td>
                        <td className="p-4">
                            <button 
                                onClick={() => toggleRowExpand(row.id)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </td>
                    </>
                );

            case 'moving':
                return (
                    <td colSpan="2" className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl">
                                <p className="text-xs text-indigo-600 font-semibold mb-1">Moving Time</p>
                                <p className="text-2xl font-black text-indigo-700">{formatDuration(row.seconds)}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <p className="text-xs text-slate-500 font-semibold mb-1">Minutes</p>
                                <p className="text-2xl font-black text-slate-700">{row.minutes || 0}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <p className="text-xs text-slate-500 font-semibold mb-1">Seconds</p>
                                <p className="text-2xl font-black text-slate-700">{Math.floor(row.seconds || 0)}</p>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-xl">
                                <p className="text-xs text-emerald-600 font-semibold mb-1">Formatted</p>
                                <p className="text-2xl font-black text-emerald-700">{formatDuration(row.seconds)}</p>
                            </div>
                        </div>
                    </td>
                );

            case 'idle':
            case 'parking':
                return (
                    <>
                        <td className={cellClass}>{idx + 1}</td>
                        <td className={cellClass}>{formatTime(row.startTime)}</td>
                        <td className={cellClass}>{formatTime(row.endTime)}</td>
                        <td className="p-4">
                            <span className="font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg text-sm">
                                {row.duration ? formatDuration(row.duration.seconds) : 'N/A'}
                            </span>
                        </td>
                        <td className="p-4">
                            <LocationBadge location={row.location} />
                        </td>
                        <td className="p-4">
                            <button 
                                onClick={() => toggleRowExpand(row.id)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </td>
                    </>
                );

            case 'sos':
                return (
                    <>
                        <td className={cellClass}>{idx + 1}</td>
                        <td className={cellClass}>{formatDateTime(row.eventTime || row.startTime)}</td>
                        <td className="p-4">
                            <LocationBadge location={row.location} />
                        </td>
                        <td className="p-4">
                            <StatusBadge type="sos" />
                        </td>
                        <td className="p-4">
                            <button 
                                onClick={() => toggleRowExpand(row.id)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </td>
                    </>
                );

            case 'distance':
                return (
                    <>
                        <td className={cellClass}>{idx + 1}</td>
                        <td className={cellClass}>{row.date || startDate}</td>
                        <td className="p-4">
                            <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg text-sm">
                                {row.distance || 0} KM
                            </span>
                        </td>
                        <td className="p-4">
                            <LocationBadge location={row.location} />
                        </td>
                        <td className="p-4">
                            <button 
                                onClick={() => toggleRowExpand(row.id)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </td>
                    </>
                );

            default:
                return (
                    <>
                        <td className={cellClass}>{idx + 1}</td>
                        <td className={cellClass}>{formatTime(row.startTime || row.time)}</td>
                        <td className={cellClass}>{formatTime(row.endTime)}</td>
                        <td className="p-4">
                            <span className="font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg text-sm">
                                {row.duration || formatDuration(row.durationInSeconds || row.seconds)}
                            </span>
                        </td>
                        <td className="p-4">
                            <LocationBadge location={row.location} />
                        </td>
                        <td className="p-4">
                            <button 
                                onClick={() => toggleRowExpand(row.id)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </td>
                    </>
                );
        }
    };

    const renderExpandedRow = (row) => {
        if (!expandedRows.has(row.id)) return null;

        return (
            <tr className="bg-slate-50/80">
                <td colSpan="6" className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                        {row.location && typeof row.location === 'object' && (
                            <>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 mb-1">Latitude</p>
                                    <p className="text-sm font-mono font-medium text-slate-700">
                                        {row.location.latitude?.toFixed(6)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 mb-1">Longitude</p>
                                    <p className="text-sm font-mono font-medium text-slate-700">
                                        {row.location.longitude?.toFixed(6)}
                                    </p>
                                </div>
                                {row.location.latitude && row.location.longitude && (
                                    <div className="col-span-2">
                                        <a
                                            href={`https://www.google.com/maps?q=${row.location.latitude},${row.location.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                                        >
                                            <Map size={14} />
                                            View on Google Maps
                                        </a>
                                    </div>
                                )}
                            </>
                        )}
                        {row.duration && (
                            <>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 mb-1">Duration (seconds)</p>
                                    <p className="text-sm font-mono font-medium text-slate-700">{row.duration.seconds?.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 mb-1">Duration (minutes)</p>
                                    <p className="text-sm font-mono font-medium text-slate-700">{row.duration.minutes}</p>
                                </div>
                            </>
                        )}
                        {row.ignitionOnTime && (
                            <div className="col-span-2">
                                <p className="text-xs font-semibold text-slate-400 mb-1">Raw Timestamps</p>
                                <p className="text-sm font-mono font-medium text-slate-700">
                                    ON: {new Date(row.ignitionOnTime).toLocaleString()}
                                </p>
                                {row.ignitionOffTime && (
                                    <p className="text-sm font-mono font-medium text-slate-700">
                                        OFF: {new Date(row.ignitionOffTime).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </td>
            </tr>
        );
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-slate-50/80 p-4 md:p-8 font-sans">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
                                Analytics & Reports
                            </h1>
                            <p className="text-slate-500 font-medium text-sm mt-1">
                                Track vehicle performance and history with detailed analytics
                            </p>
                        </div>
                        {lastRefreshed && (
                            <div className="flex items-center gap-2 text-xs text-slate-400 bg-white px-3 py-2 rounded-lg shadow-sm">
                                <RefreshCw size={12} />
                                Last updated: {lastRefreshed.toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Control Panel */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 mb-8 overflow-hidden">
                    <div className="p-5 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-slate-100">
                        <h2 className="font-bold text-slate-700 flex items-center gap-2">
                            <Filter size={16} className="text-indigo-500" />
                            Report Filters
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            {/* Device Select */}
                            <div className="lg:col-span-2">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Select Vehicle
                                </label>
                                <select
                                    value={selectedDeviceNo}
                                    onChange={(e) => {
                                        setSelectedDeviceNo(e.target.value);
                                        const device = devices.find(d => d.dev.deviceNo === e.target.value);
                                        setSelectedVehicleNo(device?.dev.vechileNo || e.target.value);
                                    }}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                                >
                                    {devices.length === 0 && <option>Loading vehicles...</option>}
                                    {devices.map((d, index) => (
                                        <option key={index} value={d.dev.deviceNo}>
                                            {d.dev.vechileNo || `Device ${d.dev.deviceNo}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Report Type */}
                            <div className="lg:col-span-2">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Report Type
                                </label>
                                <select
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                                >
                                    <option value="stoppage">Stoppage Report</option>
                                    <option value="ignition">Ignition Report</option>
                                    <option value="moving">Moving Report</option>
                                    <option value="idle">Idle Report</option>
                                    <option value="parking">Parking Report</option>
                                    <option value="distance">Distance Report</option>
                                    <option value="sos">SOS Report</option>
                                </select>
                            </div>

                            {/* Date */}
                            <div className="lg:col-span-2">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Date
                                </label>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="date" 
                                        value={startDate} 
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Start Time */}
                            <div className="lg:col-span-2">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Start Time
                                </label>
                                <input 
                                    type="time" 
                                    value={startTime} 
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                                />
                            </div>

                            {/* End Time */}
                            <div className="lg:col-span-2">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    End Time
                                </label>
                                <input 
                                    type="time" 
                                    value={endTime} 
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                                />
                            </div>

                            {/* Generate Button */}
                            <div className="lg:col-span-2 flex items-end">
                                <button
                                    onClick={handleGenerateReport}
                                    disabled={reportLoading}
                                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {reportLoading ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <Filter size={18} />
                                    )}
                                    Generate Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                {reportData.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <ReportStatCard 
                            icon={<AlertTriangle size={20} />} 
                            label="Total Events" 
                            value={summary.totalEvents || summary.count} 
                            subValue={reportType === 'stoppage' ? 'stoppages' : 'records'}
                            bg="bg-indigo-50" 
                            color="text-indigo-600" 
                        />
                        
                        {reportType === 'distance' && (
                            <ReportStatCard 
                                icon={<Navigation size={20} />} 
                                label="Distance Traveled" 
                                value={`${summary.totalDist.toFixed(2)}`} 
                                subValue="KM"
                                bg="bg-emerald-50" 
                                color="text-emerald-600" 
                            />
                        )}
                        
                        {reportType !== 'distance' && summary.totalDuration > 0 && (
                            <ReportStatCard 
                                icon={<Clock size={20} />} 
                                label="Total Duration" 
                                value={formatDuration(summary.totalDuration)} 
                                bg="bg-amber-50" 
                                color="text-amber-600" 
                            />
                        )}
                        
                        {summary.totalTime && summary.totalTime.minutes > 0 && (
                            <ReportStatCard 
                                icon={<Clock size={20} />} 
                                label="Accumulated Time" 
                                value={`${summary.totalTime.minutes}m`} 
                                subValue={`${Math.floor(summary.totalTime.seconds % 60)}s`}
                                bg="bg-purple-50" 
                                color="text-purple-600" 
                            />
                        )}
                        
                        <ReportStatCard 
                            icon={<MapPin size={20} />} 
                            label="Vehicle" 
                            value={selectedVehicleNo || 'N/A'} 
                            subValue={selectedDeviceNo.slice(-6)}
                            bg="bg-slate-50" 
                            color="text-slate-600" 
                        />

                        {reportMetadata.reportPeriod?.startTime && (
                            <ReportStatCard 
                                icon={<Calendar size={20} />} 
                                label="Report Period" 
                                value={formatTime(reportMetadata.reportPeriod.startTime)} 
                                subValue={`to ${formatTime(reportMetadata.reportPeriod.endTime)}`}
                                bg="bg-blue-50" 
                                color="text-blue-600" 
                            />
                        )}
                    </div>
                )}

                {/* Results Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                {getReportIcon()}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">
                                    {getReportTitle()}
                                </h3>
                                {reportData.length > 0 && (
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Showing {reportData.length} {reportData.length === 1 ? 'record' : 'records'}
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        {reportData.length > 0 && (
                            <div className="flex gap-2">
                                <button 
                                    onClick={exportToCSV}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    <Download size={14} /> Export CSV
                                </button>
                                <button 
                                    onClick={() => window.print()} 
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    <Printer size={14} /> Print
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-y border-slate-200">
                                    {renderTableHeader().map((h, i) => (
                                        <th key={i} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reportType === 'moving' && reportData.length > 0 ? (
                                    <tr className="hover:bg-slate-50/50 transition-colors">
                                        {renderTableBody(reportData[0], 0)}
                                    </tr>
                                ) : (
                                    reportData.map((row, idx) => (
                                        <React.Fragment key={row.id || idx}>
                                            <tr className="hover:bg-slate-50/50 transition-colors">
                                                {renderTableBody(row, idx)}
                                            </tr>
                                            {renderExpandedRow(row)}
                                        </React.Fragment>
                                    ))
                                )}
                                
                                {reportData.length === 0 && !reportLoading && (
                                    <tr>
                                        <td colSpan="6" className="p-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <FileText size={40} className="text-slate-300" />
                                                <p className="text-slate-400 font-medium">No data available</p>
                                                <p className="text-xs text-slate-400">
                                                    Select a vehicle and time range to generate report
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {reportLoading && (
                                    <tr>
                                        <td colSpan="6" className="p-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 size={40} className="animate-spin text-indigo-400" />
                                                <p className="text-slate-500 font-medium">Generating report...</p>
                                                <p className="text-xs text-slate-400">Please wait while we fetch your data</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer with summary */}
                    {reportData.length > 0 && (
                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
                            <div className="flex items-center justify-between">
                                <span>Total Records: <span className="font-bold text-slate-700">{reportData.length}</span></span>
                                <span>Click on <ChevronDown size={12} className="inline" /> to view detailed information</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default Reports;