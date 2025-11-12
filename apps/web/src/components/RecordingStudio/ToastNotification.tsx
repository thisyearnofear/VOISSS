import React from 'react';

interface ToastNotificationProps {
  message: string | null;
  type: 'success' | 'error';
  onTimeout?: () => void;
}

export default function ToastNotification({ 
  message, 
  type,
  onTimeout 
}: ToastNotificationProps) {
  React.useEffect(() => {
    if (message && onTimeout) {
      const timer = setTimeout(() => {
        onTimeout();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [message, onTimeout]);

  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`min-w-[240px] px-4 py-3 rounded-xl shadow-lg border ${
        type === 'error'
          ? 'bg-red-900/30 border-red-500/30 text-red-200'
          : 'bg-green-900/30 border-green-500/30 text-green-200'
      }`}>
        <div className="flex items-center gap-2">
          <svg className={`w-4 h-4 ${type === 'error' ? 'text-red-400' : 'text-green-400'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <p className="text-sm font-medium">{type === 'error' ? 'Save Error' : 'Success'}</p>
        </div>
        <p className="text-xs mt-1 opacity-90">{message}</p>
      </div>
    </div>
  );
}