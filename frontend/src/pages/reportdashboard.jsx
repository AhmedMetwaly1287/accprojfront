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

  // إضافة تعريفات للتقارير اليومية
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

  // دالة لتنسيق التاريخ
  const formatDate = (date) => {
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // الحصول على البيانات اليومية
  const getDailyReports = () => {
    const allItems = [...vats, ...publicTaxes, ...commercialRegisters, ...electronicBills, ...others];
    
    return {
      createdToday: allItems.filter(item => {
        const creation = new Date(item.CreationDate);
        return formatDate(creation) === formatDate(today);
      }),
      
      endingToday: allItems.filter(item => {
        const expiry = item.expiryDate ? new Date(item.expiryDate) : null;
        return expiry && formatDate(expiry) === formatDate(today);
      }),
      
      endingThisMonth: allItems.filter(item => {
        const expiry = item.expiryDate ? new Date(item.expiryDate) : null;
        return expiry && expiry >= today && expiry <= nextMonth;
      })
    };
  };

  // استخراج التقارير اليومية
  const { createdToday, endingToday, endingThisMonth } = getDailyReports();

  // تعريف أنواع التقارير وأعمدتها
  const reportTypes = {
    vat: {
      title: "تقرير ضريبة القيمة المضافة",
      columns: [
        { key: ['clientName', 'companyName', 'name'], header: 'اسم العميل' },
        { key: 'officeLocation', header: 'المأمورية' },
        { key: 'CreationDate', header: 'بداية الشهادة' },
        { key: 'expiryDate', header: 'نهاية الشهادة' },
        { key: 'email', header: 'البريد الإلكتروني' },
        { key: 'pass', header: 'كلمة المرور' },
        { 
          key: 'employeeId', 
          header: 'اسم الموظف',
          getValue: (item) => getEmployeeName(item.employeeId || item.empId, item)
        }
      ]
    },
    publicTax: {
      title: "تقرير الضرائب العامة",
      columns: [
        { key: ['clientName', 'companyName', 'name'], header: 'اسم العميل' },
        { key: 'officeLocation', header: 'المأمورية' },
        { key: 'CreationDate', header: 'بداية الشهادة' },
        { key: 'expiryDate', header: 'نهاية الشهادة' },
        { key: 'email', header: 'البريد الإلكتروني' },
        { key: 'pass', header: 'كلمة المرور' },
        { 
          key: 'employeeId', 
          header: 'اسم الموظف',
          getValue: (item) => getEmployeeName(item.employeeId || item.empId, item)
        }
      ]
    },
    commercialReg: {
      title: "تقرير السجل التجاري",
      columns: [
        { key: ['clientName', 'companyName', 'name'], header: 'اسم العميل' },
        { key: 'qcomp', header: 'ق. الشركة' },
        { key: 'location', header: 'مكان التأسيس' },
        { key: 'CreationDate', header: 'تاريخ التأسيس' },
        { key: 'expiryDate', header: 'تاريخ الانتهاء' },
        { key: 'numCommRegister', header: 'رقم السجل التجاري' },
        { key: 'activites', header: 'الأنشطة' },
        { 
          key: 'employeeId', 
          header: 'اسم الموظف',
          getValue: (item) => getEmployeeName(item.employeeId || item.empId, item)
        }
      ]
    },
    electronicBill: {
      title: "تقرير الفواتير الإلكترونية",
      columns: [
        { key: ['clientName', 'companyName', 'name'], header: 'اسم العميل' },
        { key: 'email', header: 'البريد الإلكتروني' },
        { key: 'pass', header: 'كلمة المرور' },
        { key: 'token', header: 'التوكن' },
        { key: 'CreationDate', header: 'تاريخ التسجيل' },
        { 
          key: 'expiryDate', 
          header: 'تاريخ الانتهاء',
          getValue: (item) => {
            if (item.CreationDate) {
              const creationDate = new Date(item.CreationDate);
              const expiryDate = new Date(creationDate.getTime() + (15 * 24 * 60 * 60 * 1000));
              return expiryDate.toLocaleDateString('ar-EG');
            }
            return '';
          }
        },
        { 
          key: 'employeeId', 
          header: 'اسم الموظف',
          getValue: (item) => getEmployeeName(item.employeeId || item.empId, item)
        }
      ]
    },
    other: {
      title: "تقارير أخرى",
      columns: [
        { key: ['clientName', 'companyName', 'name'], header: 'اسم العميل' },
        { key: 'type', header: 'نوع المعاملة' },
        { key: 'CreationDate', header: 'تاريخ الإنشاء' },
        { 
          key: 'employeeId', 
          header: 'اسم الموظف',
          getValue: (item) => getEmployeeName(item.employeeId || item.empId, item)
        }
      ]
    },
    tasks: {
      title: "تقرير المهام",
      columns: [
        { 
          key: ['clientName', 'companyName', 'name'], 
          header: 'اسم العميل'
        },
        { 
          key: 'type', 
          header: 'نوع المهمة',
          getValue: (item) => {
            const type = item.formType || item.type;
            if (!type) return '-';
            
            switch(type.toLowerCase()) {
              case 'vat':
                return 'ضريبة القيمة المضافة';
              case 'commercial_register':
                return 'السجل التجاري';
              case 'public_tax':
                return 'الضرائب العامة';
              case 'electronic_bill':
                return 'الفواتير الإلكترونية';
              default:
                return type;
            }
          }
        },
        { 
          key: 'employeeId', 
          header: 'الموظف',
          getValue: (item) => getEmployeeName(item.employeeId || item.empId, item)
        },
        { 
          key: 'status', 
          header: 'الحالة',
          getValue: (item) => {
            // التحقق من تاريخ الانتهاء أولاً
            if (item.expiryDate) {
              const today = new Date();
              const expiryDate = new Date(item.expiryDate);
              
              // إذا كان تاريخ الانتهاء قد مر
              if (today > expiryDate) {
                return 'منتهي';
              }
            }

            // إذا لم يكن منتهياً، نتحقق من الحالة العادية
            const status = item.status?.toUpperCase();
            switch(status) {
              case 'COMPLETED':
                return 'مكتمل';
              case 'PENDING':
                return 'قيد التنفيذ';
              case 'CANCELLED':
                return 'ملغي';
              case 'EXPIRED':
                return 'منتهية';
              default:
                return status || '-';
            }
          }
        }
      ]
    },
    employeeTasks: {
      title: "تقرير مهام الموظف",
      columns: [
        { 
          key: 'type', 
          header: 'نوع المهمة',
          getValue: (item) => {
            const type = item.formType || item.type;
            if (!type) return '-';
            
            switch(type.toLowerCase()) {
              case 'vat':
                return 'ض.ق.م';
              case 'commercial_register':
                return 'السجل التجاري';
              case 'public_tax':
                return 'ض.ع';
              case 'electronic_bill':
                return 'ف.ك';
              default:
                return type;
            }
          }
        },
        { 
          key: 'createdAt', 
          header: 'تاريخ الإنشاء',
          getValue: (item) => {
            return item.createdAt ? 
              new Date(item.createdAt).toLocaleDateString('ar-EG') : 
              '-';
          }
        },
        { 
          key: 'deliveryDate', 
          header: 'تاريخ التسليم',
          getValue: (item) => {
            const deliveryDate = getDeliveryDateFromTask(item.id);
            return deliveryDate ? 
              new Date(deliveryDate).toLocaleDateString('ar-EG') : 
              '-';
          }
        },
        { 
          key: 'status', 
          header: 'الحالة',
          getValue: (item) => getTaskStatus(item).text
        }
      ]
    },
    dailyTasks: {
      title: "تقارير اليوم",
      columns: [
        { 
          key: ['clientName', 'companyName', 'name'], 
          header: 'اسم العميل',
          getValue: (item) => {
            let clientName = '';
            for (const k of ['clientName', 'companyName', 'name']) {
              if (item[k]) {
                clientName = item[k];
                break;
              }
            }
            if (!clientName && item.compId) {
              clientName = getCompanyName(item.compId);
            }
            return clientName || '-';
          }
        },
        { 
          key: 'type', 
          header: 'نوع المهمة',
          getValue: (item) => {
            const type = item.formType || item.type;
            if (!type) return '-';
            
            switch(type.toLowerCase()) {
              case 'vat':
                return 'ضريبة القيمة المضافة';
              case 'commercial_register':
                return 'السجل التجاري';
              case 'public_tax':
                return 'الضرائب العامة';
              case 'electronic_bill':
                return 'الفواتير الإلكترونية';
              case 'other':
                return item.otherType || type;
              default:
                return type;
            }
          }
        },
        {
          key: 'phone',
          header: 'رقم الهاتف',
          getValue: (item) => {
            try {
              // محاولة الحصول على رقم الهاتف من الشركة
              if (item.compId) {
                const company = companies.find(c => c.id === item.compId);
                if (company?.phoneNumber) return company.phoneNumber;
                if (company?.phone) return company.phone;
              }
              
              // محاولة الحصول على رقم الهاتف من العميل نفسه
              if (item.phoneNumber) return item.phoneNumber;
              if (item.phone) return item.phone;
              
              // محاولة الحصول على رقم الهاتف من الشركة باستخدام companyId
              if (item.companyId) {
                const company = companies.find(c => c.id === item.companyId);
                if (company?.phoneNumber) return company.phoneNumber;
                if (company?.phone) return company.phone;
              }
              
              return '-';
            } catch (error) {
              console.error('Error getting phone number:', error);
              return '-';
            }
          }
        },
        { 
          key: 'employeeId', 
          header: 'الموظف',
          getValue: (item) => getEmployeeName(item.employeeId || item.empId, item)
        }
      ]
    },
    companyDetails: {
      title: "تفاصيل معاملات الشركة",
      columns: [
        { 
          key: ['clientName', 'companyName', 'name'], 
          header: 'اسم العميل'
        },
        { 
          key: 'officeLocation', 
          header: 'المأمورية'
        },
        { 
          key: 'CreationDate', 
          header: 'بداية الشهادة',
          getValue: (item) => {
            return item.CreationDate ? 
              new Date(item.CreationDate).toLocaleDateString('ar-EG') : 
              '-';
          }
        },
        { 
          key: 'expiryDate', 
          header: 'نهاية الشهادة',
          getValue: (item) => {
            return item.expiryDate ? 
              new Date(item.expiryDate).toLocaleDateString('ar-EG') : 
              '-';
          }
        },
        { 
          key: 'email', 
          header: 'البريد الإلكتروني'
        },
        { 
          key: 'pass', 
          header: 'كلمة المرور'
        },
        { 
          key: 'employeeId', 
          header: 'اسم الموظف',
          getValue: (item) => getEmployeeName(item.employeeId || item.empId, item)
        }
      ]
    }
  };

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
    if (!compId) return '-';
    const company = companies.find((c) => c.id === compId);
    return company ? company.name : '-';
  };

  // تحديث دالة getEmployeeName للتعامل مع القيم غير المعرفة
  const getEmployeeName = (id, item = {}) => {
    try {
      // التحقق من الموظف الأصلي أولاً
      const originalEmployeeId = item?.createdBy || item?.firstEmployeeId || item?.originalEmployeeId;
      const employeeId = originalEmployeeId || id;
      
      if (!employeeId) return 'غير معروف';
      
      const stringId = String(employeeId);
      const employee = employees.find(emp => String(emp.id) === stringId);
      return employee ? employee.name : 'غير معروف';
    } catch (error) {
      console.error('Error in getEmployeeName:', error);
      return 'غير معروف';
    }
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

  // إضافة دالة للحصول على تاريخ التسليم من المعاملة المرتبطة
  const getDeliveryDateFromTask = (taskId) => {
    const allForms = [...vats, ...publicTaxes, ...commercialRegisters, ...electronicBills, ...others];
    const relatedForm = allForms.find(form => form.taskId === taskId);
    return relatedForm ? relatedForm.createdAt : null;
  };

  // ── Export functions for raw records ──
  const prepareRecordDataForExport = (items, recordType) => {
    const mapping = reportTypes[recordType];
    if (!mapping) return items;

    return items.map(item => {
      const newObj = {};
      mapping.columns.forEach(({ key, header, getValue }) => {
        let value = '';

        switch (header) {
          case 'اسم العميل':
            if (Array.isArray(key)) {
              for (const k of key) {
                if (item[k]) {
                  value = item[k];
                  break;
                }
              }
            }
            if (!value && item.compId) {
              value = getCompanyName(item.compId);
            }
            break;

          case 'اسم الموظف':
            value = getValue ? getValue(item) : getEmployeeName(item.employeeId || item.empId, item);
            break;

          case 'تاريخ التسجيل':
          case 'تاريخ الإنشاء':
          case 'تاريخ التأسيس':
          case 'بداية الشهادة':
          case 'نهاية الشهادة':
          case 'تاريخ الانتهاء':
            if (getValue) {
              value = getValue(item);
            } else if (item[key]) {
              value = new Date(item[key]).toLocaleDateString('ar-EG');
            }
            break;

          case 'نوع المهمة':
            if (getValue) {
              value = getValue(item);
            } else {
              const type = item.formType || item.type;
              if (type) {
                switch(type.toLowerCase()) {
                  case 'vat':
                    value = 'ضريبة القيمة المضافة';
                    break;
                  case 'commercial_register':
                    value = 'السجل التجاري';
                    break;
                  case 'public_tax':
                    value = 'الضرائب العامة';
                    break;
                  case 'electronic_bill':
                    value = 'الفواتير الإلكترونية';
                    break;
                  default:
                    value = type;
                }
              }
            }
            break;

          default:
            if (getValue) {
              value = getValue(item);
            } else if (Array.isArray(key)) {
              value = key.map(k => item[k]).find(v => v);
            } else {
              value = item[key];
            }
        }

        newObj[header] = value || '-';
      });
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

    // تصفية حسب الموقع
    if (selectedLocation) {
      filteredData = {
        vat: filteredData.vat.filter((v) => v.officeLocation === selectedLocation),
        publicTax: filteredData.publicTax.filter((pt) => pt.officeLocation === selectedLocation),
        commercialReg: filteredData.commercialReg.filter((cr) => cr.location === selectedLocation),
        electronicBill: [],
        other: filteredData.other.filter((o) => o.location === selectedLocation),
      };
    }

    // تصفية حسب العميل
    if (selectedCompany) {
      const filterByCompany = (item) => {
        // البحث عن اسم العميل في جميع الحقول المحتملة
        const clientNames = [
          item.clientName,
          item.companyName,
          item.name,
          getCompanyName(item.compId),
          getCompanyName(item.companyId)
        ].filter(Boolean).map(name => name.trim().toLowerCase());

        const searchName = selectedCompany.trim().toLowerCase();
        return clientNames.some(name => name === searchName);
      };

      filteredData = {
        vat: filteredData.vat.filter(filterByCompany),
        publicTax: filteredData.publicTax.filter(filterByCompany),
        commercialReg: filteredData.commercialReg.filter(filterByCompany),
        electronicBill: filteredData.electronicBill.filter(filterByCompany),
        other: filteredData.other.filter(filterByCompany),
      };
    }

    // تصفية حسب التاريخ
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

  // تحديث دالة تصدير تقارير اليوم
  const handleExportDailyTasks = (tasks, type) => {
    if (!tasks || tasks.length === 0) return;

    let fileName;
    switch(type) {
      case 'created':
        fileName = 'المهام_المنشأة_اليوم';
        break;
      case 'ending':
        fileName = 'المهام_المنتهية_اليوم';
        break;
      case 'endingMonth':
        fileName = 'المهام_المنتهية_هذا_الشهر';
        break;
      default:
        fileName = 'تقارير_اليوم';
    }

    exportToExcel(tasks, fileName, 'dailyTasks');
  };

  // تحديث دالة exportToExcel
  const exportToExcel = (data, fileName, reportType = 'tasks') => {
    try {
      let preparedData;
      
      if (reportType === 'dailyTasks') {
        preparedData = prepareRecordDataForExport(data, 'dailyTasks');
      } else if (reportType === 'pendingTasks') {
        preparedData = prepareRecordDataForExport(data, 'pendingTasks');
      } else if (reportType === 'employeeTasks') {
        preparedData = prepareRecordDataForExport(data, 'employeeTasks');
      } else {
        preparedData = prepareRecordDataForExport(data, reportType);
      }

      const worksheet = XLSX.utils.json_to_sheet(preparedData);

      // تعيين عرض الأعمدة حسب نوع التقرير
      let wscols;
      if (reportType === 'dailyTasks') {
        wscols = [
          { wch: 20 }, // اسم العميل
          { wch: 20 }, // نوع المهمة
          { wch: 15 }  // اسم الموظف
        ];
      } else {
        wscols = [
          { wch: 20 }, // عمود 1
          { wch: 15 }, // عمود 2
          { wch: 15 }, // عمود 3
          { wch: 15 }, // عمود 4
          { wch: 15 }  // عمود 5
        ];
      }
      worksheet['!cols'] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");

      const currentDate = new Date()
        .toLocaleDateString("ar-EG")
        .replace(/\//g, "-");

      XLSX.writeFile(workbook, `${fileName}_${currentDate}.xlsx`);
    } catch (error) {
      console.error('Error in exportToExcel:', error);
      alert('حدث خطأ أثناء التصدير');
    }
  };

  // تحديث استدعاء دالة التصدير في الأزرار
  const handleExportEmployeeTasks = () => {
    if (selectedEmployee && tasks?.data) {
      const employeeTasks = tasks.data.filter(
        task => String(task.employeeId) === String(selectedEmployee) && 
        task.status?.toUpperCase() === 'COMPLETED'
      );
      exportToExcel(employeeTasks, `تقرير_مهام_الموظف`, 'employeeTasks');
    }
  };

  // تحديث دالة getFormType
  const getFormType = (item) => {
    // التحقق من نوع المعاملة من خلال مصدر البيانات
    if (vats.some(v => v.id === item.id)) return 'ضريبة القيمة المضافة';
    if (publicTaxes.some(p => p.id === item.id)) return 'الضرائب العامة';
    if (commercialRegisters.some(c => c.id === item.id)) return 'السجل التجاري';
    if (electronicBills.some(e => e.id === item.id)) return 'الفواتير الإلكترونية';
    if (others.some(o => o.id === item.id)) return item.type || 'أخرى';

    // التحقق من الخصائص المباشرة
    if (item.formType) {
      switch(item.formType) {
        case 'vat': return 'ضريبة القيمة المضافة';
        case 'publicTax': return 'الضرائب العامة';
        case 'commercialReg': return 'السجل التجاري';
        case 'electronicBill': return 'الفواتير الإلكترونية';
        default: return item.formType;
      }
    }
    
    if (item.type) {
      switch(item.type) {
        case 'vat': return 'ضريبة القيمة المضافة';
        case 'publicTax': return 'الضرائب العامة';
        case 'commercialReg': return 'السجل التجاري';
        case 'electronicBill': return 'الفواتير الإلكترونية';
        default: return item.type;
      }
    }

    if (item.category) return item.category;
    
    // إذا لم يتم العثور على نوع
    console.log('Item without type:', item); // للتصحيح
    return '-';
  };

  const ReportTable = ({ type, data }) => {
    const reportConfig = reportTypes[type];
    const headers = reportConfig.columns.map(col => col.header);
    
    const preparedData = data.map(item => {
      const newObj = {};
      reportConfig.columns.forEach(({ key, header }) => {
        let value = '';
        
        switch (header) {
          case 'اسم العميل':
            if (Array.isArray(key)) {
              for (const k of key) {
                if (item[k]) {
                  value = item[k];
                  break;
                }
              }
            }
            if (!value && item.compId) {
              value = getCompanyName(item.compId);
            }
            break;

          case 'ق. الشركة':
            value = item.qcomp || '-';
            break;

          case 'اسم الموظف':
            // تمرير كامل الـ item للحصول على معلومات الموظف الأصلي
            value = getEmployeeName(item.empId || item.employeeId, item);
            if (value === 'Unknown Employee') {
              value = 'غير معروف';
            }
            break;

          default:
            if (key.includes('Date') || key.includes('expiry')) {
              value = item[key] ? new Date(item[key]).toLocaleDateString('ar-EG') : '';
            } else if (Array.isArray(key)) {
              value = key.map(k => item[k]).find(v => v);
            } else {
              value = item[key];
            }
        }

        newObj[header] = value || '-';
      });
      return newObj;
    });

    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{reportConfig.title}</h2>
          <button
            onClick={() => exportRecordsToExcel(data, reportConfig.title, type)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            تصدير إلى Excel
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((header, idx) => (
                  <th key={idx} className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {preparedData.map((row, idx) => (
                <tr key={idx}>
                  {headers.map((header, colIdx) => (
                    <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row[header]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const [selectedCompany, setSelectedCompany] = useState('');

  // تحديث دالة getUniqueCompanies للحصول على قائمة دقيقة من العملاء
  const getUniqueCompanies = () => {
    const uniqueCompanies = new Set();

    // جمع أسماء العملاء من جميع المصادر
    const addCompanyNames = (items) => {
      items.forEach(item => {
        const names = [
          item.clientName,
          item.companyName,
          item.name,
          getCompanyName(item.compId),
          getCompanyName(item.companyId)
        ].filter(Boolean);
        
        names.forEach(name => {
          if (name && typeof name === 'string' && name.trim()) {
            uniqueCompanies.add(name.trim());
          }
        });
      });
    };

    // إضافة الأسماء من جميع المصادر
    addCompanyNames(vats);
    addCompanyNames(publicTaxes);
    addCompanyNames(commercialRegisters);
    addCompanyNames(electronicBills);
    addCompanyNames(others);
    addCompanyNames(companies);

    return Array.from(uniqueCompanies).sort();
  };

  // تحديث دالة لتحديد حالة المهمة
  const getTaskStatus = (task) => {
    if (!task) return { text: 'قيد التنفيذ', class: 'bg-yellow-100 text-yellow-800' };

    // التحقق من حالة PENDING
    if (task.status && task.status.toUpperCase() === 'PENDING') {
      return { text: 'قيد التنفيذ', class: 'bg-yellow-100 text-yellow-800' };
    }

    // التحقق من تاريخ الانتهاء
    if (task.expiryDate) {
      const today = new Date();
      const expiryDate = new Date(task.expiryDate);
      
      if (expiryDate <= today) {
        return { text: 'منتهية', class: 'bg-red-100 text-red-800' };
      } else {
        return { text: 'مكتملة', class: 'bg-green-100 text-green-800' };
      }
    }

    // التحقق من حالات الإكمال الأخرى
    if (task.status) {
      const status = task.status.toLowerCase();
      if (['completed', 'done', 'finish', 'finished'].includes(status)) {
        return { text: 'مكتملة', class: 'bg-green-100 text-green-800' };
      }
    }

    if (task.completed || task.isCompleted) {
      return { text: 'مكتملة', class: 'bg-green-100 text-green-800' };
    }

    return { text: 'قيد التنفيذ', class: 'bg-yellow-100 text-yellow-800' };
  };

  // تحديث دالة للحصول على مهام الشركة المحددة
  const getCompanyTasks = () => {
    if (!selectedCompany) return [];

    // البحث عن معرف الشركة
    const company = companies.find(c => c.name.trim() === selectedCompany.trim());
    const companyId = company?.id;

    if (!companyId) return [];

    console.log('Selected Company:', selectedCompany);
    console.log('Company ID:', companyId);

    // جمع المعاملات من كل الجداول للشركة المحددة
    const companyForms = [
      ...vats
        .filter(v => String(v.compId || v.companyId) === String(companyId))
        .map(v => ({ ...v, formType: 'ض.ق.م', source: 'vat' })),
      
      ...publicTaxes
        .filter(p => String(p.compId || p.companyId) === String(companyId))
        .map(p => ({ ...p, formType: 'ض.ع', source: 'publicTax' })),
      
      ...commercialRegisters
        .filter(c => String(c.compId || c.companyId) === String(companyId))
        .map(c => ({ ...c, formType: 'السجل التجاري', source: 'commercialReg' })),
      
      ...electronicBills
        .filter(e => String(e.compId || e.companyId) === String(companyId))
        .map(e => ({ ...e, formType: 'الفواتير الإلكترونية', source: 'electronicBill' })),
      
      ...others
        .filter(o => String(o.compId || o.companyId) === String(companyId))
        .map(o => ({ ...o, formType: o.type || 'أخرى', source: 'other' }))
    ];

    console.log('Company Forms:', companyForms);

    // جمع المهام المعلقة للشركة
    const pendingTasks = tasks.data.filter(task => {
      const taskCompanyId = String(task.compId || task.companyId);
      const isMatch = taskCompanyId === String(companyId);
      const isPending = task.status?.toUpperCase() === 'PENDING';
      
      console.log('Checking Task:', {
        taskId: task.id,
        taskCompanyId,
        targetCompanyId: companyId,
        status: task.status,
        isMatch,
        isPending
      });
      
      return isMatch && isPending;
    });

    console.log('Pending Tasks:', pendingTasks);

    // دمج المعاملات والمهام المعلقة
    const allTasks = [
      // المعاملات مع مهامها
      ...companyForms.map(form => {
        const task = tasks.data.find(t => String(t.id) === String(form.taskId));
        return {
          ...form,
          ...task,
          formType: form.formType,
          createdAt: form.createdAt || task?.createdAt,
          expiryDate: form.expiryDate || task?.expiryDate,
          employeeId: form.employeeId || form.empId || task?.employeeId || task?.empId,
          compId: companyId
        };
      }),
      
      // المهام المعلقة
      ...pendingTasks.map(task => ({
        ...task,
        formType: task.type || 'مهمة معلقة',
        compId: companyId
      }))
    ];

    console.log('Final Tasks:', allTasks);
    return allTasks;
  };

  // قسم تقارير العملاء في الواجهة
  const ClientReportsSection = () => {
    const companyTasks = getCompanyTasks();
    console.log('Rendering with tasks:', companyTasks);

    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">اختر العميل</label>
          <select
            value={selectedCompany}
            onChange={(e) => {
              console.log('Selected new company:', e.target.value);
              setSelectedCompany(e.target.value);
            }}
            className="w-full p-2 border rounded"
          >
            <option value="">اختر عميل</option>
            {getUniqueCompanies().map((company, index) => (
              <option key={index} value={company}>{company}</option>
            ))}
          </select>
        </div>

        {selectedCompany && Array.isArray(companyTasks) && companyTasks.length > 0 ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">معاملات العميل</h3>
              <button
                onClick={() => exportToExcel(companyTasks, `معاملات_${selectedCompany}`)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                تصدير إلى Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">نوع المهمة</th>
                    <th className="px-4 py-2">تاريخ الإنشاء</th>
                    <th className="px-4 py-2">تاريخ الانتهاء</th>
                    <th className="px-4 py-2">الموظف المسؤول</th>
                    <th className="px-4 py-2">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {companyTasks.map((task, index) => {
                    const status = getTaskStatus(task);
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{task.formType}</td>
                        <td className="px-4 py-2">
                          {task.createdAt ? new Date(task.createdAt).toLocaleDateString('ar-EG') : '-'}
                        </td>
                        <td className="px-4 py-2">
                          {task.expiryDate ? new Date(task.expiryDate).toLocaleDateString('ar-EG') : '-'}
                        </td>
                        <td className="px-4 py-2">
                          {getEmployeeName(task.employeeId || task.empId, task)}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded ${status.class}`}>
                            {status.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : selectedCompany ? (
          <div className="text-center py-4 text-gray-500">
            لا توجد معاملات لهذا العميل
          </div>
        ) : null}
      </div>
    );
  };

  if (loading) {
    return <>جاري تحميل البيانات...</>;
  }

  const uniqueLocations = getUniqueLocations();
  const monthlyTasksReport = getMonthlyTasksReport();
  const employeeTasksReport = getEmployeeTasks();

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      {/* قسم التصفية */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">خيارات التصفية</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">الموقع</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">جميع المواقع</option>
              {getUniqueLocations().map((location, index) => (
                <option key={index} value={location}>{location}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">العميل</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">جميع العملاء</option>
              {getUniqueCompanies().map((company, index) => (
                <option key={index} value={company}>{company}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">نطاق التاريخ</label>
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

      {/* عرض التقارير الرئيسية */}
      {Object.entries(combinedFilter()).map(([type, data]) => (
        data.length > 0 && <ReportTable key={type} type={type} data={data} />
      ))}

      {/* تقارير اليوم */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">تقارير اليوم</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">تم إنشاؤها اليوم</h3>
            <p className="text-2xl font-bold">{createdToday.length}</p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">اسم العميل</th>
                    <th className="px-4 py-2">النوع</th>
                    <th className="px-4 py-2">الموظف</th>
                  </tr>
                </thead>
                <tbody>
                  {createdToday.map((item, index) => {
                    console.log('Processing item:', item); // للتصحيح
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {item.clientName || item.companyName || (item.compId && getCompanyName(item.compId)) || '-'}
                        </td>
                        <td className="px-4 py-2">{getFormType(item)}</td>
                        <td className="px-4 py-2">{getEmployeeName(item.empId || item.employeeId, item)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">تنتهي اليوم</h3>
            <p className="text-2xl font-bold">{endingToday.length}</p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">اسم العميل</th>
                    <th className="px-4 py-2">النوع</th>
                    <th className="px-4 py-2">الموظف</th>
                  </tr>
                </thead>
                <tbody>
                  {endingToday.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        {item.clientName || item.companyName || (item.compId && getCompanyName(item.compId)) || '-'}
                      </td>
                      <td className="px-4 py-2">{getFormType(item)}</td>
                      <td className="px-4 py-2">{getEmployeeName(item.empId || item.employeeId, item)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">تنتهي هذا الشهر</h3>
            <p className="text-2xl font-bold">{endingThisMonth.length}</p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">اسم العميل</th>
                    <th className="px-4 py-2">النوع</th>
                    <th className="px-4 py-2">الموظف</th>
                  </tr>
                </thead>
                <tbody>
                  {endingThisMonth.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        {item.clientName || item.companyName || (item.compId && getCompanyName(item.compId)) || '-'}
                      </td>
                      <td className="px-4 py-2">{getFormType(item)}</td>
                      <td className="px-4 py-2">{getEmployeeName(item.empId || item.employeeId, item)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* تقارير المهام */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">تقرير المهام الشهري</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">المهام المكتملة</h3>
            <p className="text-2xl font-bold">{monthlyTasksReport.completed.length}</p>
            <button
              onClick={() => exportToExcel(monthlyTasksReport.completed, 'المهام_المكتملة')}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              تصدير إلى Excel
            </button>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">نوع المهمة</th>
                    <th className="px-4 py-2">اسم الموظف</th>
                    <th className="px-4 py-2">تاريخ الإنشاء</th>
                    <th className="px-4 py-2">تاريخ التسليم</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyTasksReport.completed.map((task, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{task.type || '-'}</td>
                      <td className="px-4 py-2">{getEmployeeName(task.employeeId, task)}</td>
                      <td className="px-4 py-2">{new Date(task.createdAt).toLocaleDateString('ar-EG')}</td>
                      <td className="px-4 py-2">
                        {getDeliveryDateFromTask(task.id) ? 
                          new Date(getDeliveryDateFromTask(task.id)).toLocaleDateString('ar-EG') : 
                          '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">المهام قيد التنفيذ</h3>
            <p className="text-2xl font-bold">{monthlyTasksReport.pending.length}</p>
            <button
              onClick={() => exportToExcel(monthlyTasksReport.pending, 'المهام_قيد_التنفيذ')}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              تصدير إلى Excel
            </button>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">نوع المهمة</th>
                    <th className="px-4 py-2">اسم الموظف</th>
                    <th className="px-4 py-2">تاريخ الإنشاء</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyTasksReport.pending.map((task, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{task.type || '-'}</td>
                      <td className="px-4 py-2">{getEmployeeName(task.employeeId, task)}</td>
                      <td className="px-4 py-2">{new Date(task.createdAt).toLocaleDateString('ar-EG')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* تقرير مهام الموظف */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">تقرير مهام الموظف</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">اختر الموظف</label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">اختر موظف</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
        {selectedEmployee && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">المهام المكتملة</h3>
              <p className="text-2xl font-bold">{employeeTasksReport.completed.length}</p>
              <button
                onClick={handleExportEmployeeTasks}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                تصدير إلى Excel
              </button>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2">نوع المهمة</th>
                      <th className="px-4 py-2">تاريخ الإنشاء</th>
                      <th className="px-4 py-2">تاريخ التسليم</th>
                      <th className="px-4 py-2">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeTasksReport.completed.map((task, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{task.type || '-'}</td>
                        <td className="px-4 py-2">{new Date(task.createdAt).toLocaleDateString('ar-EG')}</td>
                        <td className="px-4 py-2">
                          {getDeliveryDateFromTask(task.id) ? 
                            new Date(getDeliveryDateFromTask(task.id)).toLocaleDateString('ar-EG') : 
                            '-'}
                        </td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">مكتملة</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">المهام قيد التنفيذ</h3>
              <p className="text-2xl font-bold">{employeeTasksReport.pending.length}</p>
              <button
                onClick={() => exportToExcel(employeeTasksReport.pending, `مهام_${getEmployeeName(selectedEmployee)}_قيد_التنفيذ`)}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                تصدير إلى Excel
              </button>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2">نوع المهمة</th>
                      <th className="px-4 py-2">تاريخ الإنشاء</th>
                      <th className="px-4 py-2">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeTasksReport.pending.map((task, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{task.type || '-'}</td>
                        <td className="px-4 py-2">{new Date(task.createdAt).toLocaleDateString('ar-EG')}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">قيد التنفيذ</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* تقارير العملاء */}
      <ClientReportsSection />
    </div>
  );
};

export default ReportsDashboard;
