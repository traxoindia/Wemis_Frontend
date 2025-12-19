import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    Car, Navigation, Zap, Satellite, 
    Battery, Signal, Clock, AlertCircle, RefreshCw,
    Play, Pause, Square, History, Calendar
} from "lucide-react";

// --- Map Imports ---
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import your car logo image
import vehicleLogo from '../Images/car.png';
import Navbar from './Navbar';

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

    // --- Playback Animation Loop ---
    useEffect(() => {
        if (isPlaying && playbackIndex < playbackPath.length - 1) {
            playbackTimer.current = setTimeout(() => {
                setPlaybackIndex(prev => prev + 1);
            }, 500); // Animation speed 500ms per point
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

    if (!trackedDeviceNo) return <div className="h-screen flex items-center justify-center bg-slate-100"><AlertCircle size={48} className="text-red-500 animate-pulse"/></div>;

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

                        {/* Status and Mode Switcher */}
                        <div className="flex items-center gap-4 mt-6 md:mt-0">
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
                        <div className="lg:col-span-9 bg-white rounded-[2.5rem] p-3 shadow-xl border border-slate-200 relative overflow-hidden flex flex-col">
                            <div className="flex-1 rounded-[2rem] overflow-hidden">
                                {displayData ? (
                                    <MapContainer center={[displayData.lat || displayData.position?.lat, displayData.lng || displayData.position?.lng]} zoom={16} zoomControl={false} style={{ height: "100%", width: "100%" }}>
                                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                        
                                        {/* Playback Route Line */}
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

                        {/* RIGHT: STATS */}
                        <div className="lg:col-span-3 space-y-4 flex flex-col">
                            <StatCard icon={<Zap size={20}/>} label="Speed" val={displayData?.speed} unit="KM/H" color="text-amber-500" bg="bg-amber-50" />
                            {!isPlaybackMode ? (
                                <>
                                    <StatCard icon={<Satellite size={20}/>} label="Sats" val={vehicleData?.satellites} unit="SATS" color="text-blue-500" bg="bg-blue-50" />
                                    <StatCard icon={<Battery size={20}/>} label="Power" val={vehicleData?.mains} unit="V" color="text-emerald-500" bg="bg-emerald-50" />
                                </>
                            ) : (
                                <div className="bg-indigo-600 text-white p-6 rounded-[2rem] shadow-lg">
                                    <History size={24} className="mb-2 opacity-50"/>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Playback Progress</p>
                                    <p className="text-2xl font-black mt-1">{playbackIndex + 1} / {playbackPath.length}</p>
                                    <div className="w-full bg-white/20 h-1.5 rounded-full mt-4 overflow-hidden">
                                        <div className="bg-white h-full" style={{ width: `${((playbackIndex + 1) / playbackPath.length) * 100}%` }}></div>
                                    </div>
                                </div>
                            )}
                            <div className="flex-1 bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex flex-col justify-center">
                                <div className="text-center">
                                    <Clock size={32} className="mx-auto text-slate-200 mb-2" />
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Log</h4>
                                    <div className="mt-4 space-y-2 text-left">
                                        <LogItem label="Status" val={isPlaybackMode ? 'History Replay' : 'Live Data'} />
                                        {!isPlaybackMode && <LogItem label="Ignition" val={rawData?.ignition === '1' ? 'ON' : 'OFF'} />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

const StatCard = ({ icon, label, val, unit, color, bg }) => (
    <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${bg} ${color}`}>{icon}</div>
        <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-xl font-black text-slate-900 leading-none">{val ?? '--'} <span className="text-[10px] font-bold text-slate-400">{unit}</span></p>
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