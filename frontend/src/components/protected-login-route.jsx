import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

const ProtectedLoginRoute = ({ children }) => {
  const { user } = useAuth();
  
  // If user is authenticated, redirect to their appropriate dashboard
  if (user) {
    return <Navigate to={user.role === 1 ? "/dashboard" : "/employee-dashboard"} replace />;
  }

  // If user is not authenticated, show login page
  return children;
};

export default ProtectedLoginRoute;