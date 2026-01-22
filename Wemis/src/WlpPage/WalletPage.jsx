import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, X, Upload, Loader2 } from 'lucide-react';
import WlpNavbar from './WlpNavbar';

// --- CONSTANTS ---
const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh",
    "Lakshadweep", "Puducherry"
];

const WalletPage = () => {
    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('Wallet Transaction');
    const [subTab, setSubTab] = useState('AIS-140');

    // Form State for "Send Subscription"
    const [selectedState, setSelectedState] = useState("");
    const [distributors, setDistributors] = useState([]);
    const [isLoadingDistributors, setIsLoadingDistributors] = useState(false);

    // Other form fields (optional, for binding)
    const [selectedDistributor, setSelectedDistributor] = useState("");
    const [numSubscriptions, setNumSubscriptions] = useState(1);

    // --- API INTEGRATION: Fetch Distributors ---
    useEffect(() => {
        const fetchDistributors = async () => {
            // 1. If no state is selected, reset distributors and stop.
            if (!selectedState) {
                setDistributors([]);
                return;
            }

            setIsLoadingDistributors(true);
            const token = localStorage.getItem("token"); // Retrieve token

            try {
                const response = await fetch("https://api.websave.in/api/manufactur/fetchDistributorOnBasisOfState", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}` // Pass token
                    },
                    body: JSON.stringify({ state: selectedState }) // Pass selected state
                });

                const data = await response.json();
                console.log(data)

                // Check if data exists and is in expected format (adjust based on actual API response)
                // Usually it's data.distributors or data.result
                if (data && (Array.isArray(data.distributors) || Array.isArray(data.result) || Array.isArray(data))) {
                    const list = data.distributors || data.result || data;
                    setDistributors(list);
                } else {
                    console.warn("Unexpected API response:", data);
                    setDistributors([]);
                }

            } catch (error) {
                console.error("Error fetching distributors:", error);
                setDistributors([]);
            } finally {
                setIsLoadingDistributors(false);
            }
        };

        if (isModalOpen) {
            fetchDistributors();
        }
    }, [selectedState, isModalOpen]);

    // Reset form when modal closes
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedState("");
        setDistributors([]);
        setSelectedDistributor("");
    };


    // Dummy Data for the table
    const transactions = [
        { id: 'TXN2026011600000056932', msg: 'Subscriptions 2 transfer to CUTTACK TRAXO Distributor.', element: 'VTS Tracking', type: 'AIS-140', imei: '2', subs: '2', debit: '-', credit: '2', date: '16th Jan 2026 05:56 PM', status: 'SUCCESS' },
        { id: 'TXN2026011600000056927', msg: 'Subscriptions 2 transfer to CUTTACK TRAXO Distributor.', element: 'VTS Tracking', type: 'AIS-140', imei: '2', subs: '2', debit: '-', credit: '2', date: '16th Jan 2026 05:45 PM', status: 'SUCCESS' },
        { id: 'TXN2026011500000056915', msg: 'Subscriptions 2 transfer to CUTTACK TRAXO Distributor.', element: 'VTS Tracking', type: 'AIS-140', imei: '2', subs: '2', debit: '-', credit: '2', date: '15th Jan 2026 03:17 PM', status: 'SUCCESS' },
        { id: 'TXN2025120200000056288', msg: 'Subscriptions 2 transfer to TRAXO INDIA AUTOMATION Distributor.', element: 'VTS Tracking', type: 'AIS-140', imei: '2', subs: '2', debit: '-', credit: '2', date: '2nd Dec 2025 03:27 PM', status: 'SUCCESS' },
        { id: 'TXN2025112800000056220', msg: 'Subscriptions 2 transfer to ROURKELA DISTRIBUTOR Distributor.', element: 'VTS Tracking', type: 'AIS-140', imei: '2', subs: '2', debit: '-', credit: '2', date: '28th Nov 2025 12:25 PM', status: 'SUCCESS' },
    ];

    return (
        <>
            <WlpNavbar />

            <div className="min-h-screen bg-gray-50 font-sans w-full mt-40">

                {/* --- TOP HEADER NAVIGATION --- */}
                <header className="bg-white border-b border-gray-200 px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm w-full">
                    <div className="text-gray-600 font-medium text-sm w-full md:w-auto">
                        <span className="text-gray-800 font-bold"> Wallet Transactions</span>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <button className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition">
                            <Search size={18} />
                        </button>
                        <button className="px-4 py-2 bg-orange-400 text-white font-semibold text-sm rounded hover:bg-orange-500 transition shadow-sm">
                            Withdraw
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 bg-teal-800 text-white font-semibold text-sm rounded hover:bg-teal-900 transition shadow-sm flex items-center gap-2"
                        >
                            <Upload size={16} /> Send_Subscription
                        </button>
                        <button className="px-4 py-2 bg-red-500 text-white font-semibold text-sm rounded hover:bg-red-600 transition shadow-sm flex items-center gap-1">
                            <ArrowLeft size={16} /> Back
                        </button>
                    </div>
                </header>

                {/* --- MAIN CONTENT AREA (Full Width) --- */}
                <main className="w-full px-4 py-6">

                    {/* Main Tabs */}
                    <div className="flex items-end gap-1 border-b border-gray-300 mb-6">
                        <button className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 rounded-t-lg border border-b-0 border-gray-200">
                            Installation Transaction
                        </button>
                        <button className="px-4 py-2 text-sm font-semibold text-teal-700 bg-white rounded-t-lg border border-gray-300 border-b-white -mb-px z-10">
                            Wallet Transaction
                        </button>
                    </div>

                    {/* Balance Card */}
                    <div className="mb-6 w-full max-w-sm">
                        <div className="flex rounded-md overflow-hidden shadow-sm">
                            <div className="bg-orange-600 text-white font-bold px-6 py-4 flex items-center justify-center text-sm tracking-wider">
                                TRANSFER
                            </div>
                            <div className="bg-orange-400 text-white font-bold px-8 py-4 flex-grow text-2xl">
                                18070
                            </div>
                        </div>
                    </div>

                    {/* Sub Tabs (AIS-140) */}
                    <div className="mb-4">
                        <div className="flex gap-2 border-b border-gray-200">
                            <button
                                onClick={() => setSubTab('AIS-140')}
                                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${subTab === 'AIS-140' ? 'border-teal-600 text-teal-700 bg-teal-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                AIS-140
                            </button>
                            <button
                                onClick={() => setSubTab('NON AIS GPS')}
                                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${subTab === 'NON AIS GPS' ? 'border-teal-600 text-teal-700 bg-teal-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                NON AIS GPS
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="w-full mb-4 flex">
                        <input
                            type="text"
                            placeholder="Search transaction/imei no"
                            className="w-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                        />
                        <button className="bg-gray-100 border border-l-0 border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 font-medium">
                            Search
                        </button>
                    </div>

                    {/* Table - Full Width */}
                    <div className="overflow-x-auto border border-gray-200 shadow-sm bg-white">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#4a89dc] text-white text-xs uppercase tracking-wide">
                                    <th className="p-3 font-semibold">Transaction_No</th>
                                    <th className="p-3 font-semibold w-1/4">Message</th>
                                    <th className="p-3 font-semibold">Element</th>
                                    <th className="p-3 font-semibold">ElementType</th>
                                    <th className="p-3 font-semibold">IMEI</th>
                                    <th className="p-3 font-semibold">Subscriptions</th>
                                    <th className="p-3 font-semibold">Debit</th>
                                    <th className="p-3 font-semibold">Credit</th>
                                    <th className="p-3 font-semibold">Mode</th>
                                    <th className="p-3 font-semibold">Transaction_At</th>
                                    <th className="p-3 font-semibold">Status</th>
                                    <th className="p-3 font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                                {transactions.map((tx, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-3 text-xs text-gray-500">{tx.id}</td>
                                        <td className="p-3">{tx.msg}</td>
                                        <td className="p-3">{tx.element}</td>
                                        <td className="p-3">{tx.type}</td>
                                        <td className="p-3 text-center">{tx.imei}</td>
                                        <td className="p-3 text-center">{tx.subs}</td>
                                        <td className="p-3 text-center">{tx.debit}</td>
                                        <td className="p-3 text-center">{tx.credit}</td>
                                        <td className="p-3"></td>
                                        <td className="p-3 text-xs text-gray-600">
                                            <div>admin@umis.in</div>
                                            <div>{tx.date}</div>
                                        </td>
                                        <td className="p-3">
                                            <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="p-3"></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>

                {/* --- MODAL (Send Subscription) --- */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        {/* Modal Container */}
                        <div className="bg-white w-full max-w-2xl rounded shadow-2xl animate-in zoom-in-95 duration-200">

                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-4 border-b border-gray-200">
                                <h2 className="text-lg font-bold text-gray-800">Send Subscription</h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-800 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body (Form) */}
                            <div className="p-6 space-y-4">

                                {/* State Input - Dynamic */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">State</label>
                                    <div className="relative">
                                        <select
                                            value={selectedState}
                                            onChange={(e) => {
                                                setSelectedState(e.target.value);
                                                setDistributors([]); // Reset distributors on state change
                                                setSelectedDistributor("");
                                            }}
                                            className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 appearance-none"
                                        >
                                            <option value="">Choose State</option>
                                            {INDIAN_STATES.map((state) => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                                    </div>
                                </div>

                                {/* Distributor Input - Dynamic from API */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Distributor</label>
                                    <div className="relative">
                                        <select
                                            value={selectedDistributor}
                                            onChange={(e) => setSelectedDistributor(e.target.value)}
                                            disabled={!selectedState || isLoadingDistributors}
                                            className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            <option value="">
                                                {isLoadingDistributors ? "Fetching..." : !selectedState ? "Select State First" : "Choose Distributor"}
                                            </option>

                                            {!isLoadingDistributors && distributors.map((dist, index) => (
                                                // Adjust 'dist.organizationName' and 'dist._id' based on your actual API response structure
                                                <option key={dist._id || index} value={dist._id}>
                                                    {dist.business_Name
                                                        || dist.name || "Unknown Distributor"}
                                                </option>
                                            ))}
                                        </select>

                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            {isLoadingDistributors ? <Loader2 size={16} className="animate-spin text-teal-600" /> : <span className="text-xs">▼</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Element Type Input */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Element Type</label>
                                    <select className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500">
                                        <option>Select Element Type</option>
                                        <option>AIS-140</option>
                                      
                                    </select>
                                </div>

                                {/* Element Input */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Element</label>
                                    <select className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500">
                                        <option>Select Element</option>
                                        <option>VTS Tracking</option>
                                    </select>
                                </div>

                                {/* No of Subscriptions */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">No of Subscriptions</label>
                                    <input
                                        type="number"
                                        value={numSubscriptions}
                                        onChange={(e) => setNumSubscriptions(e.target.value)}
                                        min="1"
                                        className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                                    />
                                </div>

                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-gray-200">
                                <button className="bg-[#1f5f5b] hover:bg-[#164a47] text-white font-bold py-2 px-6 rounded text-sm transition-colors">
                                    Submit
                                </button>
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </>
    );
};

export default WalletPage;