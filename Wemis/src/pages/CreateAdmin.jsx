import React, { useState, useContext } from "react";
import {
  FaUserPlus,
  FaBuilding,
  FaUserTie,
  FaFileUpload,
  FaFilePdf,
  FaImage,
} from "react-icons/fa";
import Navbar from "./Navbar";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { UserAppContext } from "../contexts/UserAppProvider";
import { ToastContainer, toast } from "react-toastify";

function CreateAdmin() {
  const [formData, setFormData] = useState({
    name_of_business: "",
    Regd_Address: "",
    Gstin_No: "",
    Pan_no: "",
    Name_of_Business_owner: "",
    Email: "",
    Contact_No: "",
  });

  const [files, setFiles] = useState({
    Company_Logo: null,
    Incorporation_Certificate: null,
    Pan_Card: null,
    GST_Certificate: null,
  });

  const [loading, setLoading] = useState(false);

  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = new FormData();
      Object.keys(formData).forEach((key) => payload.append(key, formData[key]));
      Object.keys(files).forEach((key) => {
        if (files[key]) payload.append(key, files[key]);
      });

      console.log(payload)
      const response = await axios.post(
        "https://api.websave.in/api/superadmin/createAdmin",
        payload,
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
console.log(payload)
      toast.success("Admin created successfully!", { position: "top-right" });
      setTimeout(() => navigate("/superadmin/adminlist"), 3000);
    } catch (error) {
      toast.error("Something went wrong!", { position: "top-right" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-black to-gray-900 min-h-screen text-gray-100">
      <Navbar />
      <ToastContainer />

      {/* Page Header */}
      <header className="bg-yellow-500 flex justify-between items-center px-6 sm:px-8 py-4 mt-[135px] shadow-lg">
        <div className="flex items-center space-x-2 text-black font-bold text-lg">
          <FaUserPlus />
          <span>Onboard Admin</span>
        </div>
        <Link to={"/superadmin/adminlist"}>
          <button className="flex items-center space-x-2 border border-black rounded-full px-4 py-1 text-black font-semibold hover:bg-black hover:text-yellow-500 transition">
            <i className="fas fa-list"></i>
            <span>Admin List</span>
          </button>
        </Link>
      </header>

      {/* Form Container */}
      <main className="p-5 sm:p-10 max-w-6xl mx-auto">
        <form
          className="space-y-10 bg-black/40 backdrop-blur-md border border-yellow-500/30 rounded-2xl p-8 shadow-xl"
          onSubmit={handleSubmit}
        >
          {/* Business Info */}
          <section>
            <h2 className="text-yellow-500 font-semibold text-xl flex items-center gap-2 mb-6">
              <FaBuilding /> Business Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                name="name_of_business"
                placeholder="Name Of The Business *"
                required
                onChange={handleInputChange}
                className="border border-yellow-500/40 bg-transparent text-white rounded-md px-4 py-3 focus:ring-2 focus:ring-yellow-500 outline-none"
              />
              <textarea
                name="Regd_Address"
                placeholder="Regd. Address *"
                rows="3"
                required
                onChange={handleInputChange}
                className="border border-yellow-500/40 bg-transparent text-white rounded-md px-4 py-3 focus:ring-2 focus:ring-yellow-500 outline-none md:col-span-2"
              />
              <input
                type="text"
                name="Gstin_No"
                placeholder="GSTIN No. *"
                required
                onChange={handleInputChange}
                className="border border-yellow-500/40 bg-transparent text-white rounded-md px-4 py-3 focus:ring-2 focus:ring-yellow-500 outline-none"
              />
              <input
                type="text"
                name="Pan_no"
                placeholder="Pan No. *"
                required
                onChange={handleInputChange}
                className="border border-yellow-500/40 bg-transparent text-white rounded-md px-4 py-3 focus:ring-2 focus:ring-yellow-500 outline-none"
              />
            </div>
          </section>

          {/* Owner Info */}
          <section>
            <h2 className="text-yellow-500 font-semibold text-xl flex items-center gap-2 mb-6">
              <FaUserTie /> Owner Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                name="Name_of_Business_owner"
                placeholder="Name Of The Business Owner *"
                required
                onChange={handleInputChange}
                className="border border-yellow-500/40 bg-transparent text-white rounded-md px-4 py-3 focus:ring-2 focus:ring-yellow-500 outline-none md:col-span-2"
              />
              <input
                type="email"
                name="Email"
                placeholder="Email *"
                required
                onChange={handleInputChange}
                className="border border-yellow-500/40 bg-transparent text-white rounded-md px-4 py-3 focus:ring-2 focus:ring-yellow-500 outline-none"
              />
              <input
                type="text"
                name="Contact_No"
                placeholder="Contact No. *"
                required
                onChange={handleInputChange}
                className="border border-yellow-500/40 bg-transparent text-white rounded-md px-4 py-3 focus:ring-2 focus:ring-yellow-500 outline-none"
              />
            </div>
          </section>

          {/* Document Upload */}
          <section>
            <h2 className="text-yellow-500 font-semibold text-xl flex items-center gap-2 mb-6">
              <FaFileUpload /> Documents Upload
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { id: "GST_Certificate", label: "Upload GST Certificate", icon: FaFilePdf },
                { id: "Pan_Card", label: "Upload Pan Card", icon: FaFilePdf },
                { id: "Incorporation_Certificate", label: "Upload Incorporation Certificate", icon: FaFilePdf },
                { id: "Company_Logo", label: "Company Logo", icon: FaImage },
              ].map(({ id, label, icon: Icon }) => (
                <label
                  key={id}
                  className="bg-black/30 border border-yellow-500/30 rounded-lg p-5 flex flex-col space-y-2 text-sm shadow-md hover:shadow-yellow-500/40 hover:border-yellow-500 transition"
                >
                  <div className="flex items-center gap-2 text-yellow-500">
                    <Icon />
                    <span>{label}</span>
                  </div>
                  <input
                    name={id}
                    type="file"
                    onChange={handleFileChange}
                    className="mt-2 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-yellow-500 file:text-black hover:file:bg-yellow-400"
                  />
                </label>
              ))}
            </div>
          </section>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto mt-6 flex items-center gap-2 justify-center bg-yellow-500 text-black text-base font-semibold rounded-full px-8 py-3 shadow-md hover:bg-yellow-400 transition"
          >
            {loading ? "Submitting..." : <><FaUserPlus /> Onboard Admin</>}
          </button>
        </form>
      </main>
    </div>
  );
}

export default CreateAdmin;
