import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";
import { useLocation, useNavigate } from "react-router-dom";

const CommercialRegisterForm = () => {
  const { user } = useAuth();
  const location = useLocation(); // Get location state for companyId
  const navigate = useNavigate();

  // Log the location state to debug
  useEffect(() => {
    console.log("Location state:", location.state);
  }, [location.state]);

  const employeeId = location.state?.employeeId || user?.id; // Get employeeId from logged-in user or location state
  const companyId = location.state?.companyId; // Retrieve companyId from location.state
  const taskId = location.state?.taskId;

  const [formData, setFormData] = useState({
    empId: employeeId || "", // Include employeeId in formData
    compId: companyId || "", // Add companyId if available
    taskId: taskId || "",
    compName: "",
    legalEntity: "",
    numCommRegister: "",
    activites: "",
    location: "",
    qcomp: "",
    CreationDate: "",
    expiryDate: "",
  });

  const [status, setStatus] = useState({ type: "", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" }); // Clear previous status

    try {
      // Prepare the data for the backend
      const backendData = {
        ...formData,
        compId: formData.compId ? parseInt(formData.compId, 10) : null, // Send companyId if available
        taskId: formData.taskId ? parseInt(formData.taskId, 10) : null,
        numCommRegister: parseInt(formData.numCommRegister, 10) || 0, // Ensure numCommRegister is a number
        qcomp: parseInt(formData.qcomp, 10) || 0, // Ensure qcomp is a number
        CreationDate: formData.CreationDate
          ? new Date(formData.CreationDate).toISOString()
          : null,
        expiryDate: formData.expiryDate
          ? new Date(formData.expiryDate).toISOString()
          : null,
      };
      console.log("Data being sent to backend:", backendData); // Debugging log

      // Submit form data to the backend
      await axios.post("http://145.223.96.50:3002/api/v1/commercial-registers", backendData);

      // Show success message and redirect to the employee dashboard
      setStatus({ type: "success", message: "تم إرسال تفاصيل السجل التجاري بنجاح!" });
      setTimeout(() => navigate("/employee-dashboard"), 1500);
    } catch (error) {
      // Log the error and show an error message
      console.error("Error submitting form:", error);
      setStatus({
        type: "error",
        message: "فشل في إرسال النموذج. يرجى المحاولة مرة أخرى.",
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        ["numCommRegister", "qcomp"].includes(name) ? parseInt(value, 10) || "" : value,
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-2">نموذج السجل التجاري</h2>
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
        {/* Hidden input for employee ID */}
        <input type="hidden" name="empId" value={formData.empId} />

        <div>
          <label className="block text-sm font-medium mb-1">اسم الشركة</label>
          <input
            type="text"
            name="compName"
            value={formData.compName}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">الكيان القانوني</label>
          <input
            type="text"
            name="legalEntity"
            value={formData.legalEntity}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">رقم السجل التجاري</label>
          <input
            type="number"
            name="numCommRegister"
            value={formData.numCommRegister}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">الأنشطة</label>
          <textarea
            name="activites"
            value={formData.activites}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">مكان التأسيس</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">ق.الشركة</label>
          <input
            type="text"
            name="qcomp"
            value={formData.qcomp}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">بداية السجل</label>
          <input
            type="date"
            name="CreationDate"
            value={formData.CreationDate}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">نهاية السجل</label>
          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            إرسال
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommercialRegisterForm;