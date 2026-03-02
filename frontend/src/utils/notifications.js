export function isNotificationSupported() {
  return 'Notification' in window;
}

export function getPermission() {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestPermission() {
  if (!isNotificationSupported()) return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function showNativeNotification(title, body) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;
  const n = new Notification(title, {
    body,
    icon: '/vcm-icon.png',
    badge: '/vcm-icon.png',
    tag: 'vcm-lobby',
    renotify: true,
  });
  n.onclick = () => {
    window.focus();
    n.close();
  };
}
