import { useState, useEffect } from "react";
import axios from "axios";
import ReportsDashboard from "./reportdashboard.jsx";

const ManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState("tasks");
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [clientData, setClientData] = useState({
    name: "",
    phonenum: "",
  });
  const [newTask, setNewTask] = useState({
    clientName: "",
    clientPhone: "",
    type: "",
    employeeId: "",
    companyId: null,
  });
  const [otherType, setOtherType] = useState(""); // State for the "Other" type input

  useEffect(() => {
    fetchEmployees();
    fetchTasks();
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await axios.get("http://145.223.96.50:3002/api/v1/companies");
      console.log("Companies Data:", response.data); 
      setCompanies(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("❌ خطأ في جلب بيانات الشركات:", error);
      setCompanies([]);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("http://145.223.96.50:3002/api/v1/employees");
      setEmployees(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error("❌ خطأ في جلب بيانات الموظفين:", error);
      setEmployees([]);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get("http://145.223.96.50:3002/api/v1/tasks");
      console.log("Tasks Data:", response.data); 
      setTasks(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error("❌ خطأ في جلب المهام:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    
    if (!clientData.name || !clientData.phonenum) {
      setSuccessMessage("❌ يرجى ملء جميع حقول بيانات العميل");
      return;
    }

    try {
      console.log('Sending company data:', clientData);
      
      const response = await axios.post("http://145.223.96.50:3002/api/v1/companies", {
        name: clientData.name,
        phonenum: clientData.phonenum
      });
      
      if (response.data.id) {
        setSuccessMessage("✔ تم حفظ بيانات الشركة بنجاح!");
        
        // Clear the form
        setClientData({
          name: "",
          phonenum: "",
        });
        
        // Refresh companies and tasks
        await fetchCompanies();
        await fetchTasks();
        
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        throw new Error('No company ID returned');
      }
    } catch (error) {
      console.error("❌ خطأ أثناء حفظ بيانات الشركة:", error);
      setSuccessMessage("❌ حدث خطأ أثناء حفظ بيانات الشركة");
    }
  };

  const handleCompanySelect = (companyId) => {
    const selectedCompany = companies.find(company => company.id === parseInt(companyId));
    if (selectedCompany) {
      setNewTask({
        ...newTask,
        companyId: parseInt(companyId),
        clientName: selectedCompany.name,
        clientPhone: selectedCompany.phonenum
      });
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();

    // Use the "Other" type input if "Other" is selected
    const taskType = newTask.type === "Other" ? otherType : newTask.type;

    if (!taskType || !newTask.employeeId || !newTask.companyId) {
      setSuccessMessage("❌ يرجى ملء جميع حقول المهمة");
      return;
    }

    try {
      const taskData = {
        clientName: newTask.clientName,
        clientPhone: newTask.clientPhone,
        type: taskType, // Use the resolved task type
        employeeId: parseInt(newTask.employeeId, 10),
        companyId: parseInt(newTask.companyId, 10)
      };

      console.log('Sending task data:', taskData);

      await axios.post("http://145.223.96.50:3002/api/v1/tasks", taskData);
      
      setSuccessMessage("✔ تمت إضافة المهمة بنجاح!");
      
      setNewTask({
        clientName: "",
        clientPhone: "",
        type: "",
        employeeId: "",
        companyId: null,
      });
      setOtherType(""); // Clear the "Other" type input
      
      await fetchTasks();
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("❌ خطأ أثناء إنشاء المهمة:", error);
      setSuccessMessage("❌ حدث خطأ أثناء تعيين المهمة");
    }
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {loading ? (
        <p className="text-center text-gray-600">جاري تحميل البيانات...</p>
      ) : (
        <>
          <h1 className="text-2xl font-bold">لوحة تحكم المدير</h1>
          {successMessage && (
            <div className="p-4 bg-green-100 text-green-800 rounded">{successMessage}</div>
          )}
          
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-4 py-2 rounded ${activeTab === "tasks" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              المهام
            </button>
            <button
              onClick={() => setActiveTab("clients")}
              className={`px-4 py-2 rounded ${activeTab === "clients" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              العملاء
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`px-4 py-2 rounded ${activeTab === "reports" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              التقارير
            </button>
          </div>

          {activeTab === "tasks" && (
            <div className="space-y-6">
              {/* Section 1: Client Data Entry */}
              <form onSubmit={handleClientSubmit} className="p-4 bg-white shadow-md rounded-lg space-y-4">
                <h2 className="text-xl font-bold">ادخال بيانات العميل</h2>
                <input
                  type="text"
                  placeholder="اسم العميل"
                  value={clientData.name}
                  onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  type="tel"
                  placeholder="هاتف العميل"
                  value={clientData.phonenum}
                  onChange={(e) => setClientData({ ...clientData, phonenum: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  حفظ بيانات العميل
                </button>
              </form>

              {/* Section 2: Task Assignment */}
              <form onSubmit={handleTaskSubmit} className="p-4 bg-white shadow-md rounded-lg space-y-4">
                <h2 className="text-xl font-bold">ارسال المهمة للموظف</h2>
                <select
                  value={newTask.companyId || ""}
                  onChange={(e) => handleCompanySelect(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">اختر العميل</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                <select
                  value={newTask.type}
                  onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">اختر نوع المهمة</option>
                  <option value="ض.ق.م">ض.ق.م</option>
                  <option value="السجل التجاري">السجل التجاري</option>
                  <option value="ض.ع">ض.ع</option>
                  <option value="ف.ك">ف.ك</option>
                  <option value="Other">أخرى</option> {/* Add "Other" option */}
                </select>
                {newTask.type === "Other" && ( // Conditionally render the "Other" type input
                  <input
                    type="text"
                    placeholder="أدخل نوع المهمة"
                    value={otherType}
                    onChange={(e) => setOtherType(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  />
                )}
                <select
                  value={newTask.employeeId}
                  onChange={(e) => setNewTask({ ...newTask, employeeId: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">اختيار الموظف</option>
                  {employees
                    .filter((emp) => emp.role_id === 2)
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  تعيين المهمة
                </button>
              </form>
            </div>
          )}

          {activeTab === "clients" && (
            <div>
              <h2 className="text-xl font-bold mb-4">قائمة العملاء</h2>
              <table className="w-full bg-white shadow-md rounded-lg">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2">اسم العميل</th>
                    <th className="p-2">هاتف العميل</th>
                    <th className="p-2">المهام</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => {
                    // Filter tasks for the current company
                    const companyTasks = tasks.filter((task) => task.companyId === company.id);

                    // Debugging: Log company ID and associated tasks
                    console.log("Company ID:", company.id, "Tasks:", companyTasks);

                    // Merge tasks into a comma-separated string
                    const tasksList = companyTasks.map((task) => task.type).join(" , ");

                    return (
                      <tr key={company.id} className="border-b">
                        <td className="p-2 text-center">{company.name}</td>
                        <td className="p-2 text-center">{company.phonenum}</td>
                        <td className="p-2 text-center">
                          {tasksList || "لا توجد مهام"} {/* Fallback if no tasks */}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "reports" && <ReportsDashboard />}
        </>
      )}
    </div>
  );
};

export default ManagerDashboard;