import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RecentTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [tasksLoading, setTasksLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [showReassignTask, setShowReassignTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [editFormType, setEditFormType] = useState('');
  const [editFormId, setEditFormId] = useState(null);

  const navigate = useNavigate();

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
    setEmployeesLoading(true);
    try {
      const response = await axios.get('http://145.223.96.50:3002/api/v1/employees');
      if (Array.isArray(response.data.data)) {
        // تصفية الموظفين للحصول فقط على من لديهم role_id يساوي 2
        const filteredEmployees = response.data.data.filter(emp => emp.role_id === 2);
        setEmployees(filteredEmployees);
      } else {
        console.error('Expected an array but got:', response.data);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('فشل في جلب بيانات الموظفين');
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  };
  

  // Fetch tasks and associated form data
  const fetchTasks = async () => {
    setTasksLoading(true);
    try {
      const response = await axios.get('http://145.223.96.50:3002/api/v1/tasks');
      if (response.data && Array.isArray(response.data.data)) {
        const sortedTasks = response.data.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        const tasksWithDetails = await Promise.all(
          sortedTasks.map(async (task) => {
            const employee = employees.find((emp) => emp.id === task.employeeId);
            let formData = null;

            try {
              const endpointMap = {
                vat: 'vat',
                publictax: 'public-tax',
                electronicbill: 'electronic-bills',
                commercialregister: 'commercial-registers',
                other: 'other',
              };

              if (endpointMap[task.type]) {
                const formResponse = await axios.get(
                  `http://145.223.96.50:3002/api/v1/${endpointMap[task.type]}/by-task/${task.taskId}`
                );
                formData = formResponse.data.data ? formResponse.data.data : formResponse.data;
              }
            } catch (error) {
              console.error('Error fetching form data for Task ID:', task.id, error);
            }

            let formCreationDate = null;
            let formId = null;
            if (formData) {
              if (Array.isArray(formData)) {
                if (formData.length > 0) {
                  formCreationDate = formData[0].createdAt;
                  formId = formData[0].id;
                }
              } else if (formData.createdAt) {
                formCreationDate = formData.createdAt;
                formId = formData.id;
              }
            }

            return {
              ...task,
              employeeName: employee ? employee.name : 'غير معروف',
              displayType:
                task.type === 'vat'
                  ? 'ض.ق.م'
                  : task.type === 'publictax'
                  ? 'ض.ع '
                  : task.type === 'electronicbill'
                  ? 'ف.ك '
                  : task.type === 'commercialregister'
                  ? 'السجل التجاري'
                  : task.type === 'other'
                  ? 'أخرى'
                  : task.type,
              formData,
              formCreationDate,
              formId,
            };
          })
        );

        setTasks(tasksWithDetails);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('فشل في جلب بيانات المهام');
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  // Handle task completion
  const handleCompleteTask = async (taskId) => {
    try {
      await axios.put(`http://145.223.96.50:3002/api/v1/tasks/${taskId}/complete`);
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      setError('فشل في إكمال المهمة');
    }
  };

  // Handle form update
  const handleUpdateForm = async (e) => {
    e.preventDefault();
    setError('');
  
    if (!editFormId || !editFormType || !editFormData) {
      setError('بيانات النموذج غير صالحة');
      return;
    }
  
    try {
      const endpointMap = {
        vat: 'vat',
        publictax: 'public-tax',
        electronicbill: 'electronic-bills',
        commercialregister: 'commercial-registers',
        other: 'other',
      };
  
      const endpoint = endpointMap[editFormType];
      if (!endpoint) {
        throw new Error(`نوع النموذج غير معروف: ${editFormType}`);
      }
  
      // تحويل الحقول الرقمية بشكل صريح
      const processNumericField = (value) => {
        if (typeof value === 'string') {
          // إزالة أي أحرف غير رقمية
          const cleanedValue = value.replace(/[^\d]/g, '');
          return cleanedValue ? parseInt(cleanedValue, 10) : 0;
        }
        return typeof value === 'number' ? value : 0;
      };
  
      // تجهيز البيانات للتحديث
      const prepareUpdateData = (data) => {
        // تحديد الحقول الرقمية
        const numericFields = new Set([
          'taxRegNo',
          'taxFileNo',
          'pass',
          'empId',
          'compId',
          'taskId'
        ]);
  
        const dateFields = new Set([
          'CreationDate',
          'expiryDate'
        ]);
  
        // تجهيز البيانات المحدثة
        const processed = {};
  
        // معالجة كل حقل
        for (const [key, value] of Object.entries(data)) {
          // تخطي الحقول الخاصة
          if (['id', 'createdAt', 'updatedAt', 'modifiedAt'].includes(key)) {
            continue;
          }
  
          // تخطي القيم الفارغة
          if (value === '' || value === null || value === undefined) {
            continue;
          }
  
          // معالجة الحقول الرقمية
          if (numericFields.has(key)) {
            const numericValue = processNumericField(value);
            console.log(`Converting ${key} from ${value} (${typeof value}) to ${numericValue} (${typeof numericValue})`);
            processed[key] = numericValue;
            continue;
          }
  
          // معالجة حقول التاريخ
          if (dateFields.has(key) && value) {
            processed[key] = new Date(value).toISOString();
            continue;
          }
  
          // الحقول العادية
          processed[key] = value;
        }
  
        console.log('Processed data:', processed);
        return processed;
      };
  
      // تجهيز وإرسال البيانات
      const updateData = prepareUpdateData(editFormData);
      console.log('Final update data:', updateData);
  
      // إرسال الطلب
      const response = await axios.put(
        `http://145.223.96.50:3002/api/v1/${endpoint}/${editFormId}`,
        updateData
      );
  
      console.log('Server response:', response.data);
  
      // إغلاق النموذج وتحديث المهام
      setShowEditForm(false);
      setEditFormData(null);
      setEditFormType('');
      setEditFormId(null);
      fetchTasks();
  
      alert('تم تحديث البيانات بنجاح');
    } catch (error) {
      console.error('Error updating form:', error);
      console.error('Error details:', error.response?.data);
      setError(error.response?.data?.message || 'حدث خطأ أثناء تحديث النموذج');
    }
  };

  // Handle task reassignment
  const handleReassignClick = (task) => {
    setSelectedTask(task);
    setSelectedEmployeeId(task.employeeId);
    setShowReassignTask(true);
  };

  const handleReassignTask = async () => {
    if (!selectedTask || !selectedEmployeeId) {
      setError('الرجاء اختيار موظف لإعادة التعيين');
      return;
    }

    try {
      await axios.put(`http://145.223.96.50:3002/api/v1/tasks/${selectedTask.id}`, {
        employeeId: selectedEmployeeId,
      });
      setShowReassignTask(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (error) {
      console.error('Error reassigning task:', error);
      setError(error.response?.data?.message || 'حدث خطأ أثناء إعادة تعيين المهمة');
    }
  };

  // Handle form edit click
  const handleEditFormClick = async (task) => {
    try {
      const endpointMap = {
        vat: 'vat',
        'ض.ق.م': 'vat',
        publictax: 'public-tax',
        'ض.ع': 'public-tax',
        electronicbill: 'electronic-bills',
        'ف.ك': 'electronic-bills',
        commercialregister: 'commercial-registers',
        'السجل التجاري': 'commercial-registers',
        other: 'other',
        'أخرى': 'other',
      };

      const taskId = task.taskId || task.id;

      if (!taskId) {
        console.error('Task ID is undefined:', task);
        setError('معرف المهمة غير موجود');
        return;
      }

      if (!task.type || !endpointMap[task.type]) {
        console.error('Unknown task type:', task.type);
        setError(`نوع المهمة غير معروف: ${task.type}`);
        return;
      }

      const formResponse = await axios.get(
        `http://145.223.96.50:3002/api/v1/${endpointMap[task.type]}/by-task/${taskId}`
      );

      let formData = formResponse.data.data ? formResponse.data.data : formResponse.data;

      if (Array.isArray(formData) && formData.length > 0) {
        formData = formData[0];
      }

      if (!formData || !formData.id) {
        setError('لا توجد بيانات نموذج متاحة للتحرير');
        return;
      }

      setEditFormData(formData);
      setEditFormType(task.type);
      setEditFormId(formData.id);
      setShowEditForm(true);
    } catch (error) {
      console.error('Error fetching form data for editing:', error);
      setError(`فشل في جلب بيانات النموذج: ${error.response?.data?.error || error.message}`);
    }
  };

  // Handle update redirect - modified to pass formId along with taskId
  const handleUpdateRedirect = async (task) => {
    try {
      // تعيين المسارات لجميع الأنواع المحتملة بما فيها الأسماء العربية
      const formRoute = {
        'vat': '/vat',
        'ض.ق.م': '/vat',
        'commercialregister': '/commercial-register',
        'السجل التجاري': '/commercial-register',
        'electronicbill': '/electronic-bill',
        'ف.ك': '/electronic-bill',
        'publictax': '/public-tax',
        'ض.ع': '/public-tax',
        'manifesto': '/manifesto',
        'other': '/other-form',
        'أخرى': '/other-form'
      }[task.type] || '/other-form';
  
      console.log('Task type:', task.type); // للتأكد من نوع المهمة
      console.log('Selected route:', formRoute); // للتأكد من المسار المختار
  
      const taskId = task.taskId || task.id;
      
      if (!taskId) {
        alert('معرف المهمة غير موجود');
        return;
      }
  
      const navigationState = {
        taskId: parseInt(taskId, 10),
        companyId: parseInt(task.companyId, 10),
        isUpdate: true,
        formId: parseInt(task.formId, 10)
      };
  
      console.log('Navigation state:', navigationState);
      navigate(formRoute, { state: navigationState });
    } catch (error) {
      console.error('Error in update redirect:', error);
      alert(`حدث خطأ أثناء التحديث: ${error.message}`);
    }
  };

  // Helper function to format date
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

  // Helper function to get task status badge color
  const getStatusBadgeColor = (status) => {
    if (!status) return 'bg-gray-200 text-gray-800';

    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to translate task status to Arabic
  const translateStatus = (status) => {
    if (!status) return 'غير محدد';

    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'مكتمل';
      case 'IN_PROGRESS':
        return 'قيد التنفيذ';
      case 'PENDING':
        return 'قيد الانتظار';
      default:
        return status;
    }
  };

  // Render form fields based on form type
  const renderFormFields = () => {
    if (!editFormData) return null;
  
    const updateFormField = (field, value) => {
      // تحويل الحقول المحددة إلى أرقام
      const numericFields = [
        'taxRegNo',
        'taxFileNo',
        'pass'
      ];
  
      const processedValue = numericFields.includes(field) 
        ? parseInt(value, 10) || 0  // تحويل إلى رقم مع قيمة افتراضية 0
        : value;
  
      setEditFormData({
        ...editFormData,
        [field]: processedValue,
      });
    };
  
    return (
      <div className="space-y-4">
        {Object.entries(editFormData).map(([key, value]) => {
          if (['id', 'createdAt', 'updatedAt'].includes(key)) {
            return null;
          }
  
          // تحديد نوع الإدخال بناءً على اسم الحقل
          const inputType = ['taxRegNo', 'taxFileNo', 'pass'].includes(key)
            ? 'number'
            : typeof value === 'number' 
            ? 'number' 
            : 'text';
  
          return (
            <div key={key} className="flex flex-col">
              <label className="mb-1 font-medium text-gray-700">
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              </label>
              {typeof value === 'boolean' ? (
                <select
                  className="p-2 border rounded"
                  value={value ? 'true' : 'false'}
                  onChange={(e) => updateFormField(key, e.target.value === 'true')}
                >
                  <option value="true">نعم</option>
                  <option value="false">لا</option>
                </select>
              ) : (
                <input
                  type={inputType}
                  className="p-2 border rounded"
                  value={value || ''}
                  onChange={(e) => updateFormField(key, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">المهام الحديثة</h2>
        <button
          onClick={fetchTasks}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
        >
          تحديث المهام
        </button>
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

      {/* Task Reassignment Modal */}
      {showReassignTask && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="font-bold text-lg mb-4">تغيير المسؤول عن المهمة</h3>
            <p className="mb-4">نوع المهمة: {selectedTask.displayType}</p>
            <p className="mb-4">المسؤول الحالي: {selectedTask.employeeName}</p>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">اختر الموظف الجديد:</label>
              <select
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500 text-right"
                value={selectedEmployeeId || ''}
                onChange={(e) => setSelectedEmployeeId(parseInt(e.target.value))}
              >
                <option value="">اختر موظف</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={handleReassignTask}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
              >
                تأكيد
              </button>
              <button
                onClick={() => {
                  setShowReassignTask(false);
                  setSelectedTask(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Edit Modal */}
      {showEditForm && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-xl mb-4">تعديل بيانات النموذج</h3>
            <form onSubmit={handleUpdateForm} className="space-y-4">
              {renderFormFields()}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none"
                >
                  حفظ التغييرات
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditFormData(null);
                    setEditFormType('');
                    setEditFormId(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tasksLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : tasks.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المهمة
                </th>
                <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الشركة
                </th>
                <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المسؤول
                </th>
                <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ الإنشاء
                </th>
                <th className="py-3 px-6 text-right text-xs font-medium">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 text-sm font-medium text-gray-900">
                    {task.displayType}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">
                    {task.companyName || task.companyId}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">{task.employeeName}</td>
                  <td className="py-4 px-6 text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(task.status)}`}>
                      {translateStatus(task.status)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">{formatDate(task.createdAt)}</td>
                  <td className="py-4 px-6 text-sm font-medium">
                    <div className="flex space-x-2 space-x-reverse">
                      {task.status !== 'COMPLETED' && (
                        <>
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            إكمال
                          </button>
                          <button
                            onClick={() => handleReassignClick(task)}
                            className="px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                          >
                            إعادة تعيين
                          </button>
                        </>
                      )}
                      {task.formData && (
                        <button
                          onClick={() => handleEditFormClick(task)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          تعديل النموذج
                        </button>
                      )}
                      {task.status === 'COMPLETED' && (
                        <button
                          onClick={() => handleUpdateRedirect(task)}
                          className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                        >
                          تحديث
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-4">لا توجد مهام حديثة</p>
      )}
    </div>
  );
};

export default RecentTasks;