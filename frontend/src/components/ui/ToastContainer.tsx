import React from 'react';
import { useStreamShield } from '../../context/StreamShieldContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStreamShield();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
          error: <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />,
          info: <Info className="w-4 h-4 text-navy-600 shrink-0 mt-0.5" />,
        };

        const borders = {
          success: 'border-emerald-200 bg-white text-emerald-950',
          warning: 'border-amber-200 bg-white text-amber-950',
          error: 'border-red-200 bg-white text-red-950',
          info: 'border-border bg-white text-navy-950',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-dropdown animate-in slide-in-from-bottom-3 duration-200 ${borders[toast.type]}`}
          >
            {icons[toast.type]}
            <div className="flex-1 text-xs">
              <div className="font-semibold">{toast.title}</div>
              {toast.description && (
                <div className="text-navy-600 mt-0.5 leading-snug">{toast.description}</div>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded text-navy-400 hover:text-navy-700 hover:bg-canvas transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
