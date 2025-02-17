import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const OtherForm = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract taskId, employeeId, and companyId from the location state
  const { taskId, employeeId, companyId } = location.state || {};

  // State management for form data
  const [formData, setFormData] = useState({
    type: "",
    CreationDate: new Date().toISOString().split("T")[0], // Default to today's date in YYYY-MM-DD format
  });

  // State for loading and error handling
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation for required fields
    if (!formData.type) {
      setError("يرجى إدخال نوع العملية");
      return;
    }

    // Set loading state to true
    setLoading(true);
    setError("");

    try {
      // Convert CreationDate to ISO-8601 format
      const isoDate = new Date(formData.CreationDate).toISOString();

      // Send data to the backend to create a new "Other" record
      const response = await axios.post("http://145.223.96.50:3002/api/v1/other", {
        type: formData.type,
        CreationDate: isoDate, // Use the ISO-8601 formatted date
        empId: employeeId,     // Automatically pass empId
        compId: companyId,     // Automatically pass compId
        taskId: taskId,        // Automatically pass taskId
      });

      // Check if the response contains valid data
      if (response.data) {
        // Redirect to the dashboard or show a success message
        navigate("/dashboard", {
          state: { message: "تم حفظ البيانات بنجاح" },
        });
      }
    } catch (error) {
      // Handle errors gracefully
      setError("فشل حفظ البيانات. حاول مرة أخرى لاحقًا.");
    } finally {
      // Reset loading state
      setLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">نموذج آخر</h1>

      {/* Display error messages */}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Form for creating a new "Other" record */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type field */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            نوع العملية
          </label>
          <input
            type="text"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* CreationDate field */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            تاريخ الإنشاء
          </label>
          <input
            type="date"
            name="CreationDate"
            value={formData.CreationDate}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          {loading ? "جاري الحفظ..." : "حفظ"}
        </button>
      </form>
    </div>
  );
};

export default OtherForm;