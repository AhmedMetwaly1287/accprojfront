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
  const [otherType, setOtherType] = useState(""); // For "Other" task type

  // States for client update functionality
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [updateClientData, setUpdateClientData] = useState({
    name: "",
    phonenum: "",
  });

  // States for old clients section
  const [oldClientData, setOldClientData] = useState({
    name: "",
    phonenum: "",
    // Default to current date in YYYY-MM-DD format
    createdAt: new Date().toISOString().split("T")[0],
  });
  const [oldClientTask, setOldClientTask] = useState({
    clientName: "",
    clientPhone: "",
    type: "",
    employeeId: "",
    companyId: null,
    // Default to current date in YYYY-MM-DD format
    createdAt: new Date().toISOString().split("T")[0],
    status: "PENDING",
  });
  const [oldClientOtherType, setOldClientOtherType] = useState("");

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
      console.log("Sending company data:", clientData);

      const response = await axios.post("http://145.223.96.50:3002/api/v1/companies", {
        name: clientData.name,
        phonenum: clientData.phonenum,
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
        throw new Error("No company ID returned");
      }
    } catch (error) {
      console.error("❌ خطأ أثناء حفظ بيانات الشركة:", error);
      setSuccessMessage("❌ حدث خطأ أثناء حفظ بيانات الشركة");
    }
  };

  // Handle old client submissions
  const handleOldClientSubmit = async (e) => {
    e.preventDefault();
  
    if (!oldClientData.name || !oldClientData.phonenum || !oldClientData.createdAt) {
      setSuccessMessage("❌ يرجى ملء جميع حقول بيانات العميل القديم");
      return;
    }
  
    try {
      // Format the entered date by appending "T00:00:00" to match the expected format
      const formattedDate = new Date(`${oldClientData.createdAt}T00:00:00`).toISOString();
  
      const companyData = {
        name: oldClientData.name,
        phonenum: oldClientData.phonenum,
        createdAt: formattedDate,  // Use the formatted date
      };
  
      console.log("Sending old company data:", companyData);
  
      const response = await axios.post("http://145.223.96.50:3002/api/v1/companies", companyData);
  
      if (response.data.id) {
        setSuccessMessage("✔ تم حفظ بيانات العميل القديم بنجاح!");
  
        // Reset form with today's date for createdAt
        setOldClientData({
          name: "",
          phonenum: "",
          createdAt: new Date().toISOString().split("T")[0],
        });
  
        await fetchCompanies();
        await fetchTasks();
  
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        throw new Error("No company ID returned");
      }
    } catch (error) {
      console.error("❌ خطأ أثناء حفظ بيانات العميل القديم:", error);
      setSuccessMessage("❌ حدث خطأ أثناء حفظ بيانات العميل القديم");
    }
  };

  // Select a client for update
  const handleSelectClientForUpdate = (company) => {
    setSelectedClientId(company.id);
    setUpdateClientData({
      name: company.name,
      phonenum: company.phonenum,
    });
  };

  // Handle client update
  const handleClientUpdate = async (e) => {
    e.preventDefault();

    if (!updateClientData.name || !updateClientData.phonenum) {
      setSuccessMessage("❌ يرجى ملء جميع حقول تحديث بيانات العميل");
      return;
    }

    try {
      console.log("Updating company data:", updateClientData);

      const response = await axios.put(
        `http://145.223.96.50:3002/api/v1/companies/${selectedClientId}`,
        {
          name: updateClientData.name,
          phonenum: updateClientData.phonenum,
        }
      );

      if (response.data) {
        setSuccessMessage("✔ تم تحديث بيانات العميل بنجاح!");

        // Clear update form and selected client
        setSelectedClientId(null);
        setUpdateClientData({
          name: "",
          phonenum: "",
        });

        // Refresh companies and tasks
        await fetchCompanies();
        await fetchTasks();

        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      }
    } catch (error) {
      console.error("❌ خطأ أثناء تحديث بيانات العميل:", error);
      setSuccessMessage("❌ حدث خطأ أثناء تحديث بيانات العميل");
    }
  };

  // Cancel update and reset form
  const handleCancelUpdate = () => {
    setSelectedClientId(null);
    setUpdateClientData({
      name: "",
      phonenum: "",
    });
  };

  const handleCompanySelect = (companyId) => {
    const selectedCompany = companies.find(
      (company) => company.id === parseInt(companyId)
    );
    if (selectedCompany) {
      setNewTask({
        ...newTask,
        companyId: parseInt(companyId),
        clientName: selectedCompany.name,
        clientPhone: selectedCompany.phonenum,
      });
    }
  };

  // Handle selecting a company for old client tasks
  const handleOldClientCompanySelect = (companyId) => {
    const selectedCompany = companies.find(
      (company) => company.id === parseInt(companyId)
    );
    if (selectedCompany) {
      setOldClientTask({
        ...oldClientTask,
        companyId: parseInt(companyId),
        clientName: selectedCompany.name,
        clientPhone: selectedCompany.phonenum,
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
        type: taskType,
        employeeId: parseInt(newTask.employeeId, 10),
        companyId: parseInt(newTask.companyId, 10),
      };

      console.log("Sending task data:", taskData);

      await axios.post("http://145.223.96.50:3002/api/v1/tasks", taskData);

      setSuccessMessage("✔ تمت إضافة المهمة بنجاح!");

      setNewTask({
        clientName: "",
        clientPhone: "",
        type: "",
        employeeId: "",
        companyId: null,
      });
      setOtherType("");

      await fetchTasks();

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("❌ خطأ أثناء إنشاء المهمة:", error);
      setSuccessMessage("❌ حدث خطأ أثناء تعيين المهمة");
    }
  };

  // Handle old client task submissions
  const handleOldClientTaskSubmit = async (e) => {
    e.preventDefault();

    // Use the "Other" type input if "Other" is selected
    const taskType =
      oldClientTask.type === "Other" ? oldClientOtherType : oldClientTask.type;

    if (
      !taskType ||
      !oldClientTask.employeeId ||
      !oldClientTask.companyId ||
      !oldClientTask.createdAt ||
      !oldClientTask.status
    ) {
      setSuccessMessage("❌ يرجى ملء جميع حقول المهمة");
      return;
    }

    try {
      // Format the entered date for the task by appending "T00:00:00"
      const formattedDate = new Date(`${oldClientTask.createdAt}T00:00:00`).toISOString();

      const taskData = {
        clientName: oldClientTask.clientName,
        clientPhone: oldClientTask.clientPhone,
        type: taskType,
        employeeId: parseInt(oldClientTask.employeeId, 10),
        companyId: parseInt(oldClientTask.companyId, 10),
        createdAt: formattedDate,
        status: oldClientTask.status,
      };

      console.log("Sending old client task data:", taskData);

      await axios.post("http://145.223.96.50:3002/api/v1/tasks", taskData);

      setSuccessMessage("✔ تمت إضافة مهمة العميل القديم بنجاح!");

      setOldClientTask({
        clientName: "",
        clientPhone: "",
        type: "",
        employeeId: "",
        companyId: null,
        createdAt: new Date().toISOString().split("T")[0],
        status: "PENDING",
      });
      setOldClientOtherType("");

      await fetchTasks();

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("❌ خطأ أثناء إنشاء مهمة العميل القديم:", error);
      setSuccessMessage("❌ حدث خطأ أثناء تعيين مهمة العميل القديم");
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
            <div className="p-4 bg-green-100 text-green-800 rounded">
              {successMessage}
            </div>
          )}

          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-4 py-2 rounded ${
                activeTab === "tasks"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              المهام
            </button>
            <button
              onClick={() => setActiveTab("clients")}
              className={`px-4 py-2 rounded ${
                activeTab === "clients"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              العملاء
            </button>
            <button
              onClick={() => setActiveTab("oldClients")}
              className={`px-4 py-2 rounded ${
                activeTab === "oldClients"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              العملاء القدامى
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`px-4 py-2 rounded ${
                activeTab === "reports"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              التقارير
            </button>
          </div>

          {activeTab === "tasks" && (
            <div className="space-y-6">
              {/* Section 1: Client Data Entry */}
              <form
                onSubmit={handleClientSubmit}
                className="p-4 bg-white shadow-md rounded-lg space-y-4"
              >
                <h2 className="text-xl font-bold">ادخال بيانات العميل</h2>
                <input
                  type="text"
                  placeholder="اسم العميل"
                  value={clientData.name}
                  onChange={(e) =>
                    setClientData({ ...clientData, name: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  type="tel"
                  placeholder="هاتف العميل"
                  value={clientData.phonenum}
                  onChange={(e) =>
                    setClientData({ ...clientData, phonenum: e.target.value })
                  }
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
              <form
                onSubmit={handleTaskSubmit}
                className="p-4 bg-white shadow-md rounded-lg space-y-4"
              >
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
                  onChange={(e) =>
                    setNewTask({ ...newTask, type: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">اختر نوع المهمة</option>
                  <option value="ض.ق.م">ض.ق.م</option>
                  <option value="السجل التجاري">السجل التجاري</option>
                  <option value="ض.ع">ض.ع</option>
                  <option value="ف.ك">ف.ك</option>
                  <option value="Other">أخرى</option>
                </select>
                {newTask.type === "Other" && (
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
                  onChange={(e) =>
                    setNewTask({ ...newTask, employeeId: e.target.value })
                  }
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
            <div className="flex flex-wrap gap-6">
              {/* Client List */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold mb-4">قائمة العملاء</h2>
                <table className="w-full bg-white shadow-md rounded-lg">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="p-2">اسم العميل</th>
                      <th className="p-2">هاتف العميل</th>
                      <th className="p-2">المهام</th>
                      <th className="p-2">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => {
                      // Filter tasks for the current company
                      const companyTasks = tasks.filter(
                        (task) => task.companyId === company.id
                      );

                      // Merge tasks into a comma-separated string
                      const tasksList = companyTasks
                        .map((task) => task.type)
                        .join(" , ");

                      return (
                        <tr key={company.id} className="border-b">
                          <td className="p-2 text-center">{company.name}</td>
                          <td className="p-2 text-center">
                            {company.phonenum}
                          </td>
                          <td className="p-2 text-center">
                            {tasksList || "لا توجد مهام"}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => handleSelectClientForUpdate(company)}
                              className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                            >
                              تعديل
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Client Update Form */}
              {selectedClientId && (
                <div className="w-full md:w-1/3">
                  <form
                    onSubmit={handleClientUpdate}
                    className="p-4 bg-white shadow-md rounded-lg space-y-4"
                  >
                    <h2 className="text-xl font-bold">تعديل بيانات العميل</h2>
                    <input
                      type="text"
                      placeholder="اسم العميل"
                      value={updateClientData.name}
                      onChange={(e) =>
                        setUpdateClientData({
                          ...updateClientData,
                          name: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="هاتف العميل"
                      value={updateClientData.phonenum}
                      onChange={(e) =>
                        setUpdateClientData({
                          ...updateClientData,
                          phonenum: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded"
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        حفظ التعديلات
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelUpdate}
                        className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Old Clients Section */}
          {activeTab === "oldClients" && (
            <div className="space-y-6">
              {/* Old Client Data Entry */}
              <form
                onSubmit={handleOldClientSubmit}
                className="p-4 bg-white shadow-md rounded-lg space-y-4"
              >
                <h2 className="text-xl font-bold">ادخال بيانات العميل القديم</h2>
                <input
                  type="text"
                  placeholder="اسم العميل"
                  value={oldClientData.name}
                  onChange={(e) =>
                    setOldClientData({
                      ...oldClientData,
                      name: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  type="tel"
                  placeholder="هاتف العميل"
                  value={oldClientData.phonenum}
                  onChange={(e) =>
                    setOldClientData({
                      ...oldClientData,
                      phonenum: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                  required
                />
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      تاريخ الإنشاء
                    </label>
                    <input
                      type="date"
                      name="createdAt"
                      value={oldClientData.createdAt}
                      onChange={(e) => {
                        console.log("Selected date:", e.target.value);
                        setOldClientData({
                          ...oldClientData,
                          createdAt: e.target.value,
                        });
                      }}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div className="flex-1"></div>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  حفظ بيانات العميل القديم
                </button>
              </form>

              {/* Old Client Task Assignment */}
              <form
                onSubmit={handleOldClientTaskSubmit}
                className="p-4 bg-white shadow-md rounded-lg space-y-4"
              >
                <h2 className="text-xl font-bold">
                  ارسال المهمة للموظف (عميل قديم)
                </h2>
                <select
                  value={oldClientTask.companyId || ""}
                  onChange={(e) => handleOldClientCompanySelect(e.target.value)}
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
                  value={oldClientTask.type}
                  onChange={(e) =>
                    setOldClientTask({
                      ...oldClientTask,
                      type: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">اختر نوع المهمة</option>
                  <option value="ض.ق.م">ض.ق.م</option>
                  <option value="السجل التجاري">السجل التجاري</option>
                  <option value="ض.ع">ض.ع</option>
                  <option value="ف.ك">ف.ك</option>
                  <option value="Other">أخرى</option>
                </select>
                {oldClientTask.type === "Other" && (
                  <input
                    type="text"
                    placeholder="أدخل نوع المهمة"
                    value={oldClientOtherType}
                    onChange={(e) => setOldClientOtherType(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  />
                )}
                <select
                  value={oldClientTask.employeeId}
                  onChange={(e) =>
                    setOldClientTask({
                      ...oldClientTask,
                      employeeId: e.target.value,
                    })
                  }
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
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      تاريخ الإنشاء
                    </label>
                    <input
                      type="date"
                      value={oldClientTask.createdAt}
                      onChange={(e) =>
                        setOldClientTask({
                          ...oldClientTask,
                          createdAt: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الحالة
                    </label>
                    <select
                      value={oldClientTask.status}
                      onChange={(e) =>
                        setOldClientTask({
                          ...oldClientTask,
                          status: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="PENDING">قيد الانتظار</option>
                      <option value="COMPLETED">مكتمل</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  تعيين المهمة
                </button>
              </form>
            </div>
          )}

          {activeTab === "reports" && <ReportsDashboard />}
        </>
      )}
    </div>
  );
};

export default ManagerDashboard;
