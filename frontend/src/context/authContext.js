import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null; // ✅ Check if valid JSON
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
      return null; // ✅ Prevents app crash if JSON is invalid
    }
  });

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData)); // ✅ Save user data
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user"); // ✅ Clear user data
  };

  // Define the isAuthenticated function
  const isAuthenticated = () => {
    return !!user; // Returns true if user is logged in, false otherwise
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};