// src/App.js
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainPage from './pages/MainPage';
import ManagerDashboard from './pages/manager-dashboard';
import ManagerDashboard1 from './pages/manager-dashboard (1)';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/employee-management" element={<ManagerDashboard1 />} />
        <Route path="/task-management" element={<ManagerDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;