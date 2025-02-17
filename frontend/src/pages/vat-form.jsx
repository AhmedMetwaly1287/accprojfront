import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext"; // Import your authentication context
import { useNavigate, useLocation } from "react-router-dom";

const VATForm = () => {
  const { user } = useAuth(); // Get logged-in user data
  const navigate = useNavigate();
  const location = useLocation(); // Get location state for companyId

  // Log the location state to debug
  useEffect(() => {
    console.log("Location state:", location.state);
  }, [location.state]);

  const employeeId = user?.id || ""; // Get empId from logged-in user
  const companyId = location.state?.companyId; // Retrieve companyId from location.state
  const taskId = location.state?.taskId;

  const [formData, setFormData] = useState({
    empId: employeeId, // Add empId from logged-in user
    compId: companyId || "", // Add companyId if available
    taskId: taskId || "",
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
      // Prepare submission data
      const submissionData = {
        email: formData.email,
        pass: parseInt(formData.pass, 10) || 0, // Ensure pass is a number
        officeLocation: formData.officeLocation,
        CreationDate: formData.CreationDate
          ? new Date(formData.CreationDate).toISOString()
          : null,
        expiryDate: formData.expiryDate
          ? new Date(formData.expiryDate).toISOString()
          : null,
        employee: {
          connect: { id: formData.empId ? parseInt(formData.empId, 10) : null }, // Connect to the existing employee
        },
        company: formData.compId
          ? { connect: { id: parseInt(formData.compId, 10) } }
          : undefined, // Connect to the existing company (if compId is provided)
          task:formData.taskId ? { connect:{ id: parseInt(formData.taskId, 10)} } : undefined,
      };
      console.log("Submission data:", submissionData);

      // Submit form data to the backend
      const response = await axios.post(
        "http://145.223.96.50:3002/api/v1/vat",
        submissionData
      );
      console.log("Form submission response:", response.data);

      // Show success message with "مكتمل"
      setStatus({
        type: "success",
        message: "تم تسجيل تفاصيل التسجيل الضريبي بنجاح! (مكتمل)",
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
      empId: employeeId, // Keep empId from logged-in user
      compId: companyId || "", // Reset companyId to the one received from task
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
      <h2 className="text-2xl font-bold mb-2">نموذج التسجيل لضريبة القيمة المضافة</h2>
      {status.message && (
        <div
          className={`mb-4 p-4 rounded ${
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
            type="number" // Ensure pass is treated as a number
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
          <label className="block text-sm font-medium mb-1">بداية الشهادة</label>
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
          <label className="block text-sm font-medium mb-1">نهاية الشهادة</label>
          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
          />
        </div>
        <input type="hidden" name="empId" value={formData.empId} />
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

export default VATForm;