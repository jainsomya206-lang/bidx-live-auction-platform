import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Award, Zap, X, Bell } from 'lucide-react';

export default function LiveNotificationToast() {
  const { toasts, removeToast } = useSocket();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-dark-900/95 border border-amber-500/40 shadow-2xl backdrop-blur-xl text-slate-100 transition-all transform animate-bounce-short"
          style={{
            boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0 mt-0.5">
            {toast.type === 'auction_winner' ? (
              <Award className="w-5 h-5 text-amber-400" />
            ) : toast.type === 'snipe_guard' ? (
              <Zap className="w-5 h-5 text-amber-400" />
            ) : (
              <Bell className="w-5 h-5 text-amber-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              {toast.title || 'Live Auction Notice'}
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {toast.message}
            </p>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
