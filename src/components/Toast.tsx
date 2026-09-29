'use client';

import React, { useEffect, useState } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entry animation on mount
    const animFrame = requestAnimationFrame(() => setIsVisible(true));
    
    // Auto dismiss timer (longer for errors to give user time to read)
    const defaultDuration = toast.type === 'error' ? 3000 : 1500;
    const duration = toast.duration || defaultDuration;
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(toast.id), 300); // Allow fade-out animation
    }, duration);

    return () => {
      cancelAnimationFrame(animFrame);
      clearTimeout(timer);
    };
  }, [toast, onDismiss]);

  const handleManualDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  const isError = toast.type === 'error';
  const isInfo = toast.type === 'info';

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-2xl border bg-[#131b2e]/95 p-3.5 shadow-2xl backdrop-blur-md transition-all duration-300 transform ${
        isError ? 'border-rose-500/40' : 'border-slate-700/80'
      } ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 -translate-y-2 scale-95'
      }`}
      style={{
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border mt-0.5 ${
          isError
            ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
            : isInfo
            ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
            : 'bg-emerald-500/15 border-emerald-500/30 text-[#28ba90]'
        }`}
      >
        {isError ? (
          <AlertCircle className="h-4 w-4" />
        ) : isInfo ? (
          <Info className="h-4 w-4" />
        ) : (
          <Check className="h-4 w-4" />
        )}
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs font-bold text-white tracking-wide">{toast.title}</p>
        {toast.description && (
          <p className="text-[11px] font-medium text-slate-300 mt-0.5 leading-relaxed break-words">
            {toast.description}
          </p>
        )}
      </div>

      <button
        onClick={handleManualDismiss}
        className="shrink-0 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
        title="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
