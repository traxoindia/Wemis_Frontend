import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
    FaPlus,
    FaWallet,
    FaTimes,
    FaCheckCircle,
    FaHistory,
    FaSpinner,
} from "react-icons/fa";

import WalletStock from "./WalletStock";
import DealerOemNavbar from "./DealerOemNavbar";

const ActivationWalletSummary = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requests, setRequests] = useState([]);
    const [plansLoading, setPlansLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [availablePlans, setAvailablePlans] = useState([]);

    const [formData, setFormData] = useState({
        activationPlanId: "",
        requestedWalletCount: 1,
        totalPrice: 0,
        paymentMethod: "UPI",
        utrNumber: "",
    });

    const API_POST_URL = "https://api.websave.in/api/manufactur/distributorAndOemRequestForActivationWallet";
    const API_GET_PLANS = "https://api.websave.in/api/manufactur/fetchDistributorOrOemReceivedActivationWallets";
    const API_GET_HISTORY = "https://api.websave.in/api/manufactur/distributor_OrOem_OrdelerDistributor_OrdelerOem";

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        if (!token) return;
        setHistoryLoading(true);
        try {
            const res = await axios.get(API_GET_HISTORY, config);
            if (res.data.success) {
                // Mapping the 'requests' array from your API response

                setRequests(res.data.requests || []);
            }
        } catch (err) {
            console.error("History fetch error:", err);
            toast.error("Failed to load transaction history");
        } finally {
            setHistoryLoading(false);
        }
    };

    const fetchPlans = async () => {
        if (!token) {
            toast.error("Session expired. Please login again.");
            return;
        }
        setPlansLoading(true);
        try {
            const res = await axios.get(API_GET_PLANS, config);
            if (res.data.success) {
                setAvailablePlans(res.data.data || []);
            }
        } catch (err) {
            toast.error("Failed to load plans");
        } finally {
            setPlansLoading(false);
        }
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
        fetchPlans();
    };

    const getUnitPrice = (plan) => {
        const base = parseFloat(plan.price) || 0;
        const margin = parseFloat(plan.distributorAndOemMarginPrice) || 0;
        return base + margin;
    };

    const selectPlan = (plan) => {
        const unitPrice = getUnitPrice(plan);
        setFormData((prev) => ({
            ...prev,
            activationPlanId: plan._id,
            totalPrice: (prev.requestedWalletCount * unitPrice).toFixed(2),
        }));
    };

    const handleQtyChange = (e) => {
        const val = e.target.value;
        const qty = val === "" ? 0 : parseInt(val);
        const plan = availablePlans.find((p) => p._id === formData.activationPlanId);
        const unitPrice = plan ? getUnitPrice(plan) : 0;

        setFormData((prev) => ({
            ...prev,
            requestedWalletCount: val === "" ? "" : qty,
            totalPrice: (qty * unitPrice).toFixed(2),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.activationPlanId) return toast.error("Please select a plan first");
        if (formData.requestedWalletCount < 1) return toast.error("Quantity must be at least 1");
        if (!formData.utrNumber) return toast.error("UTR/Transaction ID is required");

        setSubmitLoading(true);
        const loadToast = toast.loading("Submitting request...");

        try {
            const submissionData = {
                activationPlanId: formData.activationPlanId,
                requestedWalletCount: Number(formData.requestedWalletCount),
                totalPrice: Number(formData.totalPrice),
                paymentMethod: formData.paymentMethod,
                utrNumber: Number(formData.utrNumber)
            };

            const res = await axios.post(API_POST_URL, submissionData, config);

            if (res.data.success) {
                toast.success("Request Submitted!", { id: loadToast });
                setIsModalOpen(false);
                setFormData({
                    activationPlanId: "",
                    requestedWalletCount: 1,
                    totalPrice: 0,
                    paymentMethod: "UPI",
                    utrNumber: "",
                });
                fetchRequests();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Submission failed", { id: loadToast });
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">

            <Toaster position="top-right" reverseOrder={false} />
            <DealerOemNavbar />
            <WalletStock />
            <main className="max-w-full mx-auto p-6">
                <div className="flex justify-between items-center mb-8 bg-white p-6 border rounded-sm shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-blue-900">Wallet Activation</h1>
                        <p className="text-sm text-gray-500 italic">Submit and track your wallet top-up requests.</p>
                    </div>
                    <button
                        onClick={handleOpenModal}
                        className="bg-blue-600 text-white px-6 py-3 flex items-center gap-2 font-bold hover:bg-blue-700 transition-all rounded shadow-md"
                    >
                        <FaPlus size={14} /> NEW REQUEST
                    </button>
                </div>

                <div className="bg-white border rounded-sm shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 flex items-center gap-2 font-bold text-gray-700">
                        <FaHistory /> <span>TRANSACTION HISTORY</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 text-gray-600 border-b uppercase text-[11px]">
                                <tr>
                                    <th className="p-4 font-bold">OEM Name</th>
                                    <th className="p-4 font-bold">Element Name</th>
                                    <th className="p-4 font-bold">Package Name</th>
                                    <th className="p-4 font-bold">Billing Cycle</th>
                                    <th className="p-4 font-bold">Description</th>
                                    <th className="p-4 font-bold">Qty</th>
                                    <th className="p-4 font-bold">Calculated Price</th>
                                    <th className="p-4 font-bold">Method</th>
                                    <th className="p-4 font-bold">UTR No</th>
                                    <th className="p-4 font-bold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {historyLoading ? (
                                    <tr>
                                        <td colSpan="7" className="p-10 text-center">
                                            <FaSpinner className="animate-spin mx-auto text-blue-600" size={24} />
                                            <p className="text-xs mt-2 text-gray-400 uppercase tracking-tighter">Loading history...</p>
                                        </td>
                                    </tr>
                                ) : requests.length > 0 ? (
                                    requests.reverse().map((r, i) => (
                                        <tr key={r._id || i} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 font-medium text-gray-700">
                                                {r.oemName || "N/A"}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-gray-800">
                                                    {r.activationPlanDetails?.elementName || "Standard Plan"}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-gray-800">
                                                    {r.activationPlanDetails?.packageName || "Standard Plan"}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-gray-800">
                                                    {r.activationPlanDetails?.billingCycle || "Standard Plan"}
                                                </div>
                                            </td>
                                             <td className="p-4">
                                                <div className="font-bold text-gray-800">
                                                    {r.activationPlanDetails?.description || "Standard Plan"}
                                                </div>
                                            </td>
                                            <td className="p-4 font-medium">{r.requestedWalletCount}</td>
                                            <td className="p-4 font-bold text-green-700">
                                                {/* Calculated: TotalPrice * Qty */}
                                                ₹{(parseFloat(r.totalPrice) * parseInt(r.requestedWalletCount)).toFixed(2)}
                                            </td>
                                            <td className="p-4">
                                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-bold">
                                                    {r.paymentMethod}
                                                </span>
                                            </td>
                                            <td className="p-4 font-mono text-gray-500 text-xs">
                                                {r.utrNumber}
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-[10px] px-3 py-1 font-black uppercase border rounded-full ${r.requestStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    r.requestStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-amber-50 text-green-700 border-amber-200'
                                                    }`}>
                                                    {r.requestStatus || 'Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="p-16 text-center text-gray-400">
                                            <FaWallet className="mx-auto mb-2 opacity-20" size={40} />
                                            <p className="italic uppercase text-xs tracking-widest">No previous requests found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Modal for New Request */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
                            <h2 className="text-xl font-bold flex items-center gap-3 text-blue-900">
                                <FaWallet className="text-blue-600" /> CREATE NEW REQUEST
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <FaTimes size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <label className="block text-[11px] font-black uppercase mb-4 text-gray-400 tracking-widest">
                                        1. Choose Activation Plan
                                    </label>
                                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                                        {plansLoading ? (
                                            <div className="flex flex-col items-center py-10 text-gray-400">
                                                <FaSpinner className="animate-spin mb-2" size={24} />
                                                <span className="text-xs uppercase">Loading Plans...</span>
                                            </div>
                                        ) : (
                                            availablePlans.map((plan) => {
                                                const unitPrice = getUnitPrice(plan);
                                                const isSelected = formData.activationPlanId === plan._id;
                                                return (
                                                    <div
                                                        key={plan._id}
                                                        onClick={() => selectPlan(plan)}
                                                        className={`p-4 border-2 rounded-md cursor-pointer transition-all flex justify-between items-center ${isSelected
                                                            ? "border-blue-600 bg-blue-50/50 shadow-sm"
                                                            : "border-gray-100 hover:border-blue-200 bg-white"
                                                            }`}
                                                    >
                                                        <div className="flex-1">
                                                            <p className="font-black text-sm text-gray-800 uppercase tracking-tight">{plan.packageName}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold mb-2">{plan.elementName}</p>
                                                            <div className="bg-gray-100 inline-block px-2 py-1 rounded text-[10px] font-medium text-gray-600 border">
                                                                ₹{plan.price} + ₹{plan.distributorAndOemMarginPrice} margin
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-black text-lg text-blue-900">₹{unitPrice}</div>
                                                            {isSelected && (
                                                                <span className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 justify-end">
                                                                    <FaCheckCircle size={10} /> Selected
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6 bg-blue-50/30 p-6 rounded-xl border border-blue-100">
                                    <label className="block text-[11px] font-black uppercase text-gray-400 tracking-widest">
                                        2. Payment Details
                                    </label>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-2">Quantity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.requestedWalletCount}
                                            onChange={handleQtyChange}
                                            className="w-full border-2 rounded-lg p-3 font-black focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-2">Method</label>
                                            <select
                                                className="w-full border-2 rounded-lg p-3 bg-white font-bold text-sm outline-none cursor-pointer focus:border-blue-500"
                                                value={formData.paymentMethod}
                                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                            >
                                                <option value="UPI">UPI</option>
                                                <option value="Net Banking">Net Banking</option>
                                                <option value="Card Payment">Card Payment</option>
                                                <option value="Wallet Payment">Wallet Payment</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-2">Total Payable</label>
                                            <div className="w-full border-2 border-blue-200 bg-white p-3 font-black text-lg text-blue-700 rounded-lg shadow-sm">
                                                ₹{formData.totalPrice}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-2">UTR / Transaction ID</label>
                                        <input
                                            type="text"
                                            className="w-full border-2 rounded-lg p-3 font-mono text-sm outline-none focus:border-blue-500 bg-white"
                                            placeholder="Enter Transaction Reference"
                                            value={formData.utrNumber}
                                            onChange={(e) => setFormData({ ...formData, utrNumber: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitLoading || !formData.activationPlanId || !formData.utrNumber}
                                        className={`w-full py-4 rounded-lg font-black flex items-center justify-center gap-3 transition-all ${submitLoading || !formData.activationPlanId || !formData.utrNumber
                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-xl active:scale-95"
                                            }`}
                                    >

                                        {submitLoading ? (
                                            <FaSpinner className="animate-spin" />
                                        ) : (
                                            <FaCheckCircle />
                                        )}
                                        {submitLoading ? "PROCESSING..." : "CONFIRM & SUBMIT"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivationWalletSummary;