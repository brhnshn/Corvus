import React, { useEffect, useState, Suspense, lazy } from 'react';
import { api, type AuthStatus } from './api/client';
import { Sidebar, type PageId } from './components/Sidebar';
import { RegistrationPromptModal } from './components/RegistrationPromptModal';
import { Menu, RefreshCw } from 'lucide-react';
import { useI18n } from './i18n';

// Code-splitting via React.lazy for bundle optimization (Roadmap 3.1)
const DashboardPage = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.DashboardPage })));
const ServicesPage = lazy(() => import('./pages/Services').then(m => ({ default: m.ServicesPage })));
const ContainersPage = lazy(() => import('./pages/Containers').then(m => ({ default: m.ContainersPage })));
const SystemMetricsPage = lazy(() => import('./pages/SystemMetrics').then(m => ({ default: m.SystemMetricsPage })));
const UptimePage = lazy(() => import('./pages/Uptime').then(m => ({ default: m.UptimePage })));
const SettingsPage = lazy(() => import('./pages/Settings').then(m => ({ default: m.SettingsPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const PublicStatus = lazy(() => import('./pages/PublicStatus'));

const PageLoader = () => (
  <div className="flex items-center justify-center py-20 text-[#9ca3af]">
    <div className="flex flex-col items-center gap-2">
      <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
      <span className="text-xs font-mono">Loading...</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  const { t } = useI18n();
  const isStatusPath = window.location.pathname === '/status' || window.location.pathname.startsWith('/status');
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [authLoading, setAuthLoading] = useState(!isStatusPath);
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [showRegPrompt, setShowRegPrompt] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    if (!isStatusPath) {
      checkAuth();
    }
  }, [isStatusPath]);

  // Roadmap 2.1: Server-Sent Events (SSE) Canlı Veri Yayını Bağlantısı
  useEffect(() => {
    if (isStatusPath) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/stream/events');
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          window.dispatchEvent(new CustomEvent('corvus_event', { detail: parsed }));
        } catch {
          // ignore keepalive/ping
        }
      };
    } catch (e) {
      console.warn('SSE bağlantısı kurulamadı:', e);
    }

    return () => {
      eventSource?.close();
    };
  }, [isStatusPath]);

  // Roadmap 1.6: Halka Açık Şifresiz Durum Sayfası
  if (isStatusPath) {
    return (
      <Suspense fallback={<PageLoader />}>
        <PublicStatus />
      </Suspense>
    );
  }

  const handleAuthSuccess = async (isNewRegistration: boolean) => {
    try {
      const status = await api.getAuthStatus();
      setAuthStatus(status);

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
          <span className="text-xs text-[#9ca3af] font-mono tracking-wider">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  // Auth aktif ve kullanıcı giriş yapmamış ise Login/Register sayfasını göster
  if (authStatus && authStatus.authEnabled && !authStatus.isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AuthPage authStatus={authStatus} onAuthSuccess={handleAuthSuccess} />
      </Suspense>
    );
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

  const getPageTitle = (page: PageId) => {
    switch (page) {
      case 'dashboard': return t('nav.dashboard');
      case 'services': return t('nav.services');
      case 'containers': return t('nav.containers');
      case 'metrics': return t('nav.metrics');
      case 'uptime': return t('nav.uptime');
      case 'settings': return t('nav.settings');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e5e7eb] flex flex-col lg:flex-row">
      {/* Sidebar (Desktop kalıcı, Mobil & Tablet drawer) */}
      <Sidebar 
        currentPage={currentPage} 
        onSelectPage={setCurrentPage} 
        username={authStatus?.username}
        onLogout={authStatus?.authEnabled ? handleLogout : undefined}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Mobil & Tablet Üst Barı (lg:hidden) */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#1a1d29]/95 backdrop-blur-md border-b border-[#2a2e3f] h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1e2130] transition-colors cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <img
                src="/Corvus.png"
                alt="Corvus"
                className="w-7 h-7 object-contain rounded"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="font-bold text-base tracking-wider text-[#e5e7eb]">CORVUS</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#0f1117] border border-[#2a2e3f] text-[#d4d4d8]">
              {getPageTitle(currentPage)}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<PageLoader />}>
              {renderPage()}
            </Suspense>
          </div>
        </main>
      </div>

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
