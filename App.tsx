
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import KPIDashboard from './pages/KPIDashboard';
import RequestManager from './pages/RequestManager';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import PublicOverview from './pages/PublicOverview';

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/public" element={<PublicOverview />} />
          
          {/* Protected Routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<KPIDashboard />} />
            <Route path="/overview" element={<Dashboard />} />
            <Route path="/requests" element={<RequestManager />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
};

export default App;
