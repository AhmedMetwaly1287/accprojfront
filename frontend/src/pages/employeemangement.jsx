import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RecentTasks from './recenttasks'; // Import the RecentTasks component

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    phonenum: '',
    email: '',
    username: '',
    password: '',
    role_id: 1,
  });
  const [editEmployee, setEditEmployee] = useState({
    id: null,
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

  // Handle adding a new employee
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setError('');

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

  // Handle edit employee button click
  const handleEditClick = (employee) => {
    setSelectedEmployee(employee);
    setEditEmployee({
      id: employee.id,
      name: employee.name,
      phonenum: employee.phonenum,
      email: employee.email,
      username: employee.username,
      password: '', // Clear password field for security
      role_id: employee.role_id,
    });
    setShowEditEmployee(true);
    setShowAddEmployee(false); // Close add form if open
  };

  // Handle updating an employee
  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    setError('');

    if (
      !editEmployee.name ||
      !editEmployee.phonenum ||
      !editEmployee.email ||
      !editEmployee.username
    ) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmployee.email)) {
      setError('البريد الإلكتروني غير صحيح');
      return;
    }

    try {
      const updatePayload = { ...editEmployee };
      if (!updatePayload.password) {
        delete updatePayload.password;
      }

      await axios.put(`http://145.223.96.50:3002/api/v1/employees/${editEmployee.id}`, updatePayload);
      fetchEmployees();
      setShowEditEmployee(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error('Error updating employee:', error);
      setError(error.response?.data?.message || 'حدث خطأ غير متوقع');
    }
  };

  // Handle removing an employee
  const handleRemoveEmployee = async (employeeId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      try {
        await axios.delete(`http://145.223.96.50:3002/api/v1/employees/${employeeId}`);
        fetchEmployees();
      } catch (error) {
        console.error('Error removing employee:', error);
        setError('فشل في حذف الموظف. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Employee Management Section */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">إدارة الموظفين</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowAddEmployee(!showAddEmployee);
                setShowEditEmployee(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
            >
              {showAddEmployee ? 'إلغاء' : 'إضافة موظف'}
            </button>
            <button
              onClick={() => fetchEmployees()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none"
            >
              تحديث
            </button>
          </div>
        </div>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            {error}
            <button
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setError('')}
            >
              <span className="text-xl">&times;</span>
            </button>
          </div>
        )}

        {/* Add Employee Form */}
{showAddEmployee && (
  <form onSubmit={handleAddEmployee} className="bg-gray-50 p-4 rounded-lg mb-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-gray-700 mb-2">الاسم</label>
        <input
          type="text"
          value={newEmployee.name}
          onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-2">رقم الهاتف</label>
        <input
          type="text"
          value={newEmployee.phonenum}
          onChange={(e) => setNewEmployee({ ...newEmployee, phonenum: e.target.value })}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-2">البريد الإلكتروني</label>
        <input
          type="email"
          value={newEmployee.email}
          onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-2">اسم المستخدم</label>
        <input
          type="text"
          value={newEmployee.username}
          onChange={(e) => setNewEmployee({ ...newEmployee, username: e.target.value })}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-2">كلمة المرور</label>
        <input
          type="password"
          value={newEmployee.password}
          onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-2">الدور</label>
        <select
          value={newEmployee.role_id}
          onChange={(e) => setNewEmployee({ ...newEmployee, role_id: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={1}>مدير</option>
          <option value={2}>موظف</option>
        </select>
      </div>
    </div>
    <div className="flex justify-end">
      <button
        type="submit"
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none"
      >
        إضافة
      </button>
    </div>
  </form>
)}

{/* Edit Employee Form */}
{showEditEmployee && selectedEmployee && (
  <form onSubmit={handleUpdateEmployee} className="bg-gray-50 p-4 rounded-lg mb-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-gray-700 mb-2">الاسم</label>
        <input
          type="text"
          value={editEmployee.name}
          onChange={(e) => setEditEmployee({ ...editEmployee, name: e.target.value })}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-2">رقم الهاتف</label>
        <input
          type="text"
          value={editEmployee.phonenum}
          onChange={(e) => setEditEmployee({ ...editEmployee, phonenum: e.target.value })}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-2">البريد الإلكتروني</label>
        <input
          type="email"
          value={editEmployee.email}
          onChange={(e) => setEditEmployee({ ...editEmployee, email: e.target.value })}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-2">اسم المستخدم</label>
        <input
          type="text"
          value={editEmployee.username}
          onChange={(e) => setEditEmployee({ ...editEmployee, username: e.target.value })}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-2">كلمة المرور (اتركها فارغة للاحتفاظ بالحالية)</label>
        <input
          type="password"
          value={editEmployee.password}
          onChange={(e) => setEditEmployee({ ...editEmployee, password: e.target.value })}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-2">الدور</label>
        <select
          value={editEmployee.role_id}
          onChange={(e) => setEditEmployee({ ...editEmployee, role_id: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={1}>مدير</option>
          <option value={2}>موظف</option>
        </select>
      </div>
    </div>
    <div className="flex justify-end">
      <button
        type="button"
        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none mr-2"
        onClick={() => {
          setShowEditEmployee(false);
          setSelectedEmployee(null);
        }}
      >
        إلغاء
      </button>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
      >
        تحديث
      </button>
    </div>
  </form>
)}

{/* Employees Table */}
<div className="overflow-x-auto">
  <table className="min-w-full bg-white border rounded-lg">
    <thead>
      <tr className="bg-gray-100 border-b">
        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
          الاسم
        </th>
        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
          رقم الهاتف
        </th>
        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
          البريد الإلكتروني
        </th>
        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
          اسم المستخدم
        </th>
        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
          الدور
        </th>
        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
          الإجراءات
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {employees.length > 0 ? (
        employees.map((employee) => (
          <tr key={employee.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {employee.name}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {employee.phonenum}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {employee.email}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {employee.username}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {employee.role_id === 1 ? 'مدير' : 'موظف'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button
                onClick={() => handleEditClick(employee)}
                className="text-blue-600 hover:text-blue-900 ml-3"
              >
                تعديل
              </button>
              {employee.role_id === 2 && (
                <button
                  onClick={() => handleRemoveEmployee(employee.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  حذف
                </button>
              )}
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
            لا يوجد موظفين
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>

{/* Recent Tasks Section */}
<div className="mt-8">
  <RecentTasks 
    employees={employees.filter(employee => employee.role_id === 2)}
    reassignEmployees={employees.filter(employee => employee.role_id === 2)}
  />
</div>
</div>
</div>
  );
};

export default EmployeeManagement;