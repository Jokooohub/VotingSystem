import React, { useState } from 'react';
import { ShieldCheck, X, Lock, KeyRound } from 'lucide-react';
import { ADMIN_NAME, ADMIN_DESIGNATION, ADMIN_DEFAULT_PASSCODE } from '../utils/storage';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passcode === ADMIN_DEFAULT_PASSCODE) {
      setError(null);
      setPasscode('');
      onSuccess();
    } else {
      setError('Incorrect admin password. Access denied.');
    }
  };

  return (
    <div
      id="admin-auth-backdrop"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto"
    >
      <div
        id="admin-auth-card"
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-sm p-5 sm:p-6 shadow-2xl relative border border-slate-200 animate-in fade-in slide-in-from-bottom-6 duration-200 max-h-[90vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-indigo-100">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900 text-center">
          Administrator Sign In
        </h3>
        <p className="text-xs text-slate-500 text-center mt-0.5">
          Authorized Admin: <strong className="text-slate-800">{ADMIN_NAME}</strong>
        </p>

        <div className="mt-3.5 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
          <div className="font-bold text-slate-800">{ADMIN_NAME}</div>
          <div className="text-[11px] text-slate-500">{ADMIN_DESIGNATION}</div>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-4 space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Admin Password:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="Enter password..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
                className="w-full min-h-[44px] bg-white border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-sm sm:text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full min-h-[46px] py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Authenticate Admin</span>
          </button>
        </form>
      </div>
    </div>
  );
};
