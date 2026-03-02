import { useState, useCallback, useEffect } from 'react';
import { Bell, X, BellOff } from 'lucide-react';
import { useGlobalNotifications } from '../hooks/useGlobalNotifications';
import { getPermission, requestPermission, isNotificationSupported } from '../utils/notifications';

export default function NotificationToast() {
  const [toasts, setToasts] = useState([]);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);

  useEffect(() => {
    if (isNotificationSupported() && getPermission() === 'default') {
      setShowPermissionBanner(true);
    }
  }, []);

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

  async function handleEnableNotifications() {
    const granted = await requestPermission();
    setShowPermissionBanner(false);
    if (granted) {
      addToast('Notificações ativadas! Você será avisado antes das partidas.', 'alert');
    }
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4">
      {/* Banner de permissão */}
      {showPermissionBanner && (
        <div className="flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg text-sm bg-valorant-card border border-valorant-border text-gray-300">
          <Bell size={16} className="flex-shrink-0 mt-0.5 text-valorant-red" />
          <div className="flex-1">
            <p className="font-semibold text-white text-xs mb-1">Ativar notificações?</p>
            <p className="text-gray-400 text-xs">Receba avisos de partidas mesmo com o app em segundo plano.</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleEnableNotifications}
                className="bg-valorant-red text-white text-xs font-bold px-3 py-1 rounded-lg"
              >
                Ativar
              </button>
              <button
                onClick={() => setShowPermissionBanner(false)}
                className="text-gray-500 text-xs px-2 py-1"
              >
                Agora não
              </button>
            </div>
          </div>
          <button onClick={() => setShowPermissionBanner(false)} className="text-gray-600 hover:text-gray-400">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Toasts de notificação */}
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium ${
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
