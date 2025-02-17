import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const MonthlyTasksReport = ({ tasks, employees }) => {
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Get current month's start and end dates
  const getCurrentMonthDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { firstDay, lastDay };
  };

  // Filter tasks for current month and by status
  const getFilteredTasks = () => {
    const { firstDay, lastDay } = getCurrentMonthDates();
    const tasksData = tasks?.data || [];

    return tasksData.filter(task => {
      const taskDate = new Date(task.createdAt);
      const isInCurrentMonth = taskDate >= firstDay && taskDate <= lastDay;

      if (selectedStatus === 'all') {
        return isInCurrentMonth;
      }
      return isInCurrentMonth && (
        (selectedStatus === 'pending' && task.status === 'PENDING') ||
        (selectedStatus === 'completed' && task.status === 'COMPLETED')
      );
    });
  };

  // Get employee name by employeeId
  const getEmployeeName = (id) => {
    if (!id) return 'غير معروف';
    const stringId = id.toString();
    const employee = employees.find(emp => emp.id.toString() === stringId);
    return employee ? employee.name : 'غير معروف';
  };

  // Get delivery date from related records
  const getDeliveryDate = (task) => {
    // Check each related model for createdAt date
    const relatedDates = [
      ...(task.vat || []).map(v => new Date(v.createdAt)),
      ...(task.publicTax || []).map(p => new Date(p.createdAt)),
      ...(task.electronicBill || []).map(e => new Date(e.createdAt)),
      ...(task.commercialRegister || []).map(c => new Date(c.createdAt)),
      ...(task.other || []).map(o => new Date(o.createdAt))
    ].filter(date => date); // Remove any undefined dates

    // If there are related records, return the latest date
    if (relatedDates.length > 0) {
      return new Date(Math.max(...relatedDates));
    }

    // If no related records, return task creation date
    return new Date(task.createdAt);
  };

  // Prepare data for Excel export
  const prepareExportData = (tasks) => {
    return tasks.map(task => {
      const employeeId = task.empId || task.employeeId;
      const deliveryDate = getDeliveryDate(task);
      
      return {
        ...(task.clientName && { 'اسم العميل': task.clientName }),
        ...(task.clientPhone && { 'هاتف العميل': task.clientPhone }),
        ...(task.type && { 'نوع المعاملة': task.type }),
        'الحالة': task.status === 'PENDING' ? 'قيد الانتظار' : 'مكتملة',
        'اسم الموظف': getEmployeeName(employeeId),
        'تاريخ الإنشاء': new Date(task.createdAt).toLocaleDateString('en-GB', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }),
        'تاريخ التسليم': deliveryDate.toLocaleDateString('en-GB', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }),
      };
    });
  };

  // Export to Excel
  const exportToExcel = () => {
    const filteredTasks = getFilteredTasks();
    const exportData = prepareExportData(filteredTasks);

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'المهام');

    const monthName = new Date().toLocaleDateString('en-US', { month: 'long' });
    XLSX.writeFile(workbook, `تقرير_مهام_${monthName}.xlsx`);
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">تقرير المهام لهذا الشهر</h2>
        <div className="flex gap-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="completed">مكتملة</option>
          </select>

          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            تصدير إلى Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => (
          <div key={task.id} className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold">{task.title}</h3>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600">
                الموظف: {getEmployeeName(task.empId || task.employeeId)}
              </p>
              <p className="text-sm text-gray-600">
                الحالة: {task.status === 'PENDING' ? 'قيد الانتظار' : 'مكتملة'}
              </p>
              <p className="text-sm text-gray-600">
                تاريخ الإنشاء: {new Date(task.createdAt).toLocaleDateString('en-GB')}
              </p>
              <p className="text-sm text-gray-600">
                تاريخ التسليم: {getDeliveryDate(task).toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        إجمالي المهام: {filteredTasks.length}
      </div>
    </div>
  );
};

export default MonthlyTasksReport;