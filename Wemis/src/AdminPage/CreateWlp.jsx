import React, { useContext, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import AdminNavbar from "./AdminNavbar";
import { UserAppContext } from "../contexts/UserAppProvider";
import { FaUserPlus } from "react-icons/fa";
import { Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const countryStateData = {
    India: [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
        "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
        "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
        "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
        "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
        "Jammu and Kashmir"
    ],
    USA: ["California", "Texas", "Florida", "New York"],
    Canada: ["Ontario", "Quebec", "British Columbia"],
};

export default function CreateWlpForm() {
    const [loading, setLoading] = useState(false);
    const { token: contextToken } = useContext(UserAppContext);
    const tkn = contextToken || localStorage.getItem("token");
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        country: "",
        state: "",
        language: "English",
        organizationName: "",
        mobileNumber: "",
        salesMobile: "",
        landlineNumber: "",
        email: "",
        appPackage: "",
        showPoweredBy: "Yes",
        poweredByText: "",
        accountLimit: "",
        smsGatewayUrl: "https://",
        smsGatewayMethod: "GET",
        gstinNumber: "",
        billingEmail: "",
        allowThirdPartyAPI: "Yes",
        websiteUrl: "https://",
        address: "",
        logo: null,
    });

    // Handle change for all inputs
    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    };

    // Validate all fields
    const validateForm = () => {
        for (const key in formData) {
            if (formData[key] === "" || formData[key] === null) {
                toast.error(`${key.replace(/([A-Z])/g, ' $1')} is required`);
                return false;
            }
        }
        return true;
    };

    // Submit form

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const data = new FormData();

            // Append all fields as per API keys
            Object.entries({
                country: formData.country,
                state: formData.state,
                defaultLanguage: formData.language,
                organizationName: formData.organizationName,
                mobileNumber: formData.mobileNumber,
                salesMobileNumber: formData.salesMobile,
                landLineNumber: formData.landlineNumber,
                email: formData.email,
                appPackage: formData.appPackage,
                showPoweredBy: formData.showPoweredBy,
                poweredByText: formData.poweredByText,
                accountLimit: formData.accountLimit,
                smsGatewayUrl: formData.smsGatewayUrl,
                smsGatewayMethod: formData.smsGatewayMethod,
                gstinNumber: formData.gstinNumber,
                billingEmail: formData.billingEmail,
                allowThirdPartyAPI: formData.allowThirdPartyAPI,
                websiteUrl: formData.websiteUrl,
                address: formData.address
            }).forEach(([key, value]) => {
                if (value) data.append(key, value);
            });

            if (formData.logo) data.append("logo", formData.logo);

            await axios.post(
                "https://api.websave.in/api/admin/createWlp",
                data,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${tkn}`, // Pass token here
                    },
                }
            );

            toast.success("WLP Created Successfully!");
            setTimeout(() => navigate("/admin/wlplist"), 3000);
        } catch (err) {
            console.error(err);
            toast.error("Failed to create WLP");
        }
    };

    return (
        <div className="min-h-screen bg-black text-white mt-36">
            <AdminNavbar />
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6 text-yellow-400">Create WLP</h1>
                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-900 p-6 rounded-2xl border border-yellow-400 shadow-xl"
                >
                    {/* Country */}
                    <div>
                        <label className="block font-medium mb-1 text-yellow-400">
                            Country
                        </label>
                        <select
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            className="w-full bg-black text-white border border-yellow-400 rounded p-2 focus:ring-2 focus:ring-yellow-400"
                        >
                            <option value="">Select Country</option>
                            {Object.keys(countryStateData).map((country) => (
                                <option key={country} value={country}>
                                    {country}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* State */}
                    <div>
                        <label className="block font-medium mb-1 text-yellow-400">
                            State
                        </label>
                        <select
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            disabled={!formData.country}
                            className="w-full bg-black text-white border border-yellow-400 rounded p-2 focus:ring-2 focus:ring-yellow-400"
                        >
                            <option value="">Select State</option>
                            {formData.country &&
                                countryStateData[formData.country].map((state) => (
                                    <option key={state} value={state}>
                                        {state}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Language */}
                    <div>
                        <label className="block font-medium mb-1 text-yellow-400">
                            Language
                        </label>
                        <select
                            name="language"
                            value={formData.language}
                            onChange={handleChange}
                            className="w-full bg-black text-white border border-yellow-400 rounded p-2 focus:ring-2 focus:ring-yellow-400"
                        >
                            <option>English</option>
                            <option>Hindi</option>
                            <option>French</option>
                        </select>
                    </div>

                    {/* Organization Name */}
                    <div>
                        <label className="block font-medium mb-1 text-yellow-400">
                            Organization Name
                        </label>
                        <input
                            type="text"
                            name="organizationName"
                            value={formData.organizationName}
                            onChange={handleChange}
                            className="w-full bg-black text-white border border-yellow-400 rounded p-2 focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>

                    {/* Mobile Number */}
                    <div>
                        <label className="block font-medium mb-1 text-yellow-400">
                            Mobile Number
                        </label>
                        <input
                            type="text"
                            name="mobileNumber"
                            value={formData.mobileNumber}
                            onChange={handleChange}
                            className="w-full bg-black text-white border border-yellow-400 rounded p-2 focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>

                    {/* Sales Mobile */}
                    <div>
                        <label className="block font-medium mb-1 text-yellow-400">
                            Sales Mobile
                        </label>
                        <input
                            type="text"
                            name="salesMobile"
                            value={formData.salesMobile}
                            onChange={handleChange}
                            className="w-full bg-black text-white border border-yellow-400 rounded p-2 focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>

                    {/* Landline Number */}
                    <div>
                        <label className="block font-medium mb-1 text-yellow-400">
                            Landline Number
                        </label>
                        <input
                            type="text"
                            name="landlineNumber"
                            value={formData.landlineNumber}
                            onChange={handleChange}
                            className="w-full bg-black text-white border border-yellow-400 rounded p-2 focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block font-medium mb-1 text-yellow-400">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full bg-black text-white border border-yellow-400 rounded p-2 focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>

                    {/* App Package */}
                    <div>
                        <label className="block font-medium mb-1 text-yellow-400">
                            App Package
                        </label>
                        <input
                            type="text"
                            name="appPackage"
                            value={formData.appPackage}
                            onChange={handleChange}
                            className="w-full bg-black text-white border border-yellow-400 rounded p-2 focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>

                    {/* Show Powered By */}
                    <div>
                        <label className="block font-medium mb-1 text-yellow-400">
                            Show Powered By
                        </label>
                        <select
                            name="showPoweredBy"
                            value={formData.showPoweredBy}
                            onChange={handleChange}
                            className="w-full bg-black text-white border border-yellow-400 rounded p-2 focus:ring-2 focus:ring-yellow-400"
                        >
                            <option>Yes</option>
                            <option>No</option>
                        </select>
                    </div>

                    {/* Powered By Text */}
                    <div>
                        <label className="block font-medium mb-1 text-yellow-400">
                            Powered By Text
                        </label>
                        <input
                            type="text"
                            name="poweredByText"
                            value={formData.poweredByText}
                            onChange={handleChange}
                            className="w-full bg-black text-white border border-yellow-400 rounded p-2 focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>

                    {/* Account Limit */}
                    <div>
                        <label className="block font-medium mb-1 text-yellow-400">
                            Account Limit
                        </label>
                        <input
                            type="number"
                            name="accountLimit"
                            value={formData.accountLimit}
                            onChange={handleChange}
                            className="w-full bg-black text-white border border-yellow-400 rounded p-2 focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>

                    {/* SMS Gateway URL */}
                    <div>
                        <label className="block font-medium mb-1 text-yellow-400">
                            SMS Gateway URL
                        </label>
                        <input
                            type="text"
                            name="smsGatewayUrl"
                            value={formData.smsGatewayUrl}
                            onChange={handleChange}
                            className="w-full bg-black text-white border border-yellow-400 rounded p-2 focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>

                    {/* SMS Gateway Method */}
                    <div>
                        <label className="block font-medium mb-1 text-yellow-400">
                            SMS Gateway Method
                        </label>
                        <select
                            name="smsGatewayMethod"
                            value={formData.smsGatewayMethod}
                            onChange={handleChange}
                            className="w-full bg-black text-white border border-yellow-400 rounded p-2 focus:ring-2 focus:ring-yellow-400"
                        >
                            <option>GET</option>
                            <option>POST</option>
                        </select>
                    </div>

                    {/* GSTIN Number */}
                    <div>
                        <label className="block font-medium mb-1 text-yellow-400">
                            GSTIN Number
                        </label>
                        <input
                            type="text"
                            name="gstinNumber"
                            value={formData.gstinNumber}
                            onChange={handleChange}
                            className="w-full bg-black text-white border border-yellow-400 rounded p-2 focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>

                    {/* Billing Email */}
                    <div>
                        <label className="block font-medium mb-1 text-yellow-400">
                            Billing Email
                        </label>
                        <input
                            type="email"
                            name="billingEmail"
                            value={formData.billingEmail}
                            onChange={handleChange}
                            className="w-full bg-black text-white border border-yellow-400 rounded p-2 focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>

                    {/* Allow Third Party API */}
                    <div>
                        <label className="block font-medium mb-1 text-yellow-400">
                            Allow Third Party API
                        </label>
                        <select
                            name="allowThirdPartyAPI"
                            value={formData.allowThirdPartyAPI}
                            onChange={handleChange}
                            className="w-full bg-black text-white border border-yellow-400 rounded p-2 focus:ring-2 focus:ring-yellow-400"
                        >
                            <option>Yes</option>
                            <option>No</option>
                        </select>
                    </div>

                    {/* Website URL */}
                    <div>
                        <label className="block font-medium mb-1 text-yellow-400">
                            Website URL
                        </label>
                        <input
                            type="text"
                            name="websiteUrl"
                            value={formData.websiteUrl}
                            onChange={handleChange}
                            className="w-full bg-black text-white border border-yellow-400 rounded p-2 focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                        <label className="block font-medium mb-1 text-yellow-400">
                            Address
                        </label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full bg-black text-white border border-yellow-400 rounded p-2 focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>

                    {/* Logo Upload */}
                    <div className="md:col-span-2">
                        <label className="block font-medium mb-1 text-yellow-400">
                            Logo
                        </label>
                        <input
                            type="file"
                            name="logo"
                            accept="image/*"
                            onChange={handleChange}
                            className="w-full text-white border border-yellow-400 rounded p-2 bg-black file:bg-yellow-400 file:text-black file:border-none file:px-4 file:py-2 file:rounded"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="md:col-span-2 flex justify-end">
                        <button
                            type="submit"
                            className="bg-yellow-400 text-black px-6 py-2 rounded hover:bg-yellow-500 transition-all shadow-lg"
                        >
                            {loading ? "Creating..." : <><FaUserPlus /> Create Wlp</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
