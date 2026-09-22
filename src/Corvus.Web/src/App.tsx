import React, { useEffect, useState } from 'react';
import { api, type AuthStatus } from './api/client';
import { Sidebar, type PageId } from './components/Sidebar';
import { AuthPage } from './pages/AuthPage';
import { RegistrationPromptModal } from './components/RegistrationPromptModal';
import { DashboardPage } from './pages/Dashboard';
import { ServicesPage } from './pages/Services';
import { ContainersPage } from './pages/Containers';
import { SystemMetricsPage } from './pages/SystemMetrics';
import { UptimePage } from './pages/Uptime';
import { SettingsPage } from './pages/Settings';

export const App: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [showRegPrompt, setShowRegPrompt] = useState(false);

  const checkAuth = async () => {
    try {
      const status = await api.getAuthStatus();
      setAuthStatus(status);
    } catch (err) {
      console.error('Auth durumu sorgulanamadı:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleAuthSuccess = async (isNewRegistration: boolean) => {
    try {
      const status = await api.getAuthStatus();
      setAuthStatus(status);

      // Yeni kayıt olduysa veya kayıtlar açıksa ve sorulması gerekiyorsa modalı aç
      if (isNewRegistration && status.registrationEnabled) {
        setShowRegPrompt(true);
      }
    } catch (err) {
      console.error('Auth yenilenemedi:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      await checkAuth();
    } catch (err) {
      console.error('Çıkış hatası:', err);
    }
  };

  const handleRegistrationDisabled = () => {
    if (authStatus) {
      setAuthStatus({
        ...authStatus,
        registrationEnabled: false
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#d4d4d8] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#9ca3af] font-mono tracking-wider">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  // Auth aktif ve kullanıcı giriş yapmamış ise Login/Register sayfasını göster
  if (authStatus && authStatus.authEnabled && !authStatus.isAuthenticated) {
    return <AuthPage authStatus={authStatus} onAuthSuccess={handleAuthSuccess} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'services':
        return <ServicesPage />;
      case 'containers':
        return <ContainersPage />;
      case 'metrics':
        return <SystemMetricsPage />;
      case 'uptime':
        return <UptimePage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-[#e5e7eb]">
      <Sidebar 
        currentPage={currentPage} 
        onSelectPage={setCurrentPage} 
        username={authStatus?.username}
        onLogout={authStatus?.authEnabled ? handleLogout : undefined}
      />
      <main className="flex-1 ml-64 p-8 overflow-y-auto min-h-screen">
        <div className="max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </main>

      {/* Kayıtları kapatma öneri modalı */}
      <RegistrationPromptModal
        isOpen={showRegPrompt}
        onClose={() => setShowRegPrompt(false)}
        onDisabled={handleRegistrationDisabled}
      />
    </div>
  );
};

export default App;
