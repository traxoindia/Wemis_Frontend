import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

const ElementTypeModal = ({
  isElementtypeModalOpen,
  closeElementtypeModal,
  handleElementtypeSubmit,
  data,
  elementCategoryName,
  setelementCategoryName,
  type,
  settype,
  loading,
}) => {
  const [showSimInput, setShowSimInput] = useState(false);
  const [simValue, setSimValue] = useState("");

  return (
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
                  {showSimInput ? "Yes" : "No"}
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
  );
};

export default ElementTypeModal;
