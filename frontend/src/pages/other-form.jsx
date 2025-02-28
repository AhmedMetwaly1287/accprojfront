import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";
import { useNavigate, useLocation } from "react-router-dom";

const OtherForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const taskId = location.state?.taskId;
  const companyId = location.state?.companyId;
  const isUpdate = location.state?.isUpdate || false;

  const [formData, setFormData] = useState({
    id: "",
    empId: user?.id || "",
    compId: companyId || "",
    taskId: taskId || "",
    type: "",
    CreationDate: new Date().toISOString().split("T")[0],
  });

  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    if (isUpdate && taskId) {
      const fetchFormData = async () => {
        try {
          // تحويل taskId إلى رقم إذا كان نصاً
          const numericTaskId = parseInt(taskId, 10);
          
          const response = await axios.get(
            `http://145.223.96.50:3002/api/v1/other/by-task/${numericTaskId}`
          );
          const data = response.data.data ? response.data.data : response.data;
          
          const recordId = data.id || data._id;
          
          setFormData({
            ...data,
            id: recordId,
            empId: user?.id || "",
            compId: parseInt(companyId, 10) || "",
            taskId: numericTaskId,
            CreationDate: data.CreationDate ? data.CreationDate.split('T')[0] : "",
          });
        } catch (error) {
          console.error("Error fetching form data:", error);
          setStatus({ type: "error", message: "فشل في جلب بيانات النموذج" });
        }
      };
  
      fetchFormData();
    }
  }, [isUpdate, taskId, user?.id, companyId]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    try {
      const submissionData = {
        ...formData,
        CreationDate: formData.CreationDate
          ? new Date(formData.CreationDate).toISOString()
          : null,
      };

      if (isUpdate) {
        if (!formData.id) {
          setStatus({ 
            type: "error", 
            message: "معرف السجل مفقود للتحديث" 
          });
          return;
        }

        await axios.put(
          `http://145.223.96.50:3002/api/v1/other/${formData.id}`,
          submissionData
        );
        setStatus({ type: "success", message: "تم تحديث البيانات بنجاح! (مكتمل)" });
      } else {
        await axios.post("http://145.223.96.50:3002/api/v1/other", submissionData);
        setStatus({ type: "success", message: "تم تسجيل البيانات بنجاح! (مكتمل)" });
      }

      setTimeout(() => navigate("/employee-dashboard"), 1500);
    } catch (error) {
      console.error("Form submission error:", error);
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
      id: "",
      empId: user?.id || "",
      compId: companyId || "",
      taskId: taskId || "",
      type: "",
      CreationDate: new Date().toISOString().split("T")[0],
    });
    setStatus({ type: "", message: "" });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-2">نموذج آخر</h2>
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
          <label className="block text-sm font-medium mb-1">نوع العملية</label>
          <input
            type="text"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">تاريخ الإنشاء</label>
          <input
            type="date"
            name="CreationDate"
            value={formData.CreationDate}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <input type="hidden" name="id" value={formData.id} />
        <input type="hidden" name="empId" value={formData.empId} />
        <input type="hidden" name="compId" value={formData.compId} />
        <input type="hidden" name="taskId" value={formData.taskId} />

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
            {isUpdate ? "تحديث" : "إرسال"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OtherForm;