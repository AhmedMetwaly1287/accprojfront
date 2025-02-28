import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";
import { useNavigate, useLocation } from "react-router-dom";

const PublicTaxForm = () => {
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
    taxRegNo: "",
    taxFileNo: "",
    email: "",
    pass: "",
    officeLocation: "",
    CreationDate: "",
    expiryDate: "",
  });

  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    if (isUpdate && taskId) {
      const fetchFormData = async () => {
        try {
          const response = await axios.get(
            `http://145.223.96.50:3002/api/v1/public-tax/by-task/${taskId}`
          );
          const data = response.data.data ? response.data.data : response.data;
          
          const recordId = data.id || data._id;
          
          setFormData({
            ...data,
            id: recordId,
            empId: user?.id || "",
            compId: companyId || "",
            taskId: taskId || "",
            CreationDate: data.CreationDate ? data.CreationDate.split('T')[0] : "",
            expiryDate: data.expiryDate ? data.expiryDate.split('T')[0] : ""
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
        taxRegNo: formData.taxRegNo.toString(),
        taxFileNo: formData.taxFileNo.toString(),
        CreationDate: formData.CreationDate
          ? new Date(formData.CreationDate).toISOString()
          : null,
        expiryDate: formData.expiryDate
          ? new Date(formData.expiryDate).toISOString()
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
          `http://145.223.96.50:3002/api/v1/public-tax/${formData.id}`,
          submissionData
        );
        setStatus({ type: "success", message: "تم تحديث البيانات بنجاح! (مكتمل)" });
      } else {
        await axios.post("http://145.223.96.50:3002/api/v1/public-tax", submissionData);
        setStatus({ type: "success", message: "تم تسجيل الضريبة العامة بنجاح! (مكتمل)" });
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
      <h2 className="text-2xl font-bold mb-2">نموذج الضريبة العامة</h2>
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
          <label className="block text-sm font-medium mb-1">رقم التسجيل الضريبي</label>
          <input
            type="text"
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
            type="text"
            name="taxFileNo"
            value={formData.taxFileNo}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
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
          <label className="block text-sm font-medium mb-1">كلمة المرور</label>
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
          <label className="block text-sm font-medium mb-1">المأمورية</label>
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
          <label className="block text-sm font-medium mb-1">تاريخ البداية</label>
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
          <label className="block text-sm font-medium mb-1">تاريخ الانتهاء</label>
          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
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

export default PublicTaxForm;