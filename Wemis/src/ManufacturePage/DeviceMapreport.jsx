import React, { useEffect, useState, useContext, useRef, useMemo } from "react";
import axios from "axios";
import {
    Zap, AlertTriangle, Edit, Eye, FileText, MapPin, Loader2, Info, X,
    Truck, Key, Phone, Mail, DollarSign, Calendar, UploadCloud, Link, Download, Search, Trash2
} from "lucide-react";

import { useNavigate } from 'react-router-dom';
;



// Assuming the path to your UserAppContext is correct
import { UserAppContext } from "../contexts/UserAppProvider";

// Import jsPDF for client-side PDF generation
import { jsPDF } from 'jspdf';

// --- 0a. Dynamic Bouncing Cube Loader Component ---
const CubeLoader = ({ text = "Loading data..." }) => (
    <div className="flex flex-col items-center justify-center p-8">
        <div className="relative w-12 h-12">
            <div className="absolute w-5 h-5 bg-indigo-500 rounded-sm top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce-slow shadow-xl"></div>
            <div className="absolute w-5 h-5 bg-yellow-400 rounded-sm top-0 left-0 animate-bounce-delay-1 shadow-md"></div>
            <div className="absolute w-5 h-5 bg-green-500 rounded-sm top-0 right-0 animate-bounce-delay-2 shadow-md"></div>
            <div className="absolute w-5 h-5 bg-red-500 rounded-sm bottom-0 left-0 animate-bounce-delay-3 shadow-md"></div>
            <div className="absolute w-5 h-5 bg-blue-500 rounded-sm bottom-0 right-0 animate-bounce-delay-4 shadow-md"></div>
        </div>
        <p className="mt-6 text-lg font-semibold text-indigo-300 tracking-wider">{text}</p>
        <style jsx global>{`
          /* Retained CSS for CubeLoader animation */
          @keyframes bounce-slow {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.2); }
          }
          @keyframes bounce-delay-1 {
            0%, 100% { transform: translateY(0); }
            25% { transform: translateY(-10px); }
          }
          @keyframes bounce-delay-2 {
            0%, 100% { transform: translateY(0); }
            35% { transform: translateY(-10px); }
          }
          @keyframes bounce-delay-3 {
            0%, 100% { transform: translateY(0); }
            65% { transform: translateY(10px); }
          }
          @keyframes bounce-delay-4 {
            0%, 100% { transform: translateY(0); }
            75% { transform: translateY(10px); }
          }
          .animate-bounce-slow {
            animation: bounce-slow 2s infinite ease-in-out;
          }
          .animate-bounce-delay-1 {
            animation: bounce-delay-1 1.5s infinite ease-in-out;
          }
          .animate-bounce-delay-2 {
            animation: bounce-delay-2 1.5s infinite ease-in-out;
            animation-delay: 0.1s;
          }
          .animate-bounce-delay-3 {
            animation: bounce-delay-3 1.5s infinite ease-in-out;
            animation-delay: 0.2s;
          }
          .animate-bounce-delay-4 {
            animation: bounce-delay-4 1.5s infinite ease-in-out;
            animation-delay: 0.3s;
          }
        `}</style>
    </div>
);

// --- DetailItem Component ---
const DetailItem = ({ icon: Icon, label, value, isDocument = false }) => {
    const isLink = isDocument && typeof value === 'string' && (value.startsWith('http') || value.startsWith('/'));

    return (
        <div className="flex items-start py-2 border-b border-gray-700/50">
            <Icon size={18} className="text-indigo-400 mr-3 mt-1 flex-shrink-0" />
            <div className="flex-grow">
                <p className="text-xs font-medium text-gray-400 uppercase leading-none">{label}</p>
                {isLink ? (
                    <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-yellow-400 hover:text-yellow-300 transition underline truncate max-w-full inline-block"
                        title={value}
                    >
                        View Document <Link size={14} className="inline ml-1" />
                    </a>
                ) : (
                    <p className="text-sm font-semibold text-gray-100 break-words">{value || "N/A"}</p>
                )}
            </div>
        </div>
    );
};

// --- SimDetailItem Component ---
const SimDetailItem = ({ sim, index }) => (
    <div className="bg-gray-700/70 p-4 rounded-lg shadow-inner border border-indigo-700/50">
        <h4 className="text-yellow-400 font-bold mb-2 flex items-center">
            <Phone size={16} className="mr-2 text-indigo-400" /> SIM Slot {index + 1}
        </h4>
        <div className="space-y-1 text-sm">
            <p><span className="font-medium text-gray-300">Operator:</span> <span className="text-gray-200">{sim.operator || "N/A"}</span></p>
            <p><span className="font-medium text-gray-300">SIM No:</span> <span className="text-gray-200">{sim.simNo || "N/A"}</span></p>
            <p><span className="font-medium text-gray-300">Validity:</span> <span className="text-gray-200">{sim.validityDate || "N/A"}</span></p>
        </div>
    </div>
);

// --- DeviceDetailsModal Component ---
const DeviceDetailsModal = ({ device, onClose, loading, isOpen }) => {
    // ... (Modal structure and content from V5 - unchanged)
    const sections = [
        {
            title: "Customer & Contact Information",
            icon: Info,
            fields: [
                { label: "Full Name", key: "fullName", icon: Info },
                { label: "Mobile No.", key: "mobileNo", icon: Phone },
                { label: "Email", key: "email", icon: Mail },
                { label: "Dealer/Technician Name", key: "delerName", icon: Key },
                { label: "GSTIN No.", key: "GstinNo", icon: DollarSign },
                { label: "Pan No.", key: "PanNo", icon: FileText },
                { label: "Aadhaar No.", key: "AdharNo", icon: FileText },
                { label: "Driver License No.", key: "DriverLicenseNo", icon: FileText },
            ]
        },
        {
            title: "Vehicle & Registration Details",
            icon: Truck,
            fields: [
                { label: "Registration No.", key: "RegistrationNo", icon: Truck },
                { label: "RTO", key: "Rto", icon: MapPin },
                { label: "Vehicle Type", key: "VehicleType", icon: Truck },
                { label: "Make/Model", key: "MakeModel", icon: Truck },
                { label: "Chassis Number", key: "ChassisNumber", icon: Key },
                { label: "Engine Number", key: "EngineNumber", icon: Key },
                { label: "Model Year", key: "ModelYear", icon: Calendar },
                { label: "Vehicle Birth", key: "VechileBirth", icon: Calendar },
                { label: "KM Reading", key: "VehicleKMReading", icon: MapPin },
            ]
        },
        {
            title: "Device & Installation Details",
            icon: Key,
            fields: [
                { label: "Device No.", key: "deviceNo", icon: Key },
                { label: "Device Type", key: "deviceType", icon: Key },
                { label: "Element Type", key: "elementType", icon: Key },
                { label: "Voltage", key: "voltage", icon: Key },
                { label: "No. of Panic Buttons", key: "NoOfPanicButtons", icon: Key },
                { label: "Mapped Date", key: "MappedDate", icon: Calendar },
                { label: "Batch No.", key: "batchNo", icon: Key },
            ]
        },
        {
            title: "Policy & Document Renewal Dates",
            icon: Calendar,
            fields: [
                { label: "Insurance Renew Date", key: "InsuranceRenewDate", icon: Calendar },
                { label: "Pollution Renew Date", key: "PollutionRenewdate", icon: Calendar },
                { label: "Invoice No.", key: "InvoiceNo", icon: FileText },
                { label: "Date (Submission)", key: "date", icon: Calendar },
            ]
        },
        {
            title: "Address Information",
            icon: MapPin,
            fields: [
                { label: "Complete Address", key: "CompliteAddress", icon: MapPin },
                { label: "Pincode", key: "PinCode", icon: MapPin },
                { label: "State", key: "Customerstate", icon: MapPin },
                { label: "District", key: "Customerdistrict", icon: MapPin },
                { label: "Country", key: "Customercountry", icon: MapPin },
            ]
        },
        {
            title: "Documents (Uploads)",
            icon: UploadCloud,
            fields: [
                { label: "RC Document", key: "RcDocument", icon: FileText, isDocument: true },
                { label: "Aadhaar Card", key: "AdharCardDocument", icon: FileText, isDocument: true },
                { label: "Pan Card", key: "PanCardDocument", icon: FileText, isDocument: true },
                { label: "Device Document", key: "DeviceDocument", icon: FileText, isDocument: true },
                { label: "Invoice Document", key: "InvoiceDocument", icon: FileText, isDocument: true },
                { label: "Panic Button w/ Sticker", key: "PanicButtonWithSticker", icon: FileText, isDocument: true },
                { label: "Signature Document", key: "SignatureDocument", icon: FileText, isDocument: true },
                { label: "Vehicle ID Document", key: "VechileIDocument", icon: FileText, isDocument: true },
            ]
        }
    ];

    if (!isOpen) return null;
    const hasError = device && device.error;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-70 transition-opacity" onClick={onClose}></div>
            <div className="fixed inset-y-0 right-0 max-w-full flex">
                <div className="w-screen max-w-2xl transform transition-transform duration-500 ease-in-out translate-x-0">
                    <div className="h-full flex flex-col bg-gray-800 shadow-2xl overflow-y-auto">
                        <div className="p-6 border-b border-gray-700/50 flex justify-between items-center sticky top-0 bg-gray-800 z-10 shadow-lg">
                            <h3 className="text-xl font-bold text-yellow-400 flex items-center">
                                {loading ? 'Fetching Details...' : hasError ? 'Error' : `Detailed Report: ${device.deviceNo || 'N/A'}`}
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1 rounded-full hover:bg-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        {loading ? (
                            <CubeLoader text="Loading device data..." />
                        ) : hasError ? (
                            <div className="p-6 text-red-400">
                                <AlertTriangle className="inline-block mr-2" />
                                <p className="font-medium text-lg">{device.error}</p>
                            </div>
                        ) : (
                            <div className="p-6 space-y-6 flex-grow">
                                {device.simDetails && device.simDetails.length > 0 && (
                                    <div className="bg-gray-900/50 p-4 rounded-xl shadow-inner border border-indigo-700/50">
                                        <h3 className="text-lg font-bold text-indigo-400 mb-4 flex items-center">
                                            <Phone size={18} className="mr-3" /> SIM Card Information
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {device.simDetails.map((sim, i) => (
                                                <SimDetailItem key={i} sim={sim} index={i} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {sections.map((section, index) => (
                                    <div key={index} className="bg-gray-900/50 p-4 rounded-xl shadow-inner border border-gray-700/50">
                                        <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center border-b border-gray-700 pb-2">
                                            <section.icon size={18} className="mr-3 text-indigo-400" /> {section.title}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                                            {section.fields.map((field, fIndex) => (
                                                <DetailItem
                                                    key={fIndex}
                                                    icon={field.icon}
                                                    label={field.label}
                                                    value={device[field.key]}
                                                    isDocument={field.isDocument}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- CertificateModal Component ---
const CertificateModal = ({ isOpen, onClose, deviceNo, onDownload, isDownloading }) => {
    // ... (Modal structure and content from V5 - unchanged)
    const [certificateOptions, setCertificateOptions] = useState({
        copyType: 'Customer Copy',
        letterHead: 'Leather Head',
        allow: 'Allow',
        certificateType: 'Installation'
    });

    const handleChange = (e) => {
        setCertificateOptions(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleDownloadClick = () => {
        onDownload(deviceNo, certificateOptions);
    };

    if (!isOpen) return null;

    const copyTypeOptions = ['Customer Copy', 'Dealer Copy', 'Manufacturer Copy'];
    const letterHeadOptions = ['Leather Head', 'Plain Paper'];
    const allowOptions = ['Allow', 'Restrict'];
    const certificateTypeOptions = ['Installation', 'Renewal', 'Transfer'];


    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="absolute inset-0 bg-black bg-opacity-60 transition-opacity" onClick={onClose}></div>
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 relative">
                    <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-yellow-400 flex items-center">
                            <FileText size={20} className="mr-2" /> Certificates
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1 rounded-full hover:bg-gray-700">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="space-y-1">
                            <label htmlFor="copyType" className="block text-sm font-medium text-gray-300">Copy Type</label>
                            <select
                                id="copyType"
                                name="copyType"
                                value={certificateOptions.copyType}
                                onChange={handleChange}
                                className="block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 appearance-none transition duration-150"
                            >
                                {copyTypeOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="letterHead" className="block text-sm font-medium text-gray-300">Letter Head</label>
                            <select
                                id="letterHead"
                                name="letterHead"
                                value={certificateOptions.letterHead}
                                onChange={handleChange}
                                className="block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 appearance-none transition duration-150"
                            >
                                {letterHeadOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="allow" className="block text-sm font-medium text-gray-300">Allow</label>
                            <select
                                id="allow"
                                name="allow"
                                value={certificateOptions.allow}
                                onChange={handleChange}
                                className="block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 appearance-none transition duration-150"
                            >
                                {allowOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="certificateType" className="block text-sm font-medium text-gray-300">Certificate</label>
                            <select
                                id="certificateType"
                                name="certificateType"
                                value={certificateOptions.certificateType}
                                onChange={handleChange}
                                className="block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 appearance-none transition duration-150"
                            >
                                {certificateTypeOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-700 flex justify-end">
                        <button
                            onClick={handleDownloadClick}
                            disabled={isDownloading}
                            className={`px-6 py-2 rounded-lg font-bold transition-all duration-300 flex items-center gap-2 shadow-lg 
                                ${isDownloading
                                    ? 'bg-indigo-700 text-gray-400 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/50'
                                }`}
                        >
                            {isDownloading ? (
                                <><Loader2 size={18} className="animate-spin" /> Downloading...</>
                            ) : (
                                <><Download size={18} /> Download</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- PDF Generation Logic (using jsPDF) ---
const generateCertificatePDF = (doc, deviceData, options) => {
    // ... (PDF generation logic from V5 - unchanged)
    let y = 15;
    const margin = 15;
    const lineHeight = 8;
    const pageHeight = doc.internal.pageSize.height;

    const checkPageBreak = (requiredSpace) => {
        if (y + requiredSpace > pageHeight - margin) {
            doc.addPage();
            y = margin;
            return true;
        }
        return false;
    };

    // --- Title & Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(30, 30, 30);
    doc.text(`Device ${options.certificateType} Certificate`, margin, y);
    y += 10;

    // Subtitle based on selected options
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`Copy Type: ${options.copyType} | Letter Head: ${options.letterHead} | Access: ${options.allow}`, margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Device ID: ${deviceData.deviceNo || 'N/A'}`, margin, y);
    doc.text(`Customer: ${deviceData.fullName || 'N/A'}`, doc.internal.pageSize.width - margin, y, { align: 'right' });
    y += 5;

    doc.setDrawColor(50, 50, 50);
    doc.setLineWidth(0.5);
    doc.line(margin, y, doc.internal.pageSize.width - margin, y);
    y += 5;

    // 1. Print SIM Details
    checkPageBreak(deviceData.simDetails ? deviceData.simDetails.length * 8 + 15 : 10);

    if (deviceData.simDetails && deviceData.simDetails.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(50, 70, 150); // Indigo
        doc.text("SIM Card Information", margin, y);
        y += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        deviceData.simDetails.forEach((sim, i) => {
            const simText = `Slot ${i + 1} | Operator: ${sim.operator || 'N/A'} | SIM No: ${sim.simNo || 'N/A'} | Validity: ${sim.validityDate || 'N/A'}`;
            doc.text(simText, margin + 5, y);
            y += 5;
        });
        y += 4;
    }

    // 2. Print Dynamic Sections
    const sections = [
        {
            title: "Customer & Contact Information",
            fields: [
                { label: "Full Name", key: "fullName" }, { label: "Mobile No.", key: "mobileNo" },
                { label: "Email", key: "email" }, { label: "Dealer/Technician Name", key: "delerName" },
                { label: "GSTIN No.", key: "GstinNo" }, { label: "Pan No.", key: "PanNo" },
                { label: "Aadhaar No.", key: "AdharNo" }, { label: "Driver License No.", key: "DriverLicenseNo" },
            ]
        },
        {
            title: "Vehicle & Registration Details",
            fields: [
                { label: "Registration No.", key: "RegistrationNo" }, { label: "RTO", key: "Rto" },
                { label: "Vehicle Type", key: "VehicleType" }, { label: "Make/Model", key: "MakeModel" },
                { label: "Chassis Number", key: "ChassisNumber" }, { label: "Engine Number", key: "EngineNumber" },
                { label: "Model Year", key: "ModelYear" }, { label: "Vehicle Birth", key: "VechileBirth" },
                { label: "KM Reading", key: "VehicleKMReading" },
            ]
        },
        {
            title: "Device & Installation Details",
            fields: [
                { label: "Device No.", key: "deviceNo" }, { label: "Device Type", key: "deviceType" },
                { label: "Element Type", key: "elementType" }, { label: "Voltage", key: "voltage" },
                { label: "No. of Panic Buttons", key: "NoOfPanicButtons" }, { label: "Mapped Date", key: "MappedDate" },
                { label: "Batch No.", key: "batchNo" }, { label: "Distributor Name ID", key: "distributorName" },
                { label: "Manufacturer ID", key: "manufacturId" },
            ]
        },
        {
            title: "Policy & Document Renewal Dates",
            fields: [
                { label: "Insurance Renew Date", key: "InsuranceRenewDate" }, { label: "Pollution Renew Date", key: "PollutionRenewdate" },
                { label: "Invoice No.", key: "InvoiceNo" }, { label: "Date (Submission)", key: "date" },
            ]
        },
        {
            title: "Address Information",
            fields: [
                { label: "Complete Address", key: "CompliteAddress" }, { label: "Pincode", key: "PinCode" },
                { label: "State", key: "Customerstate" }, { label: "District", key: "Customerdistrict" },
                { label: "Country", key: "Customercountry" },
            ]
        },
        {
            title: "Documents (Uploads) - Links",
            fields: [
                { label: "RC Document Link", key: "RcDocument" }, { label: "Aadhaar Card Link", key: "AdharCardDocument" },
                { label: "Pan Card Link", key: "PanCardDocument" }, { label: "Device Document Link", key: "DeviceDocument" },
                { label: "Invoice Document Link", key: "InvoiceDocument" }, { label: "Panic Button w/ Sticker Link", key: "PanicButtonWithSticker" },
                { label: "Signature Document Link", key: "SignatureDocument" }, { label: "Vehicle ID Document Link", key: "VechileIDocument" },
            ]
        }
    ];

    sections.forEach(section => {
        const numFields = section.fields.length;
        const sectionHeight = Math.ceil(numFields / 2) * lineHeight * 1.5 + 15;
        checkPageBreak(sectionHeight);

        // Section Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(150, 80, 0); // Orange/Brown for section titles
        doc.text(section.title, margin, y);
        y += 4;

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.line(margin, y, doc.internal.pageSize.width - margin, y);
        y += 3;

        // Fields in two columns
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);

        const columnWidth = (doc.internal.pageSize.width - 2 * margin) / 2;
        const labelWidth = 40;
        const valueWidth = columnWidth - labelWidth - 2;

        for (let i = 0; i < numFields; i += 2) {
            const field1 = section.fields[i];
            const field2 = section.fields[i + 1];
            let currentY = y;

            // Left Column
            doc.setFont('helvetica', 'bold');
            doc.text(`${field1.label}:`, margin, currentY);
            doc.setFont('helvetica', 'normal');

            const value1 = String(deviceData[field1.key] || "N/A");
            const splitText1 = doc.splitTextToSize(value1, valueWidth);
            doc.text(splitText1, margin + labelWidth, currentY);
            const height1 = splitText1.length * 4;

            // Right Column
            let height2 = 0;
            if (field2) {
                doc.setFont('helvetica', 'bold');
                doc.text(`${field2.label}:`, margin + columnWidth, currentY);
                doc.setFont('helvetica', 'normal');

                const value2 = String(deviceData[field2.key] || "N/A");
                const splitText2 = doc.splitTextToSize(value2, valueWidth);
                doc.text(splitText2, margin + columnWidth + labelWidth, currentY);
                height2 = splitText2.length * 4;
            }

            y += Math.max(height1, height2) + 2;
            checkPageBreak(lineHeight);
        }
        y += 4;
    });

    // --- Footer/Disclaimer ---
    checkPageBreak(15);
    doc.setDrawColor(150, 150, 150);
    doc.line(margin, y, doc.internal.pageSize.width - margin, y);
    y += 5;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, y);
    doc.text(`This document is based on the data available in the system at the time of generation.`, doc.internal.pageSize.width - margin, y, { align: 'right' });

    doc.save(`${options.certificateType}_Certificate_${deviceData.deviceNo}.pdf`);
};

// ====================================================================
//                             3. MAIN COMPONENT (DeviceMapreport)
// ====================================================================

function DeviceMapreport() {
    const [mapDevices, setMapDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDeviceIds, setSelectedDeviceIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); // NEW: State for search input
    const { token: contextToken } = useContext(UserAppContext);
    const selectAllRef = useRef(null);

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [modalDeviceDetails, setModalDeviceDetails] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
    const [isPdfDownloading, setIsPdfDownloading] = useState(false);

    const isSingleDeviceSelected = selectedDeviceIds.length === 1;

    // NEW: Memoized filtering logic
    const filteredDevices = useMemo(() => {
        if (!searchTerm) return mapDevices;

        const lowerCaseSearch = searchTerm.toLowerCase();

        return mapDevices.filter(device =>
            (device.deviceNo && device.deviceNo.toLowerCase().includes(lowerCaseSearch)) ||
            (device.Rto && device.Rto.toLowerCase().includes(lowerCaseSearch)) ||
            (device.fullName && device.fullName.toLowerCase().includes(lowerCaseSearch))
        );
    }, [mapDevices, searchTerm]);
    // -------------------------------------------------------------

    // --- Action Button Component (Retained) ---
    const ActionButton = ({ icon: Icon, label, onClick, className = '' }) => {
        const isDisabled = !isSingleDeviceSelected;
        const tooltip = 'Select exactly one device to perform this action.';

        const baseClasses = "px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 flex items-center gap-2 shadow-lg";

        const defaultEnabledClasses = "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/50 focus:ring-4 focus:ring-indigo-500/50";

        const disabledClasses = "bg-gray-700 text-gray-500 cursor-not-allowed shadow-inner";

        return (
            <button
                className={`${baseClasses} ${isDisabled ? disabledClasses : className || defaultEnabledClasses}`}
                onClick={isDisabled ? null : onClick}
                disabled={isDisabled}
                title={isDisabled ? tooltip : label}
            >
                <Icon size={18} />
                {label}
            </button>
        );
    };
    // -------------------------------------------------------------------------

    // --- API Fetch Functions (Retained) ---
    const fetchDeviceDetails = async (deviceId, setDetailsState, setLoadingState) => {
        const selectedDevice = mapDevices.find(device => device._id === deviceId);
        if (!selectedDevice || !selectedDevice.deviceNo) {
            if (setDetailsState) setDetailsState({ error: "Could not find Device Number." });
            if (setLoadingState) setLoadingState(false);
            return null;
        }

        const deviceNoToFetch = selectedDevice.deviceNo;
        if (setLoadingState) setLoadingState(true);
        if (setDetailsState) setDetailsState(null);

        try {
            const token = contextToken || localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found.");

            const response = await axios.post(
                "https://api.websave.in/api/manufactur/viewAMapDeviceInManufactur",
                { deviceNo: deviceNoToFetch },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
console.log(response.data)
            if (response.data?.mapDevice && typeof response.data.mapDevice === 'object' && !Array.isArray(response.data.mapDevice)) {
                if (setDetailsState) setDetailsState(response.data.mapDevice);
                return response.data.mapDevice;
            } else {
                if (setDetailsState) setDetailsState({ error: `No detailed data found for Device No: ${deviceNoToFetch}` });
            }
        } catch (error) {
            console.error("Error fetching device details:", error);
            if (setDetailsState) setDetailsState({ error: `API call failed. Status: ${error.response?.status || error.message}` });
        } finally {
            if (setLoadingState) setLoadingState(false);
        }
        return null;
    };

    const handleViewDetails = () => {
        if (!isSingleDeviceSelected) return;
        setIsViewModalOpen(true);
        fetchDeviceDetails(selectedDeviceIds[0], setModalDeviceDetails, setModalLoading);
    };

    const handleOpenCertificateModal = () => {
        if (!isSingleDeviceSelected) return;
        setIsCertificateModalOpen(true);
    };

    const downloadCertificatePDF = async (deviceNo, options) => {
        if (!deviceNo) return;

        setIsPdfDownloading(true);
        let deviceData = null;

        try {
            const selectedDevice = mapDevices.find(d => d.deviceNo === deviceNo);
            if (!selectedDevice) {
                throw new Error("Device not found in the list.");
            }

            // Fetches complete data needed for PDF
            deviceData = await fetchDeviceDetails(selectedDevice._id, null, () => { });

            if (!deviceData) {
                throw new Error("Failed to retrieve complete device data for PDF.");
            }
        } catch (error) {
            console.error("Error fetching device details for PDF:", error);
            alert(`Failed to fetch device details for PDF: ${error.message}`);
            setIsPdfDownloading(false);
            return;
        }

        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            generateCertificatePDF(doc, deviceData, options);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert(`An error occurred during PDF generation: ${error.message}`);
        } finally {
            setIsPdfDownloading(false);
            setIsCertificateModalOpen(false);
        }
    };
    // -----------------------------------------------------------------


    // --- Initial Fetch & Checkbox Handlers (Retained) ---
    useEffect(() => {
        const fetchMapDevices = async () => {
            setLoading(true);
            try {
                const token = contextToken || localStorage.getItem("token");
                if (!token) {
                    setLoading(false);
                    return;
                }

                const response = await axios.post(
                    "https://api.websave.in/api/manufactur/fetchAllMapDevice",
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.data?.mapDevice) {
                    console.log(response.data)
                    const devicesArray = Array.isArray(response.data.mapDevice) ? response.data.mapDevice : [];
                    const sortedDevices = devicesArray.sort((a, b) =>
                        (a.deviceNo || "").localeCompare(b.deviceNo || "")
                    );
                    setMapDevices(sortedDevices);
                }
            } catch (error) {
                console.error("Error fetching map devices:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMapDevices();
    }, [contextToken]);

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            // Selects only the currently filtered devices
            const allIds = filteredDevices.map(device => device._id);
            setSelectedDeviceIds(allIds);
        } else {
            setSelectedDeviceIds([]);
        }
    };
    const navigate = useNavigate();

    const handleSelectOne = (event, deviceId) => {
        if (event.target.checked) {
            setSelectedDeviceIds(prevIds => [...prevIds, deviceId]);
        } else {
            setSelectedDeviceIds(prevIds => prevIds.filter(id => id !== deviceId));
        }
    };

    const isAllSelected = filteredDevices.length > 0 && selectedDeviceIds.length === filteredDevices.length;
    const isIndeterminate = selectedDeviceIds.length > 0 && !isAllSelected;

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = isIndeterminate;
        }
    }, [isIndeterminate]);


    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen w-full bg-gray-900">
                <CubeLoader text="Fetching all mapped devices..." />
            </div>
        );
    }

    if (mapDevices.length === 0) {
        return (
            <div className="p-10 text-center bg-gray-800 rounded-2xl shadow-2xl m-6 border border-indigo-500/30">
                <AlertTriangle className="mx-auto h-12 w-12 text-indigo-500" />
                <h3 className="mt-2 text-xl font-semibold text-white">No Mapped Devices Found</h3>
                <p className="mt-1 text-gray-400">Please check your network or try again later.</p>
            </div>
        );
    }

    const selectedDeviceNo = isSingleDeviceSelected
        ? mapDevices.find(d => d._id === selectedDeviceIds[0])?.deviceNo || null
        : null;

    return (
        <div className="p-4 md:p-8 bg-gray-900 min-h-screen text-gray-100">
            {/* Loading overlay for PDF generation */}
            {isPdfDownloading && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center">
                    <CubeLoader text="Generating and downloading PDF certificate..." />
                </div>
            )}

            {/* HEADER/DASHBOARD CONTROLS */}
            <header className="mb-8 p-6 bg-gray-800 rounded-xl shadow-2xl border-b-4 border-indigo-700/50">
                <h2 className="text-3xl font-extrabold text-indigo-400 tracking-tight flex items-center gap-2">
                    <Zap className="h-7 w-7 text-yellow-400" /> Mapped Devices Dashboard
                </h2>

                {/* Search & Filter Area (Updated) */}
                <div className="mt-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-1/3">
                        <input
                            type="text"
                            placeholder="Search by Device No, RTO, or Customer Name..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setSelectedDeviceIds([]); // Clear selection on new search
                            }}
                            className="w-full py-2 pl-10 pr-4 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 shadow-md"
                        />
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {/* Display filtered results count */}
                    <p className="text-sm text-gray-400 font-medium">
                        Showing {filteredDevices.length} of {mapDevices.length} devices.
                    </p>
                </div>

                {/* ACTION BUTTONS ROW (More prominent background) */}
                <div className="mt-6 flex flex-wrap gap-3 p-4 bg-gray-900 rounded-lg border border-indigo-600/30 shadow-inner">
                    <ActionButton icon={Eye} label="View Details" onClick={handleViewDetails} />

                    <ActionButton
                        icon={Edit}
                        label="Edit Device"
                        onClick={() => alert('Edit action for ' + selectedDeviceIds[0])}
                        className="bg-yellow-600 text-gray-900 hover:bg-yellow-700 hover:shadow-yellow-500/50 focus:ring-4 focus:ring-yellow-500/50"
                    />
                    <ActionButton
                        icon={FileText}
                        label="Certificates (PDF)"
                        onClick={handleOpenCertificateModal}
                        className="bg-green-600 text-white hover:bg-green-700 hover:shadow-green-500/50 focus:ring-4 focus:ring-green-500/50"
                    />
                    {/* <ActionButton
                        icon={MapPin}
                        label="Live Tracking"
                        onClick={() => navigate(`/live-tracking`)}
                        className="bg-green-600 text-white hover:bg-green-700 hover:shadow-green-500/50 focus:ring-4 focus:ring-green-500/50"
                    /> */}

                    <ActionButton
                        icon={MapPin}
                        label="Live Tracking"
                        onClick={() => {
                            const selectedDevice = mapDevices.find(d => d._id === selectedDeviceIds[0]);
                            navigate('/live-tracking', {
                                state: {
                                    device: selectedDevice
                                }
                            });
                        }}
                        className="bg-green-600 text-white hover:bg-green-700 hover:shadow-green-500/50 focus:ring-4 focus:ring-green-500/50"
                    />
                </div>
            </header>

            {/* TABLE CONTAINER (Elegant Elevation) */}
            <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden ring-2 ring-indigo-600/50">
                <div className="max-h-[70vh] overflow-y-auto overflow-x-auto">
                    <table className="min-w-full text-sm divide-y divide-gray-700">

                        {/* REFINED TABLE HEADER - Sticky, elevated, and bold */}
                        <thead className="sticky top-0 bg-gray-900/95 backdrop-blur-sm z-20 border-b-4 border-yellow-400 shadow-xl">
                            <tr>
                                {/* Sticky Checkbox Column */}
                                <th className="p-4 text-left min-w-[50px] sticky left-0 bg-gray-900/95">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 cursor-pointer checked:bg-indigo-500 checked:border-indigo-500"
                                        checked={isAllSelected}
                                        ref={selectAllRef}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                {/* Sticky Action Column */}
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-300 uppercase tracking-wider min-w-[80px] sticky left-[50px] bg-gray-900/95 border-l border-gray-700">Action</th>

                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-300 uppercase tracking-wider min-w-[150px]">Device No.</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-300 uppercase tracking-wider min-w-[160px]">Sim Details</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-300 uppercase tracking-wider min-w-[120px]">State/District</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-300 uppercase tracking-wider min-w-[120px]">Vehicle Type</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-300 uppercase tracking-wider min-w-[120px]">Vehicle No</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-300 uppercase tracking-wider min-w-[100px]">RTO</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-300 uppercase tracking-wider min-w-[150px]">Dealer</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-300 uppercase tracking-wider min-w-[150px]">Customer Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-300 uppercase tracking-wider min-w-[120px]">Mobile No.</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-300 uppercase tracking-wider min-w-[200px]">Email</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {filteredDevices.map((device, index) => (
                                <tr
                                    key={device._id}
                                    // Striped rows for better readability
                                    className={`
                                        transition duration-150 
                                        ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700/60'} 
                                        hover:bg-gray-700 
                                        ${selectedDeviceIds.includes(device._id) ? 'bg-indigo-900/40 border-l-4 border-indigo-500' : ''}
                                    `}
                                >
                                    {/* Sticky Checkbox Cell */}
                                    <td className="p-4 whitespace-nowrap sticky left-0 z-10 bg-inherit">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 cursor-pointer checked:bg-indigo-500 checked:border-indigo-500"
                                            checked={selectedDeviceIds.includes(device._id)}
                                            onChange={(e) => handleSelectOne(e, device._id)}
                                        />
                                    </td>
                                    {/* Sticky Action Cell (Icon-only until hover) */}
                                    <td className="px-6 py-4 whitespace-nowrap sticky left-[50px] z-10 bg-inherit border-l border-gray-700/50">
                                        <button
                                            onClick={() => {
                                                setSelectedDeviceIds([device._id]);
                                                handleViewDetails();
                                            }}
                                            className="inline-flex items-center text-indigo-400 hover:text-white hover:bg-indigo-600 p-2 rounded-lg transition duration-200 group relative"
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                            {/* Tooltip-like effect on hover for clarity on small columns */}
                                            <span className="absolute left-full ml-2 w-max px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                View Details
                                            </span>
                                        </button>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-gray-100 font-medium">{device.deviceNo || 'N/A'}


                                    </td>

                                    {/* SIM DETAILS COLUMN - Compact and readable */}
                                    <td className="px-6 py-3 text-gray-300 text-xs">
                                        {device.simDetails && device.simDetails.length > 0 ? (
                                            device.simDetails.map((sim, index) => (
                                                <div key={index} className="flex flex-col mb-1 p-1 rounded-sm bg-gray-700/30 last:mb-0">
                                                    <span className="font-medium text-indigo-300 text-[11px]">{sim.operator || 'N/A'}</span>
                                                    <span className="text-gray-400 text-[10px]">{`#${sim.simNo || 'N/A'}`}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-gray-400 text-sm">N/A</span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                                        {`${device.Customerstate || 'N/A'} / ${device.Customerdistrict || 'N/A'}`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">{device.VehicleType || 'N/A'}</td>
<td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">{device.vechileNo || 'N/A'}</td>
                                    {/* RTO Data Cell - Highlighted */}
                                    <td className="px-6 py-4 whitespace-nowrap text-yellow-400 font-semibold text-sm">
                                        {device.Rto || 'N/A'}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-gray-200 text-sm">{device.delerName || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-100 text-sm font-medium">{device.fullName || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">{device.mobileNo || 'N/A'}</td>
                                    <td className="px-6 py-4 text-gray-300 truncate max-w-[200px] text-sm">{device.email || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredDevices.length === 0 && mapDevices.length > 0 && (
                        <div className="p-10 text-center bg-gray-800">
                            <Search className="mx-auto h-12 w-12 text-gray-500" />
                            <h3 className="mt-2 text-lg font-semibold text-gray-300">No matching devices found</h3>
                            <p className="mt-1 text-gray-500">Try adjusting your search terms.</p>
                        </div>
                    )}

                </div>
            </div>

            {/* Modals */}
            <DeviceDetailsModal
                device={modalDeviceDetails}
                onClose={() => setIsViewModalOpen(false)}
                loading={modalLoading}
                isOpen={isViewModalOpen}
            />

            <CertificateModal
                isOpen={isCertificateModalOpen}
                onClose={() => setIsCertificateModalOpen(false)}
                deviceNo={selectedDeviceNo}
                onDownload={downloadCertificatePDF}
                isDownloading={isPdfDownloading}
            />
        </div>
    );
}

export default DeviceMapreport;