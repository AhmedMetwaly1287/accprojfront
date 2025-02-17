import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    phonenum: '',
    email: '',
    username: '',
    password: '',
    role_id: 1,
  });
  const [error, setError] = useState('');

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Fetch tasks when employees are loaded
  useEffect(() => {
    if (employees.length > 0) {
      fetchTasks();
    }
  }, [employees]);

  // Fetch employees from the API
  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://145.223.96.50:3002/api/v1/employees');
      if (Array.isArray(response.data.data)) {
        setEmployees(response.data.data);
      } else {
        console.error('Expected an array but got:', response.data);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  // Fetch tasks and associated form data
  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://145.223.96.50:3002/api/v1/tasks');
      if (response.data && Array.isArray(response.data.data)) {
        // Sort tasks by createdAt descending
        const sortedTasks = response.data.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        const tasksWithDetails = await Promise.all(
          sortedTasks.map(async (task) => {
            const employee = employees.find((emp) => emp.id === task.employeeId);
            let formData = null;

            try {
              // Define the mapping between task type and API endpoint
              const endpointMap = {
                vat: 'vat',
                publictax: 'public-tax',
                electronicbill: 'electronic-bills',
                commercialregister: 'commercial-registers',
              };

              if (endpointMap[task.type]) {
                const formResponse = await axios.get(
                  `http://145.223.96.50:3002/api/v1/${endpointMap[task.type]}`,
                  {
                    params: {
                      empId: task.employeeId,
                      compId: task.companyId,
                      taskId: task.taskId, // Include taskId in the request
                    },
                  }
                );
                // Check if the API response wraps the data in a nested property
                formData = formResponse.data.data
                  ? formResponse.data.data
                  : formResponse.data;

                // Debug log to verify formData
                console.log(`Task ID ${task.id} formData:`, formData);
              }
            } catch (error) {
              console.error('Error fetching form data for Task ID:', task.id, error);
            }

            // Determine form creation date and duration
            let duration = null;
            let formCreationDate = null;
            if (formData) {
              if (Array.isArray(formData)) {
                if (formData.length > 0) {
                  formCreationDate = formData[0].createdAt;
                }
              } else if (formData.createdAt) {
                formCreationDate = formData.createdAt;
              }
            }
            if (task.createdAt && formCreationDate) {
              const taskCreatedAt = new Date(task.createdAt);
              const formCreatedAt = new Date(formCreationDate);
              duration = Math.abs((formCreatedAt - taskCreatedAt) / 1000 / 60).toFixed(2) + ' دقائق';
            }

            return {
              ...task,
              employeeName: employee ? employee.name : 'غير معروف',
              displayType:
                task.type === 'vat'
                  ? 'ض.ق.م'
                  : task.type === 'publictax'
                  ? 'ضريبة عامة'
                  : task.type === 'electronicbill'
                  ? 'فاتورة إلكترونية'
                  : task.type === 'commercialregister'
                  ? 'سجل تجاري'
                  : task.type,
              formData,         // The raw form data
              formCreationDate, // The form's createdAt timestamp (if available)
              duration,         // The calculated duration in minutes
            };
          })
        );

        setTasks(tasksWithDetails);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    }
  };

  // Handle adding a new employee
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (
      !newEmployee.name ||
      !newEmployee.phonenum ||
      !newEmployee.email ||
      !newEmployee.username ||
      !newEmployee.password
    ) {
      setError('يرجى ملء جميع الحقول');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmployee.email)) {
      setError('البريد الإلكتروني غير صحيح');
      return;
    }

    try {
      await axios.post('http://145.223.96.50:3002/api/v1/employees', newEmployee);
      fetchEmployees();
      setShowAddEmployee(false);
      setNewEmployee({
        name: '',
        phonenum: '',
        email: '',
        username: '',
        password: '',
        role_id: 1,
      });
    } catch (error) {
      console.error('Error adding employee:', error);
      setError(error.response?.data?.message || 'حدث خطأ غير متوقع');
    }
  };

  // Handle removing an employee
  const handleRemoveEmployee = async (employeeId) => {
    try {
      await axios.delete(`http://145.223.96.50:3002/api/v1/employees/${employeeId}`);
      fetchEmployees();
    } catch (error) {
      console.error('Error removing employee:', error);
    }
  };

  // Format date in a readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'غير متوفر';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'تنسيق غير صالح';
    }
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Employee Management Section */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">إدارة الموظفين</h2>
          <button
            onClick={() => setShowAddEmployee(!showAddEmployee)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
          >
            {showAddEmployee ? 'إلغاء' : 'إضافة موظف'}
          </button>
        </div>

        {showAddEmployee && (
          <form onSubmit={handleAddEmployee} className="space-y-4 mb-6">
            {error && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                role="alert"
              >
                {error}
              </div>
            )}

            <input
              type="text"
              placeholder="الاسم الكامل"
              className="w-full p-2 border rounded focus:outline-none focus:border-blue-500 text-right"
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
              required
            />
            <input
              type="tel"
              placeholder="رقم الجوال"
              className="w-full p-2 border rounded focus:outline-none focus:border-blue-500 text-right"
              value={newEmployee.phonenum}
              onChange={(e) => setNewEmployee({ ...newEmployee, phonenum: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              className="w-full p-2 border rounded focus:outline-none focus:border-blue-500 text-right"
              value={newEmployee.email}
              onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="اسم المستخدم"
              className="w-full p-2 border rounded focus:outline-none focus:border-blue-500 text-right"
              value={newEmployee.username}
              onChange={(e) => setNewEmployee({ ...newEmployee, username: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="كلمة المرور"
              className="w-full p-2 border rounded focus:outline-none focus:border-blue-500 text-right"
              value={newEmployee.password}
              onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
              required
            />
            <select
              className="w-full p-2 border rounded focus:outline-none focus:border-blue-500 text-right"
              value={newEmployee.role_id}
              onChange={(e) =>
                setNewEmployee({ ...newEmployee, role_id: parseInt(e.target.value) })
              }
              required
            >
              <option value="1">مسئول</option>
              <option value="2">موظف</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none"
            >
              إضافة الموظف
            </button>
          </form>
        )}

        {/* Employee List */}
        <div className="grid gap-4">
          {employees.map((employee) => (
            <div key={employee.id} className="flex items-center justify-between p-4 border rounded">
              <div>
                <h3 className="font-semibold">{employee.name}</h3>
                <p className="text-sm text-gray-600">الهوية: {employee.id}</p>
                <p className="text-sm text-gray-600">الجوال: {employee.phonenum}</p>
                <p className="text-sm text-gray-600">البريد الإلكتروني: {employee.email}</p>
                <p className="text-sm text-gray-600">
                  الدور: {employee.role_id === 1 ? 'مسئول' : 'موظف'}
                </p>
              </div>
              <button
                onClick={() => handleRemoveEmployee(employee.id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none"
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Tasks Section */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">المهام الحديثة</h2>
        {tasks.length > 0 ? (
          <div className="grid gap-4">
            {tasks.map((task) => (
              <div key={task.id} className="p-4 border rounded">
                <h3 className="font-semibold">{task.displayType}</h3>
                <p className="text-sm text-gray-600">المسؤول: {task.employeeName}</p>
                <p className="text-sm text-gray-600">
                  الحالة: {task.status || 'غير محدد'}
                </p>
                <p className="text-sm text-gray-600">
                  تاريخ إنشاء المهمة: {formatDate(task.createdAt)}
                </p>
                {/* Display form data if available */}
                {task.formData &&
                  ((Array.isArray(task.formData) && task.formData.length > 0) ||
                    (!Array.isArray(task.formData) && task.formData.createdAt)) && (
                    <>
                      <p className="text-sm text-gray-600">
                        تاريخ إنشاء النموذج: {formatDate(task.formCreationDate)}
                      </p>
                      <p className="text-sm text-gray-600">
                        المدة المستغرقة: {task.duration}
                      </p>
                    </>
                  )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">لا توجد مهام حالياً</p>
        )}
      </div>
    </div>
  );
};

export default EmployeeManagement;
