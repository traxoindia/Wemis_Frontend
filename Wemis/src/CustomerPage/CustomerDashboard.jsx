// import React, { useEffect, useRef, useState } from "react";
// import { io } from "socket.io-client";
// import "leaflet/dist/leaflet.css";

// // --- CUSTOM IMAGE ---
// import vehicleLogo from "../Images/car.png";

// // --- ICONS ---
// import {
//   Car,
//   MapPin,
//   Gauge,
//   Power,
//   RefreshCw,
//   Search,
//   Wifi,
//   Package,
//   Clock,
//   Navigation,
//   XCircle,
//   ArrowLeft,
//   BatteryCharging,
//   Signal,
//   Compass,
//   Download,
//   Play,
//   Pause,
//   History,
//   Calendar,
//   MoreHorizontal,
// } from "lucide-react";

// // --- CONFIG ---
// const SOCKET_SERVER_URL = "https://api.websave.in";
// const ANIMATION_DURATION = 2000; // 2 Seconds per movement

// // --- HELPER: Create Rotatable Map Icon ---
// const createVehicleIcon = (heading) => {
//   return `
//     <div style="
//       transform: rotate(${heading}deg); 
//       width: 100%; 
//       height: 100%; 
//       display: flex; 
//       align-items: center; 
//       justify-content: center;
//       transition: transform 0.5s linear; /* Smooth rotation via CSS */
//     ">
//       <img src="${vehicleLogo}" style="width: 40px; height: 40px; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));" />
//     </div>
//   `;
// };

// // --- COMPONENT: Stat Card ---
// const StatCard = ({ icon, label, val, color, bg, border }) => (
//   <div
//     className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden group`}
//   >
//     <div className={`absolute left-0 top-0 bottom-0 w-1 ${border}`}></div>
//     <div>
//       <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
//         {label}
//       </div>
//       <div className="text-3xl font-black text-slate-800 tracking-tight">
//         {val}
//       </div>
//     </div>
//     <div
//       className={`${bg} p-3 rounded-2xl ${color} group-hover:scale-110 transition-transform duration-300`}
//     >
//       {icon}
//     </div>
//   </div>
// );

// // --- COMPONENT: Address Lookup ---
// const MapAddress = ({ lat, lng }) => {
//   const [address, setAddress] = useState("Locating...");

//   useEffect(() => {
//     const getAddress = async () => {
//       if (!lat || !lng) return;
//       try {
//         const res = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
//           {
//             headers: { "Accept-Language": "en" },
//           },
//         );
//         const data = await res.json();
//         setAddress(data.display_name || "Unknown Location");
//       } catch (error) {
//         setAddress("Location Unavailable");
//       }
//     };
//     getAddress();
//   }, [lat, lng]);

//   return (
//     <div className="mt-3 p-3 bg-slate-50/80 backdrop-blur-sm rounded-xl border border-slate-100 flex gap-3 items-start">
//       <MapPin className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
//       <p className="text-xs font-medium text-slate-600 leading-snug line-clamp-2">
//         {address}
//       </p>
//     </div>
//   );
// };

// const CustomerDashboard = () => {
//   const socketRef = useRef(null);

//   // --- Leaflet Refs ---
//   const mapContainerRef = useRef(null);
//   const leafletMapRef = useRef(null);
//   const vehicleMarkerRef = useRef(null);
//   const livePathRef = useRef(null);
//   const playbackMarkerRef = useRef(null);
//   const playbackPathRef = useRef(null);
//   const previousPositionsRef = useRef([]);

//   // --- Animation Refs ---
//   const moveAnimationRef = useRef(null);
//   const animationFrameRef = useRef(null);

//   // --- State Logic Refs (Crucial for Animation Stability) ---
//   const selectedDeviceIdRef = useRef(null); // Keeps track of ID without re-rendering socket

//   // --- Main State ---
//   const [devices, setDevices] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedDevice, setSelectedDevice] = useState(null);
//   const [summary, setSummary] = useState({
//     total: 0,
//     online: 0,
//     offline: 0,
//     moving: 0,
//     stopped: 0,
//   });

//   // --- Playback State ---
//   const [isPlaybackMode, setIsPlaybackMode] = useState(false);
//   const [playbackStartTime, setPlaybackStartTime] = useState("");
//   const [playbackEndTime, setPlaybackEndTime] = useState("");
//   const [playbackRoute, setPlaybackRoute] = useState([]);
//   const [playbackIndex, setPlaybackIndex] = useState(0);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [playbackSpeed, setPlaybackSpeed] = useState(1);
//   const [isLoadingPlayback, setIsLoadingPlayback] = useState(false);

//   // --- Sync Ref with State ---
//   useEffect(() => {
//     selectedDeviceIdRef.current = selectedDevice
//       ? selectedDevice.deviceNo
//       : null;
//   }, [selectedDevice]);

//   // --- Helper: Extract data ---
//   const extractSocketData = (data) => {
//     const liveData = data.liveTracking || data;
    
//     const deviceInfo = data.dev || {};
//     return {
//       deviceNo: data.deviceNo || liveData.deviceNo || liveData.deviceId,
//       lat: Number(liveData.lat),
//       lng: Number(liveData.lng),
//       speed: Number(liveData.speed || 0),
//       heading: Number(liveData.headDegree || liveData.heading || 0),
//       ignition: liveData.ignition || "0",
//       gpsFix: liveData.gpsFix || "0",
//       satellites: liveData.satellites || "0",
//       gsmSignal: liveData.gsmSignal || "0",
//       externalBattery: parseFloat(
//         liveData.batteryVoltage || liveData.mainsVoltage || 0,
//       ),
//       vechileNo: deviceInfo.vechileNo || liveData.vehicleNo || "Unknown",
//       status: data.status || (liveData.gpsFix === "1" ? "online" : "offline"),
//       lastUpdate:
//         liveData.lastUpdate || liveData.timestamp || new Date().toISOString(),
//     };
//   };

//   // --- ANIMATION FUNCTION (Live Movement) ---
//   const animateMarkerTo = (endLat, endLng, heading) => {
//     if (!vehicleMarkerRef.current) return;

//     const startLatLng = vehicleMarkerRef.current.getLatLng();
//     const startLat = startLatLng.lat;
//     const startLng = startLatLng.lng;

//     // If distance is huge (e.g., initial load or teleport), just jump
//     const dist = Math.sqrt(
//       Math.pow(endLat - startLat, 2) + Math.pow(endLng - startLng, 2),
//     );
//     if (dist > 0.05) {
//       vehicleMarkerRef.current.setLatLng([endLat, endLng]);
//       return;
//     }

//     const deltaLat = endLat - startLat;
//     const deltaLng = endLng - startLng;
//     const startTime = performance.now();

//     // Kill existing animation
//     if (moveAnimationRef.current) {
//       cancelAnimationFrame(moveAnimationRef.current);
//     }

//     const animate = (currentTime) => {
//       const elapsed = currentTime - startTime;
//       const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

//       // Calculate new position
//       const currentLat = startLat + deltaLat * progress;
//       const currentLng = startLng + deltaLng * progress;

//       vehicleMarkerRef.current.setLatLng([currentLat, currentLng]);

//       if (progress < 1) {
//         moveAnimationRef.current = requestAnimationFrame(animate);
//       } else {
//         // Finish exactly at target
//         vehicleMarkerRef.current.setLatLng([endLat, endLng]);

//         // Update Rotation Icon
//         const iconHtml = createVehicleIcon(heading);
//         const newIcon = window.L.divIcon({
//           className: "vehicle-marker",
//           html: iconHtml,
//           iconSize: [40, 40],
//           iconAnchor: [20, 20],
//         });
//         vehicleMarkerRef.current.setIcon(newIcon);
//       }
//     };

//     moveAnimationRef.current = requestAnimationFrame(animate);
//   };

//   // --- 1. SOCKET & LIVE DATA ---
//   useEffect(() => {
//     // Only connect once
//     if (socketRef.current) return;

//     const storedUser = localStorage.getItem("user");
//     let myUserId;
//     try {
//       myUserId = JSON.parse(storedUser)?._id || JSON.parse(storedUser)?.id;
//     } catch (e) { }

//     const socket = io(SOCKET_SERVER_URL, {
//       path: "/socket.io",
//       transports: ["polling", "websocket"],
//       query: { userId: myUserId },
//     });

//     socketRef.current = socket;

//     socket.on("gps-update", (data) => {
      
//       const extractedData = extractSocketData(data);

//       // 1. Update List Data (Always)
//       setDevices((prev) => {
//         const updated = {
//           ...prev,
//           [extractedData.deviceNo]: {
//             ...prev[extractedData.deviceNo],
//             ...extractedData,
//             lastUpdate: new Date().toISOString(),
//           },
//         };
//         updateSummary(Object.values(updated));
//         return updated;
//       });

//       // 2. Update Map Animation (Only if matches currently selected ID)
//       // WE USE THE REF HERE TO AVOID RE-RENDERING THE SOCKET EFFECT
//       if (
//         selectedDeviceIdRef.current === extractedData.deviceNo &&
//         !isPlaybackMode
//       ) {
//         // Update State for Stats Panel
//         setSelectedDevice((prev) => ({ ...prev, ...extractedData }));

//         // Update Map Visuals
//         if (leafletMapRef.current && vehicleMarkerRef.current) {
//           const newLatLng = [extractedData.lat, extractedData.lng];

//           // Path Logic
//           previousPositionsRef.current.push(newLatLng);
//           if (previousPositionsRef.current.length > 100) {
//             previousPositionsRef.current =
//               previousPositionsRef.current.slice(-100);
//           }

//           if (livePathRef.current) {
//             livePathRef.current.setLatLngs(previousPositionsRef.current);
//           } else if (previousPositionsRef.current.length > 1) {
//             livePathRef.current = window.L.polyline(
//               previousPositionsRef.current,
//               {
//                 color: "#3B82F6",
//                 weight: 3,
//                 opacity: 0.7,
//                 lineJoin: "round",
//                 dashArray: "5, 10",
//               },
//             ).addTo(leafletMapRef.current);
//           }

//           // TRIGGER SMOOTH ANIMATION
//           animateMarkerTo(
//             extractedData.lat,
//             extractedData.lng,
//             extractedData.heading,
//           );

//           // Smooth Camera Pan
//           leafletMapRef.current.panTo(newLatLng, {
//             animate: true,
//             duration: 2.0,
//           });
//         }
//       }
//     });

//     return () => {
//       if (socketRef.current) {
//         socketRef.current.disconnect();
//         socketRef.current = null;
//       }
//       if (moveAnimationRef.current)
//         cancelAnimationFrame(moveAnimationRef.current);
//       if (animationFrameRef.current)
//         cancelAnimationFrame(animationFrameRef.current);
//     };
//   }, []); // EMPTY DEPENDENCY ARRAY - CRITICAL FOR ANIMATION

//   // --- 3. PLAYBACK API & SETUP ---
//   const fetchRoutePlayback = async () => {
//     if (!selectedDevice?.deviceNo || !playbackStartTime || !playbackEndTime) {
//       alert("Please select date range");
//       return;
//     }

//     setIsLoadingPlayback(true);
//     const token = localStorage.getItem("token");

//     try {
//       const response = await fetch(
//         "https://api.websave.in/api/manufactur/fetchSingleRoutePlayback",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             deviceNo: selectedDevice.deviceNo,
//             startTime: new Date(playbackStartTime).toISOString(),
//             endTime: new Date(playbackEndTime).toISOString(),
//           }),
//         },
//       );
//       const data = await response.json();
     

//       if (data.success && data.route?.length > 0) {
//         const cleanRoute = data.route
//           .map((p) => ({
//             ...p,
//             lat: parseFloat(p.latitude || p.lat),
//             lng: parseFloat(p.longitude || p.lng),
//             speed: parseFloat(p.speed || 0),
//             heading: parseFloat(p.heading || p.headDegree || 0),
//             timestamp: p.timestamp || p.lastUpdate,
//           }))
//           .filter((p) => !isNaN(p.lat) && !isNaN(p.lng));

//         setPlaybackRoute(cleanRoute);
//         setIsPlaybackMode(true);
//         setIsPlaying(true);
//         setupPlaybackVisualization(cleanRoute);
//       } else {
//         alert("No route data found for this period.");
//       }
//     } catch (e) {
//       console.error("Playback fetch error:", e);
//       alert("Failed to fetch history");
//     } finally {
//       setIsLoadingPlayback(false);
//     }
//   };

//   const setupPlaybackVisualization = (route) => {
//     const L = window.L;
//     if (!L || !leafletMapRef.current || route.length === 0) return;

//     if (vehicleMarkerRef.current) vehicleMarkerRef.current.setOpacity(0);
//     if (livePathRef.current) {
//       leafletMapRef.current.removeLayer(livePathRef.current);
//       livePathRef.current = null;
//     }
//     if (moveAnimationRef.current)
//       cancelAnimationFrame(moveAnimationRef.current);

//     if (playbackMarkerRef.current)
//       leafletMapRef.current.removeLayer(playbackMarkerRef.current);
//     if (playbackPathRef.current)
//       leafletMapRef.current.removeLayer(playbackPathRef.current);

//     const points = route.map((p) => [p.lat, p.lng]);
//     playbackPathRef.current = L.polyline(points, {
//       color: "#DC2626",
//       weight: 4,
//       opacity: 0.8,
//     }).addTo(leafletMapRef.current);
//     leafletMapRef.current.fitBounds(L.latLngBounds(points), {
//       padding: [50, 50],
//     });

//     const startPoint = route[0];
//     const pbIcon = L.divIcon({
//       className: "playback-marker",
//       html: createVehicleIcon(startPoint.heading),
//       iconSize: [40, 40],
//       iconAnchor: [20, 20],
//     });
//     playbackMarkerRef.current = L.marker([startPoint.lat, startPoint.lng], {
//       icon: pbIcon,
//       zIndexOffset: 9999,
//     }).addTo(leafletMapRef.current);
//     setPlaybackIndex(0);
//   };

//   // --- 4. PLAYBACK ANIMATION LOOP ---
//   useEffect(() => {
//     let lastFrameTime = 0;
//     const animate = (timestamp) => {
//       if (!lastFrameTime) lastFrameTime = timestamp;
//       const interval = 1000 / (5 * playbackSpeed);

//       if (timestamp - lastFrameTime > interval) {
//         setPlaybackIndex((prev) => {
//           if (prev >= playbackRoute.length - 1) {
//             setIsPlaying(false);
//             return prev;
//           }
//           return prev + 1;
//         });
//         lastFrameTime = timestamp;
//       }
//       if (isPlaying && isPlaybackMode)
//         animationFrameRef.current = requestAnimationFrame(animate);
//     };

//     if (isPlaying && isPlaybackMode && playbackRoute.length > 0) {
//       animationFrameRef.current = requestAnimationFrame(animate);
//     } else {
//       cancelAnimationFrame(animationFrameRef.current);
//     }
//     return () => cancelAnimationFrame(animationFrameRef.current);
//   }, [isPlaying, isPlaybackMode, playbackRoute, playbackSpeed]);

//   // --- 5. UPDATE PLAYBACK MARKER ---
//   useEffect(() => {
//     if (
//       isPlaybackMode &&
//       playbackRoute[playbackIndex] &&
//       playbackMarkerRef.current
//     ) {
//       const point = playbackRoute[playbackIndex];
//       playbackMarkerRef.current.setLatLng([point.lat, point.lng]);
//       const iconHtml = createVehicleIcon(point.heading);
//       const newIcon = window.L.divIcon({
//         className: "playback-marker",
//         html: iconHtml,
//         iconSize: [40, 40],
//         iconAnchor: [20, 20],
//       });
//       playbackMarkerRef.current.setIcon(newIcon);
//     }
//   }, [playbackIndex, isPlaybackMode, playbackRoute]);

//   const exitPlaybackMode = () => {
//     setIsPlaying(false);
//     setIsPlaybackMode(false);
//     setPlaybackRoute([]);
//     setPlaybackIndex(0);

//     if (leafletMapRef.current) {
//       if (playbackMarkerRef.current) {
//         leafletMapRef.current.removeLayer(playbackMarkerRef.current);
//         playbackMarkerRef.current = null;
//       }
//       if (playbackPathRef.current) {
//         leafletMapRef.current.removeLayer(playbackPathRef.current);
//         playbackPathRef.current = null;
//       }

//       if (vehicleMarkerRef.current && selectedDevice) {
//         vehicleMarkerRef.current.setOpacity(1);
//         const livePos = [selectedDevice.lat, selectedDevice.lng];
//         vehicleMarkerRef.current.setLatLng(livePos);

//         if (previousPositionsRef.current.length > 1 && !livePathRef.current) {
//           livePathRef.current = window.L.polyline(
//             previousPositionsRef.current,
//             { color: "#3B82F6", weight: 3, opacity: 0.7, dashArray: "5, 10" },
//           ).addTo(leafletMapRef.current);
//         }
//         leafletMapRef.current.panTo(livePos);
//       }
//     }
//   };

//   // --- 6. MAP INIT ---
//   const initMap = () => {
//     if (!mapContainerRef.current || leafletMapRef.current) return;
//     const L = window.L;
//     if (!L) return;

//     const startLat = selectedDevice?.lat || 21.485926;
//     const startLng = selectedDevice?.lng || 86.907545;
//     const startHeading = selectedDevice?.heading || 0;

//     const map = L.map(mapContainerRef.current, {
//       center: [startLat, startLng],
//       zoom: 16,
//       zoomControl: false,
//       attributionControl: false,
//       doubleClickZoom: true,
//       scrollWheelZoom: true,
//     });

//     L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
//       maxZoom: 20,
//       subdomains: ["mt0", "mt1", "mt2", "mt3"],
//     }).addTo(map);

//     L.control.zoom({ position: "bottomright" }).addTo(map);
//     leafletMapRef.current = map;

//     const initialIcon = L.divIcon({
//       className: "vehicle-marker",
//       html: createVehicleIcon(startHeading),
//       iconSize: [40, 40],
//       iconAnchor: [20, 20],
//     });

//     const marker = L.marker([startLat, startLng], {
//       icon: initialIcon,
//       zIndexOffset: 1000,
//     }).addTo(map);
//     vehicleMarkerRef.current = marker;
//     previousPositionsRef.current = [[startLat, startLng]];
//   };

//   // --- 7. LOAD LEAFLET ---
//   useEffect(() => {
//     if (!selectedDevice) {
//       if (leafletMapRef.current) {
//         leafletMapRef.current.remove();
//         leafletMapRef.current = null;
//         vehicleMarkerRef.current = null;
//         livePathRef.current = null;
//         previousPositionsRef.current = [];
//       }
//       return;
//     }

//     if (!document.getElementById("leaflet-css")) {
//       const link = document.createElement("link");
//       link.id = "leaflet-css";
//       link.rel = "stylesheet";
//       link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
//       document.head.appendChild(link);
//     }

//     if (!window.L) {
//       const script = document.createElement("script");
//       script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
//       script.async = true;
//       script.onload = () => {
//         setTimeout(() => initMap(), 100);
//       };
//       document.body.appendChild(script);
//     } else {
//       setTimeout(() => initMap(), 100);
//     }

//     return () => {
//       previousPositionsRef.current = [];
//     };
//   }, [selectedDevice?.deviceNo]); // Only Init on Device Change

//   // --- DATA FETCHING ---
//   const updateSummary = (list) => {
//     setSummary({
//       total: list.length,
//       online: list.filter((d) => d.status === "online").length,
//       offline: list.filter((d) => d.status !== "online").length,
//       moving: list.filter((d) => d.speed > 5).length,
//       stopped: list.filter((d) => d.speed <= 5).length,
//     });
//   };

//   const fetchData = async () => {
//     setLoading(true);
//     const token = localStorage.getItem("token");
//     try {
//       const response = await fetch(
//         "https://api.websave.in/api/manufactur/liveTrackingAllDevices",
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         },
//       );
//       const data = await response.json();
//       const deviceList = data.devices || [];
//       const devicesObj = {};

//       deviceList.forEach((d) => {
//         const extracted = extractSocketData(d);
//         devicesObj[extracted.deviceNo] = extracted;
//       });
    

//       setDevices(devicesObj);
//       updateSummary(Object.values(devicesObj));
//     } catch (error) {
//       console.error("Fetch error:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   // Define filtered list only once
//   const filteredDevices = Object.values(devices).filter(
//     (d) =>
//       d.vechileNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       d.deviceNo?.includes(searchTerm),
//   );
  

//   const displayData =
//     isPlaybackMode && playbackRoute.length > 0
//       ? playbackRoute[playbackIndex]
//       : selectedDevice;

//   // =========================================================
//   // VIEW 1: SINGLE DEVICE (LIVE + HISTORY)
//   // =========================================================
//   if (selectedDevice) {
//     return (
//       <div className="min-h-screen bg-slate-50/50 p-4 lg:p-6 font-sans">
//         {/* Navigation & History Controls */}
//         <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
//           <div className="flex items-center gap-4">
//             <button
//               onClick={() => {
//                 setSelectedDevice(null);
//                 exitPlaybackMode();
//               }}
//               className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all hover:scale-105"
//             >
//               <ArrowLeft size={16} /> Back to Fleet
//             </button>

//             {isPlaybackMode && (
//               <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4">
//                 <button
//                   onClick={() => setIsPlaying(!isPlaying)}
//                   className="p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
//                 >
//                   {isPlaying ? (
//                     <Pause size={14} fill="currentColor" />
//                   ) : (
//                     <Play size={14} fill="currentColor" />
//                   )}
//                 </button>
//                 <div className="flex items-center gap-2 px-2 border-l border-slate-100 ml-2">
//                   <span className="text-[10px] font-bold text-slate-400">
//                     SPEED:
//                   </span>
//                   {[1, 5, 10].map((s) => (
//                     <button
//                       key={s}
//                       onClick={() => setPlaybackSpeed(s)}
//                       className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${playbackSpeed === s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
//                     >
//                       {s}x
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
//             <div className="flex items-center gap-2 px-2 bg-slate-50 rounded-lg p-1.5">
//               <Calendar size={14} className="text-slate-400" />
//               <input
//                 type="datetime-local"
//                 className="text-xs border-none outline-none text-slate-600 font-bold bg-transparent"
//                 value={playbackStartTime}
//                 onChange={(e) => setPlaybackStartTime(e.target.value)}
//               />
//               <span className="text-slate-300 text-[10px] font-bold px-1">
//                 TO
//               </span>
//               <input
//                 type="datetime-local"
//                 className="text-xs border-none outline-none text-slate-600 font-bold bg-transparent"
//                 value={playbackEndTime}
//                 onChange={(e) => setPlaybackEndTime(e.target.value)}
//               />
//             </div>
//             <button
//               onClick={isPlaybackMode ? exitPlaybackMode : fetchRoutePlayback}
//               disabled={isLoadingPlayback}
//               className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${isPlaybackMode
//                   ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
//                   : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200"
//                 }`}
//             >
//               {isLoadingPlayback ? (
//                 <RefreshCw className="animate-spin" size={14} />
//               ) : (
//                 <History size={14} />
//               )}
//               {isPlaybackMode ? "Exit Playback" : "Load History"}
//             </button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-150px)] min-h-[600px]">
//           {/* LEFT: MAP (70%) */}
//           <div className="lg:col-span-8 bg-white rounded-[2.5rem] p-3 shadow-xl border border-slate-200 relative overflow-hidden flex flex-col group">
//             <div
//               ref={mapContainerRef}
//               className="flex-1 rounded-[2rem] overflow-hidden z-0 relative h-full w-full bg-slate-100"
//             />

//             {/* Overlay Info Card */}
//             <div className="absolute top-6 left-6 z-[1001] bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-white/50 max-w-xs transition-transform hover:scale-[1.02]">
//               <div className="flex items-center gap-3 mb-2">
//                 <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
//                   <Car size={20} />
//                 </div>
//                 <div>
//                   <h2 className="text-lg font-black text-slate-800 leading-none">
//                     {selectedDevice.vechileNo || "Unknown"}
//                   </h2>
//                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
//                     IMEI: {selectedDevice.deviceNo}
//                   </p>
//                 </div>
//               </div>
//               <div className="flex gap-2">
//                 {isPlaybackMode ? (
//                   <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
//                     <History size={10} /> Playback Mode
//                   </span>
//                 ) : (
//                   <>
//                     <span
//                       className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border flex items-center gap-1 ${selectedDevice.status === "online" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-600 border-slate-200"}`}
//                     >
//                       <span
//                         className={`w-1.5 h-1.5 rounded-full ${selectedDevice.status === "online" ? "bg-emerald-500" : "bg-slate-400"}`}
//                       ></span>
//                       {selectedDevice.status}
//                     </span>
//                     <span
//                       className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border flex items-center gap-1 ${selectedDevice.ignition === "1" ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-slate-50 text-slate-500 border-slate-200"}`}
//                     >
//                       <Power size={10} />
//                       {selectedDevice.ignition === "1" ? "ON" : "OFF"}
//                     </span>
//                   </>
//                 )}
//               </div>
//               {isPlaybackMode && (
//                 <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-500">
//                   {new Date(
//                     displayData?.timestamp || Date.now(),
//                   ).toLocaleString()}
//                 </div>
//               )}
//             </div>

//             {isPlaybackMode && playbackRoute.length > 0 && (
//               <div className="absolute bottom-6 left-6 right-6 z-[1001] bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-white/50">
//                 <input
//                   type="range"
//                   min="0"
//                   max={playbackRoute.length - 1}
//                   value={playbackIndex}
//                   onChange={(e) => {
//                     setPlaybackIndex(Number(e.target.value));
//                     setIsPlaying(false);
//                   }}
//                   className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all"
//                 />
//               </div>
//             )}
//             {!isPlaybackMode && (
//               <div className="absolute top-6 right-6 z-[1001] bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl shadow-lg border border-emerald-200 flex items-center gap-2">
//                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
//                 <span className="text-[10px] font-bold text-emerald-700 uppercase">
//                   LIVE TRACKING
//                 </span>
//               </div>
//             )}
//           </div>

//           {/* RIGHT: STATS (30%) */}
//           <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
//             <div className="grid grid-cols-2 gap-3">
//               <StatCard
//                 icon={<Gauge size={18} />}
//                 label="Speed"
//                 val={displayData?.speed || 0}
//                 color="text-amber-500"
//                 bg="bg-amber-50"
//                 border="bg-amber-500"
//               />
//               <StatCard
//                 icon={<Compass size={18} />}
//                 label="Heading"
//                 val={displayData?.heading || 0}
//                 color="text-blue-500"
//                 bg="bg-blue-50"
//                 border="bg-blue-500"
//               />
//               <StatCard
//                 icon={<BatteryCharging size={18} />}
//                 label="Battery"
//                 val={selectedDevice.externalBattery || 12.4}
//                 color="text-green-500"
//                 bg="bg-green-50"
//                 border="bg-green-500"
//               />
//               <StatCard
//                 icon={<Signal size={18} />}
//                 label="Signal"
//                 val={selectedDevice.gsmSignal || selectedDevice.rssi || 0}
//                 color="text-purple-500"
//                 bg="bg-purple-50"
//                 border="bg-purple-500"
//               />
//             </div>

//             <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md">
//               <div className="flex items-center gap-3 mb-4">
//                 <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
//                   <MapPin className="w-5 h-5" />
//                 </div>
//                 <div>
//                   <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
//                     {isPlaybackMode ? "History Loc" : "Live Loc"}
//                   </h4>
//                   <p className="text-[10px] text-slate-400">
//                     Coordinates & Address
//                   </p>
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 gap-4 mb-2">
//                 <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
//                   <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">
//                     Lat
//                   </p>
//                   <p className="font-mono text-xs font-bold text-slate-700">
//                     {displayData?.lat?.toFixed(6)}
//                   </p>
//                 </div>
//                 <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
//                   <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">
//                     Lng
//                   </p>
//                   <p className="font-mono text-xs font-bold text-slate-700">
//                     {displayData?.lng?.toFixed(6)}
//                   </p>
//                 </div>
//               </div>
//               <MapAddress lat={displayData?.lat} lng={displayData?.lng} />
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // =========================================================
//   // VIEW 2: FLEET COMMAND CENTER (Table List)
//   // =========================================================
//   return (
//     <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans">
//       <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
//         <div>
//           <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 tracking-tighter">
//             Fleet Command Center
//           </h1>
//           <p className="text-slate-500 font-medium text-sm mt-2 flex items-center gap-2">
//             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>{" "}
//             Real-time Monitoring Dashboard
//           </p>
//         </div>
//         <button
//           onClick={fetchData}
//           className="px-6 py-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 flex items-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-95 group"
//         >
//           <RefreshCw
//             className={`w-4 h-4 text-indigo-600 group-hover:rotate-180 transition-transform duration-500 ${loading ? "animate-spin" : ""}`}
//           />
//           <span className="font-bold text-xs text-slate-700 uppercase tracking-widest">
//             Sync Fleet
//           </span>
//         </button>
//       </div>

//       <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-10">
//         {[
//           {
//             label: "Total Assets",
//             val: summary.total,
//             color: "text-indigo-600",
//             bg: "bg-indigo-50",
//             border: "bg-indigo-500",
//             icon: <Package size={22} />,
//           },
//           {
//             label: "Online",
//             val: summary.online,
//             color: "text-emerald-600",
//             bg: "bg-emerald-50",
//             border: "bg-emerald-500",
//             icon: <Wifi size={22} />,
//           },
//           {
//             label: "Offline",
//             val: summary.offline,
//             color: "text-slate-500",
//             bg: "bg-slate-100",
//             border: "bg-slate-400",
//             icon: <XCircle size={22} />,
//           },
//           {
//             label: "Moving",
//             val: summary.moving,
//             color: "text-blue-600",
//             bg: "bg-blue-50",
//             border: "bg-blue-500",
//             icon: <Navigation size={22} />,
//           },
//           {
//             label: "Stopped",
//             val: summary.stopped,
//             color: "text-amber-600",
//             bg: "bg-amber-50",
//             border: "bg-amber-500",
//             icon: <Clock size={22} />,
//           },
//         ].map((c, i) => (
//           <StatCard key={i} {...c} />
//         ))}
//       </div>

//       <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
//         <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur flex justify-between items-center">
//           <div className="relative w-full max-w-md group">
//             <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
//             <input
//               type="text"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               placeholder="Search Vehicle No, IMEI, or Driver..."
//               className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all shadow-inner"
//             />
//           </div>
//           <div className="hidden md:flex gap-2">
//             <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
//               <Download size={18} />
//             </button>
//             <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
//               <MoreHorizontal size={18} />
//             </button>
//           </div>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left backdrop-blur-sm">
//               <tr>
//                 <th className="p-6 pl-8">Vehicle Identification</th>
//                 <th className="p-6">Status</th>
//                 <th className="p-6">Speed</th>
//                 <th className="p-6">Updated</th>
//                 <th className="p-6 pr-8 text-right">Action</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {filteredDevices.map((d, i) => (
//                 <tr
//                   key={d.deviceNo || i}
//                   className="hover:bg-indigo-50/30 transition-colors group"
//                 >
//                   <td className="p-6 pl-8">
//                     <div className="flex items-center gap-4">
//                       <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm group-hover:scale-110 transition-transform duration-300 border border-indigo-100">
//                         <Car size={20} />
//                       </div>
//                       <div>
//                         <div className="font-bold text-slate-800 text-sm mb-0.5">
//                           {d.vechileNo || d.RegistrationNo || "Unknown"}
//                         </div>
//                         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded w-fit">
//                           IMEI: {d.deviceNo}
//                         </div>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="p-6">
//                     <span
//                       className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border shadow-sm ${d.status === "online"
//                           ? "bg-emerald-50 text-emerald-700 border-emerald-100"
//                           : "bg-rose-50 text-rose-700 border-rose-100"
//                         }`}
//                     >
//                       <span
//                         className={`w-1.5 h-1.5 rounded-full ${d.status === "online" ? "bg-emerald-500" : "bg-rose-500"} animate-pulse`}
//                       ></span>
//                       {d.status}
//                     </span>
//                   </td>
//                   <td className="p-6">
//                     <div className="flex items-baseline gap-1">
//                       <span className="font-black text-lg text-slate-700 tabular-nums">
//                         {d.speed}
//                       </span>
//                       <span className="text-[10px] font-bold text-slate-400 uppercase">
//                         km/h
//                       </span>
//                     </div>
//                   </td>
//                   <td className="p-6">
//                     <div className="text-xs font-semibold text-slate-500 tabular-nums">
//                       {new Date(d.lastUpdate || Date.now()).toLocaleTimeString(
//                         [],
//                         {
//                           hour: "2-digit",
//                           minute: "2-digit",
//                           second: "2-digit",
//                         },
//                       )}
//                     </div>
//                   </td>
//                   <td className="p-6 pr-8 text-right">
//                     <button
//                       onClick={() => setSelectedDevice(d)}
//                       className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-300 shadow-sm hover:shadow-indigo-200"
//                     >
//                       <Navigation
//                         size={14}
//                         className="transition-transform group-hover:rotate-45"
//                       />{" "}
//                       Track
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//               {filteredDevices.length === 0 && (
//                 <tr>
//                   <td colSpan="5" className="p-16 text-center">
//                     <div className="flex flex-col items-center gap-3">
//                       <div className="p-4 bg-slate-50 rounded-full text-slate-300">
//                         <Search size={32} />
//                       </div>
//                       <p className="text-slate-400 font-medium text-sm">
//                         No vehicles found matching your search.
//                       </p>
//                     </div>
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CustomerDashboard;



import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "leaflet/dist/leaflet.css";

// --- CUSTOM IMAGE ---
import vehicleLogo from "../Images/car.png";

// --- ICONS ---
import {
  Car,
  MapPin,
  Gauge,
  Power,
  RefreshCw,
  Search,
  Wifi,
  Package,
  Clock,
  Navigation,
  XCircle,
  ArrowLeft,
  BatteryCharging,
  Signal,
  Compass,
  History,
  Calendar,
  Menu,
  X,
  Grid3x3,
  List,
  Eye,
  EyeOff,
} from "lucide-react";

// --- CONFIG ---
const SOCKET_SERVER_URL = "https://api.websave.in";
const ANIMATION_DURATION = 2000; // 2 Seconds per movement
const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

// --- HELPER: Create Rotatable Map Icon ---
const createVehicleIcon = (heading) => {
  return `
    <div style="
      transform: rotate(${heading}deg); 
      width: 100%; 
      height: 100%; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      transition: transform 0.5s linear;
    ">
      <img src="${vehicleLogo}" style="width: 40px; height: 40px; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));" />
    </div>
  `;
};

// --- HELPER: Get status with color and label ---
const getDeviceStatus = (device) => {
  if (!device) return { color: "gray", label: "Unknown", bg: "bg-gray-100", text: "text-gray-600" };
  
  const lastUpdate = new Date(device.lastUpdate).getTime();
  const now = Date.now();
  const timeDiff = now - lastUpdate;
  
  if (device.status === "online" && timeDiff < STALE_THRESHOLD) {
    return { color: "green", label: "Online", bg: "bg-green-100", text: "text-green-700" };
  } else if (device.status === "online" && timeDiff >= STALE_THRESHOLD) {
    return { color: "yellow", label: "IDLE", bg: "bg-yellow-100", text: "text-yellow-700" };
  } else {
    return { color: "red", label: "Offline", bg: "bg-red-100", text: "text-red-700" };
  }
};

// --- COMPONENT: Location Display ---
const LocationDisplay = ({ lat, lng }) => {
  const [address, setAddress] = useState('Locating...');

  useEffect(() => {
    const getAddress = async () => {
      if (!lat || !lng) {
        setAddress('Invalid coordinates');
        return;
      }
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&v=2&lat=${lat}&lon=${lng}`,
          {
            headers: {
              'Accept-Language': 'en',
              'User-Agent': 'FleetManagementApp/1.0'  // Required to avoid 403
            }
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}: Rate limit or error`);
        const data = await res.json();
        setAddress(data.display_name || 'Unknown Location');
      } catch (error) {
        console.error('Geocoding error:', error);
        setAddress('Location unavailable');
      }
    };

    const timer = setTimeout(getAddress, 300);  // Reduced debounce
    return () => clearTimeout(timer);
  }, [lat, lng]);

  return (
    <div className="mt-3 p-3 bg-slate-50/80 backdrop-blur-sm rounded-xl border border-slate-100 flex gap-3 items-start">
      <MapPin className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
      <p className="text-xs font-medium text-slate-600 leading-snug line-clamp-2">
        {address}
      </p>
    </div>
  );
};


// --- COMPONENT: Mobile Stats Drawer ---
const MobileStatsDrawer = ({ isOpen, onClose, device, displayData, isPlaybackMode }) => {
  if (!isOpen) return null;

  const status = getDeviceStatus(device);

  return (
    <div className="fixed inset-0 z-[2000] lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Vehicle Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Vehicle Info */}
        <div className="mb-4 p-4 bg-slate-50 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Car size={20} className="text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold">{device?.vechileNo || "Unknown"}</h4>
              <p className="text-xs text-slate-500">IMEI: {device?.deviceNo}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {isPlaybackMode ? (
              <span className="px-3 py-1 text-xs font-bold bg-amber-50 text-amber-700 rounded-lg">
                Playback Mode
              </span>
            ) : (
              <>
                <span className={`px-3 py-1 text-xs font-bold rounded-lg ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
                <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                  device?.ignition === "1" 
                    ? "bg-blue-50 text-blue-700" 
                    : "bg-slate-100 text-slate-500"
                }`}>
                  <Power size={12} className="inline mr-1" />
                  {device?.ignition === "1" ? "ON" : "OFF"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Gauge size={16} />
              <span className="text-xs font-medium">Speed</span>
            </div>
            <p className="text-xl font-bold">
              {displayData?.speed || 0} <span className="text-xs font-normal text-slate-500">km/h</span>
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Compass size={16} />
              <span className="text-xs font-medium">Heading</span>
            </div>
            <p className="text-xl font-bold">{displayData?.heading || 0}°</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <BatteryCharging size={16} />
              <span className="text-xs font-medium">Battery</span>
            </div>
            <p className="text-xl font-bold">{device?.externalBattery?.toFixed(1) || 12.4}V</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Signal size={16} />
              <span className="text-xs font-medium">Signal</span>
            </div>
            <p className="text-xl font-bold">{device?.gsmSignal || device?.rssi || 0}</p>
          </div>
        </div>

        {/* Location */}
        <LocationDisplay lat={displayData?.lat} lng={displayData?.lng} />
      </div>
    </div>
  );
};

// --- COMPONENT: Desktop Stats Sidebar ---
const DesktopStatsSidebar = ({ device, displayData, isPlaybackMode, isMinimized, onToggleMinimize }) => {
  const status = getDeviceStatus(device);

  if (isMinimized) {
    return (
      <div className="hidden lg:block absolute top-4 right-4 z-[1001]">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 w-16 overflow-hidden">
          <button
            onClick={onToggleMinimize}
            className="w-full p-4 hover:bg-slate-50 transition-colors flex flex-col items-center gap-2"
          >
            <Eye size={20} className="text-indigo-600" />
            <span className="text-[10px] font-medium text-slate-500">Expand</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:block absolute top-4 right-4 z-[1001] w-80">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
        {/* Header with minimize button */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Car size={20} className="text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 truncate">
                {device?.vechileNo || "Unknown"}
              </h3>
              <p className="text-xs text-slate-500 truncate">IMEI: {device?.deviceNo}</p>
            </div>
          </div>
          <button
            onClick={onToggleMinimize}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <EyeOff size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Status */}
        <div className="px-4 pt-3">
          <div className="flex gap-2">
            {isPlaybackMode ? (
              <span className="px-3 py-1 text-xs font-bold bg-amber-50 text-amber-700 rounded-lg">
                Playback Mode
              </span>
            ) : (
              <>
                <span className={`px-3 py-1 text-xs font-bold rounded-lg ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
                <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                  device?.ignition === "1" 
                    ? "bg-blue-50 text-blue-700" 
                    : "bg-slate-100 text-slate-500"
                }`}>
                  <Power size={12} className="inline mr-1" />
                  {device?.ignition === "1" ? "ON" : "OFF"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Gauge size={14} />
              <span className="text-xs">Speed</span>
            </div>
            <p className="text-lg font-bold">
              {displayData?.speed || 0} <span className="text-xs font-normal text-slate-500">km/h</span>
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Compass size={14} />
              <span className="text-xs">Heading</span>
            </div>
            <p className="text-lg font-bold">{displayData?.heading || 0}°</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <BatteryCharging size={14} />
              <span className="text-xs">Battery</span>
            </div>
            <p className="text-lg font-bold">{device?.externalBattery?.toFixed(1) || 12.4}V</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Signal size={14} />
              <span className="text-xs">Signal</span>
            </div>
            <p className="text-lg font-bold">{device?.gsmSignal || device?.rssi || 0}</p>
          </div>
        </div>

        {/* Location */}
        <div className="p-4 border-t border-slate-100">
          <LocationDisplay lat={displayData?.lat} lng={displayData?.lng} />
        </div>
      </div>
    </div>
  );
};

const CustomerDashboard = () => {
  const socketRef = useRef(null);

  // --- Leaflet Refs ---
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const playbackMarkerRef = useRef(null);

  // --- Animation Refs ---
  const moveAnimationRef = useRef(null);
  const animationFrameRef = useRef(null);
  const selectedDeviceIdRef = useRef(null);

  // --- UI State ---
  const [showMobileStats, setShowMobileStats] = useState(false);
  const [showMobileList, setShowMobileList] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  // --- Main State ---
  const [devices, setDevices] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [summary, setSummary] = useState({
    total: 0,
    online: 0,
    offline: 0,
    idle: 0,
    moving: 0,
    stopped: 0,
  });

  // --- Playback State ---
  const [isPlaybackMode, setIsPlaybackMode] = useState(false);
  const [playbackStartTime, setPlaybackStartTime] = useState("");
  const [playbackEndTime, setPlaybackEndTime] = useState("");
  const [playbackRoute, setPlaybackRoute] = useState([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLoadingPlayback, setIsLoadingPlayback] = useState(false);

  // --- Sync Ref with State ---
  useEffect(() => {
    selectedDeviceIdRef.current = selectedDevice ? selectedDevice.deviceNo : null;
  }, [selectedDevice]);

  // --- Helper: Extract data ---
  const extractSocketData = (data) => {
    const liveData = data.liveTracking || data;
    const deviceInfo = data.dev || {};
  //  console.log(liveData)

    return {
      deviceNo: data.deviceNo || liveData.deviceNo || liveData.deviceId,
      lat: Number(liveData.lat),
      lng: Number(liveData.lng),
      speed: Number(liveData.speed || 0),
      heading: Number(liveData.headDegree || liveData.heading || 0),
      ignition: liveData.ignition || "0",
      gpsFix: liveData.gpsFix || "0",
      satellites: liveData.satellites || "0",
      gsmSignal: liveData.gsmSignal || "0",
      externalBattery: parseFloat(liveData.batteryVoltage || liveData.mainsVoltage || 0),
      vechileNo: deviceInfo.vechileNo || liveData.vehicleNo || "Unknown",
      status: data.status || (liveData.gpsFix === "1" ? "online" : "offline"),
      lastUpdate: liveData.lastUpdate || liveData.timestamp || new Date().toISOString(),
    };
  };

  // --- ANIMATION FUNCTION ---
  const animateMarkerTo = (endLat, endLng, heading) => {
    if (!vehicleMarkerRef.current) return;

    const startLatLng = vehicleMarkerRef.current.getLatLng();
    const startLat = startLatLng.lat;
    const startLng = startLatLng.lng;

    const dist = Math.sqrt(
      Math.pow(endLat - startLat, 2) + Math.pow(endLng - startLng, 2)
    );
    
    if (dist > 0.05) {
      vehicleMarkerRef.current.setLatLng([endLat, endLng]);
      updateMarkerIcon(heading);
      return;
    }

    const deltaLat = endLat - startLat;
    const deltaLng = endLng - startLng;
    const startTime = performance.now();

    if (moveAnimationRef.current) {
      cancelAnimationFrame(moveAnimationRef.current);
    }

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

      const currentLat = startLat + deltaLat * progress;
      const currentLng = startLng + deltaLng * progress;

      vehicleMarkerRef.current.setLatLng([currentLat, currentLng]);

      if (progress < 1) {
        moveAnimationRef.current = requestAnimationFrame(animate);
      } else {
        vehicleMarkerRef.current.setLatLng([endLat, endLng]);
        updateMarkerIcon(heading);
      }
    };

    moveAnimationRef.current = requestAnimationFrame(animate);
  };

  const updateMarkerIcon = (heading) => {
    if (!vehicleMarkerRef.current) return;
    const iconHtml = createVehicleIcon(heading);
    const newIcon = window.L.divIcon({
      className: "vehicle-marker",
      html: iconHtml,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
    vehicleMarkerRef.current.setIcon(newIcon);
  };

  // --- SOCKET & LIVE DATA ---
  useEffect(() => {
    if (socketRef.current) return;

    const storedUser = localStorage.getItem("user");
    let myUserId;
    try {
      myUserId = JSON.parse(storedUser)?._id || JSON.parse(storedUser)?.id;
    } catch (e) {}

    const socket = io(SOCKET_SERVER_URL, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      query: { userId: myUserId },
    });

    socketRef.current = socket;

    socket.on("gps-update", (data) => {
      const extractedData = extractSocketData(data);

      setDevices((prev) => {
        const updated = {
          ...prev,
          [extractedData.deviceNo]: {
            ...prev[extractedData.deviceNo],
            ...extractedData,
            lastUpdate: new Date().toISOString(),
          },
        };
        updateSummary(Object.values(updated));
        return updated;
      });

      if (selectedDeviceIdRef.current === extractedData.deviceNo && !isPlaybackMode) {
        setSelectedDevice((prev) => ({ ...prev, ...extractedData }));

        if (leafletMapRef.current && vehicleMarkerRef.current) {
          animateMarkerTo(extractedData.lat, extractedData.lng, extractedData.heading);
          leafletMapRef.current.panTo([extractedData.lat, extractedData.lng], {
            animate: true,
            duration: 2.0,
          });
        }
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (moveAnimationRef.current) cancelAnimationFrame(moveAnimationRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // --- PLAYBACK API & SETUP ---
  const fetchRoutePlayback = async () => {
    if (!selectedDevice?.deviceNo || !playbackStartTime || !playbackEndTime) {
      alert("Please select date range");
      return;
    }

    setIsLoadingPlayback(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        "https://api.websave.in/api/manufactur/fetchSingleRoutePlayback",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            deviceNo: selectedDevice.deviceNo,
            startTime: new Date(playbackStartTime).toISOString(),
            endTime: new Date(playbackEndTime).toISOString(),
          }),
        }
      );
      const data = await response.json();

      if (data.success && data.route?.length > 0) {
        const cleanRoute = data.route
          .map((p) => ({
            ...p,
            lat: parseFloat(p.latitude || p.lat),
            lng: parseFloat(p.longitude || p.lng),
            speed: parseFloat(p.speed || 0),
            heading: parseFloat(p.heading || p.headDegree || 0),
            timestamp: p.timestamp || p.lastUpdate,
          }))
          .filter((p) => !isNaN(p.lat) && !isNaN(p.lng));

        setPlaybackRoute(cleanRoute);
        setIsPlaybackMode(true);
        setIsPlaying(true);
        setupPlaybackVisualization(cleanRoute);
      } else {
        alert("No route data found for this period.");
      }
    } catch (e) {
      console.error("Playback fetch error:", e);
      alert("Failed to fetch history");
    } finally {
      setIsLoadingPlayback(false);
    }
  };

  const setupPlaybackVisualization = (route) => {
    const L = window.L;
    if (!L || !leafletMapRef.current || route.length === 0) return;

    if (vehicleMarkerRef.current) vehicleMarkerRef.current.setOpacity(0);
    if (moveAnimationRef.current) cancelAnimationFrame(moveAnimationRef.current);
    if (playbackMarkerRef.current) leafletMapRef.current.removeLayer(playbackMarkerRef.current);

    const points = route.map((p) => [p.lat, p.lng]);
    leafletMapRef.current.fitBounds(L.latLngBounds(points), { padding: [50, 50] });

    const startPoint = route[0];
    const pbIcon = L.divIcon({
      className: "playback-marker",
      html: createVehicleIcon(startPoint.heading),
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
    playbackMarkerRef.current = L.marker([startPoint.lat, startPoint.lng], {
      icon: pbIcon,
      zIndexOffset: 9999,
    }).addTo(leafletMapRef.current);
    setPlaybackIndex(0);
  };

  // --- PLAYBACK ANIMATION LOOP ---
  useEffect(() => {
    let lastFrameTime = 0;
    const animate = (timestamp) => {
      if (!lastFrameTime) lastFrameTime = timestamp;
      const interval = 1000 / (5 * playbackSpeed);

      if (timestamp - lastFrameTime > interval) {
        setPlaybackIndex((prev) => {
          if (prev >= playbackRoute.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
        lastFrameTime = timestamp;
      }
      if (isPlaying && isPlaybackMode)
        animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying && isPlaybackMode && playbackRoute.length > 0) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying, isPlaybackMode, playbackRoute, playbackSpeed]);

  // --- UPDATE PLAYBACK MARKER ---
  useEffect(() => {
    if (isPlaybackMode && playbackRoute[playbackIndex] && playbackMarkerRef.current) {
      const point = playbackRoute[playbackIndex];
      playbackMarkerRef.current.setLatLng([point.lat, point.lng]);
      updateMarkerIcon(point.heading);
    }
  }, [playbackIndex, isPlaybackMode, playbackRoute]);

  const exitPlaybackMode = () => {
    setIsPlaying(false);
    setIsPlaybackMode(false);
    setPlaybackRoute([]);
    setPlaybackIndex(0);

    if (leafletMapRef.current) {
      if (playbackMarkerRef.current) {
        leafletMapRef.current.removeLayer(playbackMarkerRef.current);
        playbackMarkerRef.current = null;
      }

      if (vehicleMarkerRef.current && selectedDevice) {
        vehicleMarkerRef.current.setOpacity(1);
        const livePos = [selectedDevice.lat, selectedDevice.lng];
        vehicleMarkerRef.current.setLatLng(livePos);
        leafletMapRef.current.panTo(livePos);
      }
    }
  };

  // --- MAP INIT ---
  const initMap = () => {
    if (!mapContainerRef.current || leafletMapRef.current) return;
    const L = window.L;
    if (!L) return;

    const startLat = selectedDevice?.lat || 21.485926;
    const startLng = selectedDevice?.lng || 86.907545;
    const startHeading = selectedDevice?.heading || 0;

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    leafletMapRef.current = map;

    const initialIcon = L.divIcon({
      className: "vehicle-marker",
      html: createVehicleIcon(startHeading),
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const marker = L.marker([startLat, startLng], {
      icon: initialIcon,
      zIndexOffset: 1000,
    }).addTo(map);
    vehicleMarkerRef.current = marker;
  };

  // --- LOAD LEAFLET ---
  useEffect(() => {
    if (!selectedDevice) {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        vehicleMarkerRef.current = null;
      }
      return;
    }

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!window.L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => setTimeout(() => initMap(), 100);
      document.body.appendChild(script);
    } else {
      setTimeout(() => initMap(), 100);
    }
  }, [selectedDevice?.deviceNo]);

  // --- DATA FETCHING ---
  const updateSummary = (list) => {
    const online = list.filter(d => {
      const lastUpdate = new Date(d.lastUpdate).getTime();
      const now = Date.now();
      return d.status === "online" && (now - lastUpdate) < STALE_THRESHOLD;
    }).length;
    
    const idle = list.filter(d => {
      const lastUpdate = new Date(d.lastUpdate).getTime();
      const now = Date.now();
      return d.status === "online" && (now - lastUpdate) >= STALE_THRESHOLD;
    }).length;
    
    const offline = list.filter(d => d.status !== "online").length;

    setSummary({
      total: list.length,
      online,
      offline,
      idle,
      moving: list.filter((d) => d.speed > 5).length,
      stopped: list.filter((d) => d.speed <= 5).length,
    });
  };

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        "https://api.websave.in/api/manufactur/liveTrackingAllDevices",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      const deviceList = data.devices || [];
      const devicesObj = {};

      deviceList.forEach((d) => {
        const extracted = extractSocketData(d);
        devicesObj[extracted.deviceNo] = extracted;
      });

      setDevices(devicesObj);
      updateSummary(Object.values(devicesObj));
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDevices = Object.values(devices).filter(
    (d) =>
      d.vechileNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.deviceNo?.includes(searchTerm)
  );

  const displayData = isPlaybackMode && playbackRoute.length > 0
    ? playbackRoute[playbackIndex]
    : selectedDevice;

  // =========================================================
  // VIEW 1: SINGLE DEVICE (Full Screen Map)
  // =========================================================
  if (selectedDevice) {
    return (
      <div className="h-screen w-screen overflow-hidden relative font-sans">
        {/* Map Container */}
        <div ref={mapContainerRef} className="absolute inset-0 z-0" />

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-[1001] bg-gradient-to-b from-black/50 to-transparent p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedDevice(null);
                exitPlaybackMode();
                setShowMobileStats(false);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg text-slate-700 font-medium text-sm hover:bg-white transition-all"
            >
              <ArrowLeft size={16} /> Back
            </button>

            <div className="flex items-center gap-2">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileList(!showMobileList)}
                className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg"
              >
                <Menu size={16} />
                <span className="text-sm font-medium">Vehicles</span>
              </button>

              {/* Mobile Stats Button */}
              <button
                onClick={() => setShowMobileStats(true)}
                className="lg:hidden flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-xl shadow-lg"
              >
                <Car size={16} />
                <span className="text-sm font-medium">Stats</span>
              </button>
            </div>
          </div>

          {/* Playback Controls */}
          {isPlaybackMode && (
            <div className="mt-2 flex items-center gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-lg bg-indigo-50 text-indigo-600"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <div className="flex items-center gap-1">
                {[1, 5, 10].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPlaybackSpeed(s)}
                    className={`px-2 py-1 text-xs font-bold rounded-lg ${
                      playbackSpeed === s 
                        ? "bg-indigo-600 text-white" 
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Stats Sidebar */}
        <DesktopStatsSidebar
          device={selectedDevice}
          displayData={displayData}
          isPlaybackMode={isPlaybackMode}
          isMinimized={isSidebarMinimized}
          onToggleMinimize={() => setIsSidebarMinimized(!isSidebarMinimized)}
        />

        {/* Mobile Stats Drawer */}
        <MobileStatsDrawer
          isOpen={showMobileStats}
          onClose={() => setShowMobileStats(false)}
          device={selectedDevice}
          displayData={displayData}
          isPlaybackMode={isPlaybackMode}
        />

        {/* Mobile Vehicle List Drawer */}
        {showMobileList && (
          <div className="lg:hidden fixed inset-0 z-[2000]">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileList(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto animate-slide-right">
              <div className="p-4 border-b sticky top-0 bg-white z-10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Vehicles</h3>
                  <button onClick={() => setShowMobileList(false)} className="p-2">
                    <X size={20} />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search vehicles..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="p-2">
                {filteredDevices.map((d) => {
                  const status = getDeviceStatus(d);
                  return (
                    <button
                      key={d.deviceNo}
                      onClick={() => {
                        setSelectedDevice(d);
                        setShowMobileList(false);
                      }}
                      className={`w-full p-3 rounded-xl text-left hover:bg-slate-50 transition-colors ${
                        selectedDevice?.deviceNo === d.deviceNo ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <div className="font-medium">{d.vechileNo || "Unknown"}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-500">{d.deviceNo}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </div>
                      <LocationDisplay lat={d.lat} lng={d.lng} isMinimized={true} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Playback Progress Bar */}
        {isPlaybackMode && playbackRoute.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 z-[1001] lg:left-auto lg:right-4 lg:w-96">
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl">
              <input
                type="range"
                min="0"
                max={playbackRoute.length - 1}
                value={playbackIndex}
                onChange={(e) => {
                  setPlaybackIndex(Number(e.target.value));
                  setIsPlaying(false);
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>{new Date(playbackRoute[0]?.timestamp).toLocaleTimeString()}</span>
                <span>{new Date(playbackRoute[playbackIndex]?.timestamp).toLocaleTimeString()}</span>
                <span>{new Date(playbackRoute[playbackRoute.length-1]?.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // VIEW 2: FLEET LIST (Toggle between List and Grid)
  // =========================================================
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 font-sans">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Fleet Command</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time vehicle monitoring</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="bg-white rounded-lg border border-slate-200 p-1 flex items-center">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Grid3x3 size={18} />
            </button>
          </div>
          
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Total</div>
          <div className="text-2xl font-bold text-slate-800">{summary.total}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs text-green-600 mb-1">Online</div>
          <div className="text-2xl font-bold text-green-600">{summary.online}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs text-yellow-600 mb-1">IDLE</div>
          <div className="text-2xl font-bold text-yellow-600">{summary.idle}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs text-red-600 mb-1">Offline</div>
          <div className="text-2xl font-bold text-red-600">{summary.offline}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs text-blue-600 mb-1">Moving</div>
          <div className="text-2xl font-bold text-blue-600">{summary.moving}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs text-amber-600 mb-1">Stopped</div>
          <div className="text-2xl font-bold text-amber-600">{summary.stopped}</div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by vehicle or IMEI..."
            className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* View Mode: List */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Vehicle</th>
                  <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Speed</th>
                  <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Location</th>
                  <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Last Update</th>
                  <th className="p-4 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDevices.map((d) => {
                  const status = getDeviceStatus(d);
                  return (
                    <tr key={d.deviceNo} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 rounded-lg">
                            <Car size={18} className="text-indigo-600" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{d.vechileNo || "Unknown"}</div>
                            <div className="text-xs text-slate-500">IMEI: {d.deviceNo}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{d.speed} <span className="text-xs text-slate-500">km/h</span></div>
                      </td>
                      <td className="p-4 max-w-xs">
                        <LocationDisplay lat={d.lat} lng={d.lng} isMinimized={true} />
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-slate-600">
                          {new Date(d.lastUpdate || Date.now()).toLocaleString()}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedDevice(d)}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          Track
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDevices.map((d) => {
            const status = getDeviceStatus(d);
            return (
              <div
                key={d.deviceNo}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedDevice(d)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <Car size={20} className="text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{d.vechileNo || "Unknown"}</h3>
                      <p className="text-xs text-slate-500">IMEI: {d.deviceNo}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.bg} ${status.text}`}>
                    {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <span className="text-xs text-slate-500 block">Speed</span>
                    <span className="font-medium">{d.speed} km/h</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Ignition</span>
                    <span className={`text-sm ${d.ignition === "1" ? "text-green-600" : "text-slate-500"}`}>
                      {d.ignition === "1" ? "ON" : "OFF"}
                    </span>
                  </div>
                </div>

                <LocationDisplay lat={d.lat} lng={d.lng} isMinimized={true} />

                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-500">
                    {new Date(d.lastUpdate).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDevice(d);
                    }}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100"
                  >
                    Track
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredDevices.length === 0 && (
        <div className="text-center py-12">
          <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Search size={24} className="text-slate-400" />
          </div>
          <p className="text-slate-500">No vehicles found</p>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;