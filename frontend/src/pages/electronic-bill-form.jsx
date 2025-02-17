import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";
import { useNavigate, useLocation } from "react-router-dom";

const ElectronicBillForm = () => {
  const { user } = useAuth(); // Get logged-in user data
  const navigate = useNavigate();
  const location = useLocation(); // Get location state for companyId

  // Log the location state to debug
  useEffect(() => {
    console.log("Location state:", location.state);
  }, [location.state]);

  const employeeId = user?.id || "";
  const companyId = location.state?.companyId; // Retrieve companyId from location.state
  const taskId = location.state?.taskId;

  const [formData, setFormData] = useState({
    empId: employeeId, // Add empId from logged-in user
    compId: companyId || "", // Add companyId if available
    taskId: taskId || "",
    compName: "",
    email: "",
    pass: "",
    token: "",
    CreationDate: "",
    expiryDate: "",
  });

  const [status, setStatus] = useState({ type: "", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" }); // Clear previous status
    try {
      // Prepare submission data
      const submissionData = {
        ...formData,
        compId: formData.compId ? parseInt(formData.compId, 10) : null, // Send companyId if available
        pass: parseInt(formData.pass, 10) || 0, // Ensure pass is a number
        taskId: formData.taskId ? parseInt(formData.taskId, 10) : null,
        CreationDate: formData.CreationDate
          ? new Date(formData.CreationDate).toISOString()
          : null,
        expiryDate: formData.expiryDate
          ? new Date(formData.expiryDate).toISOString()
          : null,
      };
      console.log("Submission data:", submissionData);

      // Submit form data to the backend
      const response = await axios.post(
        "http://145.223.96.50:3002/api/v1/electronic-bills",
        submissionData
      );
      console.log("Form submission response:", response.data);

      // Show success message with "مكتمل"
      setStatus({
        type: "success",
        message: "تم تسجيل الفاتورة الإلكترونية بنجاح! (مكتمل)",
      });

      // Navigate after short delay
      setTimeout(() => {
        navigate("/employee-dashboard");
      }, 1500);
    } catch (error) {
      console.error("Form submission error:", error);
      console.error("Error details:", error.response?.data || error.message);
      setStatus({
        type: "error",
        message:
          error.response?.data?.message || "فشل إرسال النموذج. يرجى المحاولة مرة أخرى.",
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const resetForm = () => {
    setFormData({
      empId: employeeId,
      compId: companyId || "", // Reset companyId to the one received from task
      compName: "",
      email: "",
      pass: "",
      token: "",
      CreationDate: "",
      expiryDate: "",
    });
    setStatus({ type: "", message: "" });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 border border-gray-200 rounded-lg shadow-sm text-right">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">تسجيل الفاتورة الإلكترونية</h2>
      </div>

      {status.message && (
        <div
          className={`p-3 rounded-md mb-6 ${
            status.type === "error"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">شركة التعاقد</label>
          <input
            type="text"
            name="compName"
            value={formData.compName}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الايميل</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الباسورد</label>
          <input
            type="number" // Ensure pass is treated as a number
            name="pass"
            value={formData.pass}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ب.التوكين</label>
          <input
            type="text"
            name="token"
            value={formData.token}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">بداية الفاتورة</label>
          <input
            type="date"
            name="CreationDate"
            value={formData.CreationDate}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">نهاية الفاتورة</label>
          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            إعادة تعيين
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            إرسال
          </button>
        </div>
      </form>
    </div>
  );
};

export default ElectronicBillForm;