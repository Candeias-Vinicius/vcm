import { useState, useCallback } from 'react';
import { Bell, X } from 'lucide-react';
import { useGlobalNotifications } from '../hooks/useGlobalNotifications';

export default function NotificationToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'alert') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  }, []);

  useGlobalNotifications(
    (data) => addToast(data.message, 'alert'),
    (data) => addToast(data.message, 'delayed'),
  );

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium animate-fade-in ${
            toast.type === 'delayed'
              ? 'bg-red-900 border border-red-700 text-red-200'
              : 'bg-yellow-900 border border-yellow-700 text-yellow-200'
          }`}
        >
          <Bell size={16} className="flex-shrink-0 mt-0.5" />
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            className="flex-shrink-0 opacity-60 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
