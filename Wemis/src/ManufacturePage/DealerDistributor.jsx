import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { UserAppContext } from "../contexts/UserAppProvider";
import ManufactureNavbar from "./ManufactureNavbar";
import { getAllStates, getDistricts } from "india-state-district";
import { FaEdit, FaTrash } from "react-icons/fa";

/* ---------------- Constants ---------------- */
const USA_STATES = ["California", "Texas", "New York", "Florida"];
const CHINA_PROVINCES = ["Beijing", "Shanghai", "Guangdong", "Zhejiang"];
const COUNTRIES = ["India", "USA", "China"];
const GENDERS = ["Male", "Female", "Other"];
const OCCUPATIONS = ["Business", "Engineer", "Technician", "Other"];
const LANGUAGES = ["English", "Hindi", "Odia", "Chinese"];
const RTO_DIVISIONS = ["Bhubaneswar", "Cuttack", "Balasore", "Sambalpur"];

function DealerDistributor() {
    const { token: contextToken } = useContext(UserAppContext);
    const tkn = contextToken || localStorage.getItem("token");

    const [dealers, setDealers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [indiaStates, setIndiaStates] = useState([]);
    const [indiaDistricts, setIndiaDistricts] = useState([]);
    const [genericStates, setGenericStates] = useState([]);

    const [distributors, setDistributors] = useState([]);

    const [newDealer, setNewDealer] = useState({
        distributorId: "",
        select_Distributor_Name: "",
        business_Name: "",
        name: "",
        email: "",
        gender: "",
        mobile: "",
        date_of_birth: "",
        age: "",
        Is_Map_Device_Edit: "",
        pan_Number: "",
        occupation: "",
        Advance_Payment: "",
        languages_Known: "",
        country: "India",
        state: "",
        district: "",
        RTO_Division: "",
        Pin_Code: "",
        area: "",
        address: "",
    });

    /* ---------------- Fetch Distributors ---------------- */
    const fetchDistributors = async () => {
        try {
            const res = await axios.post(
                "https://api.websave.in/api/manufactur/fetchDistributor",
                {},
                { headers: { Authorization: `Bearer ${tkn}` } }
            );
            setDistributors(res.data.distributor || []);
        } catch {
            toast.error("Failed to fetch Distributors");
        }
    };

    /* ---------------- Fetch Dealers ---------------- */
    const fetchDealers = async () => {
        try {
            const res = await axios.post(
                "https://api.websave.in/api/manufactur/fetchDelerDistributor",
                {},
                { headers: { Authorization: `Bearer ${tkn}` } }
            );
            setDealers(res.data.fetchAllCreateDelerUnderDistributor);
            console.log(res.data)
        } catch {
            toast.error("Failed to fetch Dealers");
        }
    };

    useEffect(() => {
        fetchDealers();
        fetchDistributors();
        setIndiaStates(getAllStates());
    }, [tkn]);

    /* ---------------- Country → State → District ---------------- */
    const handleCountryChange = (e) => {
        const country = e.target.value;
        let nextStates = [];
        if (country === "USA") nextStates = USA_STATES;
        if (country === "China") nextStates = CHINA_PROVINCES;

        setNewDealer({
            ...newDealer,
            country,
            state: "",
            district: "",
        });
        setIndiaDistricts([]);
        setGenericStates(nextStates);
    };

    const handleStateChange = (e) => {
        const stateVal = e.target.value;
        setNewDealer({ ...newDealer, state: stateVal, district: "" });
        if (newDealer.country === "India") {
            const found = indiaStates.find((s) => s.name === stateVal);
            if (found?.code) setIndiaDistricts(getDistricts(found.code));
        }
    };

    /* ---------------- Input Change ---------------- */
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewDealer((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    /* ---------------- Distributor Select ---------------- */
    const handleDistributorChange = (e) => {
        const distId = e.target.value;
        const dist = distributors.find((d) => d._id === distId);
        setNewDealer((prev) => ({
            ...prev,
            distributorId: distId,
            select_Distributor_Name: dist ? dist.business_Name : "",
        }));
    };

    /* ---------------- Submit Create Dealer ---------------- */
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(
                "https://api.websave.in/api/manufactur/createDelerUnderDistributor",
                newDealer,
                { headers: { Authorization: `Bearer ${tkn}` } }
            );
            toast.success("Dealer created successfully");
            setIsCreateModalOpen(false);
            fetchDealers();
        } catch {
            toast.error("Failed to create Dealer");
        }
    };

    /* ---------------- Filter Dealers ---------------- */
    const filteredDealers = dealers.filter((d) =>
        [d.business_Name, d.email, d.mobile]
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );



    /* ---------------- Delete Dealer ---------------- */
    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: "Are you sure?",
            text: "This dealer will be deleted permanently.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
        });

        if (confirm.isConfirmed) {
            try {
                console.log("Deleting dealer:", id);

                await axios.post(
                    "https://api.websave.in/api/manufactur/deleteDelerDistributor",
                    { delerId: id }, // ✅ try dealerId
                    { headers: { Authorization: `Bearer ${tkn}` } }
                );

                toast.success("Dealer deleted successfully");
                fetchDealers();
            } catch (err) {
                console.error("Delete failed:", err.response?.data || err.message);
                toast.error("Failed to delete Dealer");
            }
        }
    };


    /* ---------------- Edit Dealer ---------------- */
    const handleEditClick = (dealer) => {
        // Prefill modal with dealer details
        setNewDealer(dealer);
        setIsCreateModalOpen(true); // open same modal in edit mode
    };

    return (
        <div className="p-6 bg-black min-h-screen text-gray-200">
            <ManufactureNavbar />

            <div className="flex justify-between items-center bg-yellow-600 text-black px-4 py-3 rounded-t-xl mt-10 shadow-lg">
                <h2 className="text-lg font-semibold">Dealer Management</h2>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-black border border-yellow-500 px-4 py-2 rounded-lg text-yellow-400"
                >
                    + Create Dealer
                </button>
            </div>

            {/* Search + Table */}
            <div className="flex justify-between items-center p-4">
                <input
                    type="text"
                    placeholder="Search dealers..."
                    className="border border-yellow-500 bg-black text-yellow-400 rounded px-3 py-1 text-sm"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto bg-gray-900 shadow rounded-b-xl border border-yellow-500">
                <table className="min-w-full text-left border-collapse">
                    <thead className="bg-yellow-600 text-black">
                        <tr>
                            <th className="px-4 py-2">#</th>
                            <th className="px-4 py-2">Distributor Name</th>
                            <th className="px-4 py-2">Business Name</th>
                            <th className="px-4 py-2">Owner</th>
                            <th className="px-4 py-2">Email</th>
                            <th className="px-4 py-2">Mobile</th>
                            <th className="px-4 py-2">Password</th>
                            <th className="px-4 py-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDealers.length > 0 ? (
                            filteredDealers.map((d, i) => (
                                <tr key={d._id} className={i % 2 ? "bg-gray-800" : "bg-black"}>
                                    <td className="px-4 py-2">{i + 1}</td>
                                    <td className="px-4 py-2">{d.select_Distributor_Name}</td>
                                    <td className="px-4 py-2">{d.business_Name}</td>
                                    <td className="px-4 py-2">{d.name}</td>
                                    <td className="px-4 py-2">{d.email}</td>
                                    <td className="px-4 py-2">{d.mobile}</td>
                                    <td className="px-4 py-2">{d.mobile}</td>
                                    <td className="px-4 py-2 flex gap-2">
                                        <button
                                            onClick={() => handleEditClick(d)}
                                            className="bg-yellow-500 p-2 rounded text-black hover:bg-yellow-400 transition"
                                        >
                                            <FaEdit />
                                        </button>

                                        <button
                                            onClick={() => handleDelete(d._id)}
                                            className="bg-red-500 p-2 rounded text-white hover:bg-red-400 transition"
                                        >
                                            <FaTrash />
                                        </button>

                                    </td>
                                </tr>

                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="text-center py-4">
                                    No Dealers found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>


            {/* Create Dealer Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-6 rounded-xl w-[900px] border border-yellow-500 overflow-y-auto max-h-[90vh]">
                        <h2 className="text-xl font-bold text-yellow-400 mb-6">
                            Create Dealer
                        </h2>
                        <form onSubmit={handleCreateSubmit} className="grid grid-cols-2 gap-4">
                            {/* Distributor Selection */}
                            <div>
                                <label className="block text-sm mb-1">Select Distributor*</label>
                                <select
                                    name="distributorId"
                                    value={newDealer.distributorId}
                                    onChange={handleDistributorChange}
                                    className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                >
                                    <option value="">Select Distributor</option>
                                    {distributors.map((d) => (
                                        <option key={d._id} value={d._id}>
                                            {d.business_Name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Business Name*</label>
                                <input
                                    name="business_Name"
                                    value={newDealer.business_Name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Name*</label>
                                <input
                                    name="name"
                                    value={newDealer.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Email*</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={newDealer.email}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Gender*</label>
                                <select
                                    name="gender"
                                    value={newDealer.gender}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                >
                                    <option value="">Select Gender</option>
                                    {GENDERS.map((g) => (
                                        <option key={g}>{g}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Mobile*</label>
                                <input
                                    name="mobile"
                                    value={newDealer.mobile}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Date of Birth*</label>
                                <input
                                    type="date"
                                    name="date_of_birth"
                                    value={newDealer.date_of_birth}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Age*</label>
                                <input
                                    name="age"
                                    value={newDealer.age}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Is Map Device Edit*</label>
                                <select
                                    name="Is_Map_Device_Edit"
                                    value={newDealer.Is_Map_Device_Edit}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                >
                                    <option value="">Select Option</option>
                                    <option value="true">True</option>
                                    <option value="false">False</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm mb-1">PAN Number*</label>
                                <input
                                    name="pan_Number"
                                    value={newDealer.pan_Number}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Occupation*</label>
                                <select
                                    name="occupation"
                                    value={newDealer.occupation}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                >
                                    <option value="">Select Occupation</option>
                                    {OCCUPATIONS.map((o) => (
                                        <option key={o}>{o}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Advance Payment*</label>
                                <input
                                    name="Advance_Payment"
                                    value={newDealer.Advance_Payment}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Languages Known*</label>
                                <select
                                    name="languages_Known"
                                    value={newDealer.languages_Known}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                >
                                    <option value="">Select Language</option>
                                    {LANGUAGES.map((l) => (
                                        <option key={l}>{l}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Country*</label>
                                <select
                                    name="country"
                                    value={newDealer.country}
                                    onChange={handleCountryChange}
                                    className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                >
                                    {COUNTRIES.map((c) => (
                                        <option key={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm mb-1">State*</label>
                                <select
                                    name="state"
                                    value={newDealer.state}
                                    onChange={handleStateChange}
                                    className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                >
                                    <option value="">Select State</option>
                                    {newDealer.country === "India"
                                        ? indiaStates.map((s) => <option key={s.name}>{s.name}</option>)
                                        : genericStates.map((s) => <option key={s}>{s}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm mb-1">District*</label>
                                <select
                                    name="district"
                                    value={newDealer.district}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                >
                                    <option value="">Select District</option>
                                    {indiaDistricts.map((d) => (
                                        <option key={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm mb-1">RTO Division*</label>
                                <select
                                    name="RTO_Division"
                                    value={newDealer.RTO_Division}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                >
                                    <option value="">Select RTO</option>
                                    {RTO_DIVISIONS.map((r) => (
                                        <option key={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Pin Code*</label>
                                <input
                                    name="Pin_Code"
                                    value={newDealer.Pin_Code}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Area*</label>
                                <input
                                    name="area"
                                    value={newDealer.area}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm mb-1">Address*</label>
                                <textarea
                                    name="address"
                                    value={newDealer.address}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded bg-black border border-yellow-500"
                                />
                            </div>

                            <div className="col-span-2 flex justify-end gap-4 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 bg-gray-700 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-yellow-500 text-black rounded-lg"
                                >
                                    Save Dealer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DealerDistributor;
