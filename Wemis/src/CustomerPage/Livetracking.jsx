import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    Car, Navigation, Zap, Satellite, 
    Battery, Signal, Clock, AlertCircle, RefreshCw,
    Play, Pause, Square, History, Calendar,
    MapPin, StopCircle, FileText, Download, Filter, X,
    Power, Activity, ParkingCircle, Fuel, BarChart3,
    ChevronDown, ChevronUp, TrendingUp, Layers
} from "lucide-react";

// --- Map Imports ---
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import your car logo image
import vehicleLogo from '../Images/car.png';
import Navbar from './Navbar';
import VehicleDataTable from './VehicleDataTable';

// --- Sub-component: Reverse Geocoding ---
const MapAddress = ({ lat, lng }) => {
    const [address, setAddress] = useState("Loading address...");
    useEffect(() => {
        const fetchAddr = async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
                const data = await res.json();
                setAddress(data.display_name || "Address not found");
            } catch { setAddress("Location services unavailable"); }
        };
        if (lat && lng) fetchAddr();
    }, [lat, lng]);
    return <p className="text-[10px] text-slate-500 mt-1">{address}</p>;
};

// --- Sub-component: Recenter Map ---
const RecenterMap = ({ position }) => {
    const map = useMap();
    useEffect(() => {
        if (position) map.panTo([position.lat, position.lng], { animate: true });
    }, [position, map]);
    return null;
};

// --- Sub-component: Report Modal ---
const ReportModal = ({ isOpen, onClose, deviceNo, reportType, onFetchReport }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        startTime: '08:00:00',
        endTime: '11:00:00'
    });
    const [loading, setLoading] = useState(false);

    const reportConfigs = {
        stoppage: {
            name: "Stoppage Report",
            icon: <StopCircle className="w-6 h-6 text-amber-600" />,
            bg: "bg-amber-100",
            endpoint: "fetchStoppageReport",
            fields: ['date', 'startTime', 'endTime']
        },
        ignition: {
            name: "Ignition Report",
            icon: <Power className="w-6 h-6 text-blue-600" />,
            bg: "bg-blue-100",
            endpoint: "fetchIgnitionReport",
            fields: ['date', 'startTime', 'endTime']
        },
        moving: {
            name: "Moving Time Report",
            icon: <Activity className="w-6 h-6 text-green-600" />,
            bg: "bg-green-100",
            endpoint: "fetchMovingTimeReport",
            fields: ['date', 'startTime', 'endTime']
        },
        idle: {
            name: "Idle Time Report",
            icon: <Clock className="w-6 h-6 text-yellow-600" />,
            bg: "bg-yellow-100",
            endpoint: "fetchIdleTimeReport",
            fields: ['date', 'startTime', 'endTime']
        },
        parking: {
            name: "Parking Time Report",
            icon: <ParkingCircle className="w-6 h-6 text-purple-600" />,
            bg: "bg-purple-100",
            endpoint: "fetchParkingTimeReport",
            fields: ['date', 'startTime', 'endTime']
        }
    };

    const config = reportConfigs[reportType];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onFetchReport(reportType, { deviceNo, ...formData });
        setLoading(false);
    };

    if (!isOpen || !config) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 ${config.bg} rounded-xl`}>
                            {config.icon}
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900">{config.name}</h3>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Device: {deviceNo}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block">Date</label>
                        <input
                            type="date"
                            className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 ring-indigo-500"
                            value={formData.date}
                            onChange={e => setFormData({...formData, date: e.target.value})}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block">Start Time</label>
                            <input
                                type="time"
                                className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 ring-indigo-500"
                                value={formData.startTime}
                                onChange={e => setFormData({...formData, startTime: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block">End Time</label>
                            <input
                                type="time"
                                className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 ring-indigo-500"
                                value={formData.endTime}
                                onChange={e => setFormData({...formData, endTime: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-slate-300 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Filter className="w-4 h-4" />
                            )}
                            Generate Report
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Livetracking = () => {
    const location = useLocation();
    const trackedDeviceNo = location.state?.deviceNo;

    // --- State ---
    const [vehicleData, setVehicleData] = useState(null);
    const [status, setStatus] = useState("Initializing");
    const [lastUpdateTime, setLastUpdateTime] = useState(null);
    const [deviceInfo, setDeviceInfo] = useState({ deviceNo: trackedDeviceNo || 'N/A', vehicleNo: 'Loading...' });
    const [rawData, setRawData] = useState(null);

    // --- Playback States ---
    const [playbackPath, setPlaybackPath] = useState([]);
    const [isPlaybackMode, setIsPlaybackMode] = useState(false);
    const [playbackIndex, setPlaybackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [loadingPlayback, setLoadingPlayback] = useState(false);
    const playbackTimer = useRef(null);

    // --- Report States ---
    const [showReportModal, setShowReportModal] = useState(false);
    const [activeReportType, setActiveReportType] = useState('stoppage');
    const [reports, setReports] = useState({
        stoppage: null,
        ignition: null,
        moving: null,
        idle: null,
        parking: null
    });
    const [loadingReports, setLoadingReports] = useState({
        stoppage: false,
        ignition: false,
        moving: false,
        idle: false,
        parking: false
    });
    const [selectedReportItem, setSelectedReportItem] = useState(null);
    const [expandedReports, setExpandedReports] = useState({
        stoppage: true,
        ignition: false,
        moving: false,
        idle: false,
        parking: false
    });

    const carIcon = (heading, isHistory = false) => L.divIcon({
        className: 'vehicle-marker-container',
        html: `
            <div style="transform: rotate(${heading}deg); transition: all 0.5s ease-in-out; width: 50px; height: 50px; display:flex; align-items:center; justify-content:center;">
                <img src="${vehicleLogo}" style="width: 45px; height: auto; filter: drop-shadow(0px 4px 6px ${isHistory ? 'rgba(239, 68, 68, 0.5)' : 'rgba(0,0,0,0.3)'});" alt="car" />
            </div>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 25]
    });

    // Report marker icons
    const reportIcon = (type) => L.divIcon({
        className: 'report-marker',
        html: `
            <div style="width: 24px; height: 24px; background: ${getMarkerColor(type)}; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
                <div style="color: white; font-size: 10px; font-weight: bold;">${getMarkerLabel(type)}</div>
            </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    const getMarkerColor = (type) => {
        const colors = {
            stoppage: '#ef4444',
            ignition: '#3b82f6',
            moving: '#10b981',
            idle: '#f59e0b',
            parking: '#8b5cf6'
        };
        return colors[type] || '#6b7280';
    };

    const getMarkerLabel = (type) => {
        const labels = {
            stoppage: 'S',
            ignition: 'I',
            moving: 'M',
            idle: 'D',
            parking: 'P'
        };
        return labels[type] || 'R';
    };

    // --- Fetch Live Data ---
    const fetchVehicleData = useCallback(async () => {
        if (!trackedDeviceNo || isPlaybackMode) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('https://api.websave.in/api/manufactur/liveTrackingSingleDevice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ deviceNo: trackedDeviceNo }),
            });
            const data = await res.json();
            const loc = data.location || data.rawData || {};
            const raw = data.rawData || data;
            console.log(raw)
            setRawData(raw);
            setDeviceInfo({ deviceNo: trackedDeviceNo, vehicleNo: data.deviceInfo?.vehicleName || 'Vehicle' });

            const lat = parseFloat(loc.latitude || raw.lat || 0);
            const lng = parseFloat(loc.longitude || raw.lng || 0);

            if (lat !== 0 && lng !== 0) {
                setVehicleData({
                    position: { lat, lng },
                    speed: parseFloat(loc.speed || raw.speed || 0),
                    heading: parseFloat(loc.heading || raw.headDegree || 0),
                    satellites: raw.satellites || 0,
                    battery: raw.batteryVoltage || "0",
                    signal: raw.gsmSignal || "0",
                    mains: raw.mainsVoltage || "0"
                });
                setLastUpdateTime(new Date());
                setStatus("Live");
            } else { setStatus("No GPS Fix"); }
        } catch (e) { setStatus("Offline"); }
    }, [trackedDeviceNo, isPlaybackMode]);

    // --- Fetch Route Playback ---
    const handleFetchPlayback = async () => {
        if (!startTime || !endTime) return alert("Please select both Start and End time");
       
        setLoadingPlayback(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('https://api.websave.in/api/manufactur/fetchSingleRoutePlayback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ deviceNo: trackedDeviceNo, startTime, endTime }),
            });
             
            const data = await res.json();
            console.log(data)
         
            if (data.route && data.route.length > 0) {
                const formattedPath = data.route.map(p => ({
                    lat: parseFloat(p.latitude),
                    lng: parseFloat(p.longitude),
                    speed: p.speed,
                    heading: p.heading,
                    timestamp: p.timestamp
                }));
                setPlaybackPath(formattedPath);
                setIsPlaybackMode(true);
                setPlaybackIndex(0);
                setStatus("Playback Mode");
            } else {
                alert("No route found for this time period");
            }
        } catch (e) { console.error(e); }
        finally { setLoadingPlayback(false); }
    };

    // --- Generic Report Fetch Function ---
    const fetchReport = async (reportType, filters) => {
        setLoadingReports(prev => ({ ...prev, [reportType]: true }));
        
        const token = localStorage.getItem('token');
        try {
            const endpoints = {
                stoppage: 'fetchStoppageReport',
                ignition: 'fetchIgnitionReport',
                moving: 'fetchMovingTimeReport',
                idle: 'fetchIdleTimeReport',
                parking: 'fetchParkingTimeReport'
            };

            const response = await fetch(`https://api.websave.in/api/manufactur/${endpoints[reportType]}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    deviceNo: filters.deviceNo,
                    date: filters.date,
                    startTime: filters.startTime,
                    endTime: filters.endTime
                }),
            });

            const data = await response.json();
            console.log(`${reportType} Report:`, data);
            
            if (data.success || data.data) {
                setReports(prev => ({
                    ...prev,
                    [reportType]: data.data || data
                }));
                setShowReportModal(false);
            } else {
                alert(data.message || `No ${reportType} data found`);
                // Set mock data for demonstration
                setReports(prev => ({
                    ...prev,
                    [reportType]: getMockData(reportType)
                }));
            }
        } catch (error) {
            console.error(`Error fetching ${reportType} report:`, error);
            alert(`Failed to fetch ${reportType} report`);
            // Set mock data for demonstration
            setReports(prev => ({
                ...prev,
                [reportType]: getMockData(reportType)
            }));
        } finally {
            setLoadingReports(prev => ({ ...prev, [reportType]: false }));
        }
    };

    // Mock data for demonstration
    const getMockData = (reportType) => {
        const mockData = {
            stoppage: [
                { startTime: "08:15:00", endTime: "08:30:00", duration: "15m", latitude: 19.0760, longitude: 72.8777, address: "Mumbai Central" },
                { startTime: "09:45:00", endTime: "10:00:00", duration: "15m", latitude: 19.0760, longitude: 72.8777, address: "Bandra" }
            ],
            ignition: {
                ignitionCount: 5,
                totalOnTime: "2h 30m",
                averageDuration: "30m",
                firstIgnition: "08:10:00",
                lastIgnition: "10:45:00"
            },
            moving: {
                totalMovingTime: "1h 45m",
                movingPercentage: "70%",
                averageSpeed: "45 km/h",
                maxSpeed: "80 km/h"
            },
            idle: {
                totalIdleTime: "45m",
                idlePercentage: "30%",
                idleCount: 6,
                averageIdleDuration: "7.5m"
            },
            parking: {
                totalParkingTime: "1h 15m",
                parkingCount: 3,
                longestPark: "40m",
                overnightParking: false
            }
        };
        return mockData[reportType];
    };

    // --- Export Report to CSV ---
    const exportReport = (reportType) => {
        const report = reports[reportType];
        if (!report || (Array.isArray(report) && report.length === 0)) {
            alert('No data to export');
            return;
        }

        const reportNames = {
            stoppage: "Stoppage",
            ignition: "Ignition",
            moving: "Moving_Time",
            idle: "Idle_Time",
            parking: "Parking_Time"
        };

        let headers = [];
        let rows = [];

        if (Array.isArray(report)) {
            headers = Object.keys(report[0] || {});
            rows = report.map(item => headers.map(header => `"${item[header] || ''}"`));
        } else {
            headers = ['Metric', 'Value'];
            rows = Object.entries(report).map(([key, value]) => [
                key,
                typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value
            ]);
        }

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportNames[reportType]}_Report_${deviceInfo.deviceNo}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    // --- Playback Animation Loop ---
    useEffect(() => {
        if (isPlaying && playbackIndex < playbackPath.length - 1) {
            playbackTimer.current = setTimeout(() => {
                setPlaybackIndex(prev => prev + 1);
            }, 500);
        } else {
            setIsPlaying(false);
        }
        return () => clearTimeout(playbackTimer.current);
    }, [isPlaying, playbackIndex, playbackPath]);

    // --- Polling for Live ---
    useEffect(() => {
        if (!trackedDeviceNo || isPlaybackMode) return;
        fetchVehicleData();
        const interval = setInterval(fetchVehicleData, 4000);
        return () => clearInterval(interval);
    }, [trackedDeviceNo, fetchVehicleData, isPlaybackMode]);

    const exitPlayback = () => {
        setIsPlaybackMode(false);
        setPlaybackPath([]);
        setIsPlaying(false);
        setStatus("Live");
    };

    // Toggle report section
    const toggleReportSection = (section) => {
        setExpandedReports(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Open report modal
    const openReportModal = (reportType) => {
        setActiveReportType(reportType);
        setShowReportModal(true);
    };

    // Render report content
    const renderReportContent = (reportType) => {
        const report = reports[reportType];
        const loading = loadingReports[reportType];

        if (loading) {
            return (
                <div className="p-4 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                </div>
            );
        }

        if (!report) {
            return (
                <div className="p-4 text-center">
                    <FileText className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-[10px] text-slate-400">No data available</p>
                    <button 
                        onClick={() => openReportModal(reportType)}
                        className="mt-2 px-3 py-1 bg-indigo-600 text-white text-[8px] font-bold rounded-lg hover:bg-indigo-700"
                    >
                        Generate Report
                    </button>
                </div>
            );
        }

        if (Array.isArray(report)) {
            return (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {report.map((item, index) => (
                        <div 
                            key={index}
                            className={`p-2 rounded-lg border cursor-pointer hover:bg-slate-50 ${
                                selectedReportItem === item ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 border-slate-100'
                            }`}
                            onClick={() => setSelectedReportItem(item)}
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-slate-700">{item.startTime} - {item.endTime}</span>
                                <span className="text-[8px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                                    {item.duration}
                                </span>
                            </div>
                            {item.address && (
                                <p className="text-[8px] text-slate-500 truncate mt-1">{item.address}</p>
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        // For object reports
        return (
            <div className="grid grid-cols-2 gap-2 p-2">
                {Object.entries(report).map(([key, value]) => (
                    <div key={key} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                        <p className="text-[8px] font-bold text-slate-500 uppercase">{key}</p>
                        <p className="text-[10px] font-bold text-slate-900">
                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                        </p>
                    </div>
                ))}
            </div>
        );
    };

    if (!trackedDeviceNo) return (
        <div className="h-screen flex items-center justify-center bg-slate-100">
            <AlertCircle size={48} className="text-red-500 animate-pulse"/>
        </div>
    );

    const displayData = isPlaybackMode && playbackPath.length > 0 ? playbackPath[playbackIndex] : vehicleData;

    return (
        <>
            <Navbar/>
            <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8 font-sans">
                <div className="max-w-[1600px] mx-auto space-y-6">
                    
                    {/* TOP HEADER */}
                    <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center border border-white/10">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-indigo-600 rounded-3xl">
                                <Car size={32} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tighter uppercase">{deviceInfo.vehicleNo}</h1>
                                <div className="flex items-center gap-2 text-indigo-300">
                                    <Navigation size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">IMEI: {trackedDeviceNo}</span>
                                </div>
                            </div>
                        </div>

                        {/* Status and Controls */}
                        <div className="flex flex-wrap items-center gap-3 mt-6 md:mt-0">
                            {/* Report Buttons */}
                            <div className="flex flex-wrap gap-2">
                                {['stoppage', 'ignition', 'moving', 'idle', 'parking'].map((type) => (
                                    <button 
                                        key={type}
                                        onClick={() => openReportModal(type)}
                                        className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                                    >
                                        {type === 'stoppage' && <StopCircle size={12} />}
                                        {type === 'ignition' && <Power size={12} />}
                                        {type === 'moving' && <Activity size={12} />}
                                        {type === 'idle' && <Clock size={12} />}
                                        {type === 'parking' && <ParkingCircle size={12} />}
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </button>
                                ))}
                            </div>
                            
                            {isPlaybackMode && (
                                <button onClick={exitPlayback} className="bg-rose-500 hover:bg-rose-600 px-4 py-2 rounded-xl text-xs font-bold transition-all">
                                    Exit Playback
                                </button>
                            )}
                            
                            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${status === 'Live' ? 'border-emerald-500 text-emerald-500' : 'border-indigo-500 text-indigo-500'}`}>
                                <span className={`w-2 h-2 rounded-full bg-current ${status === 'Live' ? 'animate-pulse' : ''}`}></span>
                                {status}
                            </div>
                        </div>
                    </div>

                    {/* PLAYBACK CONTROL PANEL */}
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block">Start Time</label>
                            <input type="datetime-local" className="w-full p-3 bg-slate-50 border rounded-xl text-xs outline-none focus:ring-2 ring-indigo-500" value={startTime} onChange={e => setStartTime(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block">End Time</label>
                            <input type="datetime-local" className="w-full p-3 bg-slate-50 border rounded-xl text-xs outline-none focus:ring-2 ring-indigo-500" value={endTime} onChange={e => setEndTime(e.target.value)} />
                        </div>
                        <button onClick={handleFetchPlayback} disabled={loadingPlayback} className="bg-slate-900 text-white p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                            {loadingPlayback ? <RefreshCw className="animate-spin" size={16}/> : <History size={16}/>} Load Route
                        </button>
                        {isPlaybackMode && (
                            <div className="flex gap-2">
                                <button onClick={() => setIsPlaying(!isPlaying)} className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                                    {isPlaying ? <Pause size={16}/> : <Play size={16}/>} {isPlaying ? 'Pause' : 'Play'}
                                </button>
                                <button onClick={() => {setIsPlaying(false); setPlaybackIndex(0);}} className="bg-slate-100 text-slate-600 p-3 rounded-xl hover:bg-slate-200">
                                    <Square size={16} fill="currentColor"/>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-350px)] min-h-[500px]">
                        {/* LEFT: MAP */}
                        <div className="lg:col-span-8 bg-white rounded-[2.5rem] p-3 shadow-xl border border-slate-200 relative overflow-hidden flex flex-col">
                            <div className="flex-1 rounded-[2rem] overflow-hidden z-20">
                                {displayData ? (
                                    <MapContainer center={[displayData.lat || displayData.position?.lat, displayData.lng || displayData.position?.lng]} zoom={16} zoomControl={false} style={{ height: "100%", width: "100%" }}>
                                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                        
                                        {/* Playback Route Line */}
                                        {isPlaybackMode && playbackPath.length > 0 && (
                                            <Polyline positions={playbackPath.map(p => [p.lat, p.lng])} color="#6366f1" weight={5} opacity={0.6} />
                                        )}

                                        {/* Report Markers */}
                                        {reports.stoppage && Array.isArray(reports.stoppage) && reports.stoppage.map((stoppage, index) => (
                                            <Marker 
                                                key={`stoppage-${index}`}
                                                position={[stoppage.latitude, stoppage.longitude]}
                                                icon={reportIcon('stoppage')}
                                                eventHandlers={{
                                                    click: () => setSelectedReportItem(stoppage)
                                                }}
                                            >
                                                <Popup>
                                                    <div className="p-2 min-w-[200px]">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <StopCircle className="w-4 h-4 text-red-500" />
                                                            <h3 className="font-bold text-sm">Stoppage #{index + 1}</h3>
                                                        </div>
                                                        <div className="space-y-1 text-xs">
                                                            <p><span className="font-bold">From:</span> {stoppage.startTime}</p>
                                                            <p><span className="font-bold">To:</span> {stoppage.endTime}</p>
                                                            <p><span className="font-bold">Duration:</span> {stoppage.duration}</p>
                                                            <p className="text-slate-500 text-[10px] mt-2">{stoppage.address || 'Address not available'}</p>
                                                        </div>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        ))}

                                        <Marker 
                                            position={[displayData.lat || displayData.position?.lat, displayData.lng || displayData.position?.lng]} 
                                            icon={carIcon(displayData.heading, isPlaybackMode)}
                                        >
                                            <Popup>
                                                <div className="p-1">
                                                    <p className="font-black text-xs uppercase">{deviceInfo.vehicleNo}</p>
                                                    <p className="font-bold text-indigo-600 text-[10px]">{displayData.speed} KM/H</p>
                                                    {isPlaybackMode && <p className="text-[9px] text-slate-400 mt-1">{new Date(displayData.timestamp).toLocaleString()}</p>}
                                                </div>
                                            </Popup>
                                        </Marker>
                                        <RecenterMap position={isPlaybackMode ? playbackPath[playbackIndex] : vehicleData?.position} />
                                    </MapContainer>
                                ) : (
                                    <div className="h-full w-full bg-slate-50 flex items-center justify-center flex-col">
                                        <RefreshCw size={48} className="text-indigo-200 animate-spin mb-4" />
                                        <p className="text-slate-400 font-bold uppercase text-[10px]">Syncing Data...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT SIDE: STATS AND REPORTS */}
                        <div className="lg:col-span-4 flex flex-col gap-4">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <StatCard icon={<Zap size={16}/>} label="Speed" val={displayData?.speed} unit="KM/H" color="text-amber-500" bg="bg-amber-50" />
                                {!isPlaybackMode && vehicleData && (
                                    <>
                                        <StatCard icon={<Satellite size={16}/>} label="Sats" val={vehicleData?.satellites} unit="SATS" color="text-blue-500" bg="bg-blue-50" />
                                    </>
                                )}
                            </div>

                            {/* Reports Panel */}
                            <div className="flex-1 bg-white rounded-[2rem] p-4 border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                                            <BarChart3 className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Reports Dashboard</h4>
                                    </div>
                                    <span className="text-[8px] font-bold bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                                        {Object.values(reports).filter(r => r !== null).length}/5
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                                    {['stoppage', 'ignition', 'moving', 'idle', 'parking'].map((type) => (
                                        <div key={type} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                            <div 
                                                className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-100"
                                                onClick={() => toggleReportSection(type)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1.5 rounded-lg ${
                                                        type === 'stoppage' ? 'bg-red-100' :
                                                        type === 'ignition' ? 'bg-blue-100' :
                                                        type === 'moving' ? 'bg-green-100' :
                                                        type === 'idle' ? 'bg-yellow-100' :
                                                        'bg-purple-100'
                                                    }`}>
                                                        {type === 'stoppage' && <StopCircle className="w-3 h-3 text-red-600" />}
                                                        {type === 'ignition' && <Power className="w-3 h-3 text-blue-600" />}
                                                        {type === 'moving' && <Activity className="w-3 h-3 text-green-600" />}
                                                        {type === 'idle' && <Clock className="w-3 h-3 text-yellow-600" />}
                                                        {type === 'parking' && <ParkingCircle className="w-3 h-3 text-purple-600" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-900 capitalize">{type} Report</p>
                                                        <p className="text-[8px] text-slate-500">
                                                            {reports[type] ? 'Data loaded' : 'No data'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {reports[type] && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                exportReport(type);
                                                            }}
                                                            className="p-1 bg-slate-200 hover:bg-slate-300 rounded-lg"
                                                        >
                                                            <Download className="w-3 h-3 text-slate-600" />
                                                        </button>
                                                    )}
                                                    {expandedReports[type] ? 
                                                        <ChevronUp className="w-4 h-4 text-slate-400" /> : 
                                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                                    }
                                                </div>
                                            </div>
                                            
                                            {expandedReports[type] && (
                                                <div className="px-3 pb-3">
                                                    {renderReportContent(type)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Selected Item Details */}
                                {selectedReportItem && (
                                    <div className="mt-4 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-[9px] font-bold text-indigo-700 uppercase">Selected Details</p>
                                            <button 
                                                onClick={() => setSelectedReportItem(null)}
                                                className="text-[8px] text-indigo-500 hover:text-indigo-700"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                        <div className="text-[9px] text-slate-700 space-y-1">
                                            {Object.entries(selectedReportItem).map(([key, value]) => (
                                                <div key={key} className="flex justify-between">
                                                    <span className="font-bold">{key}:</span>
                                                    <span>{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Playback Progress */}
                            {isPlaybackMode && (
                                <div className="bg-indigo-600 text-white p-4 rounded-[2rem] shadow-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                        <History className="w-4 h-4 opacity-50"/>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Playback Progress</p>
                                    </div>
                                    <p className="text-xl font-black">{playbackIndex + 1} / {playbackPath.length}</p>
                                    <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
                                        <div className="bg-white h-full" style={{ width: `${((playbackIndex + 1) / playbackPath.length) * 100}%` }}></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Modal */}
            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                deviceNo={trackedDeviceNo}
                reportType={activeReportType}
                onFetchReport={fetchReport}
            />

            <div className='z-40'>
                <VehicleDataTable/>
            </div>
        </>
    );
};

const StatCard = ({ icon, label, val, unit, color, bg }) => (
    <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className={`p-2 rounded-xl ${bg} ${color}`}>{icon}</div>
        <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-lg font-black text-slate-900 leading-none">{val ?? '--'} <span className="text-[9px] font-bold text-slate-400">{unit}</span></p>
        </div>
    </div>
);

const LogItem = ({ label, val }) => (
    <div className="flex justify-between items-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
        <span className="text-[9px] font-black text-slate-400 uppercase">{label}</span>
        <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">{val}</span>
    </div>
);

export default Livetracking;