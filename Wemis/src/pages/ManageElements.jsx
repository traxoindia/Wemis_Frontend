import React, { useState, useEffect, useContext } from "react";
import {
  FaPlus,
  FaLayerGroup,
  // FaMicrochip,
  // FaPuzzlePiece,
  // FaHashtag,
  // FaCertificate,
  FaFlask,
  FaTimes,
  FaEdit,
  FaDeezer,
  FaTrash,
  FaAdjust,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { UserAppContext } from "../contexts/UserAppProvider";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  FaCogs,
  FaMicrochip,
  FaPuzzlePiece,
  FaCertificate,
} from "react-icons/fa";

const ManageElements = () => {
  const [showSimInput, setShowSimInput] = useState(false);
  const [simValue, setSimValue] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [isElementModalOpen, setIsElementModalOpen] = useState(false); // NEW

  const [brandName, setBrandName] = useState("");
  const [elementCategoryName, setelementCategoryName] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [loading, setLoading] = useState(false);
  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");
  const [getbrand, setGetbrand] = useState([]);
  const [getcategory, setgetcategory] = useState([]);
  const [elementName, setElementName] = useState("");
  const [is_Vltd, setis_Vltd] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [isElementListModalOpen, setIsElementListModalOpen] = useState(false);
  const [list, setlist] = useState([]);
  const [checkBoxoxName, setcheckBoxoxName] = useState("");
  const [data, setData] = useState([]);
  const [isElementtypeModalOpen, setisElementtypeModalOpen] = useState(false);
  const [type, settype] = useState("");
  const [isElementModelModalOpen, setIsElementModelModalOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [modelNo, setModelNo] = useState("");
  const [voltage, setVoltage] = useState("");
  const [modeldata, setmodelData] = useState([]);

  // Device part

  const [isDevicePartModalOpen, setIsDevicePartModalOpen] = useState(false);
  const [selectedElementForPart, setSelectedElementForPart] = useState("");
  const [selectedTypeForPart, setSelectedTypeForPart] = useState("");
  const [selectedModelForPart, setSelectedModelForPart] = useState("");
  const [devicePartNo, setDevicePartNo] = useState("");
  const [partdata, setDatapart] = useState([]);

  // TAC Part
  const [isTACModalOpen, setIsTACModalOpen] = useState(false);
  const [TacData, setTacData] = useState([]);
  const [selectedElementForTAC, setSelectedElementForTAC] = useState("");
  const [selectedTypeForTAC, setSelectedTypeForTAC] = useState("");
  const [selectedModelForTAC, setSelectedModelForTAC] = useState("");
  const [selectedDevicePartForTAC, setSelectedDevicePartForTAC] = useState("");

  // COP Part

  // COP Part
  const [isCOPModalOpen, setIsCOPModalOpen] = useState(false);
  const [copNumbers, setCopNumbers] = useState([]);
  const [copDates, setCopDates] = useState([""]);

  const [selectedElementForCOP, setSelectedElementForCOP] = useState("");
  const [selectedTypeForCOP, setSelectedTypeForCOP] = useState("");
  const [selectedModelForCOP, setSelectedModelForCOP] = useState("");
  const [selectedDevicePartForCOP, setSelectedDevicePartForCOP] = useState("");
  const [selectedTacPartForCOP, setSelectedTacPartForCOP] = useState("");
  const [cop, setcop] = useState([]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openCategoryModal = () => setIsCategoryModalOpen(true);
  const closeCategoryModal = () => setIsCategoryModalOpen(false);

  const openElementModal = () => setIsElementModalOpen(true); // NEW
  const closeElementModal = () => setIsElementModalOpen(false); // NEW

  const openElementtypeModal = () => setisElementtypeModalOpen(true);
  const closeElementtypeModal = () => setisElementtypeModalOpen(false);

  // Add Dynamic Button
  const [addButtonLoading, setAddButtonLoading] = useState(false);

  const addButton = async () => {
    if (!checkBoxoxName.trim()) {
      toast.error("Button name cannot be empty!");
      return;
    }

    try {
      setAddButtonLoading(true);
      await axios.post(
        "https://api.websave.in/api/superadmin/addElementCheckBox",
        { checkBoxoxName },
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Button added successfully!");
      setcheckBoxoxName("");
      setIsElementListModalOpen(false);

      await fetchCostumize();
    } catch (error) {
      console.log(error.message);
      toast.error("Failed to add button");
    } finally {
      setAddButtonLoading(false);
    }
  };

  // Submit Brand
  async function handleBrandSubmit(e) {
    e.preventDefault();
    if (!brandName.trim()) {
      toast.error("Brand name cannot be empty!");
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        "https://api.websave.in/api/superadmin/createBrand",
        { brandName },
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Brand added successfully!");
      setBrandName("");
      closeModal();
      fetchBrands(); // Refresh brands list
    } catch (error) {
      toast.error("Failed to add brand");
    } finally {
      setLoading(false);
    }
  }

  // Submit Category
  async function handleCategorySubmit(e) {
    e.preventDefault();
    if (!selectedBrand || !elementCategoryName.trim()) {
      toast.error("Please select brand and enter category name!");
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        "https://api.websave.in/api/superadmin/createElementCategory",
        { brandName: selectedBrand, elementCategoryName },
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Category added successfully!");
      setelementCategoryName("");
      setSelectedBrand("");
      closeCategoryModal();

      // Refresh category list immediately after adding
      await fetchcategory();
    } catch (error) {
      toast.error("Failed to add category");
    } finally {
      setLoading(false);
    }
  }

  // Fetch brands
  const fetchBrands = async () => {
    try {
      const response = await axios.post(
        "https://api.websave.in/api/superadmin/fetchAllBrands",
        {},
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );
      setGetbrand(response.data.allBrand || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);
  //fetch category

  const fetchcategory = async () => {
    try {
      const response = await axios.post(
        "https://api.websave.in/api/superadmin/fetchAllCategory",
        {},
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );
      setgetcategory(response.data.fetchAllCategory);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchcategory();
  }, []);

  //submit element

  async function handleElementSubmit(e) {
    e.preventDefault();
    if (!elementCategoryName || !elementName.trim()) {
      toast.error("Please select category and enter element name!");
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        "https://api.websave.in/api/superadmin/createElement",
        { elementCategoryName, elementName, is_Vltd },
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Element added successfully!");
      setElementName("");
      setelementCategoryName("");
      setis_Vltd("");
      closeElementModal();
    } catch (error) {
      console.error(error.response?.data || error.message);
      toast.error("Failed to add element");
    } finally {
      setLoading(false);
    }
  }

  // ESC key close
  useEffect(() => {
    const handleEsc = (e) =>
      e.key === "Escape" && (closeModal(), closeCategoryModal());
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const icons = [
    FaPlus,
    FaCogs,
    FaMicrochip,
    FaPuzzlePiece,
    FaFlask,
    FaCertificate,
  ];

  const fetchCostumize = async () => {
    try {
      const responsedata = await axios.post(
        "https://api.websave.in/api/superadmin/fetchAllElementCheckBox",
        {},
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );

      const rawData = responsedata.data.allCheckBox || [];
      const processedData = rawData.map((item) => {
        const RandomIcon = icons[Math.floor(Math.random() * icons.length)];
        return { ...item, icon: RandomIcon };
      });

      setlist(processedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchCostumize();
  }, [tkn]);

  // Fetch All element type

  const fetchData = async () => {
    try {
      const response = await axios.post(
        "https://api.websave.in/api/superadmin/fetchAllElement",
        {},
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );
      setData(response.data.allElement || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [data]);

  const handleElementtypeSubmit = async (e) => {
    e.preventDefault();
    if (!elementCategoryName || !type) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "https://api.websave.in/api/superadmin/addElementType",
        {
          elementName: elementCategoryName,
          sim: simValue,
          elementType: type,
        },
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Element Type added successfully!");
      settype("");
      setelementCategoryName("");
      closeElementtypeModal();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add element type");
    } finally {
      setLoading(false);
    }
  };

  const handleElementModelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedElement || !selectedType || !modelNo || !voltage) {
      toast.error("All fields are required!");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        "https://api.websave.in/api/superadmin/addDeviceModel",
        {
          elementName: selectedElement,
          elementType: selectedType,
          model_No: modelNo,
          voltage,
        },
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Element Model added successfully!");
      setSelectedElement("");
      setSelectedType("");
      setModelNo("");
      setVoltage("");
      setIsElementModelModalOpen(false);
    } catch (error) {
      toast.error("Failed to add element model");
    } finally {
      setLoading(false);
    }
  };

  const fetchmodelData = async () => {
    try {
      const response = await axios.post(
        "https://api.websave.in/api/superadmin/fetchAllElementType",
        {},
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );
      setmodelData(response.data.fetchAllType);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchmodelData();
  }, []);

  // Device part submit

  const handleDevicePartSubmit = async (e) => {
    e.preventDefault();
    if (
      !selectedElementForPart ||
      !selectedTypeForPart ||
      !selectedModelForPart ||
      !devicePartNo.trim()
    ) {
      toast.error("All fields are required!");
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        "https://api.websave.in/api/superadmin/addDevicePart",
        {
          elementName: selectedElementForPart,
          elementType: selectedTypeForPart,
          model_No: selectedModelForPart,
          device_Part_No: devicePartNo,
        },
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Device Part added successfully!");
      setSelectedElementForPart("");
      setSelectedTypeForPart("");
      setSelectedModelForPart("");
      setDevicePartNo("");
      setIsDevicePartModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to add device part");
    } finally {
      setLoading(false);
    }
  };

  //Device part Fetch

  const fetchpartData = async () => {
    try {
      const response = await axios.post(
        "https://api.websave.in/api/superadmin/fetchModelElementData",
        {},
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );
      setDatapart(response.data.allFetchModelElementData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchpartData();
  }, [data]);

  // Tac

  const [tacNumbers, setTacNumbers] = useState([{ id: Date.now(), value: "" }]);

  const addTacNumber = () => {
    setTacNumbers([...tacNumbers, { id: Date.now(), value: "" }]);
  };

  const removeTacNumber = (id) => {
    setTacNumbers(tacNumbers.filter((tac) => tac.id !== id));
  };

  const handleChange = (id, value) => {
    setTacNumbers(
      tacNumbers.map((tac) => (tac.id === id ? { ...tac, value } : tac))
    );
  };

  const fetchTacData = async () => {
    try {
      const response = await axios.post(
        "https://api.websave.in/api/superadmin/fetchAllDeviceData",
        {},
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );
      setTacData(response.data.deviceData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchTacData();
  }, [data]);

  const handleTACSubmit = async (e) => {
    e.preventDefault();

    if (
      !selectedElementForTAC ||
      !selectedTypeForTAC ||
      !selectedModelForTAC ||
      !selectedDevicePartForTAC ||
      tacNumbers.some((tac) => !tac.value.trim())
    ) {
      toast.error("Please fill all fields and enter TAC numbers!");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        "https://api.websave.in/api/superadmin/addTacNumber",
        {
          elementName: selectedElementForTAC,
          elementType: selectedTypeForTAC,
          model_No: selectedModelForTAC,
          device_Part_No: selectedDevicePartForTAC,
          tac_No: tacNumbers.map((t) => t.value), // send array of TAC numbers
        },
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("TAC Numbers added successfully!");
      setTacNumbers([{ id: Date.now(), value: "" }]); // reset input fields
      setIsTACModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to add TAC numbers");
    } finally {
      setLoading(false);
    }
  };

  // cop part

  const fetchcopData = async () => {
    try {
      const response = await axios.post(
        "https://api.websave.in/api/superadmin/fetchAllTacNo",
        {},
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );
      setcop(response.data.tacNo || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchcopData();
  }, [data]);

  const addCOPNumber = () => {
    setCopNumbers([...copNumbers, ""]);
    setCopDates([...copDates, ""]);
  };

  const removeCOPNumber = (index) => {
    setCopNumbers(copNumbers.filter((_, i) => i !== index));
    setCopDates(copDates.filter((_, i) => i !== index));
  };

  const handleCOPChange = (index, value) => {
    const updated = [...copNumbers];
    updated[index] = value;
    setCopNumbers(updated);
  };

  const handleDateChange = (index, value) => {
    const updated = [...copDates];
    updated[index] = value;
    setCopDates(updated);
  };

  const handleCOPSubmit = async (e) => {
    e.preventDefault();

    // if (
    //   !selectedElementForCOP ||
    //   !selectedTypeForCOP ||
    //   !selectedModelForCOP ||
    //   !selectedTacPartForCOP ||
    //   copNumbers.some((num) => !num.trim()) ||
    //   copDates.some((date) => !date.trim())
    // ) {
    //   toast.error("Please fill all fields, COP numbers, and dates!");
    //   return;
    // }

    try {
      setLoading(true);
      await axios.post(
        "https://api.websave.in/api/superadmin/addCopNumber",
        {
          elementName: selectedElementForCOP,
          elementType: selectedTypeForCOP,
          model_No: selectedModelForCOP,
          device_Part_No: selectedDevicePartForCOP,
          tac_No: selectedTacPartForCOP,
          cop_No: copNumbers,
          date: copDates,
        },
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("COP Numbers added successfully!");
      setCopNumbers([""]);
      setCopDates([""]);
      setIsCOPModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to add COP numbers");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black text-yellow-400  shadow-lg p-6 mt-32">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Title Section */}
        <h2 className="flex items-center text-2xl font-semibold">
          <FaLayerGroup className="mr-2 text-yellow-400" />
          Manage Elements
        </h2>

        {/* Main Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={openModal}
            className="px-4 py-2 bg-yellow-400 text-black rounded-full shadow-md hover:bg-yellow-300 transition flex items-center"
          >
            <FaPlus className="mr-2" /> Add Brand
          </button>

          <button
            onClick={openCategoryModal}
            className="px-4 py-2 border border-yellow-400 rounded-full hover:bg-yellow-500 hover:text-black transition flex items-center"
          >
            <FaLayerGroup className="mr-2" /> Add Category
          </button>

          <button
            onClick={openElementModal}
            className="px-4 py-2 border border-yellow-400 rounded-full hover:bg-yellow-500 hover:text-black transition flex items-center"
          >
            <FaPlus className="mr-2" /> Add Element
          </button>
          <button
            onClick={openElementtypeModal}
            className="px-4 py-2 border border-yellow-400 rounded-full hover:bg-yellow-500 hover:text-black transition flex items-center"
          >
            <FaAdjust className="mr-2" /> Add Element Type
          </button>
          <button
            onClick={() => setIsElementModelModalOpen(true)}
            className="px-4 py-2 border border-yellow-400 rounded-full hover:bg-yellow-500 hover:text-black transition flex items-center"
          >
            <FaAdjust className="mr-2" /> Add Element Model
          </button>

          <button
            onClick={() => setIsDevicePartModalOpen(true)}
            className="px-4 py-2 border border-yellow-400 rounded-full hover:bg-yellow-500 hover:text-black transition flex items-center"
          >
            <FaPlus className="mr-2" /> Add Device Part
          </button>

          <button
            onClick={() => setIsTACModalOpen(true)}
            className="px-4 py-2 border border-yellow-400 rounded-full hover:bg-yellow-500 hover:text-black transition flex items-center"
          >
            <FaPlus className="mr-2" /> Add TAC Number
          </button>

          <button
            onClick={() => setIsCOPModalOpen(true)}
            className="px-4 py-2 border border-yellow-400 rounded-full hover:bg-yellow-500 hover:text-black transition flex items-center"
          >
            <FaPlus className="mr-2" /> Add COP Number
          </button>

          <button
            onClick={() => setIsElementListModalOpen(true)}
            className="px-4 py-2 border border-yellow-400 rounded-full hover:bg-yellow-500 hover:text-black flex items-center"
          >
            <FaPlus className="mr-2" /> Customize List
          </button>
        </div>
      </div>

      {/* Dynamic Buttons Section - Separate Line */}
      <div className="flex flex-wrap gap-2 mt-6">
        {list.map((btn, index) => (
          <button
            key={index}
            className="px-4 py-2 border border-yellow-400 rounded-full hover:bg-yellow-500 hover:text-black gap-2 transition flex items-center"
          >
            {btn.icon && React.createElement(btn.icon, { className: "mr-2" })}
            {btn.checkBoxoxName}
            {/* <span className=" text-red-600">{<FaTrash/>}</span> */}
          </button>
        ))}
      </div>

      {/* Element List Modal */}
      <AnimatePresence>
        {isElementListModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-6 w-full max-w-md relative border border-gray-200"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <button
                onClick={() => setIsElementListModalOpen(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition"
              >
                <FaTimes size={20} />
              </button>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Add Dynamic Buttons
              </h3>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter button label"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={checkBoxoxName}
                  onChange={(e) => setcheckBoxoxName(e.target.value)}
                />
                <button
                  onClick={addButton}
                  className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
                  disabled={addButtonLoading}
                >
                  {addButtonLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brand Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-6 w-full max-w-md relative border border-gray-200"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition"
              >
                <FaTimes size={20} />
              </button>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Add Brand
              </h3>
              <form className="space-y-4" onSubmit={handleBrandSubmit}>
                <input
                  type="text"
                  placeholder="Enter brand name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                  onChange={(e) => setBrandName(e.target.value)}
                  value={brandName}
                />
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-6 w-full max-w-md relative border border-gray-200"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <button
                onClick={closeCategoryModal}
                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition"
              >
                <FaTimes size={20} />
              </button>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Add Category
              </h3>
              <form className="space-y-4" onSubmit={handleCategorySubmit}>
                {/* Dropdown for Brand */}
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                >
                  <option value="">Select Brand</option>
                  {getbrand.map((b, i) => (
                    <option key={i} value={b.brandName}>
                      {b.brandName}
                    </option>
                  ))}
                </select>

                {/* Input for Category */}
                <input
                  type="text"
                  placeholder="Enter category name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                  value={elementCategoryName}
                  onChange={(e) => setelementCategoryName(e.target.value)}
                />

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeCategoryModal}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Element Modal */}
      <AnimatePresence>
        {isElementModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-6 w-full max-w-md relative border border-gray-200"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <button
                onClick={closeElementModal}
                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition"
              >
                <FaTimes size={20} />
              </button>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Add Element
              </h3>
              <form className="space-y-4" onSubmit={handleElementSubmit}>
                <select
                  value={elementCategoryName}
                  onChange={(e) => setelementCategoryName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                >
                  <option value="">Select Category</option>
                  {getcategory.map((c, i) => (
                    <option key={i} value={c.elementCategoryName}>
                      {c.elementCategoryName}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Enter element name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                  value={elementName}
                  onChange={(e) => setElementName(e.target.value)}
                />

                <select
                  value={is_Vltd}
                  onChange={(e) => setis_Vltd(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                >
                  <option value="">Is VLTD or Not </option>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeElementModal}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Element-type Modal */}

      <AnimatePresence>
        {isElementtypeModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-6 w-full max-w-md relative border border-gray-200"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <button
                onClick={closeElementtypeModal}
                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition"
              >
                <FaTimes size={20} />
              </button>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Add Element Type
              </h3>

              <form
                className="space-y-4"
                onSubmit={(e) => handleElementtypeSubmit(e, simValue)}
              >
                {/* Element Category Dropdown */}
                <select
                  value={elementCategoryName}
                  onChange={(e) => setelementCategoryName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                >
                  <option value="">Select Element Category</option>
                  {data.map((c, i) => (
                    <option key={i} value={c.elementName}>
                      {c.elementName}
                    </option>
                  ))}
                </select>

                {/* Element Type Input */}
                <input
                  type="text"
                  placeholder="Enter element type name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                  value={type}
                  onChange={(e) => settype(e.target.value)}
                />

                {/* Toggle for SIM Input */}
                <div className="flex items-center gap-3">
                  <label className="text-gray-700 font-medium">
                    Add SIM Value?
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSimInput(!showSimInput)}
                    className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                      showSimInput
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-black"
                    }`}
                  >
                    {showSimInput ? "No" : "Yes"}
                  </button>
                </div>

                {/* SIM Input Field (toggleable) */}
                {showSimInput && (
                  <input
                    type="text"
                    placeholder="Enter SIM value"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    value={simValue}
                    onChange={(e) => setSimValue(e.target.value)}
                  />
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeElementtypeModal}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Element Model Modal */}

      <AnimatePresence>
        {isElementModelModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-6 w-full max-w-md relative border border-gray-200"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <button
                onClick={() => setIsElementModelModalOpen(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition"
              >
                <FaTimes size={20} />
              </button>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Add Element Model
              </h3>
              <form className="space-y-4" onSubmit={handleElementModelSubmit}>
                {/* Element Dropdown */}
                <select
                  value={selectedElement}
                  onChange={(e) => setSelectedElement(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                >
                  <option value="">Select Element</option>
                  {modeldata.map((item, i) => (
                    <option key={i} value={item.elementName}>
                      {item.elementName}
                    </option>
                  ))}
                </select>

                {/* Type Dropdown */}
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                >
                  <option value="">Select Type</option>

                  {modeldata.map((item, i) => (
                    <option key={i} value={item.elementType}>
                      {item.elementType}
                    </option>
                  ))}
                </select>

                {/* Model Number */}
                <input
                  type="text"
                  placeholder="Enter model number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                  value={modelNo}
                  onChange={(e) => setModelNo(e.target.value)}
                />

                {/* Voltage */}
                <input
                  type="text"
                  placeholder="Enter voltage"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                  value={voltage}
                  onChange={(e) => setVoltage(e.target.value)}
                />

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsElementModelModalOpen(false)}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Element Device Part Model */}

      <AnimatePresence>
        {isDevicePartModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-6 w-full max-w-md relative border border-gray-200"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <button
                onClick={() => setIsDevicePartModalOpen(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition"
              >
                <FaTimes size={20} />
              </button>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Add Device Part
              </h3>

              <form className="space-y-4" onSubmit={handleDevicePartSubmit}>
                {/* Element Dropdown */}
                <select
                  value={selectedElementForPart}
                  onChange={(e) => setSelectedElementForPart(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                >
                  <option value="">Select Element</option>
                  {partdata.map((item, i) => (
                    <option key={i} value={item.elementName}>
                      {item.elementName}
                    </option>
                  ))}
                </select>

                {/* Element Type Dropdown */}
                <select
                  value={selectedTypeForPart}
                  onChange={(e) => setSelectedTypeForPart(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                >
                  <option value="">Select Element Type</option>
                  {partdata.map((item, i) => (
                    <option key={i} value={item.elementType}>
                      {item.elementType}
                    </option>
                  ))}
                </select>

                {/* Model Number Dropdown */}
                <select
                  value={selectedModelForPart}
                  onChange={(e) => setSelectedModelForPart(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                >
                  <option value="">Select Model No</option>
                  {partdata.map((item, i) => (
                    <option key={i} value={item.model_No}>
                      {item.model_No}
                    </option>
                  ))}
                </select>

                {/* Device Part No Input */}
                <input
                  type="text"
                  placeholder="Enter device part number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                  value={devicePartNo}
                  onChange={(e) => setDevicePartNo(e.target.value)}
                />

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDevicePartModalOpen(false)}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Element TAC Number */}

      <AnimatePresence>
        {isTACModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 relative"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Add TAC Details
                </h2>
                <button
                  type="button"
                  onClick={() => setIsTACModalOpen(false)}
                  className="text-gray-500 hover:text-red-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              {/* TAC Form */}
              <form
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                onSubmit={handleTACSubmit}
              >
                {/* Element Dropdown */}
                <select
                  value={selectedElementForTAC}
                  onChange={(e) => setSelectedElementForTAC(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 transition"
                >
                  <option value="">Select Element</option>
                  {TacData.map((item) => (
                    <option key={item.id} value={item.elementName}>
                      {item.elementName}
                    </option>
                  ))}
                </select>

                {/* Type Dropdown */}
                <select
                  value={selectedTypeForTAC}
                  onChange={(e) => setSelectedTypeForTAC(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 transition"
                >
                  <option value="">Select Type</option>
                  {TacData.map((item) => (
                    <option key={item.id + "-type"} value={item.elementType}>
                      {item.elementType}
                    </option>
                  ))}
                </select>

                {/* Model Dropdown */}
                <select
                  value={selectedModelForTAC}
                  onChange={(e) => setSelectedModelForTAC(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 transition"
                >
                  <option value="">Select Model No</option>
                  {TacData.map((item) => (
                    <option key={item.id + "-model"} value={item.model_No}>
                      {item.model_No}
                    </option>
                  ))}
                </select>

                {/* Device Part Dropdown */}
                <select
                  value={selectedDevicePartForTAC}
                  onChange={(e) => setSelectedDevicePartForTAC(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 transition"
                >
                  <option value="">Select Device Part No</option>
                  {TacData.map((item) => (
                    <option key={item.id + "-part"} value={item.device_Part_No}>
                      {item.device_Part_No}
                    </option>
                  ))}
                </select>

                {/* TAC Inputs */}
                {tacNumbers.map((tac) => (
                  <motion.div
                    key={tac.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3 col-span-2"
                  >
                    <input
                      type="text"
                      value={tac.value}
                      onChange={(e) => handleChange(tac.id, e.target.value)}
                      className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-purple-500 transition"
                      placeholder="Enter TAC Number"
                    />
                    <button
                      type="button"
                      onClick={() => removeTacNumber(tac.id)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                    >
                      Remove
                    </button>
                  </motion.div>
                ))}

                {/* Add More Button */}
                <button
                  type="button"
                  onClick={addTacNumber}
                  className="col-span-2 px-4 py-2 mt-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
                >
                  + Add More TAC Number
                </button>

                {/* Action Buttons */}
                <div className="col-span-2 flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsTACModalOpen(false)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-purple-600 transition"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cop Number */}

      <AnimatePresence>
        {isCOPModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 relative"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-green-700">
                  Add COP Details
                </h2>
                <button
                  type="button"
                  onClick={() => setIsCOPModalOpen(false)}
                  className="text-gray-500 hover:text-red-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              {/* COP Form */}
              <form
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                onSubmit={handleCOPSubmit}
              >
                {/* Element Dropdown */}
                <select
                  value={selectedElementForCOP}
                  onChange={(e) => setSelectedElementForCOP(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 transition"
                >
                  <option value="">Select Element</option>
                  {cop.map((item) => (
                    <option key={item.id} value={item.elementName}>
                      {item.elementName}
                    </option>
                  ))}
                </select>

                {/* Type Dropdown */}
                <select
                  value={selectedTypeForCOP}
                  onChange={(e) => setSelectedTypeForCOP(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 transition"
                >
                  <option value="">Select Type</option>
                  {cop.map((item) => (
                    <option key={item.id + "-type"} value={item.elementType}>
                      {item.elementType}
                    </option>
                  ))}
                </select>

                {/* Model Dropdown */}
                <select
                  value={selectedModelForCOP}
                  onChange={(e) => setSelectedModelForCOP(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 transition"
                >
                  <option value="">Select Model No</option>
                  {cop.map((item) => (
                    <option key={item.id + "-model"} value={item.model_No}>
                      {item.model_No}
                    </option>
                  ))}
                </select>

                {/* Device Part Dropdown */}
                <select
                  value={selectedDevicePartForCOP}
                  onChange={(e) => setSelectedDevicePartForCOP(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 transition"
                >
                  <option value="">Select Device Part No</option>
                  {cop.map((item) => (
                    <option key={item.id + "-part"} value={item.device_Part_No}>
                      {item.device_Part_No}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedTacPartForCOP}
                  onChange={(e) => setSelectedTacPartForCOP(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 transition"
                >
                  <option value="">Select TAC Part No</option>
                  {cop.map((item) =>
                    item.tac_No?.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))
                  )}
                </select>

                {/* COP Inputs with Date */}
                {copNumbers.map((cop, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={cop}
                      onChange={(e) => handleCOPChange(index, e.target.value)}
                      placeholder="Enter COP Number"
                      className="border p-2 rounded w-1/2"
                    />
                    <input
                      type="date"
                      value={copDates[index]}
                      onChange={(e) => handleDateChange(index, e.target.value)}
                      className="border p-2 rounded w-1/2"
                    />
                    <button
                      type="button"
                      onClick={() => removeCOPNumber(index)}
                      className="px-3 py-1 bg-red-500 text-white rounded"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCOPNumber}
                  className="px-4 py-2 bg-green-500 text-white rounded"
                >
                  Add COP Number
                </button>

                {/* Add More Button */}

                {/* Action Buttons */}
                <div className="col-span-2 flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsCOPModalOpen(false)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageElements;
