/**
 * Abandoned but Not Forgotten — NASA Space Apps Challenge 2026
 * Browser Notification Opt-In Service
 * Rules: Never request on page load; request only upon explicit user opt-in;
 * feed works completely if notifications are denied or unsupported.
 */

const NotificationService = (() => {
  const STORAGE_KEY = 'abnf_notifications_enabled';

  function isSupported() {
    return 'Notification' in window;
  }

  function getPermissionState() {
    if (!isSupported()) return 'unsupported';
    return Notification.permission; // 'default', 'granted', 'denied'
  }

  async function requestOptIn(onStatusChange) {
    if (!isSupported()) {
      if (onStatusChange) onStatusChange('unsupported');
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem(STORAGE_KEY, 'true');
        sendWelcomeNotification();
      } else {
        localStorage.setItem(STORAGE_KEY, 'false');
      }

      if (onStatusChange) onStatusChange(permission);
      return permission;
    } catch (err) {
      console.warn('Notification request failed:', err);
      if (onStatusChange) onStatusChange(Notification.permission);
      return Notification.permission;
    }
  }

  function sendWelcomeNotification() {
    if (getPermissionState() === 'granted') {
      try {
        new Notification('Abandoned but Not Forgotten', {
          body: 'You are now subscribed to verified NASA Space Apps catalogue updates!',
          icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230b3d91"/><circle cx="50" cy="50" r="20" fill="%23fc3d21"/></svg>'
        });
      } catch (e) {
        console.warn('Could not trigger native notification:', e);
      }
    }
  }

  return {
    isSupported,
    getPermissionState,
    requestOptIn
  };
})();

window.NotificationService = NotificationService;
