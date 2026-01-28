import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Plus, X, Package, Search, Edit } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import ManufactureNavbar from "./ManufactureNavbar";
import { UserAppContext } from "../contexts/UserAppProvider";

// --- API Endpoints ---
const SUBSCRIPTION_CREATE_API =
  "https://api.websave.in/api/manufactur/createNewSubscription";
const FETCH_SUBSCRIPTIONS_API =
  "https://api.websave.in/api/manufactur/fetchAllSubscriptionPlans";
const FIND_SUBSCRIPTION_BY_ID_API =
  "https://api.websave.in/api/manufactur/findSubScriptionById";
const EDIT_SUBSCRIPTION_API =
  "https://api.websave.in/api/manufactur/editSubscriptionById";

// --- Constants ---
const BILLING_CYCLE_DAYS = [
  "3 days", "7 days", "30 days", "60 days", "90 days", "120 days", "150 days",
  "180 days", "210 days", "240 days", "270 days", "300 days", "330 days",
];
const PACKAGE_TYPES = ["TRACKER", "OFFERED"];

// --- New Renewal Constants for String Type ---
const RENEWAL_AUTOMATIC_STRING = "Automatic";
const RENEWAL_MANUAL_STRING = "Manual";

const initialSubscriptionState = {
  packageType: PACKAGE_TYPES[0],
  packageName: "",
  billingCycle: BILLING_CYCLE_DAYS[0],
  price: 0,
  // We'll use a boolean state in the form, but convert it to a String for the API
  renewal: true, // true means Automatic
  description: "",
  subscriptionId: "",
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch {
    return dateString;
  }
};

function Subscription() {
  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState(initialSubscriptionState);
  const [message, setMessage] = useState("");
  const [submissionLoading, setSubmissionLoading] = useState(false);

  // Helper function to check if renewal is automatic (using string comparison)
  const isRenewalAutomatic = (renewalValue) => {
    if (typeof renewalValue === 'string') {
        // ✅ FIX: Use strict string comparison
        return renewalValue.toLowerCase() === RENEWAL_AUTOMATIC_STRING.toLowerCase();
    }
    // Fallback for boolean values (shouldn't happen after the fix, but good for safety)
    return renewalValue === true;
  }

  // Fetch all subscriptions
  const fetchSubscriptions = async () => {
    if (!tkn) return toast.error("Token not found. Please log in.");
    setLoading(true);
    try {
      const res = await axios.post(
        FETCH_SUBSCRIPTIONS_API,
        {},
        { headers: { Authorization: `Bearer ${tkn}` } }
      );
      const data = res.data.allSubscription || [];
      const sanitized = data.map((sub) => ({
        ...sub,
        price: parseFloat(sub.price) || 0,
        // ✅ FIX: The state 'renewal' will store a boolean (true/false) based on the string value from the backend
        renewal: isRenewalAutomatic(sub.renewal), 
      }));
      setSubscriptions(sanitized);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to fetch subscriptions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tkn) fetchSubscriptions();
  }, [tkn]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditClick = async (id) => {
    if (!tkn) return toast.error("Missing token.");

    setIsModalOpen(true);
    setIsEditMode(true);
    setMessage("Loading subscription...");
    setSubmissionLoading(true);

    try {
      const res = await axios.post(
        FIND_SUBSCRIPTION_BY_ID_API,
        { subscriptionId: id },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tkn}`,
          },
        }
      );

      let subData = res.data.findSubscription;
      if (Array.isArray(subData)) subData = subData[0];
      if (!subData) throw new Error("Subscription not found");

      setFormData({
        _id: subData._id || "",
        subscriptionId: subData._id || "",
        packageType: subData.packageType || PACKAGE_TYPES[0],
        packageName: subData.packageName || "",
        billingCycle: subData.billingCycle || BILLING_CYCLE_DAYS[0],
        price: subData.price?.toString() || "0",
        description: subData.description || "",
        // ✅ FIX: Convert string from backend to boolean for the form state
        renewal: isRenewalAutomatic(subData.renewal),
      });
      setMessage("");
    } catch (err) {
      console.error("Edit error:", err);
      toast.error("Failed to fetch subscription details.");
      setMessage("❌ Could not load subscription.");
    } finally {
      setSubmissionLoading(false);
    }
  };

  // --- Create or Edit Submit (FINAL FIX: Aligned with Mongoose Schema as String) ---
  const handleCreateOrEditSubmit = async (e) => {
    e.preventDefault();
    if (!tkn) return toast.error("Missing token.");

    setSubmissionLoading(true);
    setMessage(isEditMode ? "Updating subscription..." : "Creating subscription...");

    try {
      const apiEndpoint = isEditMode ? EDIT_SUBSCRIPTION_API : SUBSCRIPTION_CREATE_API;
      const payload = { ...formData };
      
      // ✅ CORE FIX: Convert the boolean state to the required string value for the backend.
      // This ensures the backend receives "Automatic" or "Manual" as a String.
      payload.renewal = formData.renewal ? RENEWAL_AUTOMATIC_STRING : RENEWAL_MANUAL_STRING; 

      // Price conversion
      payload.price = parseFloat(payload.price);
      

      if (isEditMode) {
        payload.subscriptionId = formData.subscriptionId;
        delete payload._id;
      } else {
        delete payload._id;
        delete payload.subscriptionId;
        payload.packageName = formData.packageName.trim(); // exact user input
      }

      const res = await axios.post(apiEndpoint, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tkn}`,
        },
      });

      if (res.status === 200 || res.status === 201) {
        toast.success(`Subscription ${isEditMode ? "updated" : "created"} successfully!`);
        await fetchSubscriptions();
        closeModal();
      } else {
        const errorMessage = res.data?.message || "Unexpected server response.";
        toast.error(errorMessage);
        setMessage(`❌ ${errorMessage}`);
      }
    } catch (err) {
      const backendError = err.response?.data?.message || err.message;
      console.error("Submit error:", err.response?.data || err.message);

      if (backendError && (backendError.includes("duplicate") || backendError.includes("unique"))) {
          toast.error("Package name already exists. Please choose a different name.");
      } else {
          toast.error(backendError);
      }

      setMessage(`❌ Submission failed: ${backendError}`);
    } finally {
      setSubmissionLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter(
    (s) =>
      s.packageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.packageType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setFormData(initialSubscriptionState);
    setMessage("");
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Toaster position="top-right" />
      <ManufactureNavbar />

      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-extrabold text-yellow-400 mb-6 border-b border-gray-700 pb-3">
          Subscription Management
        </h1>

        {/* Search & Create */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by name or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition duration-150"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          <button
            onClick={() => {
              setIsModalOpen(true);
              setIsEditMode(false);
              setFormData(initialSubscriptionState);
            }}
            className="flex items-center gap-2 px-6 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition duration-150 w-full sm:w-auto justify-center"
          >
            <Plus size={20} /> Create Subscription
          </button>
        </div>

        {/* Table */}
        <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-700">
          <h2 className="text-xl font-bold text-yellow-400 p-4 border-b border-gray-700 flex items-center gap-2">
            <Package size={20} /> Active Subscriptions
          </h2>

          <div className="overflow-x-auto">
            {loading ? (
              <p className="p-6 text-center text-yellow-400">Loading subscriptions...</p>
            ) : filteredSubscriptions.length === 0 ? (
              <p className="p-6 text-center text-gray-400">No subscriptions found.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    {["Package Name", "Type", "Price", "Cycle", "Renewal", "Created", "Actions"].map((head) => (
                      <th key={head} className="px-6 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider whitespace-nowrap">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredSubscriptions.map((s) => (
                    <tr key={s._id} className="hover:bg-gray-700/50 text-sm">
                      <td className="px-6 py-4 font-medium text-yellow-300 whitespace-nowrap">{s.packageName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{s.packageType}</td>
                      <td className="px-6 py-4 text-green-400 font-mono whitespace-nowrap">{(s.price || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{s.billingCycle}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={s.renewal ? "text-yellow-400" : "text-gray-400"}>
                          {/* ✅ FIX: Display correctly based on the boolean state 's.renewal' */}
                          {s.renewal ? RENEWAL_AUTOMATIC_STRING : RENEWAL_MANUAL_STRING}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 whitespace-nowrap">{formatDate(s.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleEditClick(s._id)}
                          className="text-yellow-500 hover:text-yellow-300 p-2 rounded-full hover:bg-gray-700 transition"
                          title="Edit Subscription"
                        >
                          <Edit size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-900 p-6 sm:p-8 rounded-xl w-full max-w-md border border-yellow-500 shadow-2xl overflow-y-auto max-h-[95vh]">
              <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-3">
                <h2 className="text-2xl font-bold text-yellow-400">
                  {isEditMode ? "Edit Subscription ✏️" : "Create Subscription 💳"}
                </h2>
                <button onClick={closeModal} className="text-yellow-400 hover:bg-gray-800 rounded-full p-2 transition">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateOrEditSubmit} className="space-y-4">
                {/* Package Name */}
                <div>
                  <label htmlFor="packageName" className="block mb-1 text-gray-300 font-medium">Package Name *</label>
                  <input
                    id="packageName"
                    type="text"
                    name="packageName"
                    value={formData.packageName}
                    onChange={handleChange}
                    required
                    className="w-full p-3 bg-gray-800 border border-yellow-500/50 rounded-lg text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                  />
                </div>

                {/* Package Type + Billing Cycle */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-1/2">
                    <label htmlFor="packageType" className="block mb-1 text-gray-300 font-medium">Package Type *</label>
                    <select
                      id="packageType"
                      name="packageType"
                      value={formData.packageType}
                      onChange={handleChange}
                      required
                      className="w-full p-3 bg-gray-800 border border-yellow-500/50 rounded-lg text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                    >
                      {PACKAGE_TYPES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-1/2">
                    <label htmlFor="billingCycle" className="block mb-1 text-gray-300 font-medium">Billing Cycle *</label>
                    <select
                      id="billingCycle"
                      name="billingCycle"
                      value={formData.billingCycle}
                      onChange={handleChange}
                      className="w-full p-3 bg-gray-800 border border-yellow-500/50 rounded-lg text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                    >
                      {BILLING_CYCLE_DAYS.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label htmlFor="price" className="block mb-1 text-gray-300 font-medium">Price</label>
                  <input
                    id="price"
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                    className="w-full p-3 bg-gray-800 border border-yellow-500/50 rounded-lg text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                  />
                </div>

                {/* Renewal */}
                <div className="flex items-center justify-between bg-gray-800 border border-yellow-500/50 rounded-lg p-3">
                  <label htmlFor="renewal-switch" className="text-gray-300 font-medium cursor-pointer">
                    Renewal Type:{" "}
                    <span className="font-semibold text-yellow-300">
                      {/* ✅ FIX: Display based on the boolean state */}
                      {formData.renewal ? RENEWAL_AUTOMATIC_STRING : RENEWAL_MANUAL_STRING}
                    </span>
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="renewal-switch"
                      type="checkbox"
                      name="renewal"
                      checked={formData.renewal}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block mb-1 text-gray-300 font-medium">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full p-3 bg-gray-800 border border-yellow-500/50 rounded-lg text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 resize-y"
                  ></textarea>
                </div>

                {message && (
                  <p
                    className={`text-center p-3 rounded-md text-sm ${
                      message.includes("❌")
                        ? "bg-red-700/30 text-red-400 border border-red-500"
                        : "bg-green-700/30 text-green-400 border border-green-500"
                    }`}
                  >
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submissionLoading}
                  className={`w-full py-3 font-bold rounded-lg shadow-md transition-all duration-300 ${
                    submissionLoading
                      ? "bg-yellow-300 text-black cursor-not-allowed opacity-70"
                      : "bg-yellow-500 hover:bg-yellow-400 text-black"
                  }`}
                >
                  {submissionLoading
                    ? isEditMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditMode
                    ? "Update Subscription"
                    : "Create Subscription"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Subscription;