import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import WlpNavbar from "./WlpNavbar";
import axios from "axios";
import { UserAppContext } from "../contexts/UserAppProvider";

function CreateManufacture() {
  const [formData, setFormData] = useState({
    country: "",
    city: "",
    manufactur_code: "MFG-001",
    business_Name: "",
    gst_Number: "",
    Parent_WLP: "",
    manufacturer_Name: "",
    mobile_Number: "",
    email: "",
    toll_Free_Number: "",
    website: "",
    address: "",
    logo: null,
  });

  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  // Fetch Parent WLP Name
  useEffect(() => {
    const fetchWlpNames = async () => {
      try {
        const res = await axios.post(
          "https://api.websave.in/api/wlp/fetchWlpName",
          {},
          {
            headers: {
              Authorization: `Bearer ${tkn}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Assuming API returns { wlpName: "SomeName" }
        setFormData((prev) => ({
          ...prev,
          Parent_WLP: res.data.wlpName,
        }));

        console.log("Fetched WLP Name:", res.data.wlpName);
      } catch (error) {
        console.error("Error fetching WLP names:", error);
        toast.error("Failed to fetch Parent WLP name ");
      }
    };

    fetchWlpNames();
  }, [tkn]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          payload.append(key, value);
        }
      });

      const res = await axios.post(
        "https://api.websave.in/api/wlp/createManuFactur",
        formData,
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data) {
        toast.success("Manufacturer Created Successfully 🚀");
        console.log("Submitted Data:", res.data);

        // Reset form but keep Parent_WLP intact
        setFormData((prev) => ({
          country: "",
          city: "",
          manufactur_code: "MFG-001",
          business_Name: "",
          gst_Number: "",
          Parent_WLP: prev.Parent_WLP, // keep parent
          manufacturer_Name: "",
          mobile_Number: "",
          email: "",
          toll_Free_Number: "",
          website: "",
          address: "",
          logo: null,
        }));
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to create manufacturer ❌");
    }
  };

  return (
    <div className="min-h-screen bg-black text-yellow-400 p-8">
      <WlpNavbar />

      <div className="max-w-4xl mx-auto bg-gray-900 rounded-xl shadow-xl border border-yellow-500 p-6 mt-40">
        <h2 className="text-2xl font-bold text-center mb-6">
          Create Manufacturer
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold border-b border-yellow-500 pb-2 mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-1">Country *</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                >
                  <option value="">Choose Country</option>
                  <option value="India">India</option>
                  <option value="USA">USA</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                />
              </div>

              <div>
                <label className="block mb-1">Manufacturer Code *</label>
                <input
                  type="text"
                  name="manufactur_code"
                  value={formData.manufactur_code}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                />
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div>
            <h3 className="text-lg font-semibold border-b border-yellow-500 pb-2 mb-4">
              Business Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-1">Business Name *</label>
                <input
                  type="text"
                  name="business_Name"
                  placeholder="Enter business name"
                  value={formData.business_Name}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                />
              </div>
              <div>
                <label className="block mb-1">GST Number *</label>
                <input
                  type="text"
                  name="gst_Number"
                  placeholder="22AAAAA0000A1Z5"
                  value={formData.gst_Number}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                />
              </div>
              <div>
                <label className="block mb-1">Parent WLP *</label>
                <input
                  type="text"
                  name="Parent_WLP"
                  value={formData.Parent_WLP}
                  readOnly
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold border-b border-yellow-500 pb-2 mb-4">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-1">Manufacturer Name *</label>
                <input
                  type="text"
                  name="manufacturer_Name"
                  placeholder="Contact person name"
                  value={formData.manufacturer_Name}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                />
              </div>
              <div>
                <label className="block mb-1">Mobile Number *</label>
                <input
                  type="text"
                  name="mobile_Number"
                  placeholder="+91"
                  value={formData.mobile_Number}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                />
              </div>
              <div>
                <label className="block mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="contact@manufacturer.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                />
              </div>
              <div>
                <label className="block mb-1">Toll Free Number</label>
                <input
                  type="text"
                  name="toll_Free_Number"
                  placeholder="1800-XXX-XXXX"
                  value={formData.toll_Free_Number}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                />
              </div>
              <div>
                <label className="block mb-1">Website</label>
                <input
                  type="text"
                  name="website"
                  placeholder="https://www.example.com"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                />
              </div>
            </div>
          </div>

          {/* Address & Logo */}
          <div>
            <h3 className="text-lg font-semibold border-b border-yellow-500 pb-2 mb-4">
              Address & Logo
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block mb-1">Address *</label>
                <textarea
                  name="address"
                  rows="3"
                  placeholder="Plot No: 443/4516, ITI Chowk, Near RTO Office, Balasore, Odisha, 756001"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                />
              </div>
              <div>
                <label className="block mb-1">Logo *</label>
                <input
                  type="file"
                  name="logo"
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-black border border-yellow-500"
                />
                <p className="text-sm text-gray-400 mt-1">
                  Recommended: Square image (300x300px)
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition"
            >
              Create Manufacturer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateManufacture;
