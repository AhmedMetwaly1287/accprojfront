// src/components/Header.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext'; // Import useAuth

const Header = ({ pageTitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth(); // Destructure user and logout from useAuth

  // Function to determine if a page is active
  const isActive = (path) => {
    return location.pathname === path ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-blue-600';
  };

  // Handle logout
  const handleLogout = () => {
    logout(); // Call the logout function from AuthContext
    navigate('/login'); // Redirect to the login page after logout
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-blue-600">البيان للاستشارات</h1>
        </div>

        <div className="flex items-center space-x-6">
          <span className="text-gray-600">{pageTitle}</span>
          <nav className="flex space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className={`hover:text-blue-600 ${isActive('/dashboard')}`}
            >
              لوحة التحكم
            </button>

            {/* Logout Button */}
            {user && ( // Only show logout button if user is logged in
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-blue-600"
              >
                تسجيل الخروج
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;