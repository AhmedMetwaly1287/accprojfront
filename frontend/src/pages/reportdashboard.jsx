import { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx"; // Import xlsx for Excel generation
import { CalendarDays, MapPin, AlertCircle } from "lucide-react";
import MonthlyTasksReport from "./monthlytaskreport";

const ReportsDashboard = () => {
  // States for various records
  const [vats, setVats] = useState([]);
  const [publicTaxes, setPublicTaxes] = useState([]);
  const [commercialRegisters, setCommercialRegisters] = useState([]);
  const [electronicBills, setElectronicBills] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  // States for tasks and employees
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [others, setOthers] = useState([]);

  // Fetch data from API endpoints
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [
        vatRes,
        taxRes,
        regRes,
        billRes,
        companiesRes,
        tasksRes,
        employeesRes,
        othersRes,
      ] = await Promise.all([
        axios.get("http://145.223.96.50:3002/api/v1/vat"),
        axios.get("http://145.223.96.50:3002/api/v1/public-tax"),
        axios.get("http://145.223.96.50:3002/api/v1/commercial-registers"),
        axios.get("http://145.223.96.50:3002/api/v1/electronic-bills"),
        axios.get("http://145.223.96.50:3002/api/v1/companies"),
        axios.get("http://145.223.96.50:3002/api/v1/tasks"),
        axios.get("http://145.223.96.50:3002/api/v1/employees"),
        axios.get("http://145.223.96.50:3002/api/v1/other"),
      ]);

      const filteredEmployees = employeesRes.data.data.filter(
        (emp) => emp.role_id === 2
      );
      setEmployees(filteredEmployees || []);

      setVats(vatRes.data);
      setPublicTaxes(taxRes.data);
      setCommercialRegisters(regRes.data);
      setElectronicBills(billRes.data);
      setCompanies(companiesRes.data);
      setTasks(tasksRes.data);
      setOthers(othersRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper: get company name based on compId
  const getCompanyName = (compId) => {
    const company = companies.find((c) => c.id === compId);
    return company ? company.name : "Unknown Company";
  };

  // Helper: get employee name based on empId
  const getEmployeeName = (empId) => {
    const employee = employees.find((e) => e.id == empId);
    return employee ? employee.name : "Unknown Employee";
  };

  // Helper for tasks: get delivery date using related records.
  // It takes the latest createdAt date from associated forms that have a matching taskId.
  // If no related form is found, it falls back to task.createdAt.
  const getDeliveryDate = (task) => {
    const relatedDates = [
      ...(task.vat || [])
        .filter((v) => v.taskId === task.id)
        .map((v) => new Date(v.createdAt)),
      ...(task.publicTax || [])
        .filter((p) => p.taskId === task.id)
        .map((p) => new Date(p.createdAt)),
      ...(task.electronicBill || [])
        .filter((e) => e.taskId === task.id)
        .map((e) => new Date(e.createdAt)),
      ...(task.commercialRegister || [])
        .filter((c) => c.taskId === task.id)
        .map((c) => new Date(c.createdAt)),
      ...(task.other || [])
        .filter((o) => o.taskId === task.id)
        .map((o) => new Date(o.createdAt)),
    ].filter(date => date);
    if (relatedDates.length > 0) {
      return new Date(Math.max(...relatedDates));
    }
    return new Date(task.createdAt);
  };

  // ── Export functions for raw records ──
  const prepareRecordDataForExport = (items, recordType) => {
    const removalKeys = ["id", "empId", "taskId", "compId", "createdAt", "modifiedAt"];
    const renameMapping = {
      officeLocation: "المأمورية",
      CreationDate: "بداية الشهادة",
      expiryDate: "نهاية الشهادة",
      companyName: "اسم العميل",
      legalEntity: "الكيان القانوني",
      numCommRegister: "رقم السجل التجاري",
      activites: "الأنشطة",
      qcomp: "ق.الشركة",
      taxRegNo: "ر.ت.ض",
      taxFileNo: "رقم الملف الضريبي",
      email: "الايميل",
      pass: "الباسورد",
      token: "ب.التوكين",
      compName: "شركة التعاقد",
      location: "مكان التأسيس",
    };

    return items.map((item) => {
      const newObj = {};
      for (const key in item) {
        if (Object.hasOwnProperty.call(item, key)) {
          if (removalKeys.includes(key)) continue;
          let value = item[key];
          if (
            value &&
            (key.toLowerCase().includes("date") || key.toLowerCase().includes("time"))
          ) {
            const date = new Date(value);
            if (!isNaN(date)) {
              value = date.toLocaleDateString("en-GB", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              });
            }
          }
          const headerName = renameMapping[key] || key;
          newObj[headerName] = value;
        }
      }
      if (item.empId !== undefined) {
        newObj["اسم الموظف"] = getEmployeeName(item.empId);
      }
      return newObj;
    });
  };

  const exportRecordsToExcel = (data, fileName, recordType) => {
    const preparedData = prepareRecordDataForExport(data, recordType);
    const worksheet = XLSX.utils.json_to_sheet(preparedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Records");

    const currentDate = new Date()
      .toLocaleDateString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\//g, "-");

    XLSX.writeFile(workbook, `${fileName}_${currentDate}.xlsx`);
  };

  // Get unique office locations from relevant fields
  const getUniqueLocations = () => {
    const vatLocations = vats.map((v) => v.officeLocation).filter(Boolean);
    const publicTaxLocations = publicTaxes
      .map((pt) => pt.officeLocation)
      .filter(Boolean);
    const commercialRegisterLocations = commercialRegisters
      .map((cr) => cr.location)
      .filter(Boolean);
    const allLocations = [
      ...vatLocations,
      ...publicTaxLocations,
      ...commercialRegisterLocations,
    ];
    return [...new Set(allLocations)];
  };

  // Filter by location (excluding electronic bills)
  const filterByLocation = (location) => {
    return {
      vat: vats.filter((v) => v.officeLocation === location),
      publicTax: publicTaxes.filter((pt) => pt.officeLocation === location),
      commercialReg: commercialRegisters.filter((cr) => cr.location === location),
      electronicBill: [], // as per original logic
      other: others.filter((o) => o.location === location),
    };
  };

  // Filter by date range (using CreationDate)
  const filterByDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const filterByRange = (item) => {
      const creationDate = new Date(item.CreationDate);
      return creationDate >= start && creationDate <= end;
    };
    return {
      vat: vats.filter(filterByRange),
      publicTax: publicTaxes.filter(filterByRange),
      commercialReg: commercialRegisters.filter(filterByRange),
      electronicBill: electronicBills.filter(filterByRange),
      other: others.filter(filterByRange),
    };
  };

  // Combined filter (by location and date)
  const combinedFilter = () => {
    let filteredData = {
      vat: vats,
      publicTax: publicTaxes,
      commercialReg: commercialRegisters,
      electronicBill: electronicBills,
      other: others,
    };
    if (selectedLocation) {
      filteredData = {
        vat: filteredData.vat.filter((v) => v.officeLocation === selectedLocation),
        publicTax: filteredData.publicTax.filter((pt) => pt.officeLocation === selectedLocation),
        commercialReg: filteredData.commercialReg.filter((cr) => cr.location === selectedLocation),
        electronicBill: [], // as per original logic
        other: filteredData.other.filter((o) => o.location === selectedLocation),
      };
    }
    if (dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      const filterByRange = (item) => {
        const creationDate = new Date(item.CreationDate);
        return creationDate >= start && creationDate <= end;
      };
      filteredData = {
        vat: filteredData.vat.filter(filterByRange),
        publicTax: filteredData.publicTax.filter(filterByRange),
        commercialReg: filteredData.commercialReg.filter(filterByRange),
        electronicBill: filteredData.electronicBill.filter(filterByRange),
        other: filteredData.other.filter(filterByRange),
      };
    }
    return filteredData;
  };

  // Expiring cards summary (for records)
  const getExpiringCards = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

    const formatDate = (date) => {
      return date.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    };

    const filterByExpiry = (items) => ({
      expiringToday: items.filter((item) => {
        const expiry = item.expiryDate ? new Date(item.expiryDate) : null;
        return expiry && formatDate(expiry) === formatDate(today);
      }),
      createdToday: items.filter((item) => {
        const creation = new Date(item.CreationDate);
        return formatDate(creation) === formatDate(today);
      }),
      expiringThisMonth: items.filter((item) => {
        const expiry = item.expiryDate ? new Date(item.expiryDate) : null;
        return expiry && expiry >= today && expiry <= nextMonth;
      }),
    });

    return {
      vat: filterByExpiry(vats),
      publicTax: filterByExpiry(publicTaxes),
      commercialReg: filterByExpiry(commercialRegisters),
      electronicBill: filterByExpiry(electronicBills),
      other: filterByExpiry(others),
    };
  };

  // ── Tasks Reports ──
  const getMonthlyTasksReport = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const tasksData = tasks?.data || [];

    const tasksThisMonth = tasksData.filter((task) => {
      const created = new Date(task.createdAt);
      return created.getFullYear() === currentYear && created.getMonth() === currentMonth;
    });

    return {
      completed: tasksThisMonth.filter((task) => task.status.toUpperCase() === "COMPLETED"),
      pending: tasksThisMonth.filter((task) => task.status.toUpperCase() === "PENDING"),
    };
  };

  const getEmployeeTasks = () => {
    if (!selectedEmployee) return { completed: [], pending: [] };
    const tasksData = tasks?.data || [];
    const employeeTasks = tasksData.filter((task) => task.employeeId == selectedEmployee);
    return {
      completed: employeeTasks.filter((task) => task.status.toUpperCase() === "COMPLETED"),
      pending: employeeTasks.filter((task) => task.status.toUpperCase() === "PENDING"),
    };
  };

  // Export function for tasks – updated to always show the delivery date based on getDeliveryDate.
  const exportToExcel = (data, fileName) => {
    const prepareDataForExport = (items) => {
      return items.map((item) => ({
        "نوع المهمة": item.type || "",
        الحالة: item.status,
        "اسم الموظف": getEmployeeName(item.employeeId || item.empId),
        "تاريخ الإنشاء": new Date(item.createdAt).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
        "تاريخ التسليم": getDeliveryDate(item).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
      }));
    };

    const exportData = prepareDataForExport(data);
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");

    const currentDate = new Date()
      .toLocaleDateString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit" })
      .replace(/\//g, "-");

    XLSX.writeFile(workbook, `${fileName}_${currentDate}.xlsx`);
  };

  if (loading) {
    return <>جاري تحميل البيانات...</>;
  }

  const uniqueLocations = getUniqueLocations();
  const monthlyTasksReport = getMonthlyTasksReport();
  const employeeTasksReport = getEmployeeTasks();

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      {/* Combined Filter Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">تصفية حسب الموقع والتاريخ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">الموقع</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">اختر الموقع</option>
              {uniqueLocations.map((location, index) => (
                <option key={index} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">التاريخ</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="p-2 border rounded"
              />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="p-2 border rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Display Filtered Data Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">البيانات المصفاة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(combinedFilter()).map(([key, items]) => (
            <div key={key} className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold">
                {key === "vat"
                  ? "ض.ق.م"
                  : key === "publicTax"
                  ? "ض.ع"
                  : key === "commercialReg"
                  ? "السجل التجاري"
                  : key === "electronicBill"
                  ? "الفاتورة الإلكترونية"
                  : "أخرى"}
              </h3>
              <p className="text-sm text-gray-600">عدد المعاملات: {items.length}</p>
              <button
                onClick={() =>
                  exportRecordsToExcel(items, `Filtered_${key}_By_Location_And_Date`, key)
                }
                className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                تصدير إلى Excel
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Expiring Cards Summary */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">ملخص البطاقات</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(getExpiringCards()).map(([type, data]) => (
            <div key={type} className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold">
                {type === "vat"
                  ? "ض.ق.م"
                  : type === "publicTax"
                  ? "ض.ع"
                  : type === "commercialReg"
                  ? "السجل التجاري"
                  : type === "electronicBill"
                  ? "الفاتورة الإلكترونية"
                  : "أخرى"}
              </h3>
              <p className="text-sm text-gray-600">تنتهي اليوم: {data.expiringToday.length}</p>
              <p className="text-sm text-gray-600">أنشئت اليوم: {data.createdToday.length}</p>
              <p className="text-sm text-gray-600">تنتهي هذا الشهر: {data.expiringThisMonth.length}</p>
              <button
                onClick={() =>
                  exportRecordsToExcel(data.expiringToday, `Expiring_Today_${type}`, type)
                }
                className="mt-2 w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                تصدير المنتهية اليوم
              </button>
              <button
                onClick={() =>
                  exportRecordsToExcel(data.createdToday, `Created_Today_${type}`, type)
                }
                className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                تصدير المنشأة اليوم
              </button>
              <button
                onClick={() =>
                  exportRecordsToExcel(data.expiringThisMonth, `Expiring_Next_Month_${type}`, type)
                }
                className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                تصدير المنتهية هذا الشهر
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Tasks Report Section */}
      <MonthlyTasksReport tasks={tasks} employees={employees} />

      {/* Employee Tasks Report Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">تقرير مهام الموظف</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">اختر الموظف</label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">اختر الموظف</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>

        {selectedEmployee && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Completed Tasks */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">المهام المكتملة</h3>
              <p className="text-sm text-gray-600 mb-3">
                عدد المهام: {employeeTasksReport.completed.length}
              </p>
              <button
                onClick={() =>
                  exportToExcel(
                    employeeTasksReport.completed,
                    `مهام_مكتملة_${getEmployeeName(selectedEmployee)}`
                  )
                }
                className="mb-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                تصدير المهام المكتملة
              </button>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {employeeTasksReport.completed.map((task) => (
                  <div key={task.id} className="p-3 bg-white rounded shadow-sm">
                    <h4 className="font-medium text-sm">{task.type}</h4>
                    <p className="text-xs text-gray-600">
                      تاريخ الإنشاء: {new Date(task.createdAt).toLocaleDateString("en-GB")}
                    </p>
                    <p className="text-xs text-gray-600">نوع المهمة: {task.taskType}</p>
                    <p className="text-xs text-gray-600">
                      تاريخ التسليم:{" "}
                      {getDeliveryDate(task).toLocaleDateString("en-GB", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Tasks */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">المهام قيد الانتظار</h3>
              <p className="text-sm text-gray-600 mb-3">
                عدد المهام: {employeeTasksReport.pending.length}
              </p>
              <button
                onClick={() =>
                  exportToExcel(
                    employeeTasksReport.pending,
                    `مهام_قيد_الانتظار_${getEmployeeName(selectedEmployee)}`
                  )
                }
                className="mb-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                تصدير المهام قيد الانتظار
              </button>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {employeeTasksReport.pending.map((task) => (
                  <div key={task.id} className="p-3 bg-white rounded shadow-sm">
                    <h4 className="font-medium text-sm">{task.type}</h4>
                    <p className="text-xs text-gray-600">
                      تاريخ الإنشاء: {new Date(task.createdAt).toLocaleDateString("en-GB")}
                    </p>
                    <p className="text-xs text-gray-600">نوع المهمة: {task.taskType}</p>
                    <p className="text-xs text-gray-600">
                      تاريخ التسليم:{" "}
                      {getDeliveryDate(task).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Completed Tasks Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">المهام المكتملة بالتفصيل</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthlyTasksReport.completed.map((task) => (
            <div key={task.id} className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold">{task.type}</h3>
              <p className="text-sm text-gray-600">
                الموظف: {getEmployeeName(task.employeeId)}
              </p>
              <p className="text-sm text-gray-600">
                تاريخ التسليم:{" "}
                {getDeliveryDate(task).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}
              </p>
              <p className="text-sm text-gray-600">الحالة: {task.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
