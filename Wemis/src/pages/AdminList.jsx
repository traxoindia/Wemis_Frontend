




import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaUserPlus, FaTrash, FaEdit, FaEye, FaEyeSlash } from "react-icons/fa";
import { UserAppContext } from "../contexts/UserAppProvider";
import Navbar from "./Navbar";
import { Link, useNavigate } from "react-router-dom";

function PasswordToggle({ password }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <input
        type={visible ? "text" : "password"}
        value={password}
        readOnly
        className="border border-yellow-500 bg-black text-yellow-400 rounded px-2 py-1 text-sm w-24"
      />
      <button
        onClick={() => setVisible(!visible)}
        className="text-yellow-500 hover:text-yellow-300"
      >
        {visible ?  <FaEye />:<FaEyeSlash />}
      </button>
    </div>
  );
}

function AdminList() {
  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAdmins = async () => {
    try {
      const response = await axios.post(
        "https://api.websave.in/api/superadmin/getAllAdmins",
        {},
        { headers: { Authorization: `Bearer ${tkn}` } }
      );
      if (response.data) {
        setAdmins(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching admins:", err.response || err);
      toast.error("Failed to fetch admins");
    }
  };

  useEffect(() => {
    if (tkn) fetchAdmins();
  }, [tkn]);

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name_of_business
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      admin.Name_of_Business_owner?.toLowerCase().includes(
        searchTerm.toLowerCase()
      ) ||
      admin.Email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [formData, setFormData] = useState({
    name_of_business: "",
    Regd_Address: "",
    Gstin_No: "",
    Pan_no: "",
    Name_of_Business_owner: "",
    Email: "",
    Contact_No: "",
    Company_Logo: null,
    Incorporation_Certificate: null,
    Pan_Card: null,
    GST_Certificate: null,
  });

  const [Id, setId] = useState(null);
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleUpdate = async (id, e) => {
    e.preventDefault();
    if (!id) return toast.error("No admin selected to update");

    setLoading(true);
    try {
      const response = await axios.post(
        "https://api.websave.in/api/superadmin/editAdmin",
        { adminId: id, ...formData },
        { headers: { Authorization: `Bearer ${tkn}` } }
      );

      fetchAdmins();
      setTimeout(() => {
        toast.success( "Admin updated successfully!");
        setIsEditModalOpen(false);
      }, 3000);
    } catch (error) {
      console.error("Error updating admin:", error);
      toast.error("Failed to update admin");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = async (id) => {
    try {
      const response = await axios.post(
        "https://api.websave.in/api/superadmin/getAdminById",
        { adminId: id },
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
          },
        }
      );

      setFormData(response.data.data);
      setId(response.data.data._id);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load admin data");
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action will delete the admin permanently!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.post(
            "https://api.websave.in/api/superadmin/deleteAdmin",
            { adminId: id },
            {
              headers: {
                Authorization: `Bearer ${tkn}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (response.status === 200) {
            toast.success("Admin deleted successfully");
            setAdmins((prev) => prev.filter((admin) => admin._id !== id));
          } else {
            toast.error("Error deleting admin");
          }
        } catch (error) {
          toast.error("Delete failed");
          console.error("Delete error:", error);
        }
      }
    });
  };

  return (
    <div className="p-6 bg-black min-h-screen text-gray-200">
      <Navbar />

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-70 flex items-start justify-center overflow-y-auto py-10">
          <div className="bg-gray-900 p-6 rounded-xl w-full max-w-4xl shadow-2xl border border-yellow-500">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
              Edit Admin
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: "name_of_business", placeholder: "Business Name" },
                { name: "Regd_Address", placeholder: "Registered Address" },
                { name: "Gstin_No", placeholder: "GSTIN Number" },
                { name: "Pan_no", placeholder: "PAN Number" },
                { name: "Name_of_Business_owner", placeholder: "Business Owner Name" },
                { name: "Email", placeholder: "Email" },
                { name: "Contact_No", placeholder: "Contact Number" },
              ].map((field, i) => (
                <input
                  key={i}
                  type="text"
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleInputChange}
                  className="w-full border border-yellow-500 bg-black text-yellow-100 rounded-lg px-4 py-3 shadow-sm focus:ring-2 focus:ring-yellow-500"
                  placeholder={field.placeholder}
                />
              ))}

              {/* File Uploads */}
              {["Company_Logo", "Incorporation_Certificate", "Pan_Card", "GST_Certificate"].map(
                (field, i) => (
                  <input
                    key={i}
                    type="file"
                    name={field}
                    onChange={(e) =>
                      setFormData({ ...formData, [field]: e.target.files[0] })
                    }
                    className="w-full border border-yellow-500 bg-black text-yellow-100 rounded-lg px-4 py-3 shadow-sm focus:ring-2 focus:ring-yellow-500"
                  />
                )
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={(e) => handleUpdate(Id, e)}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-full shadow-md transition"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-300 hover:text-white px-6 py-3 rounded-full border border-gray-500 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="flex justify-between items-center bg-yellow-600 text-black px-4 py-3 rounded-t-xl mt-36 shadow-lg">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FaUserPlus /> Admin Management
        </h2>
        <Link to={"/superadmin/createadmin"}>
          <button className="bg-black border border-yellow-500 px-4 py-2 rounded-lg text-yellow-400 hover:bg-yellow-500 hover:text-black transition">
            + Create Admin
          </button>
        </Link>
      </div>

      <p className="text-gray-400 text-sm px-4 py-2">
        This table shows the list of all registered admins and their details
      </p>

      <div className="flex justify-between items-center p-4">
        <div>
          <label className="text-sm text-gray-400">Display</label>
          <select className="ml-2 border border-yellow-500 bg-black text-yellow-400 rounded px-2 py-1 text-sm">
            <option>10</option>
            <option>20</option>
            <option>50</option>
          </select>
          <span className="text-sm ml-1">records per page</span>
        </div>
        <input
          type="text"
          placeholder="Search..."
          className="border border-yellow-500 bg-black text-yellow-400 rounded px-3 py-1 text-sm"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto bg-gray-900 shadow rounded-b-xl border border-yellow-500">
        <table className="min-w-full text-left border">
          <thead className="bg-yellow-600 text-black">
            <tr>
              {["#", "Logo", "Business Name", "Owner", "Email", "Contact", "Passwords", "Actions"].map(
                (h, i) => (
                  <th key={i} className="px-4 py-2">{h}</th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.length > 0 ? (
              filteredAdmins.map((admin, index) => (
                <tr
                  key={admin._id}
                  className={index % 2 === 0 ? "bg-black" : "bg-gray-800"}
                >
                  <td className="px-4 py-2">{index + 1}</td>
                  <td className="px-4 py-2">
                    <img
                      src={admin.Company_Logo || "https://via.placeholder.com/40"}
                      alt="Logo"
                      className="w-10 h-10 rounded border border-yellow-500"
                    />
                  </td>
                  <td className="px-4 py-2 font-medium text-yellow-400">
                    {admin.name_of_business}
                  </td>
                  <td className="px-4 py-2">{admin.Name_of_Business_owner}</td>
                  <td className="px-4 py-2 text-yellow-300">{admin.Email}</td>
                  <td className="px-4 py-2">{admin.Contact_No}</td>
                  <td className="px-4 py-2">
                    <PasswordToggle password={admin.Contact_No || "N/A"} />
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => handleEdit(admin._id)}
                      className="bg-yellow-500 p-2 rounded text-black hover:bg-yellow-400 transition"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(admin._id)}
                      className="bg-red-500 p-2 rounded text-white hover:bg-red-400 transition"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-4 text-gray-500">
                  No admins found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminList;
