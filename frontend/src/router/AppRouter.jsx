import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ToastContainer } from '../components/Toast';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { CitizenDashboard } from '../pages/CitizenDashboard';
import { DriverDashboard } from '../pages/DriverDashboard';
import { AdminDashboard } from '../pages/AdminDashboard';

export function AppRouter() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');

  // Synchronize browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route guard helper
  const renderProtectedRoute = (requiredRole, Component) => {
    if (isLoading) {
      return (
        <div className="container" style={{ padding: '4rem 0' }}>
          <LoadingState message="Verifying session credentials..." />
        </div>
      );
    }

    if (!isAuthenticated || !user) {
      return (
        <div className="container" style={{ padding: '4rem 0' }}>
          <ErrorState
            title="Authentication Required"
            message="You must log in with authorized Gram Panchayat credentials to access this area."
            onBack={() => navigate('/login')}
          />
        </div>
      );
    }

    if (user.role !== requiredRole) {
      return (
        <div className="container" style={{ padding: '4rem 0' }}>
          <ErrorState
            title="Role Access Restricted"
            message={`Your account role (${user.role}) is not authorized to view the ${requiredRole} portal. Please switch to your designated workspace.`}
            onBack={() => {
              if (user.role === 'CITIZEN') navigate('/citizen');
              else if (user.role === 'DRIVER') navigate('/driver');
              else if (user.role === 'ADMIN') navigate('/admin');
              else navigate('/');
            }}
          />
        </div>
      );
    }

    return <Component onNavigate={navigate} />;
  };

  // Page switcher
  const renderPage = () => {
    switch (currentPath) {
      case '/':
        return <LandingPage onNavigate={navigate} />;
      case '/login':
        return <LoginPage onNavigate={navigate} />;
      case '/citizen':
        return renderProtectedRoute('CITIZEN', CitizenDashboard);
      case '/driver':
        return renderProtectedRoute('DRIVER', DriverDashboard);
      case '/admin':
        return renderProtectedRoute('ADMIN', AdminDashboard);
      default:
        return (
          <div className="container" style={{ padding: '5rem 0' }}>
            <ErrorState
              title="404 - Page Not Found"
              message={`The path "${currentPath}" does not exist on Echo Route Smart Waste.`}
              onBack={() => navigate('/')}
            />
          </div>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar onNavigate={navigate} currentPath={currentPath} />
      <main style={{ flex: 1 }}>
        {renderPage()}
      </main>
      <Footer onNavigate={navigate} />
      <ToastContainer />
    </div>
  );
}
