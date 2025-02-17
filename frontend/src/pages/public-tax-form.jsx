import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";
import { useLocation, useNavigate } from "react-router-dom";

const PublicTaxForm = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Log the location state to debug
  useEffect(() => {
    console.log("Location state:", location.state);
  }, [location.state]);

  const employeeId = location.state?.employeeId || user?.id;
  const companyId = location.state?.companyId; // Retrieve companyId from location.state
  const taskId = location.state?.taskId;

  const [formData, setFormData] = useState({
    empId: employeeId || "",
    compId: companyId || "", // Add companyId to the form state
    taskId: taskId || "",
    taxRegNo: "",
    taxFileNo: "",
    email: "",
    pass: "",
    officeLocation: "",
    CreationDate: "",
    expiryDate: "",
  });

  const [status, setStatus] = useState({ type: "", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" }); // Clear previous status
    try {
      console.log("Starting form submission...");
      // Prepare submission data
      const submissionData = {
        empId: parseInt(employeeId, 10),
        compId: formData.compId ? parseInt(formData.compId, 10) : null, // Send companyId if available
        taskId: formData.taskId ? parseInt(formData.taskId, 10) : null,
        taxRegNo: parseInt(formData.taxRegNo, 10) || 0,
        taxFileNo: parseInt(formData.taxFileNo, 10) || 0,
        pass: parseInt(formData.pass, 10) || 0,
        email: formData.email,
        officeLocation: formData.officeLocation,
        CreationDate: new Date(formData.CreationDate).toISOString(),
        expiryDate: formData.expiryDate
          ? new Date(formData.expiryDate).toISOString()
          : null,
      };
      console.log("Submission data:", submissionData);
      // Submit form data
      const formResponse = await axios.post(
        "http://145.223.96.50:3002/api/v1/public-tax",
        submissionData
      );
      console.log("Form submission response:", formResponse.data);
      // Show success message with "مكتمل"
      setStatus({
        type: "success",
        message: "تم إرسال تفاصيل التسجيل الضريبي بنجاح! (مكتمل)",
      });
      // Navigate after short delay
      setTimeout(() => {
        console.log("Navigating to dashboard");
        navigate("/employee-dashboard");
      }, 1500);
    } catch (error) {
      console.error("Form submission error:", error);
      console.error("Error details:", error.response?.data || error.message);
      setStatus({
        type: "error",
        message:
          error.response?.data?.message || "فشل في إرسال النموذج. يرجى المحاولة مرة أخرى.",
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      empId: employeeId || "",
      compId: companyId || "", // Reset companyId to the one received from task
      taxRegNo: "",
      taxFileNo: "",
      email: "",
      pass: "",
      officeLocation: "",
      CreationDate: "",
      expiryDate: "",
    });
    setStatus({ type: "", message: "" });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-2">التسجيل الضريبي العام</h2>
      {status.message && (
        <div
          className={`mb-4 p-4 rounded ${
            status.type === "error"
              ? "bg-red-100 text-red-700"
              : status.type === "warning"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {status.message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Removed the employee ID display */}
        <div>
          <label className="block text-sm font-medium mb-1">ر.ت.ض</label>
          <input
            type="number"
            name="taxRegNo"
            value={formData.taxRegNo}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">رقم الملف الضريبي</label>
          <input
            type="number"
            name="taxFileNo"
            value={formData.taxFileNo}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">الايميل</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">الباسورد</label>
          <input
            type="password"
            name="pass"
            value={formData.pass}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">مأمورية</label>
          <input
            type="text"
            name="officeLocation"
            value={formData.officeLocation}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">بداية النشاط</label>
          <input
            type="date"
            name="CreationDate"
            value={formData.CreationDate}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">نهاية النشاط</label>
          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none"
          >
            إعادة تعيين
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
          >
            إرسال
          </button>
        </div>
      </form>
    </div>
  );
};

export default PublicTaxForm;