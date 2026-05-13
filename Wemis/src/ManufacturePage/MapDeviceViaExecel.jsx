import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Plus, X, Search, SlidersHorizontal, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Trash2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { UserAppContext } from "../contexts/UserAppProvider";
import ManufactureNavbar from "./ManufactureNavbar";
import * as XLSX from 'xlsx';

function MapDeviceViaExcel() {
  const { token: contextToken } = useContext(UserAppContext);
  const tkn = contextToken || localStorage.getItem("token");

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [barcodeData, setBarcodeData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [creationType, setCreationType] = useState("Automatic");

  // Fetch existing barcode data
  const fetchBarcodeData = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        "https://api.websave.in/api/manufactur/fetchAllBarCode",
        {},
        { headers: { Authorization: `Bearer ${tkn}` } }
      );
      if (res.data && res.data.allBarCods) {
        setBarcodeData(res.data.allBarCods);
      } else {
        setBarcodeData([]);
      }
    } catch (err) {
      toast.error("Failed to fetch barcode data");
      setBarcodeData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tkn) {
      fetchBarcodeData();
    } else {
      toast.error("No token found. Please login again.");
    }
  }, [tkn]);

  // Parse Excel file and map to API format
  const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
          // Map Excel data to API expected format
          const mappedData = jsonData.map((row, index) => {
            // Extract SIM details dynamically
            const simDetails = [];
            
            // Find all SIM-related columns (simNo, iccidNo, validityDate, operator)
            // SIMs can be multiple (simNo1, iccidNo1, validityDate1, operator1, simNo2, etc.)
            const simPatterns = ['simNo', 'iccidNo', 'validityDate', 'operator'];
            const simGroups = new Map();
            
            // Group SIM fields by their index
            Object.keys(row).forEach(key => {
              for (const pattern of simPatterns) {
                if (key.toLowerCase().includes(pattern.toLowerCase())) {
                  const match = key.match(/\d+$/);
                  const simIndex = match ? parseInt(match[0]) : 1;
                  
                  if (!simGroups.has(simIndex)) {
                    simGroups.set(simIndex, {});
                  }
                  
                  const fieldName = key.replace(/\d+$/, '');
                  simGroups.get(simIndex)[fieldName] = row[key];
                  break;
                }
              }
            });
            
            // Convert grouped data to simDetails array
            simGroups.forEach((sim, index) => {
              if (sim.simNo || sim.iccidNo || sim.validityDate || sim.operator) {
                simDetails.push({
                  simNo: sim.simNo || sim.simNo || "",
                  iccidNo: sim.iccidNo || sim.iccidNo || "",
                  validityDate: formatDateForAPI(sim.validityDate || sim.validityDate || ""),
                  operator: sim.operator || sim.operator || ""
                });
              }
            });
            
            // If no grouped SIMs found, try direct fields
            if (simDetails.length === 0) {
              if (row.simNo || row.iccidNo || row.validityDate || row.operator) {
                simDetails.push({
                  simNo: row.simNo || "",
                  iccidNo: row.iccidNo || "",
                  validityDate: formatDateForAPI(row.validityDate || ""),
                  operator: row.operator || ""
                });
              }
            }
            
            return {
              elementName: row.elementName || row.elementname || "",
              elementType: row.elementType || row.elementtype || "",
              elementModelNo: row.elementModelNo || row.elementmodelno || row.modelNo || "",
              elementPartNo: row.elementPartNo || row.elementpartno || row.partNo || "",
              elementTacNo: row.elementTacNo || row.elementtacno || row.tacNo || "",
              elementCopNo: row.elementCopNo || row.elementcopno || row.copNo || "",
              copValid: formatDateForAPI(row.copValid || row.copvalid || ""),
              voltage: row.voltage || "",
              batchNo: row.batchNo || row.batchno || generateBatchNo(),
              barCodeNo: row.barCodeNo || row.barcodeno || "",
              is_Renew: row.is_Renew || row.isrenew || "No",
              deviceSerialNo: row.deviceSerialNo || row.deviceserialno || "",
              simDetails: simDetails,
              // Store original row for reference
              _originalRow: row,
              _isValid: true,
              _errors: []
            };
          });
          
          // Validate the mapped data
          const validatedData = mappedData.map(item => {
            const errors = [];
            
            if (!item.elementName) errors.push("Element Name is required");
            if (!item.elementType) errors.push("Element Type is required");
            if (!item.elementModelNo) errors.push("Model No is required");
            if (!item.barCodeNo) errors.push("Barcode No is required");
            if (!item.deviceSerialNo) errors.push("Device Serial No is required");
            
            // Validate SIM details if present
            if (item.simDetails && item.simDetails.length > 0) {
              item.simDetails.forEach((sim, idx) => {
                if (!sim.iccidNo && !sim.simNo) {
                  errors.push(`SIM ${idx + 1}: ICCID or SIM Number required`);
                }
              });
            }
            
            return {
              ...item,
              _isValid: errors.length === 0,
              _errors: errors
            };
          });
          
          resolve(validatedData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Format date for API
  const formatDateForAPI = (dateValue) => {
    if (!dateValue) return "";
    
    try {
      // Handle Excel serial number dates
      if (typeof dateValue === 'number') {
        const date = XLSX.SSF.parse_date_code(dateValue);
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
      
      // Handle string dates
      let dateStr = String(dateValue);
      
      // Check for DD-MM-YYYY or DD/MM/YYYY format
      if (dateStr.includes('-') || dateStr.includes('/')) {
        let parts = dateStr.split(/[-/]/);
        if (parts.length === 3) {
          // Assume DD-MM-YYYY or MM-DD-YYYY? Usually DD-MM-YYYY
          let day = parts[0];
          let month = parts[1];
          let year = parts[2];
          
          // If year has 2 digits, convert to 4
          if (year.length === 2) {
            year = '20' + year;
          }
          
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
      
      // Try parsing as date
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      
      return dateStr;
    } catch (e) {
      return dateValue;
    }
  };

  // Generate batch number
  const generateBatchNo = () => {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  };

  // Handle file selection
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    const validTypes = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
      toast.error('Please upload a valid Excel file (.xlsx, .xls, or .csv)');
      return;
    }
    
    setSelectedFile(file);
    setUploading(true);
    
    try {
      const parsedData = await parseExcelFile(file);
      setPreviewData(parsedData);
      toast.success(`Successfully parsed ${parsedData.length} records`);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Failed to parse Excel file. Please check the format.');
      setPreviewData([]);
    } finally {
      setUploading(false);
    }
  };

  // Download template Excel file
  const downloadTemplate = () => {
    const template = [
      {
        elementName: "TRAXO AIS140",
        elementType: "ELITE",
        elementModelNo: "TIA101",
        elementPartNo: "TRAXO104",
        elementTacNo: "CN8737",
        elementCopNo: "CC0GU9339",
        copValid: "2026-05-06",
        voltage: "12v",
        batchNo: "20241201120000123",
        barCodeNo: "356218603205113",
        is_Renew: "No",
        deviceSerialNo: "TIA/11/25/3313",
        simNo1: "22323",
        iccidNo1: "43434",
        validityDate1: "2026-03-12",
        operator1: "Airtel",
        simNo2: "121212",
        iccidNo2: "2323232",
        validityDate2: "2026-03-11",
        operator2: "BSNL"
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "barcode_template.xlsx");
    toast.success("Template downloaded");
  };

  // Upload to API
  const uploadToAPI = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    // Create form data
    const formData = new FormData();
    formData.append("baecodeCreationType", creationType);
    formData.append("file", selectedFile);
    
    try {
      const response = await axios.post(
        "https://api.websave.in/api/manufactur/upload-barcode-excel",
        formData,
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "multipart/form-data"
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      if (response.status === 200 || response.status === 201) {
        toast.success("Barcodes uploaded successfully!");
        setIsUploadModalOpen(false);
        setSelectedFile(null);
        setPreviewData([]);
        setUploadProgress(0);
        fetchBarcodeData(); // Refresh the list
      } else {
        toast.error(`Upload failed: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to upload barcodes";
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Manual upload for each record (alternative to bulk upload)
  const uploadManualRecords = async () => {
    if (previewData.length === 0) {
      toast.error("No data to upload");
      return;
    }
    
    const invalidRecords = previewData.filter(item => !item._isValid);
    if (invalidRecords.length > 0) {
      toast.error(`Please fix ${invalidRecords.length} invalid records before uploading`);
      return;
    }
    
    setUploading(true);
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < previewData.length; i++) {
      const record = previewData[i];
      try {
        // Remove internal fields before sending
        const { _originalRow, _isValid, _errors, ...apiRecord } = record;
        
        const response = await axios.post(
          "https://api.websave.in/api/manufactur/createBarCode",
          apiRecord,
          { headers: { Authorization: `Bearer ${tkn}` } }
        );
        
        if (response.status === 200 || response.status === 201) {
          successCount++;
          setUploadProgress(Math.round(((i + 1) / previewData.length) * 100));
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
        console.error(`Failed to upload record ${i + 1}:`, err);
      }
    }
    
    setUploading(false);
    toast.success(`Upload complete: ${successCount} successful, ${failCount} failed`);
    
    if (successCount > 0) {
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setPreviewData([]);
      fetchBarcodeData();
    }
  };

  // Filter barcode data for display
  const filteredBarcodeData = barcodeData.filter(item => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    const matchesMain = item.deviceSerialNo?.toLowerCase().includes(lowerCaseSearch) ||
                        item.barCodeNo?.toLowerCase().includes(lowerCaseSearch);
    const matchesSim = item.simDetails?.some(sim => sim.iccidNo?.toLowerCase().includes(lowerCaseSearch));
    return matchesMain || matchesSim;
  });

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen">
      <ManufactureNavbar />
      
      <div className="p-4 sm:p-8">
        <Toaster position="top-right" />
        
        <h1 className="text-3xl font-extrabold text-yellow-400 mb-6 border-b border-gray-700 pb-3">
          Map Device via Excel
        </h1>
        
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search Serial No, ICCID, or Barcode No"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 w-full sm:w-96 transition duration-150"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          
          <div className="flex gap-3">
            
            
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition duration-150 shadow-lg"
            >
              <Upload size={18} /> Upload Excel
            </button>
          </div>
        </div>
        
        {/* Barcode List Table */}
        <div className="bg-gray-800 shadow-2xl rounded-xl border border-gray-700">
          {loading ? (
            <p className="p-6 text-center text-yellow-400">Loading barcode data...</p>
          ) : filteredBarcodeData.length === 0 ? (
            <p className="p-6 text-center text-gray-500">No barcodes found.</p>
          ) : (
            <div className="overflow-x-auto max-h-[75vh] custom-scrollbar rounded-xl">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700 sticky top-0 z-10 shadow-md">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Device Serial No</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Barcode No</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">ICCID / SIM Details</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Type/Model</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Created At</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {filteredBarcodeData.map((item, index) => {
                    const simDetails = item.simDetails && item.simDetails.length > 0 ? item.simDetails : [null];
                    
                    return simDetails.map((sim, simIndex) => (
                      <tr key={`${item._id}-${simIndex}`} className="hover:bg-gray-700/50 transition">
                        {simIndex === 0 && (
                          <>
                            <td className="px-4 py-3 text-sm font-medium text-yellow-300" rowSpan={simDetails.length}>
                              {item.deviceSerialNo || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm font-mono text-cyan-400" rowSpan={simDetails.length}>
                              {item.barCodeNo || 'N/A'}
                            </td>
                          </>
                        )}
                        
                        <td className="px-4 py-3 text-xs font-mono text-gray-300">
                          {sim?.iccidNo ? (
                            <div>
                              <p className="text-yellow-300">{sim.iccidNo}</p>
                              <p className="text-gray-400 text-[11px]">{sim.operator} (Valid: {formatDate(sim.validityDate)})</p>
                            </div>
                          ) : (
                            <span className="text-gray-500 italic">No SIM</span>
                          )}
                        </td>
                        
                        {simIndex === 0 && (
                          <>
                            <td className="px-4 py-3 text-sm text-gray-300" rowSpan={simDetails.length}>
                              {item.elementType} / {item.elementModelNo}
                            </td>
                            <td className="px-4 py-3" rowSpan={simDetails.length}>
                              <span className={`inline-block px-2 py-1 text-xs rounded-full font-semibold ${
                                item.status === 'Active' ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'
                              }`}>
                                {item.status || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500" rowSpan={simDetails.length}>
                              {formatDate(item.createdAt)}
                            </td>
                          </>
                        )}
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl w-[1200px] max-w-full max-h-[90vh] overflow-y-auto border border-yellow-500 shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                <FileSpreadsheet size={24} /> Upload Excel File
              </h2>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setSelectedFile(null);
                  setPreviewData([]);
                }}
                className="p-2 rounded-full text-yellow-400 hover:bg-gray-800 transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {/* File Upload Section */}
              <div className="mb-6">
                <label className="block mb-2 text-gray-300 font-medium">Barcode Creation Type</label>
                <select
                  value={creationType}
                  onChange={(e) => setCreationType(e.target.value)}
                  className="mb-4 p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-yellow-500"
                >
                  <option value="Automatic">Automatic</option>
                  
                </select>
                
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-yellow-500 transition">
                  <input
                    type="file"
                    id="excelFile"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="excelFile"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <Upload size={48} className="text-yellow-500" />
                    <span className="text-gray-300">
                      {selectedFile ? selectedFile.name : "Click or drag to upload Excel file"}
                    </span>
                    <span className="text-gray-500 text-sm">Supports .xlsx, .xls, .csv</span>
                  </label>
                </div>
              </div>
              
              {/* Preview Section */}
              {previewData.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-yellow-400">
                      Preview ({previewData.length} records)
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={uploadManualRecords}
                        disabled={uploading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition disabled:opacity-50"
                      >
                        Upload All Records
                      </button>
                    </div>
                  </div>
                  
                  {uploading && (
                    <div className="mb-4">
                      <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-yellow-500 h-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-gray-400 text-sm mt-1">{uploadProgress}% Complete</p>
                    </div>
                  )}
                  
                  <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-700 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs text-yellow-400">Status</th>
                          <th className="px-3 py-2 text-left text-xs text-yellow-400">Device Serial</th>
                          <th className="px-3 py-2 text-left text-xs text-yellow-400">Barcode No</th>
                          <th className="px-3 py-2 text-left text-xs text-yellow-400">Element Name</th>
                          <th className="px-3 py-2 text-left text-xs text-yellow-400">SIMs</th>
                          <th className="px-3 py-2 text-left text-xs text-yellow-400">Errors</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {previewData.map((item, idx) => (
                          <tr key={idx} className={item._isValid ? 'bg-gray-800' : 'bg-red-900/20'}>
                            <td className="px-3 py-2">
                              {item._isValid ? (
                                <CheckCircle size={16} className="text-green-500" />
                              ) : (
                                <AlertCircle size={16} className="text-red-500" />
                              )}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-300">{item.deviceSerialNo || '-'}</td>
                            <td className="px-3 py-2 text-sm font-mono text-cyan-400">{item.barCodeNo || '-'}</td>
                            <td className="px-3 py-2 text-sm text-gray-300">{item.elementName || '-'}</td>
                            <td className="px-3 py-2 text-sm text-gray-400">
                              {item.simDetails?.length || 0} SIM(s)
                            </td>
                            <td className="px-3 py-2 text-sm text-red-400">
                              {item._errors.length > 0 && (
                                <ul className="text-xs">
                                  {item._errors.slice(0, 2).map((err, i) => (
                                    <li key={i}>{err}</li>
                                  ))}
                                  {item._errors.length > 2 && `+${item._errors.length - 2} more`}
                                </ul>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-4 p-6 border-t border-gray-700">
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setSelectedFile(null);
                  setPreviewData([]);
                }}
                className="px-6 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={uploadToAPI}
                disabled={!selectedFile || uploading}
                className="px-6 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition disabled:opacity-50"
              >
                {uploading ? `Uploading... ${uploadProgress}%` : "Upload to Server"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapDeviceViaExcel;