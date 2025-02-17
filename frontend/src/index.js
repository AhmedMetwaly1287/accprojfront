import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/authContext"; // ✅ Import AuthProvider
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider> {/* ✅ Wrap App inside AuthProvider */}
      <App />
    </AuthProvider>
  </React.StrictMode>
);
