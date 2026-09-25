import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Info, 
  CheckCircle2, 
  ShieldCheck, 
  User, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { fetchTableData, insertTableRow, getApiUrl } from '../lib/api';
import { normalizeRoleId, fetchAndSyncPermissionsFromSupabase } from '../lib/permissions';
import { saveAccount, switchAccount, SavedAccount } from '../lib/accountManager';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountAdded?: () => void;
}

const ACCOUNT_TYPES = [
  { value: 'sekretaris_putra', label: 'Sekretaris Putra' },
  { value: 'sekretaris_putri', label: 'Sekretaris Putri' },
  { value: 'bendahara_putra', label: 'Bendahara Putra' },
  { value: 'bendahara_putri', label: 'Bendahara Putri' },
  { value: 'pendidikan_putra', label: 'Pendidikan Putra' },
  { value: 'pendidikan_putri', label: 'Pendidikan Putri' },
  { value: 'humasy_putra', label: 'Humas Putra' },
  { value: 'humasy_putri', label: 'Humas Putri' },
  { value: 'keamanan_putra', label: 'Keamanan Putra' },
  { value: 'keamanan_putri', label: 'Keamanan Putri' }
];

export default function AddAccountModal({ isOpen, onClose, onAccountAdded }: AddAccountModalProps) {
  const [step, setStep] = useState<'choice' | 'login' | 'register'>('choice');
  
  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Register form states
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('sekretaris_putra');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('choice');
      setErrorMsg(null);
      setRegSuccessMsg(null);
      setLoginEmail('');
      setLoginPassword('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegRole('sekretaris_putra');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const normalizedEmail = loginEmail.trim().toLowerCase();
    const defaultUser = 'superadmin@attaroqqy.com';
    const defaultPass = '1234';

    try {
      let user: any = null;
      let isServerAuth = false;

      // 1. Try server backend auth
      try {
        const response = await fetch(getApiUrl("/api/auth/login"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: normalizedEmail, password: loginPassword })
        });
        const text = await response.text();
        const result = JSON.parse(text);
        if (result && result.success) {
          user = result.user;
          isServerAuth = true;
        } else if (result && result.error) {
          setErrorMsg(result.error);
          setLoading(false);
          return;
        }
      } catch (err) {
        // Fallback to table lookup
      }

      // 2. Client fallback
      if (!isServerAuth) {
        let creds: any[] = [];
        try {
          creds = await fetchTableData<any>(
            'app_credentials',
            'smartsantri_app_credentials',
            [{ id: 'superadmin', username: defaultUser, password: defaultPass, role: 'superadmin', status: 'approved' }]
          );
        } catch (e) {
          creds = [];
        }

        let found = creds.find((c: any) => 
          (c.username && c.username.trim().toLowerCase() === normalizedEmail) ||
          (c.id === 'superadmin' && normalizedEmail === defaultUser.toLowerCase())
        );

        if (!found && normalizedEmail === defaultUser.toLowerCase()) {
          found = {
            id: 'superadmin',
            username: defaultUser,
            password: defaultPass,
            role: 'superadmin',
            status: 'approved',
            displayName: 'Mang Daud'
          };
        }

        if (!found) {
          setErrorMsg('Email atau Kata Sandi salah atau akun belum terdaftar.');
          setLoading(false);
          return;
        }

        const storedPassword = found.password || (found.id === 'superadmin' ? defaultPass : '');
        if (storedPassword && storedPassword !== loginPassword) {
          setErrorMsg('Email atau Kata Sandi salah.');
          setLoading(false);
          return;
        }

        if (found.status === 'pending') {
          setErrorMsg('Akun masih menunggu persetujuan pendaftaran dari Super Admin.');
          setLoading(false);
          return;
        }

        if (found.status === 'rejected') {
          setErrorMsg('Pendaftaran akun ini telah ditolak oleh Super Admin.');
          setLoading(false);
          return;
        }

        user = {
          id: found.id || 'user_' + Date.now(),
          username: found.username,
          role: found.role || 'superadmin',
          displayName: found.displayName || found.display_name || found.nama || found.name || found.username,
          avatarUrl: found.avatarUrl || found.fotoUrl || ''
        };
      }

      if (!user) {
        setErrorMsg('Gagal memverifikasi akun.');
        setLoading(false);
        return;
      }

      // Save to accounts list and switch
      const newAcc: SavedAccount = {
        id: user.id || 'acc_' + Date.now(),
        username: user.username,
        displayName: user.displayName || user.username,
        role: user.role || 'superadmin',
        avatarUrl: user.avatarUrl || '',
        lastActive: new Date().toISOString()
      };

      await switchAccount(newAcc);

      if (onAccountAdded) onAccountAdded();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk akun.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setRegSuccessMsg(null);
    setLoading(true);

    const emailLower = regEmail.trim().toLowerCase();

    if (!emailLower.endsWith('@attaroqqy.com') && !emailLower.endsWith('@attaroqqy')) {
      setErrorMsg('Pendaftaran Gagal: Email harus berakhiran @attaroqqy.com atau @attaroqqy.');
      setLoading(false);
      return;
    }

    if (regPassword.length < 4) {
      setErrorMsg('Pendaftaran Gagal: Kata Sandi minimal harus 4 karakter.');
      setLoading(false);
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Pendaftaran Gagal: Konfirmasi Kata Sandi tidak cocok.');
      setLoading(false);
      return;
    }

    try {
      const newId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const roleDef = ACCOUNT_TYPES.find(r => r.value === regRole);
      const payload = {
        id: newId,
        username: emailLower,
        displayName: roleDef?.label || emailLower.split('@')[0],
        password: regPassword,
        role: regRole as any,
        status: 'pending' as const,
        created_at: new Date().toISOString()
      };

      await insertTableRow('app_credentials', 'smartsantri_app_credentials', payload);

      setRegSuccessMsg('Pendaftaran Berhasil! Permohonan akun Anda telah dicatat dalam status Menunggu Persetujuan (Pending) dari Super Admin.');
      
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegRole('sekretaris_putra');
      if (onAccountAdded) onAccountAdded();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mendaftarkan akun baru.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-150 overflow-hidden flex flex-col"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            {step !== 'choice' && (
              <button
                type="button"
                onClick={() => {
                  setStep('choice');
                  setErrorMsg(null);
                  setRegSuccessMsg(null);
                }}
                className="p-1.5 -ml-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
                title="Kembali"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base">
                {step === 'choice' && 'Tambah Akun'}
                {step === 'login' && 'Masuk ke Akun Terdaftar'}
                {step === 'register' && 'Daftar Akun Pengurus Baru'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {step === 'choice' && 'Pilih cara untuk menambahkan akun ke aplikasi'}
                {step === 'login' && 'Masukkan kredensial akun pengurus Anda'}
                {step === 'register' && 'Buat permohonan akun baru untuk sistem'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold leading-relaxed flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Choice between Existing Account vs Register New */}
          {step === 'choice' && (
            <div className="space-y-3 py-1">
              {/* Option A: Akun yang sudah ada */}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setStep('login');
                }}
                className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 active:bg-blue-100/50 transition-all flex items-center gap-4 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <LogIn className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Akun yang Sudah Ada
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Masuk dengan email & kata sandi akun pengurus yang sudah pernah didaftarkan.
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600 transition-all shrink-0" />
              </button>

              {/* Option B: Buat akun baru */}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setRegSuccessMsg(null);
                  setStep('register');
                }}
                className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 active:bg-emerald-100/50 transition-all flex items-center gap-4 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    Buat Akun Baru
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Daftarkan akun pengurus baru menggunakan email domain <code className="text-emerald-700 font-semibold font-mono text-[11px]">@attaroqqy.com</code>.
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-600 transition-all shrink-0" />
              </button>
            </div>
          )}

          {/* STEP 2: Login Form (Akun yang sudah ada) */}
          {step === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Email Akun
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="nama@attaroqqy.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-semibold text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-bold tracking-widest text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-60 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memverifikasi &amp; Masuk...
                  </>
                ) : (
                  <>
                    <span>Masuk &amp; Tambahkan Akun</span>
                    <LogIn className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Register Form (Buat Baru) */}
          {step === 'register' && (
            <div>
              {regSuccessMsg ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold leading-relaxed flex flex-col gap-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    <span>{regSuccessMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('login');
                      setRegSuccessMsg(null);
                      setErrorMsg(null);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-colors cursor-pointer w-fit self-end"
                  >
                    <span>Lanjut Masuk</span>
                    <LogIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Email Pendaftaran
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="nama@attaroqqy.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-semibold text-slate-800"
                    />
                    <span className="text-[10px] text-slate-400 block font-medium">
                      * Wajib menggunakan akhiran <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono">@attaroqqy.com</code>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Jenis Jabatan / Akun
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-semibold text-slate-800"
                    >
                      {ACCOUNT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Kata Sandi
                    </label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimal 4 karakter"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-bold tracking-widest text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Konfirmasi Kata Sandi
                    </label>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-bold tracking-widest text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-60 cursor-pointer mt-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Mendaftarkan...
                      </>
                    ) : (
                      <>
                        <span>Daftar Sekarang</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
