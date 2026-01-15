import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    Car, Navigation, Zap, Satellite, 
    Battery, Signal, Clock, AlertCircle, RefreshCw,
    Play, Pause, Square, History, Calendar,
    MapPin, StopCircle, FileText, Download, Filter, X,
    Power, Activity, ParkingCircle, Fuel, BarChart3,
    ChevronDown, ChevronUp, TrendingUp, Layers, Printer,
    Move, BatteryCharging, Map, Gauge, Compass
} from "lucide-react";

// --- Map Imports ---
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import jsPDF for PDF generation
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Import your car logo image
import vehicleLogo from '../Images/car.png';
import Navbar from './Navbar';
import VehicleDataTable from './VehicleDataTable';
import SocketClient from './SocketClient';

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
        startTime: '08:00',
        endTime: '11:00'
    });
    const [loading, setLoading] = useState(false);

    const reportConfigs = {
        stoppage: {
            name: "Stoppage Report",
            icon: <StopCircle className="w-6 h-6 text-amber-600" />,
            bg: "bg-amber-100"
        },
        ignition: {
            name: "Ignition Report",
            icon: <Power className="w-6 h-6 text-blue-600" />,
            bg: "bg-blue-100"
        },
        moving: {
            name: "Moving Time Report",
            icon: <Activity className="w-6 h-6 text-green-600" />,
            bg: "bg-green-100"
        },
        idle: {
            name: "Idle Time Report",
            icon: <Clock className="w-6 h-6 text-yellow-600" />,
            bg: "bg-yellow-100"
        },
        parking: {
            name: "Parking Time Report",
            icon: <ParkingCircle className="w-6 h-6 text-purple-600" />,
            bg: "bg-purple-100"
        }
    };

    const config = reportConfigs[reportType];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        // Helper to ensure HH:mm:ss format (adds :00 if seconds missing)
        const formatTime = (timeStr) => {
            return timeStr.split(':').length === 2 ? `${timeStr}:00` : timeStr;
        };

        // Construct payload exactly as requested
        const payload = {
            deviceNo,
            date: formData.date,
            startTime: formatTime(formData.startTime),
            endTime: formatTime(formData.endTime)
        };

        await onFetchReport(reportType, payload);
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
                                step="1"
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
                                step="1"
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
                            Generate
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
    const [reportMetadata, setReportMetadata] = useState({
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
        stoppage: false,
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

    // --- Helper function to format date/time ---
    const formatDateTime = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatTimeOnly = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // --- Format duration ---
    const formatDuration = (seconds) => {
        if (!seconds) return '0s';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    // --- Format short duration ---
    const formatShortDuration = (seconds) => {
        if (!seconds) return '0s';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m`;
        } else {
            return `${seconds}s`;
        }
    };

    // --- Generate PDF Report ---
    const generatePDFReport = (reportType) => {
        const report = reports[reportType];
        const metadata = reportMetadata[reportType];
        
        if (!report) {
            alert('No report data available to generate PDF');
            return;
        }

        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.width;
        
        // Add header
        doc.setFillColor(41, 41, 41);
        doc.rect(0, 0, pageWidth, 30, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, pageWidth / 2, 15, { align: 'center' });
        
        doc.setFontSize(10);
        doc.text(`Device: ${deviceInfo.deviceNo}`, 14, 25);
        doc.text(`Vehicle: ${deviceInfo.vehicleNo}`, pageWidth - 14, 25, { align: 'right' });
        
        // Reset text color
        doc.setTextColor(0, 0, 0);
        
        let yPos = 40;
        
        // Add report period
        if (metadata) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Report Period', 14, yPos);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            yPos += 8;
            
            if (metadata.reportDate) {
                doc.text(`Date: ${metadata.reportDate}`, 14, yPos);
                yPos += 6;
            }
            
            if (metadata.reportPeriod) {
                const start = formatDateTime(metadata.reportPeriod.startTime);
                const end = formatDateTime(metadata.reportPeriod.endTime);
                doc.text(`From: ${start}`, 14, yPos);
                yPos += 6;
                doc.text(`To: ${end}`, 14, yPos);
                yPos += 10;
            }
        }

        // Add report data based on type
        if (reportType === 'stoppage' && Array.isArray(report)) {
            // Stoppage report table
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Stoppage Details', 14, yPos);
            yPos += 10;
            
            const tableData = report.map((item, index) => [
                index + 1,
                formatTimeOnly(item.startTime),
                formatTimeOnly(item.endTime),
                formatDuration(item.duration?.seconds || 0),
                item.location?.latitude?.toFixed(6) || 'N/A',
                item.location?.longitude?.toFixed(6) || 'N/A'
            ]);
            
            doc.autoTable({
                startY: yPos,
                head: [['#', 'Start Time', 'End Time', 'Duration', 'Latitude', 'Longitude']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [239, 68, 68] },
                margin: { left: 14, right: 14 }
            });
            
            yPos = doc.lastAutoTable.finalY + 10;
            
            // Add summary
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Summary', 14, yPos);
            yPos += 8;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Total Stoppages: ${report.length}`, 14, yPos);
            yPos += 6;
            
            const totalSeconds = report.reduce((sum, item) => sum + (item.duration?.seconds || 0), 0);
            doc.text(`Total Stoppage Time: ${formatDuration(totalSeconds)}`, 14, yPos);
            
        } else if (reportType === 'ignition' && Array.isArray(report)) {
            // Ignition report table
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Ignition Sessions', 14, yPos);
            yPos += 10;
            
            const tableData = report.map((item, index) => [
                index + 1,
                formatTimeOnly(item.ignitionOnTime),
                formatTimeOnly(item.ignitionOffTime),
                formatDuration(item.duration?.seconds || 0),
                item.startLocation?.latitude?.toFixed(6) || 'N/A',
                item.startLocation?.longitude?.toFixed(6) || 'N/A',
                item.status || 'OFF'
            ]);
            
            doc.autoTable({
                startY: yPos,
                head: [['#', 'Ignition ON', 'Ignition OFF', 'Duration', 'Latitude', 'Longitude', 'Status']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246] },
                margin: { left: 14, right: 14 }
            });
            
            yPos = doc.lastAutoTable.finalY + 10;
            
            // Add summary
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Summary', 14, yPos);
            yPos += 8;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Total Ignition Sessions: ${report.length}`, 14, yPos);
            yPos += 6;
            
            const totalSeconds = report.reduce((sum, item) => sum + (item.duration?.seconds || 0), 0);
            doc.text(`Total Ignition Time: ${formatDuration(totalSeconds)}`, 14, yPos);
            
        } else if (reportType === 'idle' && Array.isArray(report)) {
            // Idle report table
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Idle Sessions', 14, yPos);
            yPos += 10;
            
            const tableData = report.map((item, index) => [
                index + 1,
                formatTimeOnly(item.startTime),
                formatTimeOnly(item.endTime),
                formatDuration(item.duration?.seconds || 0),
                item.location?.latitude?.toFixed(6) || 'N/A',
                item.location?.longitude?.toFixed(6) || 'N/A'
            ]);
            
            doc.autoTable({
                startY: yPos,
                head: [['#', 'Start Time', 'End Time', 'Duration', 'Latitude', 'Longitude']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [245, 158, 11] },
                margin: { left: 14, right: 14 }
            });
            
            yPos = doc.lastAutoTable.finalY + 10;
            
            // Add summary
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Summary', 14, yPos);
            yPos += 8;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Total Idle Sessions: ${report.length}`, 14, yPos);
            yPos += 6;
            
            if (metadata.totalIdleTime) {
                doc.text(`Total Idle Time: ${formatDuration(metadata.totalIdleTime.seconds)}`, 14, yPos);
            }
            
        } else if (reportType === 'parking' && Array.isArray(report)) {
            // Parking report table
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Parking Locations', 14, yPos);
            yPos += 10;
            
            const tableData = report.map((item, index) => [
                index + 1,
                formatTimeOnly(item.startTime),
                formatTimeOnly(item.endTime),
                formatDuration(item.duration?.seconds || 0),
                item.location?.latitude?.toFixed(6) || 'N/A',
                item.location?.longitude?.toFixed(6) || 'N/A'
            ]);
            
            doc.autoTable({
                startY: yPos,
                head: [['#', 'Start Time', 'End Time', 'Duration', 'Latitude', 'Longitude']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [139, 92, 246] },
                margin: { left: 14, right: 14 }
            });
            
            yPos = doc.lastAutoTable.finalY + 10;
            
            // Add summary
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Summary', 14, yPos);
            yPos += 8;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Total Parking Locations: ${report.length}`, 14, yPos);
            yPos += 6;
            
            if (metadata.totalParkingTime) {
                doc.text(`Total Parking Time: ${formatDuration(metadata.totalParkingTime.seconds)}`, 14, yPos);
            }
            
        } else if (reportType === 'moving' && typeof report === 'object' && report.seconds !== undefined) {
            // Moving time report (single object)
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Moving Time Summary', 14, yPos);
            yPos += 10;
            
            const tableData = [
                ['Total Moving Time', formatDuration(report.seconds || 0)],
                ['Minutes', report.minutes || 0],
                ['Seconds', (report.seconds || 0).toFixed(2)]
            ];
            
            doc.autoTable({
                startY: yPos,
                head: [['Metric', 'Value']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129] },
                margin: { left: 14, right: 14 }
            });
        } else if (typeof report === 'object' && !Array.isArray(report)) {
            // Other report types (object format)
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Report Summary', 14, yPos);
            yPos += 10;
            
            const tableData = Object.entries(report).map(([key, value]) => [
                key.replace(/([A-Z])/g, ' $1').trim(),
                typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
            ]);
            
            doc.autoTable({
                startY: yPos,
                head: [['Metric', 'Value']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246] },
                margin: { left: 14, right: 14 }
            });
        }
        
        // Add footer
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
            doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - 14, doc.internal.pageSize.height - 10, { align: 'right' });
        }
        
        // Save the PDF
        doc.save(`${reportType}_Report_${deviceInfo.deviceNo}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // --- Export Report to CSV ---
    const exportReport = (reportType) => {
        const report = reports[reportType];
        if (!report || (Array.isArray(report) && report.length === 0)) {
            alert('No data to export');
            return;
        }

        let headers = [];
        let rows = [];

        if (reportType === 'stoppage' && Array.isArray(report)) {
            headers = ['Sr.No', 'Start Time', 'End Time', 'Duration', 'Latitude', 'Longitude'];
            rows = report.map((item, index) => [
                index + 1,
                formatTimeOnly(item.startTime),
                formatTimeOnly(item.endTime),
                formatDuration(item.duration?.seconds || 0),
                item.location?.latitude || '',
                item.location?.longitude || ''
            ]);
        } else if (reportType === 'ignition' && Array.isArray(report)) {
            headers = ['Sr.No', 'Ignition ON', 'Ignition OFF', 'Duration', 'Latitude', 'Longitude', 'Status'];
            rows = report.map((item, index) => [
                index + 1,
                formatTimeOnly(item.ignitionOnTime),
                formatTimeOnly(item.ignitionOffTime),
                formatDuration(item.duration?.seconds || 0),
                item.startLocation?.latitude || '',
                item.startLocation?.longitude || '',
                item.status || 'OFF'
            ]);
        } else if (reportType === 'idle' && Array.isArray(report)) {
            headers = ['Sr.No', 'Start Time', 'End Time', 'Duration', 'Latitude', 'Longitude'];
            rows = report.map((item, index) => [
                index + 1,
                formatTimeOnly(item.startTime),
                formatTimeOnly(item.endTime),
                formatDuration(item.duration?.seconds || 0),
                item.location?.latitude || '',
                item.location?.longitude || ''
            ]);
        } else if (reportType === 'parking' && Array.isArray(report)) {
            headers = ['Sr.No', 'Start Time', 'End Time', 'Duration', 'Latitude', 'Longitude'];
            rows = report.map((item, index) => [
                index + 1,
                formatTimeOnly(item.startTime),
                formatTimeOnly(item.endTime),
                formatDuration(item.duration?.seconds || 0),
                item.location?.latitude || '',
                item.location?.longitude || ''
            ]);
        } else if (reportType === 'moving' && typeof report === 'object' && report.seconds !== undefined) {
            headers = ['Metric', 'Value'];
            rows = [
                ['Total Moving Time', formatDuration(report.seconds || 0)],
                ['Minutes', report.minutes || 0],
                ['Seconds', (report.seconds || 0).toFixed(2)]
            ];
        } else {
            // For other report types
            headers = ['Metric', 'Value'];
            rows = Object.entries(report).map(([key, value]) => [
                key.replace(/([A-Z])/g, ' $1').trim(),
                typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
            ]);
        }
        
        const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_Report_${deviceInfo.deviceNo}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
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
                body: JSON.stringify({ 
                    deviceNo: trackedDeviceNo, 
                    startTime: new Date(startTime).toISOString(), 
                    endTime: new Date(endTime).toISOString() 
                }),
            });
             
            const data = await res.json();
            
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

    // --- Report Fetch Function (Updated) ---
    const fetchReport = async (reportType, payload) => {
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

            console.log(`Sending ${reportType} request:`, payload);

            const response = await fetch(`https://api.websave.in/api/manufactur/${endpoints[reportType]}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            console.log(`${reportType} Response:`, data);
            
            if (data.success) {
                // Extract report data based on type
                let reportData, metadata = {};
                
                switch(reportType) {
                    case 'stoppage':
                        reportData = data.stoppages || [];
                        metadata = {
                            reportDate: data.reportDate,
                            reportPeriod: data.reportPeriod,
                            totalStoppages: data.totalStoppages
                        };
                        break;
                    case 'ignition':
                        reportData = data.ignitionSessions || [];
                        metadata = {
                            reportDate: data.reportDate,
                            reportPeriod: data.reportPeriod
                        };
                        break;
                    case 'moving':
                        reportData = data.movingTime || {};
                        metadata = {
                            reportDate: data.reportDate,
                            reportPeriod: data.reportPeriod
                        };
                        break;
                    case 'idle':
                        reportData = data.idleSessions || [];
                        metadata = {
                            reportDate: data.reportDate,
                            reportPeriod: data.reportPeriod,
                            totalIdleTime: data.totalIdleTime
                        };
                        break;
                    case 'parking':
                        reportData = data.parkingLocations || [];
                        metadata = {
                            reportDate: data.reportDate,
                            reportPeriod: data.reportPeriod,
                            totalParkingTime: data.totalParkingTime
                        };
                        break;
                    default:
                        reportData = data.data || data;
                        metadata = {
                            reportDate: data.reportDate,
                            reportPeriod: data.reportPeriod
                        };
                }
                
                setReports(prev => ({
                    ...prev,
                    [reportType]: reportData
                }));
                
                setReportMetadata(prev => ({
                    ...prev,
                    [reportType]: metadata
                }));
                
                setShowReportModal(false);
            } else {
                alert(data.message || `No ${reportType} data found`);
                setReports(prev => ({ ...prev, [reportType]: null }));
            }
        } catch (error) {
            console.error(`Error fetching ${reportType} report:`, error);
            alert(`Failed to fetch ${reportType} report`);
        } finally {
            setLoadingReports(prev => ({ ...prev, [reportType]: false }));
        }
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

    const toggleReportSection = (section) => {
        setExpandedReports(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const openReportModal = (reportType) => {
        setActiveReportType(reportType);
        setShowReportModal(true);
    };

    // --- Render report content based on type ---
    const renderReportContent = (reportType) => {
        const report = reports[reportType];
        const loading = loadingReports[reportType];

        if (loading) {
            return (
                <div className="p-4 flex justify-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                </div>
            );
        }

        if (!report || (Array.isArray(report) && report.length === 0)) {
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

        if (reportType === 'stoppage' && Array.isArray(report)) {
            return (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {report.slice(0, 3).map((item, index) => (
                        <div 
                            key={index}
                            className={`p-2 rounded-lg border cursor-pointer hover:bg-slate-50 ${
                                selectedReportItem === item ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 border-slate-100'
                            }`}
                            onClick={() => setSelectedReportItem(item)}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <StopCircle className="w-3 h-3 text-red-500" />
                                    <span className="text-[9px] font-bold text-slate-700">
                                        Stoppage #{index + 1}
                                    </span>
                                </div>
                                <span className="text-[8px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                                    {formatShortDuration(item.duration?.seconds || 0)}
                                </span>
                            </div>
                            <div className="text-[8px] text-slate-600 mt-1">
                                <div className="flex justify-between">
                                    <span>Start: {formatTimeOnly(item.startTime)}</span>
                                    <span>End: {formatTimeOnly(item.endTime)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {report.length > 3 && (
                        <p className="text-[8px] text-slate-500 text-center">+ {report.length - 3} more stoppages</p>
                    )}
                </div>
            );
        } else if (reportType === 'ignition' && Array.isArray(report)) {
            return (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {report.slice(0, 3).map((item, index) => (
                        <div 
                            key={index}
                            className={`p-2 rounded-lg border cursor-pointer hover:bg-slate-50 ${
                                selectedReportItem === item ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 border-slate-100'
                            }`}
                            onClick={() => setSelectedReportItem(item)}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Power className="w-3 h-3 text-blue-500" />
                                    <span className="text-[9px] font-bold text-slate-700">
                                        Session #{index + 1}
                                    </span>
                                </div>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                    item.status === 'Still ON' 
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-blue-100 text-blue-600'
                                }`}>
                                    {formatShortDuration(item.duration?.seconds || 0)}
                                </span>
                            </div>
                            <div className="text-[8px] text-slate-600 mt-1">
                                <div className="flex justify-between">
                                    <span>ON: {formatTimeOnly(item.ignitionOnTime)}</span>
                                    <span>OFF: {item.status === 'Still ON' ? 'Still ON' : formatTimeOnly(item.ignitionOffTime)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {report.length > 3 && (
                        <p className="text-[8px] text-slate-500 text-center">+ {report.length - 3} more sessions</p>
                    )}
                </div>
            );
        } else if (reportType === 'idle' && Array.isArray(report)) {
            return (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {report.slice(0, 3).map((item, index) => (
                        <div 
                            key={index}
                            className={`p-2 rounded-lg border cursor-pointer hover:bg-slate-50 ${
                                selectedReportItem === item ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 border-slate-100'
                            }`}
                            onClick={() => setSelectedReportItem(item)}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-yellow-500" />
                                    <span className="text-[9px] font-bold text-slate-700">
                                        Idle #{index + 1}
                                    </span>
                                </div>
                                <span className="text-[8px] font-bold bg-yellow-100 text-yellow-600 px-1.5 py-0.5 rounded">
                                    {formatShortDuration(item.duration?.seconds || 0)}
                                </span>
                            </div>
                            <div className="text-[8px] text-slate-600 mt-1">
                                <div className="flex justify-between">
                                    <span>Start: {formatTimeOnly(item.startTime)}</span>
                                    <span>End: {formatTimeOnly(item.endTime)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {report.length > 3 && (
                        <p className="text-[8px] text-slate-500 text-center">+ {report.length - 3} more idle sessions</p>
                    )}
                </div>
            );
        } else if (reportType === 'parking' && Array.isArray(report)) {
            return (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {report.slice(0, 3).map((item, index) => (
                        <div 
                            key={index}
                            className={`p-2 rounded-lg border cursor-pointer hover:bg-slate-50 ${
                                selectedReportItem === item ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 border-slate-100'
                            }`}
                            onClick={() => setSelectedReportItem(item)}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <ParkingCircle className="w-3 h-3 text-purple-500" />
                                    <span className="text-[9px] font-bold text-slate-700">
                                        Parking #{index + 1}
                                    </span>
                                </div>
                                <span className="text-[8px] font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">
                                    {formatShortDuration(item.duration?.seconds || 0)}
                                </span>
                            </div>
                            <div className="text-[8px] text-slate-600 mt-1">
                                <div className="flex justify-between">
                                    <span>Start: {formatTimeOnly(item.startTime)}</span>
                                    <span>End: {formatTimeOnly(item.endTime)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {report.length > 3 && (
                        <p className="text-[8px] text-slate-500 text-center">+ {report.length - 3} more parking locations</p>
                    )}
                </div>
            );
        } else if (reportType === 'moving' && typeof report === 'object' && report.seconds !== undefined) {
            return (
                <div className="grid grid-cols-2 gap-2 p-2">
                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                        <p className="text-[8px] font-bold text-slate-500 uppercase">Moving Time</p>
                        <p className="text-[10px] font-bold text-slate-900">{formatShortDuration(report.seconds || 0)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                        <p className="text-[8px] font-bold text-slate-500 uppercase">Minutes</p>
                        <p className="text-[10px] font-bold text-slate-900">{report.minutes || 0}</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-2 gap-2 p-2">
                {Object.entries(report).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                        <p className="text-[8px] font-bold text-slate-500 uppercase">{key.replace(/([A-Z])/g, ' $1').trim().slice(0, 15)}</p>
                        <p className="text-[10px] font-bold text-slate-900">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value).slice(0, 10)}</p>
                    </div>
                ))}
            </div>
        );
    };

    // --- Render report summary (compact view) ---
    const renderReportSummary = (reportType) => {
        const report = reports[reportType];
        const metadata = reportMetadata[reportType];

        if (!report) return null;

        if (reportType === 'stoppage' && Array.isArray(report)) {
            const totalSeconds = report.reduce((sum, item) => sum + (item.duration?.seconds || 0), 0);
            return (
                <div className="text-[8px] text-slate-500">
                    {report.length} stops • {formatShortDuration(totalSeconds)}
                </div>
            );
        } else if (reportType === 'ignition' && Array.isArray(report)) {
            const totalSeconds = report.reduce((sum, item) => sum + (item.duration?.seconds || 0), 0);
            return (
                <div className="text-[8px] text-slate-500">
                    {report.length} sessions • {formatShortDuration(totalSeconds)}
                </div>
            );
        } else if (reportType === 'idle' && Array.isArray(report)) {
            const totalSeconds = metadata?.totalIdleTime?.seconds || 
                               report.reduce((sum, item) => sum + (item.duration?.seconds || 0), 0);
            return (
                <div className="text-[8px] text-slate-500">
                    {report.length} sessions • {formatShortDuration(totalSeconds)}
                </div>
            );
        } else if (reportType === 'parking' && Array.isArray(report)) {
            const totalSeconds = metadata?.totalParkingTime?.seconds || 
                               report.reduce((sum, item) => sum + (item.duration?.seconds || 0), 0);
            return (
                <div className="text-[8px] text-slate-500">
                    {report.length} locations • {formatShortDuration(totalSeconds)}
                </div>
            );
        } else if (reportType === 'moving' && typeof report === 'object' && report.seconds !== undefined) {
            return (
                <div className="text-[8px] text-slate-500">
                    {formatShortDuration(report.seconds || 0)} total
                </div>
            );
        }

        return (
            <div className="text-[8px] text-slate-500">
                Data loaded
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
                        <div className="flex flex-wrap items-center gap-3 mt-6 md:mt-0">
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
                            <input 
                                type="datetime-local" 
                                className="w-full p-3 bg-slate-50 border rounded-xl text-xs outline-none focus:ring-2 ring-indigo-500" 
                                value={startTime} 
                                onChange={e => setStartTime(e.target.value)} 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block">End Time</label>
                            <input 
                                type="datetime-local" 
                                className="w-full p-3 bg-slate-50 border rounded-xl text-xs outline-none focus:ring-2 ring-indigo-500" 
                                value={endTime} 
                                onChange={e => setEndTime(e.target.value)} 
                            />
                        </div>
                        <button 
                            onClick={handleFetchPlayback} 
                            disabled={loadingPlayback} 
                            className="bg-slate-900 text-white p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                        >
                            {loadingPlayback ? <RefreshCw className="animate-spin" size={16}/> : <History size={16}/>} 
                            Load Route
                        </button>
                        {isPlaybackMode && (
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setIsPlaying(!isPlaying)} 
                                    className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                                >
                                    {isPlaying ? <Pause size={16}/> : <Play size={16}/>} 
                                    {isPlaying ? 'Pause' : 'Play'}
                                </button>
                                <button 
                                    onClick={() => {setIsPlaying(false); setPlaybackIndex(0);}} 
                                    className="bg-slate-100 text-slate-600 p-3 rounded-xl hover:bg-slate-200"
                                >
                                    <Square size={16} fill="currentColor"/>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-350px)] min-h-[500px]">
                        {/* LEFT: MAP */}
                        <div className="lg:col-span-7 bg-white rounded-[2.5rem] p-3 shadow-xl border border-slate-200 relative overflow-hidden flex flex-col">
                            <div className="flex-1 rounded-[2rem] overflow-hidden z-20">
                                {displayData ? (
                                    <MapContainer center={[displayData.lat || displayData.position?.lat, displayData.lng || displayData.position?.lng]} zoom={16} zoomControl={false} style={{ height: "100%", width: "100%" }}>
                                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                        {isPlaybackMode && playbackPath.length > 0 && (
                                            <Polyline positions={playbackPath.map(p => [p.lat, p.lng])} color="#6366f1" weight={5} opacity={0.6} />
                                        )}
                                        <Marker 
                                            position={[displayData.lat || displayData.position?.lat, displayData.lng || displayData.position?.lng]} 
                                            icon={carIcon(displayData.heading, isPlaybackMode)}
                                        >
                                            <Popup>
                                                <div className="p-1">
                                                    <p className="font-black text-xs uppercase">{deviceInfo.vehicleNo}</p>
                                                    <p className="font-bold text-indigo-600 text-[10px]">{displayData.speed} KM/H</p>
                                                    {isPlaybackMode && (
                                                        <p className="text-[9px] text-slate-400 mt-1">
                                                            {new Date(displayData.timestamp).toLocaleString()}
                                                        </p>
                                                    )}
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
                        <div className="lg:col-span-5 flex flex-col gap-4">
                            {/* Vehicle Stats Row */}
                            <div className="grid grid-cols-4 gap-3">
                                <StatCard 
                                    icon={<Gauge size={14} className="text-amber-500"/>} 
                                    label="Speed" 
                                    val={displayData?.speed || 0} 
                                    unit="km/h" 
                                    color="text-amber-500" 
                                    bg="bg-amber-50" 
                                />
                                <StatCard 
                                    icon={<Compass size={14} className="text-blue-500"/>} 
                                    label="Heading" 
                                    val={displayData?.heading || 0} 
                                    unit="°" 
                                    color="text-blue-500" 
                                    bg="bg-blue-50" 
                                />
                                <StatCard 
                                    icon={<BatteryCharging size={14} className="text-green-500"/>} 
                                    label="Battery" 
                                    val={vehicleData?.battery || 0} 
                                    unit="V" 
                                    color="text-green-500" 
                                    bg="bg-green-50" 
                                />
                                <StatCard 
                                    icon={<Signal size={14} className="text-purple-500"/>} 
                                    label="Signal" 
                                    val={vehicleData?.signal || 0} 
                                    unit="%" 
                                    color="text-purple-500" 
                                    bg="bg-purple-50" 
                                />
                            </div>

                            {/* Location Info Card */}
                            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <MapPin className="w-4 h-4 text-indigo-500" />
                                    <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Location</h4>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-slate-500">Latitude:</span>
                                        <span className="text-[10px] font-bold text-slate-900">
                                            {displayData?.lat || displayData?.position?.lat || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-slate-500">Longitude:</span>
                                        <span className="text-[10px] font-bold text-slate-900">
                                            {displayData?.lng || displayData?.position?.lng || 'N/A'}
                                        </span>
                                    </div>
                                    {displayData?.lat && displayData?.lng && (
                                        <MapAddress 
                                            lat={displayData.lat || displayData.position?.lat} 
                                            lng={displayData.lng || displayData.position?.lng} 
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Reports Dashboard */}
                            <div className="flex-1 bg-white rounded-[2rem] p-4 border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                                            <BarChart3 className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                                            Reports Dashboard
                                        </h4>
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
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] font-bold text-slate-900 capitalize truncate">
                                                            {type.charAt(0).toUpperCase() + type.slice(1)} Report
                                                        </p>
                                                        {renderReportSummary(type)}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {reports[type] && (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    exportReport(type);
                                                                }}
                                                                className="p-1 bg-slate-200 hover:bg-slate-300 rounded-lg"
                                                                title="Download CSV"
                                                            >
                                                                <Download className="w-3 h-3 text-slate-600" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    generatePDFReport(type);
                                                                }}
                                                                className="p-1 bg-rose-100 hover:bg-rose-200 rounded-lg"
                                                                title="Download PDF"
                                                            >
                                                                <Printer className="w-3 h-3 text-rose-600" />
                                                            </button>
                                                        </>
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
                                                    <span className="text-right">
                                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Playback Progress */}
                            {isPlaybackMode && (
                                <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                        <History className="w-4 h-4 opacity-50"/>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
                                            Playback Progress
                                        </p>
                                    </div>
                                    <p className="text-xl font-black">
                                        {playbackIndex + 1} / {playbackPath.length}
                                    </p>
                                    <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
                                        <div 
                                            className="bg-white h-full" 
                                            style={{ width: `${((playbackIndex + 1) / playbackPath.length) * 100}%` }}
                                        ></div>
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

            <div className='z-40 mt-52'>
                {/* <VehicleDataTable/> */}
                <SocketClient/>
            </div>
        </>
    );
};

const StatCard = ({ icon, label, val, unit, color, bg }) => (
    <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
        <div className={`p-2 rounded-xl ${bg} ${color}`}>{icon}</div>
        <div className="min-w-0 flex-1">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 truncate">{label}</p>
            <p className="text-lg font-black text-slate-900 leading-none truncate">{val ?? '--'} <span className="text-[9px] font-bold text-slate-400">{unit}</span></p>
        </div>
    </div>
);

export default Livetracking;