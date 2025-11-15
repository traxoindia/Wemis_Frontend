import React, { useState } from 'react';
import { FaTimes, FaTicketAlt } from 'react-icons/fa';

const RaiseTicketModal = ({ isOpen, onClose, onSubmit }) => {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium'); // Default to Medium

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject || !category || !description) {
      alert("Please fill out all required fields.");
      return;
    }
    onSubmit({ subject, category, description, priority, date: new Date().toISOString() });
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-gray-800 rounded-xl w-full max-w-lg shadow-2xl border border-yellow-500/50 transform transition-transform duration-300 scale-100">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-yellow-500 flex items-center gap-2">
            <FaTicketAlt /> Raise New Support Ticket
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Close"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body/Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Subject Field */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-yellow-500 focus:border-yellow-500 text-sm"
              placeholder="e.g., Device Mapping Failed"
              required
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-yellow-500 focus:border-yellow-500 text-sm appearance-none"
                required
              >
                <option value="">Select Category</option>
                <option value="DeviceMapping">Device Mapping</option>
                <option value="WalletIssue">Wallet/Recharge Issue</option>
                <option value="Renewal">Renewal Issue</option>
                <option value="Technical">Technical/Bug Report</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {/* Priority Dropdown */}
            <div className="w-1/3">
              <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-1">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-yellow-500 focus:border-yellow-500 text-sm appearance-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* Description Textarea */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-yellow-500 focus:border-yellow-500 text-sm"
              placeholder="Describe your issue in detail, including any relevant device IDs or error messages."
              required
            ></textarea>
          </div>

          {/* Modal Footer/Actions */}
          <div className="flex justify-end pt-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg text-sm font-bold hover:bg-yellow-400 transition-colors shadow-md"
            >
              Submit Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RaiseTicketModal;