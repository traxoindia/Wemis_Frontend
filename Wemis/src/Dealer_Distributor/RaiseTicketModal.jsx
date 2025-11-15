import React, { useState, useEffect } from "react";
import { FaTimes, FaTicketAlt } from "react-icons/fa";
import { toast } from "react-toastify";

const VEHICLE_API_URL =
  "https://api.websave.in/api/manufactur/fetchAllVechileNoByDeler";
const SUBMIT_API_URL =
  "https://api.websave.in/api/manufactur/ticketIssueByDeler";

const RaiseTicketModal = ({ isOpen, onClose, onSubmit }) => {
  const [vechileNo, setVechileNo] = useState("");
  const [issueType, setIssueType] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [address, setAddress] = useState("");

  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const handleModalClose = () => {
    setSubmitError(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchVehicles = async () => {
      setIsLoading(true);
      setFetchError(null);

      const token = localStorage.getItem("token");

      if (!token) {
        setFetchError("Authentication token not found.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(VEHICLE_API_URL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.message);

        if (Array.isArray(data.vechileNos)) {
          const valid = data.vechileNos.filter(Boolean);
          setVehicleOptions(valid);

          if (valid.length > 0) setVechileNo(valid[0]);
        }
      } catch (error) {
        setFetchError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    setVechileNo("");
    setIssueType("");
    setIssueDescription("");
    setAddress("");

    fetchVehicles();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!vechileNo || !issueType || !issueDescription || !address) {
      toast.error("Please fill all required fields.");
      return;
    }

    setIsSubmitting(true);

    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Token not found. Please login again.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      vechileNo,
      issueType,
      issueDescription,
      address,
    };

    try {
      const response = await fetch(SUBMIT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Submission failed.");
      }

      toast.success("Ticket submitted successfully!");

      // notify parent
      onSubmit?.({
        ...payload,
        status: "Open",
        date: new Date().toISOString(),
      });

      setTimeout(() => {
        handleModalClose();
      }, 1500);
    } catch (error) {
      setSubmitError(error.message);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl w-full max-w-lg p-5 shadow-xl border border-yellow-500/40">

        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-700 pb-4">
          <h2 className="text-xl text-yellow-500 font-bold flex items-center gap-2">
            <FaTicketAlt /> Raise New Support Ticket
          </h2>
          <button onClick={handleModalClose} className="text-gray-300 hover:text-red-500">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">

          {submitError && (
            <div className="text-red-400 bg-red-900/40 p-3 rounded-lg">
              {submitError}
            </div>
          )}

          {/* Vehicle No */}
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Vehicle No *</label>

            {isLoading ? (
              <div className="p-2 bg-gray-700 text-gray-100 rounded">Loading...</div>
            ) : fetchError ? (
              <div className="p-2 text-red-400 bg-red-900/40 rounded">{fetchError}</div>
            ) : (
              <select
                value={vechileNo}
                onChange={(e) => setVechileNo(e.target.value)}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
              >
                <option value="">Select Vehicle Number</option>
                {vehicleOptions.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            )}
          </div>

          {/* Issue Type + Address */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-gray-300 text-sm mb-1 block">Issue Type *</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
              >
                <option value="">Select Issue Type</option>
                <option value="DeviceMapping">Device Mapping</option>
                <option value="WalletIssue">Wallet/Recharge</option>
                <option value="Renewal">Renewal</option>
                <option value="Technical">Technical Issue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="text-gray-300 text-sm mb-1 block">Address *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
                placeholder="Installation Address"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Issue Description *</label>
            <textarea
              rows="4"
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
              placeholder="Describe your issue"
            ></textarea>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2 bg-gray-600 text-white rounded"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-yellow-500 text-black rounded font-bold"
            >
              {isSubmitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default RaiseTicketModal;
