import React, { useState } from 'react';
import { api, type AuthStatus } from '../api/client';
import { Lock, User, UserPlus, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthPageProps {
  authStatus: AuthStatus;
  onAuthSuccess: (isNewRegistration: boolean) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ authStatus, onAuthSuccess }) => {
  const isFirstSetup = !authStatus.hasUsers;
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(isFirstSetup);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!username.trim() || !password) {
      setError('Lütfen kullanıcı adı ve şifre giriniz.');
      return;
    }

    if (isRegisterMode && password !== confirmPassword) {
      setError('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setLoading(true);

    try {
      if (isRegisterMode) {
        await api.register({ username: username.trim(), password });
        setSuccessMsg('Kayıt başarılı! Oturum açılıyor...');
        setTimeout(() => {
          onAuthSuccess(true);
        }, 600);
      } else {
        await api.login({ username: username.trim(), password });
        onAuthSuccess(false);
      }
    } catch (err: any) {
      setError(err.message || 'İşlem sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col justify-center items-center px-4 select-none">
      <div className="w-full max-w-md bg-[#1a1d29] border border-[#2a2e3f] rounded-2xl p-8 shadow-2xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/Corvus.png" 
            alt="Corvus" 
            className="w-16 h-16 object-contain rounded-xl mb-3 shadow-md"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <h1 className="text-2xl font-bold tracking-wider text-[#e5e7eb]">CORVUS</h1>
          <p className="text-xs text-[#9ca3af] tracking-widest font-mono uppercase mt-1">
            {isFirstSetup ? 'İlk Kurulum & Yönetici Kaydı' : 'Server Launcher & Monitoring'}
          </p>
        </div>

        {/* Tab Selection (only if users already exist and registration is enabled) */}
        {!isFirstSetup && authStatus.registrationEnabled && (
          <div className="grid grid-cols-2 bg-[#0f1117] p-1 rounded-xl mb-6 border border-[#2a2e3f]">
            <button
              type="button"
              onClick={() => { setIsRegisterMode(false); setError(null); }}
              className={`py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                !isRegisterMode 
                  ? 'bg-[#d4d4d8] text-[#0f1117] font-semibold shadow' 
                  : 'text-[#9ca3af] hover:text-[#e5e7eb]'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => { setIsRegisterMode(true); setError(null); }}
              className={`py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                isRegisterMode 
                  ? 'bg-[#d4d4d8] text-[#0f1117] font-semibold shadow' 
                  : 'text-[#9ca3af] hover:text-[#e5e7eb]'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Kayıt Ol
            </button>
          </div>
        )}

        {/* Notifications */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/30 text-[#ef4444] text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3 rounded-lg bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#22c55e] text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#9ca3af] mb-1.5 uppercase tracking-wider">
              Kullanıcı Adı
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9ca3af]">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="örn. admin"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0f1117] border border-[#2a2e3f] rounded-lg text-sm text-[#e5e7eb] placeholder-[#9ca3af]/40 focus:outline-none focus:border-[#d4d4d8] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9ca3af] mb-1.5 uppercase tracking-wider">
              Şifre
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9ca3af]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0f1117] border border-[#2a2e3f] rounded-lg text-sm text-[#e5e7eb] placeholder-[#9ca3af]/40 focus:outline-none focus:border-[#d4d4d8] transition-colors"
              />
            </div>
          </div>

          {isRegisterMode && (
            <div>
              <label className="block text-xs font-semibold text-[#9ca3af] mb-1.5 uppercase tracking-wider">
                Şifre Tekrar
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9ca3af]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0f1117] border border-[#2a2e3f] rounded-lg text-sm text-[#e5e7eb] placeholder-[#9ca3af]/40 focus:outline-none focus:border-[#d4d4d8] transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-[#d4d4d8] hover:bg-[#e4e4e7] text-[#0f1117] font-semibold text-sm rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-[#0f1117] border-t-transparent rounded-full animate-spin" />
            ) : isRegisterMode ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Hesap Oluştur</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Giriş Yap</span>
              </>
            )}
          </button>
        </form>

        {/* Footer note */}
        <div className="mt-6 pt-4 border-t border-[#2a2e3f] text-center">
          <p className="text-[11px] text-[#9ca3af]/60 font-mono">
            {isFirstSetup 
              ? '💡 İlk kullanıcı sistem yöneticisi olarak yetkilendirilir.'
              : !authStatus.registrationEnabled 
                ? '🔒 Yeni kullanıcı kayıtları sistem yöneticisi tarafından kapatılmıştır.'
                : '🛡️ Güvenli self-hosted oturum.'}
          </p>
        </div>
      </div>
    </div>
  );
};
