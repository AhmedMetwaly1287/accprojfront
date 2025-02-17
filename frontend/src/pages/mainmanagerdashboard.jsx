// src/pages/MainPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const MainPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start pt-12"> {/* Adjusted padding-top */}
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">مكتب البيان للاستشارات</h1> {/* Added margin-bottom */}
        <h2 className="text-2xl font-semibold text-gray-700 mb-8">لوحات تحكم المدير</h2> {/* Added margin-bottom */}
        
        <div className="space-y-4">
          <button
            onClick={() => navigate('/employee-management')}
            className="w-full px-6 py-4 bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow
                     text-xl font-medium text-gray-700 border border-blue-200 hover:border-blue-400"
          >
              إدارة الموظفين
          </button>
          
          <button
            onClick={() => navigate('/task-management')}
            className="w-full px-6 py-4 bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow
                     text-xl font-medium text-gray-700 border border-blue-200 hover:border-blue-400"
          >
              إدارة المهام
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainPage;